"""YouTube ingestion.

Step 1: try YouTube's own transcript (fast, free, has timestamps).
Step 2: if there is none, download the audio with yt-dlp and transcribe it with Whisper.
"""
import logging
import tempfile
from pathlib import Path

import requests
import yt_dlp
from youtube_transcript_api import (
    CouldNotRetrieveTranscript,
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)
from youtube_transcript_api.proxies import WebshareProxyConfig

from app.config import get_settings
from app.ingestion import whisper_transcriber
from app.ingestion.errors import TranscriptionFailedError, VideoUnavailableError
from app.models import Transcript, TranscriptSegment

log = logging.getLogger(__name__)


def watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def proxy_dict() -> dict | None:
    """The proxy as a requests-style dict when configured (Render), otherwise None (laptop)."""
    s = get_settings()
    if s.webshare_proxy_username and s.webshare_proxy_password:
        return WebshareProxyConfig(
            proxy_username=s.webshare_proxy_username,
            proxy_password=s.webshare_proxy_password,
        ).to_requests_dict()
    return None


def fetch_video_info(video_id: str) -> dict:
    """Title via YouTube oEmbed (works through the proxy on the server); duration via yt-dlp only locally."""
    proxies = proxy_dict()

    # 1. Title: oEmbed returns a tiny JSON with the title
    title = video_id
    try:
        r = requests.get("https://www.youtube.com/oembed",
                         params={"url": watch_url(video_id), "format": "json"},
                         proxies=proxies, timeout=20)
        if r.status_code == 404:
            raise VideoUnavailableError("This video is private, removed or doesn't exist.")
        if r.ok:
            title = r.json().get("title") or video_id
        else:
            log.warning("oEmbed returned %s for %s", r.status_code, video_id)
    except requests.RequestException as e:
        log.warning("Could not read the title of %s: %s", video_id, e)

    # 2. Duration: yt-dlp works from a home connection; on the server YouTube blocks it, so we skip it there
    duration = None
    if proxies is None:
        try:
            opts = {"quiet": True, "no_warnings": True, "skip_download": True}
            with yt_dlp.YoutubeDL(opts) as ydl:
                duration = ydl.extract_info(watch_url(video_id), download=False).get("duration")
        except yt_dlp.utils.DownloadError as e:
            log.warning("Could not read the duration of %s: %s", video_id, e)

    return {"title": title, "duration": duration}


def transcript_api() -> YouTubeTranscriptApi:
    """Captions through the residential proxy when it's configured (Render), otherwise direct (laptop)."""
    s = get_settings()
    if s.webshare_proxy_username and s.webshare_proxy_password:
        log.info("Fetching captions through the Webshare residential proxy")
        return YouTubeTranscriptApi(proxy_config=WebshareProxyConfig(
            proxy_username=s.webshare_proxy_username,
            proxy_password=s.webshare_proxy_password,
            retries_when_blocked=5,
        ))
    return YouTubeTranscriptApi()


def fetch_youtube_transcript(video_id: str, languages: list[str], auto: bool = False
                             ) -> tuple[list[TranscriptSegment], str] | None:
    """Return (segments, language_code), or None if the video has no transcript.

    auto=True: no language chosen, so take YouTube's auto-generated captions,
    which are always in the language actually spoken in the video.
    """
    api = transcript_api()
    try:
        if auto:
            tracks = list(api.list(video_id))
            if not tracks:
                return None
            generated = [t for t in tracks if t.is_generated]
            track = generated[0] if generated else tracks[0]
            fetched = track.fetch()
        else:
            fetched = api.fetch(video_id, languages=languages)
    except VideoUnavailable as e:
        raise VideoUnavailableError("This video is private, removed or doesn't exist.") from e
    except (TranscriptsDisabled, NoTranscriptFound):
        return None
    except CouldNotRetrieveTranscript as e:
        log.warning("Transcript fetch failed for %s: %s", video_id, type(e).__name__)
        return None
    except requests.exceptions.RequestException as e:
        raise TranscriptionFailedError("Could not reach YouTube. Check your internet connection.") from e

    segments = [
        TranscriptSegment(text=s.text.replace("\n", " ").strip(), start=s.start, end=s.start + s.duration)
        for s in fetched
        if s.text.strip()
    ]
    return segments, fetched.language_code


def download_audio(video_id: str, target_dir: Path) -> Path:
    """Download the audio track only (m4a needs no ffmpeg)."""
    opts = {
        "quiet": True,
        "no_warnings": True,
        "format": "bestaudio[ext=m4a]/bestaudio",
        "outtmpl": str(target_dir / "%(id)s.%(ext)s"),
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(watch_url(video_id), download=True)
            return Path(ydl.prepare_filename(info))
    except yt_dlp.utils.DownloadError as e:
        raise TranscriptionFailedError("Could not download the audio of this video.") from e


def preferred_languages(language: str | None, defaults: list[str]) -> list[str]:
    """The chosen language first, then the defaults, without duplicates."""
    ordered = ([language] if language else []) + defaults
    return list(dict.fromkeys(ordered))


def ingest_youtube(video_id: str, language: str | None = None) -> Transcript:
    settings = get_settings()
    info = fetch_video_info(video_id)

    languages = preferred_languages(language, settings.transcript_languages)
    result = fetch_youtube_transcript(video_id, languages, auto=language is None)
    if result is not None:
        segments, language = result
        source = "youtube_transcript"
    else:
        log.info("No YouTube transcript for %s, using Whisper", video_id)
        with tempfile.TemporaryDirectory() as tmp:
            audio = download_audio(video_id, Path(tmp))
            segments, language = whisper_transcriber.transcribe(audio, language)
        source = "whisper"

    return Transcript(
        video_id=video_id,
        title=info["title"],
        source_type="youtube",
        transcript_source=source,
        language=language,
        youtube_url=watch_url(video_id),
        segments=segments,
    )
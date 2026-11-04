"""Input validation: YouTube links, uploaded files, and 'is there any speech?'."""
import re
from urllib.parse import parse_qs, urlparse

from app.ingestion.errors import (
    FileTooLargeError,
    InvalidUrlError,
    NoSpeechError,
    UnsupportedFileError,
)
from app.models import TranscriptSegment

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".m4a", ".wav", ".webm", ".mpeg", ".mpga"}
_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")  # YouTube IDs are always 11 characters
MIN_SPEECH_CHARACTERS = 20


def extract_youtube_id(url: str) -> str:
    """Return the 11-character video ID from any common YouTube URL form.

    Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
    youtube.com/embed/ID, youtube.com/live/ID.
    """
    if not url or not url.strip():
        raise InvalidUrlError("Please paste a YouTube link.")

    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.").removeprefix("m.")

    video_id = None
    if host == "youtu.be":
        video_id = parsed.path.lstrip("/").split("/")[0]
    elif host in ("youtube.com", "music.youtube.com"):
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        else:
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 2 and parts[0] in ("shorts", "embed", "live", "v"):
                video_id = parts[1]
    else:
        raise InvalidUrlError("This is not a YouTube link. Please paste a link from youtube.com or youtu.be.")

    if not video_id or not _VIDEO_ID.match(video_id):
        raise InvalidUrlError("This YouTube link doesn't contain a valid video ID. Please check the link.")
    return video_id


def validate_upload(filename: str | None, size_bytes: int, max_mb: int) -> str:
    """Check the file type and size. Returns the lower-case extension."""
    if not filename or "." not in filename:
        raise UnsupportedFileError("The file has no extension. Please upload an MP4 or MP3 file.")
    ext = "." + filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(e.lstrip(".").upper() for e in ALLOWED_EXTENSIONS))
        raise UnsupportedFileError(f"'{ext}' files are not supported. Allowed: {allowed}.")
    if size_bytes == 0:
        raise UnsupportedFileError("The uploaded file is empty.")
    if size_bytes > max_mb * 1024 * 1024:
        raise FileTooLargeError(
            f"The file is {size_bytes / 1024 / 1024:.1f} MB. The maximum is {max_mb} MB. "
            "Tip: upload only the audio (MP3) or a shorter part of the video."
        )
    return ext


def ensure_speech(segments: list[TranscriptSegment]) -> None:
    """Reject transcripts with no real speech (silent videos, music only)."""
    text = " ".join(s.text for s in segments)
    # Remove things like [Music] or [Applause] that YouTube adds to silent parts
    spoken = re.sub(r"\[[^\]]*\]", "", text).strip()
    if len(spoken) < MIN_SPEECH_CHARACTERS:
        raise NoSpeechError("No speech was found in this video, so there is nothing to search or answer from.")

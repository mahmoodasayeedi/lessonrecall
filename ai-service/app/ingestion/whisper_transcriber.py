"""Speech-to-text with OpenAI's Whisper API.

We ask for 'verbose_json' with segment timestamps, so every piece of text
comes with its start and end time in seconds.
"""
from pathlib import Path

from openai import OpenAI, OpenAIError

from app.config import get_settings
from app.ingestion.errors import FileTooLargeError, TranscriptionFailedError
from app.models import TranscriptSegment

WHISPER_LIMIT_BYTES = 25 * 1024 * 1024


def transcribe(audio_path: Path, language: str | None = None) -> tuple[list[TranscriptSegment], str | None]:
    """Return (segments, language) for an audio or video file.

    If `language` is given (e.g. "de"), Whisper is told which language is spoken,
    which is more accurate than letting it guess.
    """
    if audio_path.stat().st_size > WHISPER_LIMIT_BYTES:
        raise FileTooLargeError(
            "The audio is larger than 25 MB, the Whisper API limit. Please use a shorter video."
        )

    settings = get_settings()
    if not settings.openai_api_key:
        raise TranscriptionFailedError("OPENAI_API_KEY is not set in ai-service/.env.")

    client = OpenAI(api_key=settings.openai_api_key)
    options = {"language": language} if language else {}   # empty = Whisper detects the language
    try:
        with audio_path.open("rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
                **options,
            )
    except OpenAIError as e:
        raise TranscriptionFailedError(f"Whisper transcription failed: {e}") from e

    segments = [
        TranscriptSegment(text=s.text.strip(), start=s.start, end=s.end)
        for s in (result.segments or [])
        if s.text.strip()
    ]
    return segments, _language_code(getattr(result, "language", None))


def _language_code(language: str | None) -> str | None:
    """Whisper returns names like 'english' / 'german'; we store codes like YouTube does."""
    if not language:
        return None
    names = {
        "english": "en", "german": "de", "spanish": "es", "french": "fr",
        "arabic": "ar", "urdu": "ur", "hindi": "hi",
    }
    return names.get(language.lower(), language.lower())
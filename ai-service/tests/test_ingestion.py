"""Tests run without internet or API keys: YouTube and Whisper are replaced by fakes.

Run:  pytest -v   (from the ai-service folder)
Java comparison: pytest ~ JUnit, monkeypatch ~ Mockito's when(...).thenReturn(...)
"""
import pytest
from fastapi.testclient import TestClient

from app import main
from app.ingestion import youtube
from app.ingestion.chunker import chunk_transcript
from app.ingestion.errors import InvalidUrlError, NoSpeechError, UnsupportedFileError, FileTooLargeError
from app.ingestion.validation import ensure_speech, extract_youtube_id, validate_upload
from app.models import Transcript, TranscriptSegment

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def fake_pinecone(monkeypatch):
    monkeypatch.setattr(main, "upsert_chunks", lambda chunks, course_id: len(chunks))

def make_segments(total_seconds: int, step: int = 5) -> list[TranscriptSegment]:
    return [TranscriptSegment(text=f"sentence at {t} seconds", start=t, end=t + step) for t in range(0, total_seconds, step)]


def make_transcript(total_seconds: int) -> Transcript:
    return Transcript(
        video_id="abcdefghijk", title="Demo", source_type="youtube", transcript_source="youtube_transcript",
        language="en", youtube_url="https://www.youtube.com/watch?v=abcdefghijk", segments=make_segments(total_seconds),
    )


# ---------- URL validation ----------
@pytest.mark.parametrize("url", [
    "https://www.youtube.com/watch?v=abcdefghijk",
    "https://youtube.com/watch?v=abcdefghijk&t=42s",
    "https://youtu.be/abcdefghijk",
    "https://youtu.be/abcdefghijk?si=xyz",
    "https://www.youtube.com/shorts/abcdefghijk",
    "https://www.youtube.com/embed/abcdefghijk",
    "https://m.youtube.com/watch?v=abcdefghijk",
    "youtube.com/watch?v=abcdefghijk",
])
def test_valid_youtube_urls(url):
    assert extract_youtube_id(url) == "abcdefghijk"


@pytest.mark.parametrize("url", ["", "https://vimeo.com/123", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/"])
def test_invalid_youtube_urls(url):
    with pytest.raises(InvalidUrlError):
        extract_youtube_id(url)


# ---------- File validation ----------
def test_upload_validation():
    assert validate_upload("lesson.MP4", 1000, 25) == ".mp4"
    with pytest.raises(UnsupportedFileError):
        validate_upload("slides.pptx", 1000, 25)
    with pytest.raises(UnsupportedFileError):
        validate_upload("lesson.mp3", 0, 25)
    with pytest.raises(FileTooLargeError):
        validate_upload("lesson.mp3", 30 * 1024 * 1024, 25)


def test_no_speech_detected():
    with pytest.raises(NoSpeechError):
        ensure_speech([TranscriptSegment(text="[Music]", start=0, end=60), TranscriptSegment(text="[Applause]", start=60, end=70)])


# ---------- Chunking ----------
def test_chunks_cover_whole_video_with_overlap():
    chunks = chunk_transcript(make_transcript(300), target_seconds=75, overlap_seconds=10)
    assert chunks[0].start_seconds == 0
    assert chunks[-1].end_seconds == 300
    for prev, nxt in zip(chunks, chunks[1:]):
        assert nxt.start_seconds < prev.end_seconds        # overlap
        assert nxt.start_seconds > prev.start_seconds      # always moves forward
    assert all(c.end_seconds - c.start_seconds <= 80 for c in chunks)
    assert chunks[1].timestamp_url == f"https://www.youtube.com/watch?v=abcdefghijk&t={chunks[1].start_seconds}s"


def test_short_video_is_one_chunk():
    chunks = chunk_transcript(make_transcript(30))
    assert len(chunks) == 1 and chunks[0].end_seconds == 30


# ---------- API endpoint (YouTube faked) ----------
def test_ingest_youtube_endpoint(monkeypatch):
    monkeypatch.setattr(youtube, "fetch_video_info", lambda vid: {"title": "Spring Boot Basics", "duration": 300})
    monkeypatch.setattr(youtube, "fetch_youtube_transcript", lambda vid, langs: (make_segments(300), "en"))

    response = client.post("/ingest/youtube", json={"url": "https://youtu.be/abcdefghijk"})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Spring Boot Basics"
    assert body["transcript_source"] == "youtube_transcript"
    assert body["duration_seconds"] == 300
    assert body["chunk_count"] == len(body["chunks"]) >= 4


def test_ingest_youtube_rejects_bad_link():
    response = client.post("/ingest/youtube", json={"url": "https://vimeo.com/123"})
    assert response.status_code == 400
    assert response.json()["error"] == "INVALID_URL"


def test_upload_rejects_unsupported_file():
    response = client.post("/ingest/upload", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 415
    assert response.json()["error"] == "UNSUPPORTED_FILE"

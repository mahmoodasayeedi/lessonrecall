"""Data models (Pydantic).

Java comparison: these are your DTOs / records. Pydantic validates the
types automatically, like Bean Validation (@NotNull, @Size) in Spring.
"""
from typing import Literal

from pydantic import BaseModel, Field


course_id: str
stored_chunks: int

class TranscriptSegment(BaseModel):
    """One short piece of transcript as it comes from YouTube or Whisper (a few seconds)."""
    text: str
    start: float  # seconds from the start of the video
    end: float


class Transcript(BaseModel):
    """The full transcript of one video, before chunking."""
    video_id: str
    title: str
    source_type: Literal["youtube", "upload"]
    transcript_source: Literal["youtube_transcript", "whisper"]
    language: str | None = None
    youtube_url: str | None = None
    segments: list[TranscriptSegment]


class Chunk(BaseModel):
    """A ~75-second piece of transcript. This is what we will embed and store in Pinecone (Day 2)."""
    chunk_index: int
    text: str
    start_seconds: int
    end_seconds: int
    video_id: str
    title: str
    source_type: Literal["youtube", "upload"]
    language: str | None = None
    # Link that opens the video at the chunk's start (None for uploaded files)
    timestamp_url: str | None = None


class YouTubeIngestRequest(BaseModel):
    url: str = Field(..., examples=["https://www.youtube.com/watch?v=dQw4w9WgXcQ"])
    language: str | None = Field(default=None, pattern=r"^[a-z]{2}$", examples=["en"])
    course_id: str = Field(default="demo", pattern=r"^[a-z0-9-]{1,64}$", examples=["neural-networks"])


class IngestResponse(BaseModel):
    course_id: str
    stored_chunks: int
    video_id: str
    title: str
    source_type: Literal["youtube", "upload"]
    transcript_source: Literal["youtube_transcript", "whisper"]
    language: str | None
    duration_seconds: int
    chunk_count: int
    chunks: list[Chunk]


class ErrorResponse(BaseModel):
    error: str    # machine-readable code, e.g. "INVALID_URL"
    message: str  # human-readable message for the user


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, examples=["What is gradient descent?"])
    course_id: str = Field(default="demo", pattern=r"^[a-z0-9-]{1,64}$", examples=["neural-networks"])
    # Optional: only search this one video ("chat with a video" mode)
    video_id: str | None = Field(default=None, examples=["IHZwWFHWa-w"])


class Source(BaseModel):
    number: int
    title: str
    timestamp: str          # "2:05"
    url: str | None = None  # opens the video at that moment
    score: float


class AskResponse(BaseModel):
    answer: str
    covered: bool           # False = the Answer Guard said "not covered"
    sources: list[Source]
"""LessonRecall AI service (FastAPI).

Run:  uvicorn app.main:app --reload --port 8000
Docs: http://localhost:8000/docs  (Swagger UI, like springdoc-openapi)

Java comparison:
- `app = FastAPI()`           ~ your @SpringBootApplication
- `@app.post("/ingest/...")`  ~ @PostMapping in a @RestController
- `@app.exception_handler`    ~ @ExceptionHandler in a @ControllerAdvice
"""
import hashlib
import logging
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.ingestion import whisper_transcriber
from app.ingestion.chunker import chunk_transcript
from app.ingestion.errors import IngestionError
from app.ingestion.validation import ensure_speech, extract_youtube_id, validate_upload
from app.ingestion.youtube import ingest_youtube
from app.models import ErrorResponse, IngestResponse, Transcript, YouTubeIngestRequest
from app.rag.vector_store import upsert_chunks
from fastapi import FastAPI, File, Form, Request, UploadFile
from app.rag.answer import answer_question
from app.models import AskRequest, AskResponse, ErrorResponse, IngestResponse, Transcript, YouTubeIngestRequest

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="LessonRecall AI Service",
    version="0.1.0",
    description="Ingestion pipeline: YouTube link or MP4/MP3 -> timestamped transcript chunks.",
)

ERROR_RESPONSES = {code: {"model": ErrorResponse} for code in (400, 404, 413, 415, 422, 502)}


@app.exception_handler(IngestionError)
def handle_ingestion_error(_: Request, exc: IngestionError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.code, "message": exc.message})


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/ingest/youtube", response_model=IngestResponse, responses=ERROR_RESPONSES)
def ingest_from_youtube(request: YouTubeIngestRequest) -> IngestResponse:
    """Paste a YouTube link. Uses YouTube's transcript when available, otherwise Whisper."""
    video_id = extract_youtube_id(request.url)
    transcript = ingest_youtube(video_id)
    return _build_response(transcript, request.course_id)


@app.post("/ingest/upload", response_model=IngestResponse, responses=ERROR_RESPONSES)
def ingest_from_upload(
    file: UploadFile = File(...),
    course_id: str = Form(default="demo", pattern=r"^[a-z0-9-]{1,64}$"),
) -> IngestResponse:
    """Upload an MP4 / MP3 (max 25 MB). Transcribed with Whisper."""
    settings = get_settings()
    data = file.file.read()
    ext = validate_upload(file.filename, len(data), settings.max_upload_mb)

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / f"upload{ext}"
        path.write_bytes(data)
        segments, language = whisper_transcriber.transcribe(path)

    transcript = Transcript(
        # Same file -> same id, so uploading twice doesn't create duplicates later
        video_id="upload-" + hashlib.sha256(data).hexdigest()[:12],
        title=Path(file.filename).stem,
        source_type="upload",
        transcript_source="whisper",
        language=language,
        segments=segments,
    )
    return _build_response(transcript, course_id)


def _build_response(transcript: Transcript, course_id: str) -> IngestResponse:
    ensure_speech(transcript.segments)
    settings = get_settings()
    chunks = chunk_transcript(transcript, settings.chunk_target_seconds, settings.chunk_overlap_seconds)
    stored = upsert_chunks(chunks, course_id)
    duration = int(round(max(s.end for s in transcript.segments)))
    return IngestResponse(
        video_id=transcript.video_id,
        title=transcript.title,
        source_type=transcript.source_type,
        transcript_source=transcript.transcript_source,
        language=transcript.language,
        duration_seconds=duration,
        chunk_count=len(chunks),
        chunks=chunks,
        course_id=course_id,
        stored_chunks=stored,
    )

@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    """Ask a question. Answers only from the course videos, with timestamp links."""
    result = answer_question(request.question, request.course_id, request.video_id)
    return AskResponse(**result)

"""LessonRecall AI service (FastAPI).

Run:  uvicorn app.main:app --reload --port 8000
Docs: http://localhost:8000/docs  (Swagger UI, like springdoc-openapi)

Java comparison:
- `app = FastAPI()`           ~ your @SpringBootApplication
- `@app.post("/ingest/...")`  ~ @PostMapping in a @RestController
- `@app.exception_handler`    ~ @ExceptionHandler in a @ControllerAdvice
"""
from dotenv import load_dotenv
load_dotenv(override=True)
import hashlib
import logging
import tempfile
from pathlib import Path
from fastapi import Depends, FastAPI, File, Form, Header, Request, UploadFile
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse
from app.agent.agent import chat
from app.config import get_settings
from app.rag.course_quiz import generate_course_quiz
from app.models import CourseQuizRequest  
from app.ingestion import whisper_transcriber
from app.ingestion.chunker import chunk_transcript
from app.ingestion.errors import IngestionError
from app.ingestion.validation import ensure_speech, extract_youtube_id, validate_upload
from app.ingestion.youtube import ingest_youtube
from app.models import ErrorResponse, IngestResponse, Transcript, YouTubeIngestRequest
from app.rag.vector_store import upsert_chunks
from fastapi import FastAPI, File, Form, Request, UploadFile
from app.rag.answer import answer_question
from app.rag.quiz import generate_quiz
from app.models import (
    AskRequest, AskResponse, ChatRequest, ChatResponse, ErrorResponse, IngestResponse,
    PdfIngestResponse, SummaryRequest, SummaryResponse, Transcript, TranscriptRequest,
    TranscriptResponse, YouTubeIngestRequest, QuizRequest, QuizResponse,
)
from app.ingestion.pdf import pdf_to_chunks
from app.ingestion.errors import FileTooLargeError, IngestionError, UnsupportedFileError,NotFoundError,UnauthorizedError
logging.basicConfig(level=logging.INFO)
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from app.rag.summary import summarize_video
from app.rag.summary import load_video_chunks
from app.rag.vector_store import delete_course_vectors, delete_document_vectors

OPEN_PATHS = {"/health", "/docs", "/openapi.json"}


def verify_internal_token(request: Request, x_internal_token: str | None = Header(default=None)) -> None:
    """Only Spring Boot (which knows the token) may call the AI service."""
    expected = get_settings().internal_api_token
    if expected and request.url.path not in OPEN_PATHS and x_internal_token != expected:
        raise UnauthorizedError("Missing or invalid internal token.")

app = FastAPI(
    title="LessonRecall AI Service",
    version="0.1.0",
    description="Ingestion pipeline: YouTube link or MP4/MP3 -> timestamped transcript chunks.",
    dependencies=[Depends(verify_internal_token)],
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
    transcript = ingest_youtube(video_id, request.language)        # ← language passed here
    return _build_response(transcript, request.course_id)


@app.post("/ingest/upload", response_model=IngestResponse, responses=ERROR_RESPONSES)
def ingest_from_upload(
    file: UploadFile = File(...),
    course_id: str = Form(default="demo", pattern=r"^[a-z0-9-]{1,64}$"),
) -> IngestResponse:
    """Upload an MP4 / MP3 (max 25 MB). Transcribed with Whisper."""
    settings = get_settings()
    data = file.file.read()
    language: str | None = Form(None)
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
        course_id=course_id,        
        stored_chunks=stored,       
        video_id=transcript.video_id,
        title=transcript.title,
        source_type=transcript.source_type,
        transcript_source=transcript.transcript_source,
        language=transcript.language,
        duration_seconds=duration,
        chunk_count=len(chunks),
        chunks=chunks,
        
    )

@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    """Ask a question. Answers only from the course videos, with timestamp links."""
    result = answer_question(request.question, request.course_id, request.video_id)
    return AskResponse(**result)


@app.post("/ingest/pdf", response_model=PdfIngestResponse, responses=ERROR_RESPONSES)
def ingest_pdf(
    file: UploadFile = File(...),
    course_id: str = Form(default="demo", pattern=r"^[a-z0-9-]{1,64}$"),
) -> PdfIngestResponse:
    """Upload slides or a PDF. Each page becomes a searchable chunk."""
    data = file.file.read()
    if not (file.filename or "").lower().endswith(".pdf"):
        raise UnsupportedFileError("Please upload a .pdf file.")
    if len(data) > get_settings().max_upload_mb * 1024 * 1024:
        raise FileTooLargeError(f"The PDF is larger than {get_settings().max_upload_mb} MB.")

    document_id, title, page_count, chunks = pdf_to_chunks(data, file.filename)
    stored = upsert_chunks(chunks, course_id)
    return PdfIngestResponse(
        course_id=course_id, document_id=document_id, title=title,
        page_count=page_count, stored_chunks=stored,
    )

@app.post("/summary", response_model=SummaryResponse)
def summary(request: SummaryRequest) -> SummaryResponse:
    """Short summary, key points and chapters with timestamps for one video."""
    result = summarize_video(request.course_id, request.video_id)
    if result is None:
        raise NotFoundError("No video with this ID in this course.")
    return SummaryResponse(**result)

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Chat with the LessonRecall agent. Same thread_id = same conversation (memory)."""
    return ChatResponse(**chat(request.message, request.thread_id, request.course_id,
                               request.video_id, language=request.language))

@app.post("/transcript", response_model=TranscriptResponse)
def transcript(request: TranscriptRequest) -> TranscriptResponse:
    """The video's transcript as timestamped sections (the stored chunks, in order)."""
    chunks = load_video_chunks(request.course_id, request.video_id)
    if not chunks or chunks[0].get("source_type") == "pdf":
        raise NotFoundError("No video with this ID in this course.")
    return TranscriptResponse(
        video_id=request.video_id,
        sections=[{"start_seconds": int(c["start_seconds"]), "end_seconds": int(c["end_seconds"]), "text": c["text"]}
                  for c in chunks],
    )

@app.post("/quiz", response_model=QuizResponse)
def quiz(request: QuizRequest) -> QuizResponse:
    """Multiple-choice quiz for one video; every question links to the minute where it is explained."""
    questions = generate_quiz(request.course_id, request.video_id, request.number_of_questions)
    if questions is None:
        raise NotFoundError("No video with this ID in this course.")
    return QuizResponse(video_id=request.video_id, questions=questions)

@app.delete("/courses/{course_id}")
def delete_course(course_id: str):
    delete_course_vectors(course_id)
    return {"deleted": True}


@app.delete("/courses/{course_id}/documents/{doc_id}")
def delete_document(course_id: str, doc_id: str):
    return {"deleted": delete_document_vectors(course_id, doc_id)}

@app.post("/course-quiz", responses=ERROR_RESPONSES)
def course_quiz(request: CourseQuizRequest):
    """Final quiz across all materials of a course (with correct answers: Spring Boot keeps them secret)."""
    return {"questions": generate_course_quiz(request.course_id, request.document_ids,
                                              request.number_of_questions)}
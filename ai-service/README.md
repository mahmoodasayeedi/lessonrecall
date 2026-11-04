# LessonRecall – AI service

Python FastAPI service. Day 1: the ingestion pipeline.

```
YouTube link ──► YouTube transcript? ──yes──► segments ─┐
                       │ no                             │
                       ▼                                ├─► validate speech ─► chunk (~75 s, 10 s overlap) ─► JSON
              yt-dlp audio ─► Whisper ─► segments ──────┤
MP4/MP3 upload ─► validate type/size ─► Whisper ────────┘
```

## Setup (once)

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate      Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
# then open .env and paste your OPENAI_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs and try:

- `POST /ingest/youtube` with `{"url": "https://www.youtube.com/watch?v=..."}`
- `POST /ingest/upload` with an MP3/MP4 file (max 25 MB)

## Test

```bash
pytest -v
```

The tests need no internet or API key: YouTube and Whisper are replaced with fakes.

## Files

| File | What it does |
| --- | --- |
| `app/main.py` | FastAPI app and endpoints (like a `@RestController`) |
| `app/models.py` | Pydantic models (like DTOs) |
| `app/config.py` | Settings from `.env` (like `@ConfigurationProperties`) |
| `app/ingestion/validation.py` | YouTube link parsing, file checks, "no speech" check |
| `app/ingestion/youtube.py` | YouTube transcript, with yt-dlp + Whisper fallback |
| `app/ingestion/whisper_transcriber.py` | OpenAI Whisper API with segment timestamps |
| `app/ingestion/chunker.py` | Splits transcripts into timestamped chunks |
| `app/ingestion/errors.py` | Error types → clean JSON errors |

## Error codes

| Code | HTTP | When |
| --- | --- | --- |
| `INVALID_URL` | 400 | Not a YouTube link, or no valid video ID |
| `VIDEO_UNAVAILABLE` | 404 | Private, removed or non-existent video |
| `FILE_TOO_LARGE` | 413 | Upload or audio over 25 MB |
| `UNSUPPORTED_FILE` | 415 | Wrong file type or empty file |
| `NO_SPEECH` | 422 | Video has no speech (silence, music only) |
| `TRANSCRIPTION_FAILED` | 502 | YouTube unreachable, download or Whisper failed |

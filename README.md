# LessonRecall

An AI study assistant for course videos: ask questions and get answers with links to the exact minute, practise with quizzes, and follow a study plan.

_Status: in development. Ironhack AI Engineering Bootcamp final project (2026)._

## What works today

| Feature                                                                                            | Status           |
| -------------------------------------------------------------------------------------------------- | ---------------- |
| YouTube ingestion: YouTube transcript, fallback to yt-dlp + Whisper                                | ✅ Built         |
| MP4/MP3 upload (Whisper) and PDF/slides ingestion (one chunk per page)                             | ✅ Built         |
| Input validation with clear errors (broken links, no speech, wrong/too large files)                | ✅ Built         |
| Pinecone vector store, one namespace per course                                                    | ✅ Built         |
| Question answering with citations to the exact minute or PDF page                                  | ✅ Built         |
| Answer Guard: refuses off-topic questions instead of guessing                                      | ✅ Built         |
| Summary, key points and timestamped chapters                                                       | ✅ Built         |
| LangGraph agent with tools (video search, course search, quiz generator, study planner) and memory | ✅ Built         |
| LangSmith tracing                                                                                  | ✅ Built         |
| Spring Boot backend: PostgreSQL, JPA data model, JWT login with roles                              | ✅ Built         |
| Course spaces with roles (class courses, private courses, enrollment)                              | 🔄 In progress   |
| React frontend                                                                                     | ⏳ Next          |
| LangSmith evaluation (~30 questions)                                                               | ⏳ Planned       |
| Deployment (Vercel + Render)                                                                       | ⏳ Planned       |
| Instructor dashboard, coding version check                                                         | 🎯 Stretch goals |

## Architecture

```
React (Vercel) → Spring Boot API (JWT, roles, PostgreSQL) → FastAPI AI service → Pinecone · OpenAI · LangSmith
```

- **Spring Boot** handles users, roles, courses and progress. React only talks to Spring Boot, so the AI service and API keys stay private.
- **FastAPI** handles ingestion, retrieval and the LangGraph agent, because the AI tools (LangChain, LangGraph, Whisper) are Python-first.

## Project structure

| Folder               | What it is                                                  |
| -------------------- | ----------------------------------------------------------- |
| `ai-service/`        | Python FastAPI: ingestion, retrieval, summaries, agent      |
| `backend-java/`      | Spring Boot 4 API (Java 21): auth, roles, courses, progress |
| `frontend/`          | React (Vite) app                                            |
| `docker-compose.yml` | PostgreSQL for local development                            |

## Tech stack

| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Frontend             | React (Vite)                                                   |
| Backend              | Java 21, Spring Boot 4, Spring Security (JWT), Spring Data JPA |
| Database             | PostgreSQL 17 (Docker)                                         |
| AI service           | Python, FastAPI, LangChain, LangGraph                          |
| Speech recognition   | YouTube transcripts, Whisper (fallback and uploads)            |
| Embeddings / LLM     | OpenAI text-embedding-3-small, GPT-4o-mini                     |
| Vector database      | Pinecone                                                       |
| Tracing / evaluation | LangSmith                                                      |
| Deployment (planned) | Vercel (frontend), Render (backend + AI service)               |

## Getting started

**1. Database**

```bash
docker compose up -d
```

**2. AI service** (see [`ai-service/README.md`](ai-service/README.md))

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # add your API keys
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**3. Backend**

```bash
cd backend-java
.\mvnw.cmd spring-boot:run      # Mac/Linux: ./mvnw spring-boot:run
```

Runs on http://localhost:8080

## Configuration

API keys live in `ai-service/.env` (never committed). See `.env.example` for the full list: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `LANGSMITH_API_KEY` and others. The backend's JWT secret is read from the `JWT_SECRET` environment variable in production.

## Demo course

3Blue1Brown, _Neural Networks_ (4 videos, English) plus the written lesson as PDF.

## Evaluation (planned)

A fixed demo course with ~30 hand-written questions, measured in LangSmith:

| Metric                | What it measures                         |
| --------------------- | ---------------------------------------- |
| Answer accuracy       | Is the answer correct?                   |
| Retrieval hit rate    | Was the right chunk retrieved?           |
| Timestamp correctness | Does the link point to the right minute? |
| Latency               | How long until the answer appears?       |

## Data and privacy

- The demo uses public YouTube videos only; transcripts are used only for search and answers.
- API keys and secrets are kept in environment variables and excluded from Git.

## Author

Mahmooda Sayeedi. Java developer and technical trainer, now building AI applications.

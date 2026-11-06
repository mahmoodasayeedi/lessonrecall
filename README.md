# LessonRecall

An AI study assistant for course videos: ask questions and get answers with links to the exact minute, see your questions pinned on a Recall timeline, and (next) practise with quizzes and flashcards.

_Status: in development. Ironhack AI Engineering Bootcamp final project (2026)._

## What works today

| Feature                                                                                            | Status           |
| -------------------------------------------------------------------------------------------------- | ---------------- |
| Speech pipeline: YouTube transcript, fallback to yt-dlp + Whisper                                  | ✅ Built         |
| MP4/MP3 upload (Whisper) and PDF/slides (one chunk per page)                                       | ✅ Built         |
| Input validation with clear errors (broken links, no speech, wrong or too-large files)             | ✅ Built         |
| Pinecone vector store, one namespace per course                                                    | ✅ Built         |
| Answers grounded in the course, citing the exact minute or PDF page                                | ✅ Built         |
| Answer Guard: says "not covered" instead of guessing                                               | ✅ Built         |
| Deterministic timestamps: time labels recalculated from the source link in code                    | ✅ Built         |
| Summaries with timestamped chapters                                                                | ✅ Built         |
| LangGraph agent with tools (video search, course search, quiz generator, study planner) and memory | ✅ Built         |
| LangSmith tracing                                                                                  | ✅ Built         |
| Spring Boot backend: JWT login, roles (learner/instructor), class and private courses, enrollment  | ✅ Built         |
| Materials through Spring with status tracking (processing / ready / failed)                        | ✅ Built         |
| Chat sessions with history saved in PostgreSQL                                                     | ✅ Built         |
| React frontend: login, my courses, catalog, course page                                            | ✅ Built         |
| **Recall timeline**: chapters and answer pins under the video                                      | ✅ Built         |
| Transcript tab with clickable timestamps, "Ask next" suggestions, hide-chat layout                 | ✅ Built         |
| Quizzes and flashcards linked to the video minute                                                  | 🔄 Next          |
| Weak topics and "Replay my gaps"                                                                   | ⏳ Planned       |
| LangSmith evaluation (~30 questions)                                                               | ⏳ Planned       |
| Deployment (Vercel + Render)                                                                       | ⏳ Planned       |
| Instructor class insights, coding version check                                                    | 🎯 Stretch goals |

## Architecture

```
React (Vite) ──► Spring Boot API ──► FastAPI AI service ──► Pinecone · OpenAI
                 JWT, roles,          only callable with        LangSmith (tracing)
                 PostgreSQL           X-Internal-Token
```

- **Spring Boot** handles users, roles, courses, materials, chat history and progress. React only talks to Spring Boot.
- **FastAPI** handles ingestion, retrieval, summaries and the LangGraph agent. It only accepts requests carrying the internal token, so the AI service and the API keys stay private.

## Project structure

| Folder               | What it is                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `ai-service/`        | Python FastAPI: ingestion, retrieval, summaries, agent              |
| `backend-java/`      | Spring Boot 4 API (Java 21): auth, roles, courses, materials, chats |
| `frontend/`          | React (Vite) app                                                    |
| `docker-compose.yml` | PostgreSQL for local development                                    |

## Tech stack

| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Frontend             | React 19, Vite, React Router                                   |
| Backend              | Java 21, Spring Boot 4, Spring Security (JWT), Spring Data JPA |
| Database             | PostgreSQL 17 (Docker)                                         |
| AI service           | Python, FastAPI, LangChain, LangGraph                          |
| Speech recognition   | YouTube transcripts, Whisper (fallback and uploads)            |
| Embeddings / LLM     | OpenAI text-embedding-3-small, GPT-4o-mini                     |
| Vector database      | Pinecone                                                       |
| Tracing / evaluation | LangSmith                                                      |
| Deployment (planned) | Vercel (frontend), Render (backend + AI service)               |

## Getting started

Start the four parts in this order.

**1. Database**

```bash
docker compose up -d
```

**2. AI service** (port 8000)

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # add your API keys
python -m uvicorn app.main:app --reload --port 8000
```

**3. Backend** (port 8080)

```bash
cd backend-java
.\mvnw.cmd spring-boot:run      # Mac/Linux: ./mvnw spring-boot:run
```

**4. Frontend** (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Configuration

| Where             | Variable                                                  | Purpose                                                 |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `ai-service/.env` | `OPENAI_API_KEY`, `PINECONE_API_KEY`, `LANGSMITH_API_KEY` | AI services                                             |
| `ai-service/.env` | `INTERNAL_API_TOKEN`                                      | Shared secret: only the backend may call the AI service |
| Backend (env var) | `AI_SERVICE_TOKEN`                                        | Must match `INTERNAL_API_TOKEN`                         |
| Backend (env var) | `JWT_SECRET`                                              | Signs login tokens (long random value in production)    |

`.env` files are never committed. See `ai-service/.env.example` for the full list.

## API overview (Spring Boot, all JWT-protected except auth)

```
POST /api/auth/register · POST /api/auth/login · GET /api/auth/me
POST /api/courses · GET /api/courses/mine · GET /api/courses/catalog · POST /api/courses/{id}/join
POST /api/courses/{id}/materials/youtube · POST /api/courses/{id}/materials/upload · GET /api/courses/{id}/materials
GET  /api/courses/{id}/materials/{mid}/summary · GET /api/courses/{id}/materials/{mid}/transcript
POST /api/courses/{id}/ask
POST /api/courses/{id}/chats · GET /api/courses/{id}/chats · POST /api/chats/{sid}/messages · GET /api/chats/{sid}/messages
```

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
- Passwords are stored as BCrypt hashes; API keys and secrets live in environment variables and are excluded from Git.

## Author

Mahmooda Sayeedir. Java developer and technical trainer, now building AI applications.

# LessonRecall

**Ask your course. Get the exact minute.**

LessonRecall is an AI study assistant for course videos and slides. Learners ask questions by text or voice, in any language, and get answers that come **only** from the course material. Every answer links to the **exact minute** of the video or the **page** of the PDF where it was explained.

Final project · Ironhack AI Engineering bootcamp · Mahmooda Sayeedir

**Live app:** https://lessonrecall.vercel.app

> Free hosting: after 15 minutes without traffic the servers sleep. The first request can take 2–3 minutes while they wake up.

---

## Features

### Built

| Area                                | What it does                                                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Speech pipeline**                 | YouTube captions via `youtube-transcript-api`; if there are none, audio download with `yt-dlp` + **OpenAI Whisper** transcription. Also MP4/MP3/M4A/WAV uploads (Whisper) and PDF slides (one chunk per page). Video language can be chosen or auto-detected |
| **RAG with minute-exact citations** | ~75 s chunks with 10 s overlap, OpenAI embeddings, **Pinecone** with one namespace per course. Citations are rebuilt deterministically from the timestamp, so links never point to an invented minute                                                        |
| **Answer Guard**                    | Relevance threshold + prompt rules: if the course doesn't cover a question, LessonRecall says so instead of making something up                                                                                                                              |
| **LangGraph agent**                 | Tools: `video_search`, `course_search`, `video_summary`, `quiz_generator`, `study_planner`; conversation memory per chat thread; follow-up suggestions                                                                                                       |
| **Recall timeline**                 | Chapters, pins for every question asked, and rose **weak-topic zones** from missed quiz questions; click to replay                                                                                                                                           |
| **Practice**                        | Quiz and flashcards per video, with a link back to the moment each answer is explained                                                                                                                                                                       |
| **Final course quiz**               | Instructor generates a quiz across all materials, reviews it, sets a pass mark and publishes it. Learners get one attempt; grading happens on the server; class results for the instructor                                                                   |
| **Languages & voice**               | Answer language per user (7 languages), voice input (browser speech recognition), read-aloud answers with a speaking avatar                                                                                                                                  |
| **Roles**                           | Instructors create class courses; learners join from the catalog or create private courses. Owners can edit/delete; learners can leave                                                                                                                       |
| **Evaluation**                      | LangSmith evaluation with 30 questions and 5 metrics; results are public on the [Evaluation page](https://lessonrecall.vercel.app/evaluation)                                                                                                                |
| **Streaming answers**               | Tokens stream from the LangGraph agent through FastAPI (SSE) and Spring Boot (`SseEmitter`) to React, so answers appear word by word                                                                                                                         |
| **Deployment**                      | Live on Vercel + Render; YouTube captions and titles are fetched through a residential proxy in the cloud                                                                                                                                                    |

### Planned (stretch goals)

- Instructor dashboard with class insights (weakest topics across learners)
- Version check for coding courses
- Residential proxy for the Whisper fallback (audio download) in the cloud
- Live lip-synced avatar, natural TTS voice, Whisper for voice questions
- Google login, dark mode

---

## Architecture

```
            ┌────────────────────┐
 Browser ──►│  React (Vite)       │  Vercel
            └─────────┬──────────┘
                      │ REST + JWT
            ┌─────────▼──────────┐       ┌──────────────────┐
            │  Spring Boot 4      │──────►│  PostgreSQL 17    │  Render
            │  Java 21            │       └──────────────────┘
            │  auth · roles · data│
            └─────────┬──────────┘
                      │ REST + internal token
            ┌─────────▼──────────┐       ┌──────────────────────────────┐
            │  FastAPI (Python)   │──────►│ OpenAI (GPT, embeddings,     │
            │  LangChain/LangGraph│       │ Whisper) · Pinecone · LangSmith│
            └────────────────────┘       └──────────────────────────────┘
```

### Why two backends?

- **Spring Boot** owns everything that is about _users and data_: JWT authentication, roles (learner / instructor), courses, enrollments, materials, chats, quiz results and the final quiz. Grading happens here, so learners never receive the answers in advance.
- **FastAPI** owns everything that is about _AI_: ingestion, transcription, embeddings, retrieval, the LangGraph agent and quiz generation. The Python ecosystem (LangChain, LangGraph, Whisper, yt-dlp, Pinecone SDK) is first-class there.
- **React only talks to Spring Boot.** FastAPI is protected with an internal token and is never called by the browser directly.

---

## Tech stack

**Frontend:** React 19, Vite, React Router · **Backend:** Spring Boot 4.1, Java 21, Spring Security (OAuth2 resource server, JWT HS256), Spring Data JPA, PostgreSQL · **AI service:** Python, FastAPI, LangChain, LangGraph, OpenAI (GPT-4o-mini, text-embedding-3-small, Whisper), Pinecone, LangSmith, youtube-transcript-api, yt-dlp, pypdf · **Deployment:** Docker, Render, Vercel

---

## Project structure

```
lessonrecall/
├── ai-service/        FastAPI: ingestion, RAG, agent, quizzes   (Dockerfile)
│   ├── app/ingestion/ YouTube, Whisper, PDF, chunking
│   ├── app/rag/       embeddings, Pinecone, answers, summaries, quizzes
│   ├── app/agent/     LangGraph agent and tools
│   └── tests/
├── backend-java/      Spring Boot API                            (Dockerfile)
├── frontend/          React app                                  (vercel.json)
└── docker-compose.yml local PostgreSQL
```

---

## Run locally

**Prerequisites:** Docker Desktop, Python 3.12+, Java 21, Node.js 20+, API keys for OpenAI, Pinecone and LangSmith.

**1. Database**

```bash
docker compose up -d
```

**2. AI service**

```bash
cd ai-service
python -m venv .venv && .venv\Scripts\activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                                 # then fill in your keys
python -m uvicorn app.main:app --reload              # http://127.0.0.1:8000/docs
```

**3. Backend**

```bash
cd backend-java
./mvnw spring-boot:run                               # http://localhost:8080
```

**4. Frontend**

```bash
cd frontend
npm install
npm run dev                                          # http://localhost:5173
```

---

## Configuration

All values have local defaults; in production they are set as environment variables on Render/Vercel (never committed).

| Service    | Variable                                                      | Purpose                                                 |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| AI service | `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`        | AI and vector store                                     |
|            | `EMBEDDING_MODEL`, `CHAT_MODEL`                               | Model choice                                            |
|            | `LANGSMITH_API_KEY`, `LANGSMITH_TRACING`, `LANGSMITH_PROJECT` | Tracing and evaluation                                  |
|            | `INTERNAL_API_TOKEN`                                          | Only Spring Boot may call the AI service                |
|            | `WEBSHARE_PROXY_USERNAME`, `WEBSHARE_PROXY_PASSWORD`          | Residential proxy for YouTube (production only)         |
| Backend    | `DB_URL`, `DB_USER`, `DB_PASSWORD`                            | PostgreSQL (JDBC URL)                                   |
|            | `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`                          | AI service address and the same internal token          |
|            | `JWT_SECRET`                                                  | Signs login tokens                                      |
|            | `CORS_ORIGINS`                                                | Allowed frontend addresses                              |
|            | `PORT`, `SHOW_SQL`                                            | Set by Render / logging                                 |
| Frontend   | `VITE_API_URL`                                                | Backend address (empty locally: the Vite proxy is used) |

---

## Deployment

| Part        | Platform            | Notes                                                              |
| ----------- | ------------------- | ------------------------------------------------------------------ |
| Frontend    | **Vercel**          | Root `frontend`, `vercel.json` rewrites all routes to `index.html` |
| Spring Boot | **Render** (Docker) | Two-stage build: Maven → Java 21 JRE                               |
| FastAPI     | **Render** (Docker) | Python 3.12 slim + ffmpeg, health check `/health`                  |
| Database    | **Render Postgres** | Same region (Frankfurt) as the services                            |

Production uses its own Pinecone index (`lessonrecall-prod`), so local and live data never mix.

### YouTube from the cloud

YouTube blocks requests from cloud server IPs. The AI service therefore fetches captions and video titles (YouTube oEmbed) through a **rotating residential proxy** (Webshare), configured with `WEBSHARE_PROXY_USERNAME` / `WEBSHARE_PROXY_PASSWORD` on Render; locally no proxy is used. Usage is about 0.5 MB per video with a 100 % success rate.

**Remaining limitation:** the Whisper fallback (audio download with `yt-dlp`) is not proxied yet, so on the live app only YouTube videos that have captions can be added. Uploads (MP4/MP3) work everywhere.

---

## Evaluation (LangSmith)

30 questions about two real courses (16 Neural Networks, 7 Java, 3 in German, 4 the courses don't cover), each with an expected answer, video and second (`ai-service/eval/questions.csv`). `python -m eval.run_eval` runs the real agent in whole-course mode as a LangSmith experiment and writes `frontend/public/eval-results.json`, which is shown on the [Evaluation page](https://lessonrecall.vercel.app/evaluation).

| Metric                | How it is measured                                        | Result                      |
| --------------------- | --------------------------------------------------------- | --------------------------- |
| Accuracy              | LLM judge vs. reference answer; not-covered = no citation | **97 %**                    |
| Grounded              | Answer cites a video minute or a slide page               | **96 %**                    |
| Retrieval hit rate    | The expected video is cited                               | **85 %**                    |
| Timestamp correctness | Cited minute within ±75 s (one chunk)                     | **73 %**                    |
| Latency               | Full answer including follow-up suggestions               | **5.2 s** median, 6.8 s p90 |

The first run showed only 58 % retrieval hits. The misses revealed a real bug: the agent sometimes merged two citations in one bracket, which also made them unclickable in the app. After fixing `fix_citations` and the prompt, the hit rate rose to 85 %.

## API overview (Spring Boot)

| Area       | Endpoints                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Auth       | `POST /api/auth/register`, `/login`, `GET /me`, `PUT /password`, `GET/PUT /language`, `GET/PUT /avatar`                           |
| Courses    | `GET/POST /api/courses`, `/mine`, `/catalog`, `POST /{id}/join`, `PUT/DELETE /{id}`, `DELETE /{id}/enrollment`                    |
| Materials  | `POST /api/courses/{id}/materials/youtube`, `/upload`, `GET` list, `DELETE /{mid}`, `GET /{mid}/summary`, `/transcript`, `/quiz`  |
| Chat       | `GET/POST /api/courses/{id}/chats`, `GET/POST /api/chats/{sid}/messages`, `POST /api/chats/{sid}/messages/stream` (SSE)           |
| Progress   | `POST /api/courses/{id}/quiz-results`, `GET /weak-topics`                                                                         |
| Final quiz | `GET /api/courses/{id}/final-quiz`, `POST /generate`, `DELETE /questions/{qid}`, `POST /publish`, `POST /attempt`, `GET /results` |

---

## Demo content

The demo courses use the public _Neural Networks_ series by 3Blue1Brown and short _Java Basics_ videos by Guru99 on YouTube, used for educational demonstration only.

## Data and privacy

- The demo uses public YouTube videos only; transcripts are used only for search and answers.
- Passwords are stored as BCrypt hashes; API keys and secrets live in environment variables and are excluded from Git.

## Author

Mahmooda Sayeedir. Java developer and technical trainer, now building AI applications.

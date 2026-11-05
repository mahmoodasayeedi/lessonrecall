"""Summary, key points and chapters for one video (structured output with LangChain)."""
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.config import get_settings
from app.rag.answer import format_time
from app.rag.vector_store import get_index


class Chapter(BaseModel):
    title: str = Field(description="Short chapter title, max 8 words")
    start_seconds: int = Field(description="Start time in seconds, copied from a [seconds] marker")


class VideoSummary(BaseModel):
    summary: str = Field(description="3-4 sentence summary of the video")
    key_points: list[str] = Field(description="4-6 main ideas, one sentence each")
    chapters: list[Chapter] = Field(description="4-8 chapters in time order")


SYSTEM_PROMPT = """You summarise a lecture transcript for a student.
Each line starts with its start time in seconds, like [125].
Use only the transcript. Chapter start times must be copied from the [seconds] markers."""


def load_video_chunks(course_id: str, video_id: str) -> list[dict]:
    ids = [f"{video_id}-{i}" for i in range(100)]
    result = get_index().fetch(ids=ids, namespace=course_id)
    chunks = [v.metadata for v in result.vectors.values()]
    return sorted(chunks, key=lambda c: c["chunk_index"])


def summarize_video(course_id: str, video_id: str) -> dict | None:
    chunks = load_video_chunks(course_id, video_id)
    if not chunks or chunks[0].get("source_type") == "pdf":
        return None

    transcript = "\n".join(f"[{int(c['start_seconds'])}] {c['text']}" for c in chunks)

    settings = get_settings()
    llm = ChatOpenAI(model=settings.chat_model, temperature=0, api_key=settings.openai_api_key)
    result: VideoSummary = llm.with_structured_output(VideoSummary).invoke(
        [("system", SYSTEM_PROMPT), ("human", transcript)]
    )

    is_youtube = chunks[0].get("source_type") == "youtube"
    return {
        "video_id": video_id,
        "title": chunks[0]["title"],
        "summary": result.summary,
        "key_points": result.key_points,
        "chapters": [
            {
                "title": ch.title,
                "timestamp": format_time(ch.start_seconds),
                "url": f"https://www.youtube.com/watch?v={video_id}&t={ch.start_seconds}s" if is_youtube else None,
            }
            for ch in result.chapters
        ],
    }
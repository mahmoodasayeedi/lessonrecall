"""Final quiz over a WHOLE course: questions spread across all videos and PDFs."""
from typing import Literal

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.config import get_settings
from app.ingestion.errors import NotFoundError
from app.rag.answer import location
from app.rag.summary import load_video_chunks


class CourseQuizItem(BaseModel):
    topic: str = Field(description="Short topic tag, 2-4 words")
    question: str
    options: list[str] = Field(description="Exactly 4 answer options")
    correct_option: int = Field(description="Index 0-3 of the correct option")
    explanation: str = Field(description="1-2 sentences why the answer is correct")
    difficulty: Literal["easy", "medium", "hard"]
    source_number: int = Field(description="Number of the [source] the question is based on")


class CourseQuiz(BaseModel):
    questions: list[CourseQuizItem]


MAX_SOURCES = 16


def generate_course_quiz(course_id: str, document_ids: list[str], n: int = 10) -> list[dict]:
    # 1. Pick evenly spaced chunks from every document, so the quiz covers the whole course
    per_doc = max(2, MAX_SOURCES // max(1, len(document_ids)))
    sources = []
    for doc_id in document_ids:
        chunks = load_video_chunks(course_id, doc_id)
        if chunks:
            step = max(1, len(chunks) // per_doc)
            body = chunks[1:] if len(chunks) > 3 else chunks     # skip the intro of longer videos
            step = max(1, len(body) // per_doc)
            sources += body[::step][:per_doc]
    if not sources:
        raise NotFoundError("This course has no ready materials yet.")

    context = "\n\n".join(
        f"[{i}] ({c['title']}, {location(c)}) {c['text']}" for i, c in enumerate(sources, 1)
    )
    prompt = (
        f"You write a final exam for a course. Write {n} multiple-choice questions that cover "
        "the WHOLE course, spread across as many different sources as possible. "
        "Mix easy, medium and hard. Each question has exactly 4 options and exactly one correct answer. "
        "Use ONLY the sources below and give the number of the source each question is based on."
        "Every question AND its correct answer must be stated explicitly in its source. "
        "Never use general knowledge; skip a source rather than invent facts."
    )

    # 2. Ask the LLM for a structured quiz
    settings = get_settings()
    llm = ChatOpenAI(model=settings.chat_model, temperature=0.3, api_key=settings.openai_api_key)
    result: CourseQuiz = llm.with_structured_output(CourseQuiz).invoke(
        [("system", prompt), ("human", context)]
    )

    # 3. Validate and attach the exact minute / page of each question's source
    questions = []
    for q in result.questions:
        if len(q.options) != 4 or not 0 <= q.correct_option < 4 or not 1 <= q.source_number <= len(sources):
            continue
        src = sources[q.source_number - 1]
        is_youtube = src.get("source_type") == "youtube"
        start = int(src["start_seconds"]) if src.get("start_seconds") is not None else None
        questions.append({
            "topic": q.topic,
            "question": q.question,
            "options": q.options,
            "correct_option": q.correct_option,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "source_title": src["title"],
            "location": location(src),                       # "9:16" or "page 4"
            "video_id": src.get("video_id") if start is not None else None,
            "start_seconds": start,
            "url": f"https://www.youtube.com/watch?v={src['video_id']}&t={start}s" if is_youtube else None,
        })
    return questions[:n]
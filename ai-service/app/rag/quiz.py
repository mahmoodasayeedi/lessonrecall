"""Quiz generation for one video: questions spread over the whole lesson, each linked to its minute."""
from typing import Literal

from pydantic import BaseModel, Field

from app.agent.tools import get_llm
from app.rag.answer import format_time
from app.rag.summary import load_video_chunks


class QuizItem(BaseModel):
    question: str
    options: list[str] = Field(description="Exactly 4 answer options, clearly different from each other")
    correct_option: int = Field(description="Index 0-3 of the only correct option")
    explanation: str = Field(description="One sentence explaining why the answer is correct")
    difficulty: Literal["easy", "medium", "hard"]
    source_number: int = Field(description="The [n] of the source where the answer is explained")


class Quiz(BaseModel):
    questions: list[QuizItem]


PROMPT = """Write {n} multiple-choice questions for a student, using ONLY the numbered sources below.
Rules:
- Ask about the main ideas of the lesson, not trivia.
- Exactly one option is correct; the other options must be clearly wrong.
- Mix difficulties: some easy, some medium, some hard.
- Spread the questions over different sources.

Sources:
{sources}"""


def generate_quiz(course_id: str, video_id: str, n: int = 5) -> list[dict] | None:
    chunks = load_video_chunks(course_id, video_id)
    if not chunks or chunks[0].get("source_type") == "pdf":
        return None

    step = max(1, len(chunks) // 8)
    picked = chunks[::step][:8]                           # ~8 chunks spread over the whole video
    sources = "\n\n".join(f"[{i}] ({format_time(int(c['start_seconds']))}) {c['text']}"
                          for i, c in enumerate(picked, start=1))

    quiz: Quiz = get_llm().with_structured_output(Quiz).invoke(PROMPT.format(n=n, sources=sources))

    result = []
    for q in quiz.questions[:n]:
        if len(q.options) != 4 or not 0 <= q.correct_option <= 3:
            continue                                      # skip malformed questions
        src = picked[q.source_number - 1] if 1 <= q.source_number <= len(picked) else picked[0]
        start = int(src["start_seconds"])
        result.append({
            "question": q.question,
            "options": q.options,
            "correct_option": q.correct_option,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "start_seconds": start,
            "timestamp": format_time(start),
            "url": src.get("timestamp_url"),
        })
    return result
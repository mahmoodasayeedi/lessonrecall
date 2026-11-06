"""Tools the agent can call. Built per request so each tool knows the course (and video)."""
import json

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.config import get_settings
from app.rag.answer import location
from app.rag.vector_store import list_documents, search


def get_llm() -> ChatOpenAI:
    s = get_settings()
    return ChatOpenAI(model=s.chat_model, temperature=0, api_key=s.openai_api_key)


def format_results(matches: list[dict]) -> str:
    """Numbered sources the LLM can read and cite."""
    if not matches or matches[0]["score"] < get_settings().min_relevance_score:
        return "NO_RELEVANT_CONTENT"
    lines = []
    for i, m in enumerate(matches, start=1):
        
        lines.append(f"[{i}] {m['title']}\nCITE AS: ({location(m)}{', ' + m['timestamp_url'] if m.get('timestamp_url') else ''})\n{m['text']}")
    return "\n\n".join(lines)


# --- Structured outputs for quizzes and plans ---
class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(description="Exactly 4 answer options")
    correct_option: int = Field(description="Index 0-3 of the correct option")
    explanation: str = Field(description="One sentence: why it is correct")
    source_number: int = Field(description="Number of the source [n] where the answer is explained")


class Quiz(BaseModel):
    questions: list[QuizQuestion]


class PlanDay(BaseModel):
    day: int
    focus: str
    tasks: list[str] = Field(description="2-4 concrete tasks, naming the video or PDF to study")


class StudyPlan(BaseModel):
    days: list[PlanDay]


def make_tools(course_id: str, video_id: str | None = None) -> list:

    @tool
    def video_search(question: str) -> str:
        """Search the video the student is currently watching. Use for questions about 'this video'."""
        return format_results(search(question, course_id, video_id, top_k=4))

    @tool
    def course_search(question: str) -> str:
        """Search all videos and PDFs of the course. Use for any question about the course content."""
        return format_results(search(question, course_id, None, top_k=5))

    @tool
    def quiz_generator(topic: str, number_of_questions: int = 3) -> str:
        """Create multiple-choice quiz questions about a topic from the course, each linked to its source."""
        matches = search(topic, course_id, video_id, top_k=5)
        sources = format_results(matches)
        if sources == "NO_RELEVANT_CONTENT":
            return sources
        quiz: Quiz = get_llm().with_structured_output(Quiz).invoke(
            f"Write {number_of_questions} multiple-choice questions using ONLY these sources:\n\n{sources}"
        )
        result = []
        for q in quiz.questions:
            src = matches[q.source_number - 1] if 0 < q.source_number <= len(matches) else matches[0]
            result.append({**q.model_dump(), "location": location(src), "url": src.get("timestamp_url")})
        return json.dumps(result)

    @tool
    def study_planner(goal: str, days: int, minutes_per_day: int) -> str:
        """Create a day-by-day study plan for the course, e.g. 'exam in 10 days, 60 minutes a day'."""
        materials = "\n".join(f"- {d['title']} ({d['type']})" for d in list_documents(course_id))
        plan: StudyPlan = get_llm().with_structured_output(StudyPlan).invoke(
            f"Goal: {goal}. {days} days, {minutes_per_day} minutes per day.\n"
            f"Course materials:\n{materials}\nPlan the days using only these materials."
        )
        return plan.model_dump_json()

    if video_id:
        # "This video" scope: the agent can only search the current video
        return [video_search, quiz_generator, study_planner]
    return [video_search, course_search, quiz_generator, study_planner]
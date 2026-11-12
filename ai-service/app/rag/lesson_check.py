"""Lesson check: is this YouTube video good for learning? Rated from its captions (nothing is indexed)."""
from typing import Literal

from pydantic import BaseModel, Field

from app.agent.tools import get_llm
from app.config import get_settings
from app.ingestion.errors import NotFoundError
from app.ingestion.validation import extract_youtube_id
from app.ingestion.youtube import fetch_video_info, fetch_youtube_transcript, preferred_languages, watch_url


class Criteria(BaseModel):
    clarity: int = Field(ge=1, le=5, description="How clearly the concepts are explained")
    structure: int = Field(ge=1, le=5, description="Logical order, clear steps")
    examples: int = Field(ge=1, le=5, description="Concrete examples or demos")
    depth: int = Field(ge=1, le=5, description="How thoroughly the topic is covered")


class LessonCheck(BaseModel):
    score: int = Field(ge=1, le=5, description="Overall value for learning")
    level: Literal["Beginner", "Intermediate", "Advanced"]
    verdict: str = Field(description="One sentence: who should watch it and why")
    topics: list[str] = Field(description="3-6 main topics the video teaches")
    strengths: list[str] = Field(description="2-3 short strengths")
    weaknesses: list[str] = Field(description="0-3 short weaknesses")
    outdated: list[str] = Field(description="Outdated versions, deprecated APIs or old syntax it teaches; empty if none or not a coding topic")
    criteria: Criteria


MAX_CHARS = 24000   # long videos: we send the beginning, middle and end


def check_lesson(url: str) -> dict:
    video_id = extract_youtube_id(url)
    info = fetch_video_info(video_id)
    result = fetch_youtube_transcript(video_id, preferred_languages(None, get_settings().transcript_languages), auto=True)
    if result is None:
        raise NotFoundError("This video has no captions, so it can't be checked.")
    segments, language = result

    text = " ".join(s.text for s in segments)
    minutes = round(segments[-1].end / 60) if segments else 0
    if len(text) > MAX_CHARS:
        third, mid = MAX_CHARS // 3, len(text) // 2
        text = text[:third] + " … " + text[mid - third // 2: mid + third // 2] + " … " + text[-third:]

    check = get_llm().with_structured_output(LessonCheck).invoke(
        f"You review YouTube videos for students. Title: {info['title']} ({minutes} min, language: {language}).\n"
        "Rate how good this video is FOR LEARNING, based only on its transcript below. Be honest and specific. "
        "For programming videos, list outdated versions or deprecated syntax it teaches (today is 2026). "
        "Write all text in English.\n\nTranscript:\n" + text
    )
    
    c = check.criteria
    check.score = max(1, min(5, round((c.clarity + c.structure + c.examples + c.depth) / 4)))
    return {"video_id": video_id, "title": info["title"], "url": watch_url(video_id), "minutes": minutes,
            "language": language, **check.model_dump()}
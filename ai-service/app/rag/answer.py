"""Answer a question using only the retrieved chunks (RAG)."""
from app.config import get_settings
from app.rag.embeddings import get_openai_client
from app.rag.vector_store import search

NOT_COVERED = "This isn't covered in the course material, so I can't answer it without guessing."

SYSTEM_PROMPT = """You are LessonRecall, a study assistant.
Answer ONLY from the numbered sources below. Do not use outside knowledge.
Cite the sources you used like [1] or [2].
If the sources do not contain the answer, reply exactly: NOT_COVERED"""


def format_time(seconds: int) -> str:
    """125 -> '2:05'"""
    return f"{seconds // 60}:{seconds % 60:02d}"


def answer_question(question: str, course_id: str, video_id: str | None = None) -> dict:
    settings = get_settings()
    matches = search(question, course_id, video_id, top_k=5)

    # Answer Guard: nothing relevant -> don't ask the LLM
    if not matches or matches[0]["score"] < settings.min_relevance_score:
        return {"answer": NOT_COVERED, "covered": False, "sources": []}

    sources = [m for m in matches if m["score"] >= settings.min_relevance_score]
    context = "\n\n".join(
        f"[{i}] {s['title']} at {format_time(int(s['start_seconds']))}:\n{s['text']}"
        for i, s in enumerate(sources, start=1)
    )

    response = get_openai_client().chat.completions.create(
        model=settings.chat_model,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Sources:\n{context}\n\nQuestion: {question}"},
        ],
    )
    answer = response.choices[0].message.content.strip()

    if answer == "NOT_COVERED":
        return {"answer": NOT_COVERED, "covered": False, "sources": []}

    return {
        "answer": answer,
        "covered": True,
        "sources": [
            {
                "number": i,
                "title": s["title"],
                "timestamp": format_time(int(s["start_seconds"])),
                "url": s.get("timestamp_url"),
                "score": round(s["score"], 3),
            }
            for i, s in enumerate(sources, start=1)
        ],
    }
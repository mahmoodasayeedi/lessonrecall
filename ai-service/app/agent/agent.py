"""The LessonRecall chat agent (LangGraph ReAct agent with tools and memory)."""
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_react_agent
import re
from pydantic import BaseModel, Field
from app.rag.answer import format_time
from app.agent.tools import get_llm, make_tools
import json
import logging

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are LessonRecall, a friendly study assistant for one course.
Rules:
- Always use a tool to look up course content. Never answer from your own knowledge.
- If a tool returns NO_RELEVANT_CONTENT, say the course doesn't cover this. Do not guess.
- - Cite facts by copying the CITE AS text from the tool result exactly. Never write your own times.
- For follow-ups like "explain that more simply" or "give me an example", build on the
  previous answer in this conversation; search again if you need more detail.
- - For quizzes, show only the questions and options. Never include the correct answers or
  explanations in the same message; reveal them only when the student asks.
- When several sources support the answer (for example a video minute and a PDF page),
  cite each of them, up to 3, so the student can see where they agree.
- Answer in the same language as the student's message.
- For requests to summarise the video, list its key points, or say what to remember for an exam, use the video_summary tool and cite the chapter timestamps."""


# Keeps every conversation in memory, by thread_id (lost when the server restarts)
checkpointer = InMemorySaver()

# "(9:16, URL)", "( 9:16, URL)", "(CITE AS: 9:16, URL)" or "CITE AS: (9:16, URL)" → "(9:16, URL)"
CITATION = re.compile(
    r"(?:CITE AS:\s*)?\(\s*(?:CITE AS:\s*)?(\d+:\d{2}),\s*(https://www\.youtube\.com/watch\?v=[\w-]+&t=(\d+)s)\s*\)")
PAGE = re.compile(r"(?:CITE AS:\s*)?\(\s*(?:CITE AS:\s*)?page (\d+)\s*\)")


def fix_citations(text: str) -> str:
    """Rebuild every time label from the seconds in its link, and normalise page citations."""
    text = CITATION.sub(lambda m: f"({format_time(int(m.group(3)))}, {m.group(2)})", text)
    text = PAGE.sub(lambda m: f"(page {m.group(1)})", text)
    return text.replace("CITE AS:", "").strip()

def chat(message, thread_id, course_id, video_id=None, language: str | None = None):
    if language:
        message = f"{message}\n\n[Reply in {language}. Keep every citation exactly as given.]"
    agent = create_react_agent(
        get_llm(),
        make_tools(course_id, video_id),
        prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
    config = {"configurable": {"thread_id": thread_id}}

    before = len(agent.get_state(config).values.get("messages", []))
    result = agent.invoke({"messages": [("user", message)]}, config=config)
    new_messages = result["messages"][before:]

    tools_used = [call["name"] for m in new_messages for call in (getattr(m, "tool_calls", None) or [])]

    answer = fix_citations(new_messages[-1].content)
    return {
        "answer": answer,
        "tools_used": tools_used,
        "thread_id": thread_id,
        "suggestions": suggest_followups(message, answer,language),
    }
def sse(data: dict) -> str:
    """One Server-Sent Event: 'data: {...}' followed by a blank line."""
    return f"data: {json.dumps(data)}\n\n"


def chat_stream(message, thread_id, course_id, video_id=None, language: str | None = None):
    """Same as chat(), but yields the answer token by token as Server-Sent Events."""
    if language:
        message = f"{message}\n\n[Reply in {language}. Keep every citation exactly as given.]"
    agent = create_react_agent(
        get_llm(),
        make_tools(course_id, video_id),
        prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
    config = {"configurable": {"thread_id": thread_id}}
    before = len(agent.get_state(config).values.get("messages", []))

    try:
        # stream_mode="messages" gives us every LLM token as it is generated
        for chunk, meta in agent.stream({"messages": [("user", message)]},
                                        config=config, stream_mode="messages"):
            # Only tokens from the agent itself, not from LLM calls inside tools (summary, quiz)
            if meta.get("langgraph_node") == "agent" and isinstance(chunk.content, str) and chunk.content:
                yield sse({"type": "token", "text": chunk.content})

        # Stream finished: build the clean final answer exactly like chat() does
        new_messages = agent.get_state(config).values["messages"][before:]
        tools_used = [call["name"] for m in new_messages for call in (getattr(m, "tool_calls", None) or [])]
        answer = fix_citations(new_messages[-1].content)
        yield sse({
            "type": "done",
            "answer": answer,
            "tools_used": tools_used,
            "thread_id": thread_id,
            "suggestions": suggest_followups(message, answer, language),
        })
    except Exception:
        log.exception("Streaming chat failed")
        yield sse({"type": "error", "message": "Something went wrong while answering. Please try again."})


class FollowUps(BaseModel):
    questions: list[str] = Field(description="Exactly 3 short follow-up questions, max 12 words each")


def suggest_followups(question: str, answer: str, language: str | None = None) -> list[str]:
    """3 questions the student could ask next. Never breaks the chat if it fails."""
    if not CITATION.search(answer) and not PAGE.search(answer):   # ← replaces the "not cover" check
        return []
    lang_rule = f" Write the suggestions in {language}." if language else ""
    try:
        result = get_llm().with_structured_output(FollowUps).invoke(
            f"A student asked: {question}\nThe tutor answered: {answer}\n"
            "Suggest 3 short follow-up questions the student could ask next about the same lesson."
            + lang_rule
        )
        return result.questions[:3]
    except Exception:
        return []
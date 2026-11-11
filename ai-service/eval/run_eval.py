"""LessonRecall evaluation with LangSmith.

Run from the ai-service folder:   python -m eval.run_eval
Results: a LangSmith experiment + frontend/public/eval-results.json (for the Evaluation page)
"""
import csv
import json
import re
import statistics
import time
import uuid
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(override=True)

from langsmith import Client, evaluate
from pydantic import BaseModel, Field

from app.agent.agent import CITATION, PAGE, chat
from app.agent.tools import get_llm

DATASET = "lessonrecall-eval"
CSV_PATH = Path(__file__).parent / "questions.csv"
OUT_PATH = Path(__file__).parents[2] / "frontend" / "public" / "eval-results.json"
TOLERANCE = 75                      # seconds: one chunk
VIDEO_ID = re.compile(r"v=([\w-]+)")


# ---------- 1. Dataset: the CSV uploaded to LangSmith once ----------
def load_dataset(client: Client) -> None:
    if client.has_dataset(dataset_name=DATASET):
        print(f"Using existing dataset '{DATASET}' (delete it in LangSmith to reload the CSV)")
        return
    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    ds = client.create_dataset(DATASET, description="LessonRecall: question, expected answer, video and second")
    client.create_examples(
        dataset_id=ds.id,
        inputs=[{"question": r["question"], "course_id": r["course_id"]} for r in rows],
        outputs=[{"expected_answer": r["expected_answer"],
                  "video_id": r["video_id"] or None,
                  "start_seconds": int(r["start_seconds"]) if r["start_seconds"] else None} for r in rows],
    )
    print(f"Created dataset '{DATASET}' with {len(rows)} questions")


# ---------- 2. The system under test: the same agent the app uses ----------
def ask_agent(inputs: dict) -> dict:
    start = time.perf_counter()
    result = chat(inputs["question"], f"eval-{uuid.uuid4()}", inputs["course_id"])   # whole-course mode
    latency = time.perf_counter() - start
    citations = [{"video_id": VIDEO_ID.search(m.group(2)).group(1), "seconds": int(m.group(3))}
                 for m in CITATION.finditer(result["answer"])]
    return {"answer": result["answer"], "citations": citations,
            "has_page": bool(PAGE.search(result["answer"])),
            "tools_used": result["tools_used"], "latency": round(latency, 2)}


# ---------- 3. The four metrics ----------
class Grade(BaseModel):
    correct: bool = Field(description="True if the answer contains the key point of the reference answer")
    reason: str = Field(description="One short sentence explaining the grade")


judge = get_llm().with_structured_output(Grade)


def accuracy(outputs: dict, reference_outputs: dict) -> dict:
    expected = reference_outputs["expected_answer"]
    if expected == "NOT_COVERED":           # Answer Guard test: must not cite anything
        ok = not outputs["citations"] and not outputs["has_page"]
        return {"key": "accuracy", "score": int(ok),
                "comment": "Guard: said not covered" if ok else "Answered a question the course doesn't cover"}
    grade = judge.invoke(
        f"Reference answer: {expected}\n\nTutor's answer: {outputs['answer']}\n\n"
        "Does the tutor's answer contain the key point of the reference answer without contradicting it? "
        "Ignore citations, extra details and the language it is written in.")
    return {"key": "accuracy", "score": int(grade.correct), "comment": grade.reason}


def retrieval_hit(outputs: dict, reference_outputs: dict) -> dict:
    video = reference_outputs["video_id"]
    if not video:
        return {"key": "retrieval_hit", "score": None}          # not applicable
    return {"key": "retrieval_hit", "score": int(any(c["video_id"] == video for c in outputs["citations"]))}


def timestamp_ok(outputs: dict, reference_outputs: dict) -> dict:
    video, second = reference_outputs["video_id"], reference_outputs["start_seconds"]
    if not video:
        return {"key": "timestamp_ok", "score": None}
    ok = any(c["video_id"] == video and abs(c["seconds"] - second) <= TOLERANCE for c in outputs["citations"])
    return {"key": "timestamp_ok", "score": int(ok)}


def latency(outputs: dict) -> dict:
    return {"key": "latency_s", "score": outputs["latency"]}

def grounded(outputs: dict, reference_outputs: dict) -> dict:
    if not reference_outputs["video_id"]:
        return {"key": "grounded", "score": None}
    return {"key": "grounded", "score": int(bool(outputs["citations"]) or outputs["has_page"])}
# ---------- 4. Run + save the results for the Evaluation page ----------
def main() -> None:
    client = Client()
    load_dataset(client)
    results = evaluate(ask_agent, data=DATASET, client=client,
                       evaluators=[accuracy, retrieval_hit, timestamp_ok, grounded, latency],
                       experiment_prefix="lessonrecall", max_concurrency=2)

    rows = []
    for r in results:
        evals = {e.key: e for e in r["evaluation_results"]["results"]}
        out, ex = r["run"].outputs or {}, r["example"]
        rows.append({
            "question": ex.inputs["question"],
            "course": ex.inputs["course_id"],
            "expected": ex.outputs["expected_answer"],
            "expected_video": ex.outputs["video_id"],
            "expected_seconds": ex.outputs["start_seconds"],
            "answer": out.get("answer", "ERROR"),
            "citations": out.get("citations", []),
            "accuracy": evals["accuracy"].score if "accuracy" in evals else 0,
            "judge": evals["accuracy"].comment if "accuracy" in evals else "",
            "retrieval_hit": evals["retrieval_hit"].score if "retrieval_hit" in evals else None,
            "timestamp_ok": evals["timestamp_ok"].score if "timestamp_ok" in evals else None,
            "latency": out.get("latency"),
            "grounded": evals["grounded"].score if "grounded" in evals else None,
        })

    def percent(key):
        values = [row[key] for row in rows if row[key] is not None]
        return round(100 * sum(values) / len(values)) if values else None

    latencies = sorted(row["latency"] for row in rows if row["latency"] is not None)
    summary = {
        "questions": len(rows),
        "accuracy": percent("accuracy"),
        "retrieval_hit_rate": percent("retrieval_hit"),
        "timestamp_correct": percent("timestamp_ok"),
        "latency_median": round(statistics.median(latencies), 1),
        "latency_p90": round(latencies[int(0.9 * (len(latencies) - 1))], 1),
        "experiment": results.experiment_name,
        "date": date.today().isoformat(),
        "grounded_rate": percent("grounded"),
    }
    OUT_PATH.write_text(json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2),
                        encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print("Saved", OUT_PATH)


if __name__ == "__main__":
    main()
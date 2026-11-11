"""Writes the stored transcript chunks of a course to a text file (used to write the eval questions).

Run from the ai-service folder:
  python -m eval.export_transcripts COURSE-SLUG VIDEO-ID VIDEO-ID ...
"""
import sys

from dotenv import load_dotenv
load_dotenv(override=True)

from app.rag.summary import load_video_chunks

course_id, video_ids = sys.argv[1], sys.argv[2:]
path = f"eval/transcripts_{course_id}.txt"

with open(path, "w", encoding="utf-8") as f:
    for vid in video_ids:
        chunks = load_video_chunks(course_id, vid)
        if not chunks:
            print("Not found in this course:", vid)
            continue
        f.write(f"\n### VIDEO {vid}\n")
        for c in chunks:
            f.write(f"[{int(c['start_seconds'])}s] {c['text']}\n")
        print(f"{vid}: {len(chunks)} chunks")

print("Written to", path)
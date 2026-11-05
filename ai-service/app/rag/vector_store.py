"""Pinecone: create the index, store chunks, search them."""
import time
from functools import lru_cache

from pinecone import Pinecone, ServerlessSpec

from app.config import get_settings
from app.models import Chunk
from app.rag.embeddings import embed_texts
from app.rag.embeddings import embed_text

DIMENSION = 1536  # must match text-embedding-3-small


@lru_cache
def get_index():
    settings = get_settings()
    pc = Pinecone(api_key=settings.pinecone_api_key)

    if settings.pinecone_index not in pc.list_indexes().names():
        pc.create_index(
            name=settings.pinecone_index,
            dimension=DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        while not pc.describe_index(settings.pinecone_index).status["ready"]:
            time.sleep(1)

    return pc.Index(settings.pinecone_index)


def upsert_chunks(chunks: list[Chunk], course_id: str) -> int:
    """Embed the chunks and store them in the course's namespace. Returns how many were stored."""
    vectors = embed_texts([c.text for c in chunks])

    records = []
    for chunk, vector in zip(chunks, vectors):
        metadata = chunk.model_dump(exclude_none=True)
        metadata["course_id"] = course_id
        records.append({
            "id": f"{chunk.video_id}-{chunk.chunk_index}",
            "values": vector,
            "metadata": metadata,
        })

    index = get_index()
    for i in range(0, len(records), 100):
        index.upsert(vectors=records[i:i + 100], namespace=course_id)
    return len(records)

def search(question: str, course_id: str, video_id: str | None = None, top_k: int = 5) -> list[dict]:
    """Return the top_k chunks most similar to the question, best first."""
    query = {
        "vector": embed_text(question),
        "top_k": top_k,
        "namespace": course_id,
        "include_metadata": True,
    }
    if video_id:
        query["filter"] = {"video_id": {"$eq": video_id}}

    result = get_index().query(**query)
    return [{"score": m.score, **m.metadata} for m in result.matches]

def list_documents(course_id: str) -> list[dict]:
    """All videos and PDFs in a course: [{"id", "title", "type"}]."""
    index = get_index()
    doc_ids = set()
    for ids in index.list(namespace=course_id):
        doc_ids.update(i.rsplit("-", 1)[0] for i in ids)   # "IHZwWFHWa-w-3" -> "IHZwWFHWa-w"

    docs = []
    for doc_id in sorted(doc_ids):
        found = index.fetch(ids=[f"{doc_id}-0", f"{doc_id}-1"], namespace=course_id).vectors
        if found:
            meta = next(iter(found.values())).metadata
            docs.append({"id": doc_id, "title": meta["title"], "type": meta["source_type"]})
    return docs

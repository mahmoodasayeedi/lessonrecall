"""Turn text into embeddings (lists of numbers that represent meaning)."""
from functools import lru_cache

from openai import OpenAI

from app.config import get_settings


@lru_cache
def get_openai_client() -> OpenAI:
    return OpenAI(api_key=get_settings().openai_api_key)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed many texts in one API call. Returns one vector per text, in the same order."""
    response = get_openai_client().embeddings.create(
        model=get_settings().embedding_model,
        input=texts,
    )
    return [item.embedding for item in response.data]


def embed_text(text: str) -> list[float]:
    """Embed a single text (used for the question)."""
    return embed_texts([text])[0]
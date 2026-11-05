"""App settings, read from environment variables / the .env file.

Java comparison: this is like @ConfigurationProperties in Spring Boot,
where values from application.properties are bound to a class.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    pinecone_api_key: str = ""
    pinecone_index: str = "lessonrecall"
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    chunk_target_seconds: int = 75
    chunk_overlap_seconds: int = 10

    #Threshold
    min_relevance_score: float = 0.30
    
    # Whisper API accepts files up to 25 MB
    max_upload_mb: int = 25
    # Languages we accept from YouTube transcripts, in order of preference
    transcript_languages: list[str] = ["en", "de"]

    webshare_proxy_username: str = ""
    webshare_proxy_password: str = ""


@lru_cache
def get_settings() -> Settings:
    # lru_cache = created once and reused (like a Spring singleton bean)
    return Settings()

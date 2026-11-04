"""App settings, read from environment variables / the .env file.

Java comparison: this is like @ConfigurationProperties in Spring Boot,
where values from application.properties are bound to a class.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    chunk_target_seconds: int = 75
    chunk_overlap_seconds: int = 10

    # Whisper API accepts files up to 25 MB
    max_upload_mb: int = 25
    # Languages we accept from YouTube transcripts, in order of preference
    transcript_languages: list[str] = ["en", "de"]


@lru_cache
def get_settings() -> Settings:
    # lru_cache = created once and reused (like a Spring singleton bean)
    return Settings()

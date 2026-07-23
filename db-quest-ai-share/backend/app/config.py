"""Central configuration.

Reads everything from environment variables (loaded from backend/.env when present)
and exposes a single ``settings`` object used across the app. Every value has a
safe default so the app runs fully offline with zero configuration:

- No AI keys  -> mock AI brain + TF-IDF retrieval.
- No DATABASE_URL -> local SQLite file (auto-created).
- No JWT_SECRET -> a dev secret (fine for demo; set your own in production).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
load_dotenv(BASE_DIR / ".env")

STORAGE_DIR = BASE_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class Settings:
    app_name: str = "DB Quest AI"
    version: str = "0.2.0"

    # ---- AI provider (mock | openai | azure | gemini) ----
    ai_provider: str = os.getenv("AI_PROVIDER", "mock").strip().lower()
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    openai_embedding_model: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    azure_api_key: str = os.getenv("AZURE_API_KEY", "")
    azure_endpoint: str = os.getenv("AZURE_ENDPOINT", "")
    azure_deployment: str = os.getenv("AZURE_DEPLOYMENT", "gpt-4o-mini")
    azure_embedding_deployment: str = os.getenv("AZURE_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    azure_api_version: str = os.getenv("AZURE_API_VERSION", "2024-02-01")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # ---- Auth ----
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))

    # ---- Database ----
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{(STORAGE_DIR / 'dbquest.db').as_posix()}")

    # ---- Web ----
    cors_origins: list[str] = [
        item.strip()
        for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if item.strip()
    ]

    # ---- Behaviour flags ----
    seed_demo: bool = os.getenv("SEED_DEMO", "true").strip().lower() in ("1", "true", "yes")

    # Seed content (sample docs, missions, acronyms, experts) lives here.
    data_dir: Path = Path(__file__).resolve().parent / "data"

    @property
    def provider_configured(self) -> bool:
        """True only when a real LLM provider AND its credentials are present.

        This single gate decides live-vs-mock everywhere in the app.
        """
        if self.ai_provider == "openai":
            return bool(self.openai_api_key)
        if self.ai_provider == "azure":
            return bool(self.azure_api_key and self.azure_endpoint)
        if self.ai_provider == "gemini":
            return bool(self.gemini_api_key)
        return False

    @property
    def embeddings_configured(self) -> bool:
        """Embeddings are available for OpenAI/Azure when configured.

        When False, retrieval automatically falls back to offline TF-IDF.
        (Gemini text-embeddings are intentionally left to the TF-IDF fallback.)
        """
        if self.ai_provider == "openai":
            return bool(self.openai_api_key)
        if self.ai_provider == "azure":
            return bool(self.azure_api_key and self.azure_endpoint)
        return False


settings = Settings()

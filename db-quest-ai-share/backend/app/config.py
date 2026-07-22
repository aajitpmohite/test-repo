"""Application configuration loaded from environment variables.

The application is designed to run with ZERO configuration in a demo/mock
mode so it always works during a hackathon presentation, even offline.
Provide provider keys only if you want live LLM responses.
"""
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Runtime settings resolved from the environment."""

    def __init__(self) -> None:
        self.ai_provider: str = os.getenv("AI_PROVIDER", "mock").strip().lower()

        # OpenAI / OpenAI-compatible
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        self.openai_base_url: str = os.getenv(
            "OPENAI_BASE_URL", "https://api.openai.com/v1"
        ).strip().rstrip("/")

        # Azure OpenAI
        self.azure_api_key: str = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
        self.azure_endpoint: str = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip().rstrip("/")
        self.azure_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
        self.azure_api_version: str = os.getenv(
            "AZURE_OPENAI_API_VERSION", "2024-06-01"
        ).strip()

        # Google Gemini
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

        # Server
        cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
        self.cors_origins = [c.strip() for c in cors.split(",") if c.strip()]

        # Paths
        self.data_dir = os.path.join(os.path.dirname(__file__), "data")
        self.uploads_dir = os.path.join(self.data_dir, "uploads")

    @property
    def provider_configured(self) -> bool:
        """Whether the selected provider has the credentials it needs."""
        if self.ai_provider == "openai":
            return bool(self.openai_api_key)
        if self.ai_provider == "azure":
            return bool(self.azure_api_key and self.azure_endpoint and self.azure_deployment)
        if self.ai_provider == "gemini":
            return bool(self.gemini_api_key)
        return False


settings = Settings()

from __future__ import annotations

import json
import re
from typing import Any

import httpx


def extract_json(text: str) -> dict[str, Any]:
    """Best-effort extraction of a JSON object from an LLM response.

    Handles raw JSON, ```json fenced blocks, and prose that wraps a JSON object.
    Returns an empty dict when nothing parseable is found.
    """
    if not text:
        return {}
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return {}
    return {}


class AIProvider:
    """Thin synchronous client for OpenAI / Azure OpenAI / Gemini.

    ``chat()`` returns plain text; ``chat_json()`` returns a parsed dict.
    ``self.live`` is set True after a successful live call so callers can report
    whether a real model answered. The provider never raises on ``mock`` — that
    keeps the offline demo path simple.
    """

    def __init__(self, provider: str, config: dict[str, str]) -> None:
        self.provider = provider
        self.config = config
        self.live = False

    def _messages(self, prompt: str, system: str | None) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return messages

    def chat(self, prompt: str, *, system: str | None = None) -> str:
        provider = self.provider

        if provider == "openai":
            payload = {
                "model": self.config.get("openai_model", "gpt-4o-mini"),
                "messages": self._messages(prompt, system),
            }
            headers = {"Authorization": f"Bearer {self.config.get('api_key', '')}"}
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.openai.com/v1/chat/completions", json=payload, headers=headers
                )
                response.raise_for_status()
                self.live = True
                return response.json()["choices"][0]["message"]["content"]

        if provider == "azure":
            endpoint = self.config.get("endpoint", "").rstrip("/")
            deployment = self.config.get("azure_deployment", "gpt-4o-mini")
            api_version = self.config.get("azure_api_version", "2024-02-01")
            url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"
            headers = {"api-key": self.config.get("api_key", "")}
            payload = {"messages": self._messages(prompt, system)}
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                self.live = True
                return response.json()["choices"][0]["message"]["content"]

        if provider == "gemini":
            model = self.config.get("gemini_model", "gemini-2.0-flash")
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                f"?key={self.config.get('api_key', '')}"
            )
            parts = []
            if system:
                parts.append({"text": system})
            parts.append({"text": prompt})
            payload = {"contents": [{"parts": parts}]}
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                self.live = True
                return response.json()["candidates"][0]["content"]["parts"][0]["text"]

        if provider == "groq":
            # Groq exposes an OpenAI-compatible Chat Completions API.
            payload = {
                "model": self.config.get("groq_model", "llama-3.3-70b-versatile"),
                "messages": self._messages(prompt, system),
            }
            headers = {"Authorization": f"Bearer {self.config.get('api_key', '')}"}
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers
                )
                response.raise_for_status()
                self.live = True
                return response.json()["choices"][0]["message"]["content"]

        # mock / unknown provider
        self.live = False
        return ""

    def chat_json(self, prompt: str, *, system: str | None = None) -> dict[str, Any]:
        return extract_json(self.chat(prompt, system=system))

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Return an embedding vector per input text (OpenAI / Azure only).

        Raises on any error so callers can fall back to TF-IDF. Returns [] for mock.
        """
        if not texts:
            return []

        if self.provider == "openai":
            payload = {"model": self.config.get("openai_embedding_model", "text-embedding-3-small"), "input": texts}
            headers = {"Authorization": f"Bearer {self.config.get('api_key', '')}"}
            with httpx.Client(timeout=30.0) as client:
                response = client.post("https://api.openai.com/v1/embeddings", json=payload, headers=headers)
                response.raise_for_status()
                return [row["embedding"] for row in response.json()["data"]]

        if self.provider == "azure":
            endpoint = self.config.get("endpoint", "").rstrip("/")
            deployment = self.config.get("azure_embedding_deployment", "text-embedding-3-small")
            api_version = self.config.get("azure_api_version", "2024-02-01")
            url = f"{endpoint}/openai/deployments/{deployment}/embeddings?api-version={api_version}"
            headers = {"api-key": self.config.get("api_key", "")}
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json={"input": texts}, headers=headers)
                response.raise_for_status()
                return [row["embedding"] for row in response.json()["data"]]

        return []

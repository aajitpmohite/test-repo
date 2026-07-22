"""Low-level LLM provider abstraction.

Supports OpenAI, Azure OpenAI and Google Gemini via plain HTTP (httpx), so no
heavy vendor SDKs are required. If no provider is configured, ``live`` is False
and callers fall back to the deterministic mock generators in ``ai_service``.
"""
from __future__ import annotations

import json
import re
from typing import Optional

import httpx

from .config import settings


class AIProvider:
    """Thin, provider-agnostic chat client."""

    def __init__(self) -> None:
        self.provider = settings.ai_provider
        self.timeout = httpx.Timeout(45.0)

    @property
    def live(self) -> bool:
        """True when a real provider is selected and configured."""
        return self.provider in {"openai", "azure", "gemini"} and settings.provider_configured

    async def chat(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        """Return raw assistant text for a single-turn system+user exchange."""
        if self.provider == "openai":
            return await self._openai(system, user, temperature, max_tokens)
        if self.provider == "azure":
            return await self._azure(system, user, temperature, max_tokens)
        if self.provider == "gemini":
            return await self._gemini(system, user, temperature, max_tokens)
        raise RuntimeError("No live AI provider configured")

    async def chat_json(self, system: str, user: str, temperature: float = 0.5) -> dict:
        """Return a parsed JSON object from the model response."""
        text = await self.chat(
            system + "\n\nRespond ONLY with valid minified JSON. No markdown fences.",
            user,
            temperature=temperature,
            max_tokens=1600,
        )
        return _extract_json(text)

    # ----------------------------------------------------------------- OpenAI
    async def _openai(self, system: str, user: str, temperature: float, max_tokens: int) -> str:
        url = f"{settings.openai_base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
        payload = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]

    # ------------------------------------------------------------------ Azure
    async def _azure(self, system: str, user: str, temperature: float, max_tokens: int) -> str:
        url = (
            f"{settings.azure_endpoint}/openai/deployments/"
            f"{settings.azure_deployment}/chat/completions"
            f"?api-version={settings.azure_api_version}"
        )
        headers = {"api-key": settings.azure_api_key}
        payload = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]

    # ----------------------------------------------------------------- Gemini
    async def _gemini(self, system: str, user: str, temperature: float, max_tokens: int) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


def _extract_json(text: str) -> dict:
    """Best-effort extraction of a JSON object from a model response."""
    text = text.strip()
    # Strip markdown code fences if present.
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


provider = AIProvider()

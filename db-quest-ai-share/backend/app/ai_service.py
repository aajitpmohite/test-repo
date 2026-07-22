"""High-level AI domain service.

Each method returns the same shape whether it is served by a live LLM provider
or the offline mock generators. Routers depend only on this service, never on
the provider directly.
"""
from __future__ import annotations

import json

from . import mock_ai
from .ai_provider import provider


class AIService:
    def __init__(self) -> None:
        self.provider = provider

    @property
    def live(self) -> bool:
        return self.provider.live

    # ------------------------------------------------------------- missions
    async def generate_mission(self, topic: str, audience: str, difficulty: str) -> dict:
        if not self.live:
            return mock_ai.generate_mission(topic, audience, difficulty)
        system = (
            "You are a compliance training designer for Deutsche Bank. Design a realistic, "
            "interactive 'escape room' security mission. Keep it professional and non-punitive."
        )
        user = (
            f"Create a mission. Topic: {topic}. Audience: {audience}. Difficulty: {difficulty}.\n"
            "Return JSON with keys: title, topic (one of Cybersecurity/Data Privacy/Operational Risk/"
            "Responsible AI), difficulty, points (int), estimatedMinutes (int), summary, briefing, "
            "scenario, objectives (array), steps (array of {id, prompt, clue, choices:[{id,text,"
            "correct(bool),risk(low|medium|high),feedback}]}), learningPoints (array), policyRefs "
            "(array), clues (object mapping aspect->{finding,meaning}). Exactly one correct choice per step."
        )
        try:
            data = await self.provider.chat_json(system, user)
            return self._ensure_mission_shape(data, topic, audience, difficulty)
        except Exception:
            return mock_ai.generate_mission(topic, audience, difficulty)

    def _ensure_mission_shape(self, data: dict, topic: str, audience: str, difficulty: str) -> dict:
        fallback = mock_ai.generate_mission(topic, audience, difficulty)
        for key, default in fallback.items():
            data.setdefault(key, default)
        import uuid
        data["id"] = f"gen_{uuid.uuid4().hex[:8]}"
        data["generated"] = True
        # Guarantee each step has ids.
        for i, step in enumerate(data.get("steps", []), start=1):
            step.setdefault("id", f"step{i}")
            for j, choice in enumerate(step.get("choices", [])):
                choice.setdefault("id", chr(ord("A") + j))
        return data

    async def game_master(self, mission: dict, history: list[dict], message: str) -> dict:
        if not self.live:
            return mock_ai.game_master(mission, history, message)
        system = (
            "You are the AI Game Master of a Deutsche Bank security escape-room mission. Narrate "
            "adaptively, never reveal the full answer, guide the player to inspect indicators, and "
            "praise safe behaviour. Be concise (2-4 sentences)."
        )
        convo = "\n".join(f"{t['role']}: {t['content']}" for t in history[-8:])
        user = (
            f"Mission scenario: {mission.get('scenario')}\n"
            f"Known indicators (clues): {json.dumps(mission.get('clues', {}))}\n"
            f"Conversation so far:\n{convo}\n"
            f"Player says: {message}\n"
            "Reply as the Game Master. Then on new lines add 'SUGGESTIONS:' followed by up to 3 short "
            "suggested next actions separated by '|'."
        )
        try:
            raw = await self.provider.chat(system, user, temperature=0.7, max_tokens=400)
            reply, suggestions = raw, []
            if "SUGGESTIONS:" in raw:
                reply, sugg = raw.split("SUGGESTIONS:", 1)
                suggestions = [s.strip() for s in sugg.replace("\n", "|").split("|") if s.strip()][:3]
            return {"reply": reply.strip(), "revealed": [], "suggestions": suggestions}
        except Exception:
            return mock_ai.game_master(mission, history, message)

    def hint(self, mission: dict, step_id: str | None, level: int) -> str:
        # Hints are deterministic and instant either way.
        return mock_ai.hint(mission, step_id, level)

    def evaluate(self, mission: dict, step: dict, choice: dict) -> dict:
        return mock_ai.evaluate(mission, step, choice)

    async def learning_report(self, mission, decisions, hints_used, duration) -> dict:
        return mock_ai.learning_report(mission, decisions, hints_used, duration)

    # ---------------------------------------------------------- colleague
    async def answer_question(self, question: str, chunks: list[tuple]) -> dict:
        if not self.live:
            return mock_ai.answer_question(question, chunks)
        if not chunks:
            return mock_ai.answer_question(question, chunks)
        context = "\n\n".join(
            f"[Source: {c.title}]\n{c.text}" for c, _ in chunks[:4]
        )
        system = (
            "You are the AI Digital Colleague for a Deutsche Bank team. Answer ONLY from the provided "
            "context. If it is not in the context, say so. Be concise and factual."
        )
        user = f"Context:\n{context}\n\nQuestion: {question}\nAnswer with a short, source-grounded response."
        try:
            answer = await self.provider.chat(system, user, temperature=0.3, max_tokens=500)
            mock = mock_ai.answer_question(question, chunks)
            return {"answer": answer.strip(), "sources": mock["sources"], "confidence": mock["confidence"]}
        except Exception:
            return mock_ai.answer_question(question, chunks)

    async def onboarding_plan(self, role: str, project: str, days: int) -> dict:
        if not self.live:
            return mock_ai.onboarding_plan(role, project, days)
        system = "You are an onboarding buddy for a Deutsche Bank engineering team. Be practical."
        user = (
            f"Create a {days}-day onboarding plan for a {role} joining the {project} team. Return JSON "
            "with keys: role, project, plan (array of {day, title, tasks[], resources[]}), keyContacts[], "
            "glossary (array of {term, meaning})."
        )
        try:
            data = await self.provider.chat_json(system, user)
            data.setdefault("role", role)
            data.setdefault("project", project)
            if not data.get("plan"):
                return mock_ai.onboarding_plan(role, project, days)
            return data
        except Exception:
            return mock_ai.onboarding_plan(role, project, days)

    async def find_expert(self, query: str, experts: list[dict]) -> list[dict]:
        # Deterministic ranking keeps this explainable and fair.
        return mock_ai.find_expert(query, experts)

    async def summarize_document(self, title: str, text: str) -> dict:
        if not self.live:
            return mock_ai.summarize_document(title, text)
        system = "You summarize enterprise documents for busy engineers. Be accurate and concise."
        user = (
            f"Summarize this document titled '{title}'. Return JSON with keys: title, summary, keyPoints[], "
            f"decisions[], actionItems[], risks[], peopleMentioned[].\n\nDocument:\n{text[:6000]}"
        )
        try:
            data = await self.provider.chat_json(system, user)
            data.setdefault("title", title)
            return data
        except Exception:
            return mock_ai.summarize_document(title, text)


ai = AIService()

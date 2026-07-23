from __future__ import annotations

from typing import Any

from .ai_provider import AIProvider
from .config import settings
from .mock_ai import (
    answer_question,
    evaluate,
    find_expert,
    game_master,
    generate_mission,
    hint,
    learning_report,
    onboarding_plan,
    summarize_document,
)

VALID_TOPICS = ("Cybersecurity", "Data Privacy", "Operational Risk", "Responsible AI")
VALID_DIFFICULTIES = ("Beginner", "Intermediate", "Expert")


def _coerce_mission(data: dict[str, Any], topic: str, difficulty: str) -> dict[str, Any] | None:
    """Force an LLM mission into the exact schema the app needs, or return None.

    Guarantees: 3-key choices with id/text/correct/risk/feedback, EXACTLY one
    correct choice per step, and valid enum values. If the model output can't be
    made valid, we return None so the caller falls back to the deterministic mock.
    """
    if not isinstance(data, dict):
        return None
    steps = data.get("steps")
    if not isinstance(steps, list) or not steps:
        return None

    coerced_steps: list[dict[str, Any]] = []
    for i, step in enumerate(steps):
        if not isinstance(step, dict):
            return None
        choices = step.get("choices")
        if not isinstance(choices, list) or len(choices) < 2:
            return None
        correct_count = 0
        coerced_choices: list[dict[str, Any]] = []
        for j, choice in enumerate(choices):
            if not isinstance(choice, dict) or not choice.get("text"):
                return None
            is_correct = bool(choice.get("correct"))
            correct_count += 1 if is_correct else 0
            risk = choice.get("risk", "medium")
            if risk not in ("low", "medium", "high"):
                risk = "medium"
            coerced_choices.append({
                "id": choice.get("id") or f"s{i + 1}_c{j + 1}",
                "text": str(choice["text"]),
                "correct": is_correct,
                "risk": risk,
                "feedback": str(choice.get("feedback", "")) or (
                    "A safe, compliant choice." if is_correct else "Reconsider — this option carries risk."
                ),
            })
        if correct_count != 1:
            return None
        coerced_steps.append({
            "id": step.get("id") or f"s{i + 1}",
            "prompt": str(step.get("prompt", "Decide how to respond.")),
            "clue": str(step.get("clue", "")),
            "choices": coerced_choices,
        })

    chosen_topic = data.get("topic") if data.get("topic") in VALID_TOPICS else (
        topic if topic in VALID_TOPICS else "Cybersecurity"
    )
    chosen_difficulty = data.get("difficulty") if data.get("difficulty") in VALID_DIFFICULTIES else (
        difficulty if difficulty in VALID_DIFFICULTIES else "Beginner"
    )
    points = data.get("points")
    if not isinstance(points, int):
        points = {"Beginner": 100, "Intermediate": 200, "Expert": 300}[chosen_difficulty]
    minutes = data.get("estimatedMinutes")
    if not isinstance(minutes, int):
        minutes = {"Beginner": 5, "Intermediate": 8, "Expert": 12}[chosen_difficulty]

    return {
        "id": data.get("id") or "",
        "title": str(data.get("title", "Generated Mission")),
        "topic": chosen_topic,
        "difficulty": chosen_difficulty,
        "points": points,
        "estimatedMinutes": minutes,
        "summary": str(data.get("summary", "A generated compliance scenario.")),
        "briefing": str(data.get("briefing", "")),
        "scenario": str(data.get("scenario", "")),
        "objectives": [str(o) for o in data.get("objectives", []) if o] or ["Spot the red flags", "Choose the safe action"],
        "steps": coerced_steps,
        "learningPoints": [str(x) for x in data.get("learningPoints", []) if x] or ["Stay alert to social engineering."],
        "policyRefs": [str(x) for x in data.get("policyRefs", []) if x] or ["Internal Security Policy"],
        "clues": data.get("clues") if isinstance(data.get("clues"), dict) else {},
        "generated": True,
    }


class AIService:
    """Domain-level AI methods.

    Each method returns an identical shape whether it is served by a live model
    or the offline mock, so the routers never need to know which is active.
    When a provider is configured, the live path is tried first and ANY error
    falls back to the deterministic mock — the demo can never fully break.
    """

    def __init__(self) -> None:
        self.provider = AIProvider(settings.ai_provider, {
            "api_key": (
                settings.openai_api_key if settings.ai_provider == "openai"
                else settings.gemini_api_key if settings.ai_provider == "gemini"
                else settings.azure_api_key
            ),
            "endpoint": settings.azure_endpoint,
            "openai_model": settings.openai_model,
            "azure_deployment": settings.azure_deployment,
            "azure_api_version": settings.azure_api_version,
            "gemini_model": settings.gemini_model,
        })
        self.live = settings.provider_configured

    # ---- Live-capable methods -------------------------------------------------

    def answer_question(self, question: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
        # Sources and confidence always come from the retriever so citations stay faithful.
        base = answer_question(question, chunks)
        if settings.provider_configured and chunks:
            try:
                context = "\n\n".join(f"[{c.get('title')}] {c.get('text')}" for c in chunks)
                system = (
                    "You are a helpful internal colleague. Answer ONLY using the provided context. "
                    "If the answer is not in the context, say you do not have that information."
                )
                prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer concisely in 3-5 sentences using only the context."
                text = self.provider.chat(prompt, system=system)
                self.live = self.provider.live
                if text and text.strip():
                    return {"answer": text.strip(), "sources": base["sources"], "confidence": base["confidence"]}
            except Exception:
                self.live = False
        return base

    def generate_mission(self, topic: str, audience: str, difficulty: str) -> dict[str, Any]:
        if settings.provider_configured:
            try:
                system = "You are a compliance training designer. Respond ONLY with a valid JSON object and no prose."
                prompt = (
                    "Create a compliance escape-room mission as a JSON object with these keys: "
                    "title, topic, difficulty, summary, briefing, scenario, objectives (array), "
                    "steps (array of exactly 3), learningPoints (array), policyRefs (array), clues (object). "
                    "Each step has: id, prompt, clue, choices (array of exactly 3). "
                    "Each choice has: id, text, correct (boolean), risk (one of low, medium, high), feedback. "
                    "EXACTLY ONE choice per step must have correct=true. "
                    f"topic must be one of Cybersecurity, Data Privacy, Operational Risk, Responsible AI (use '{topic}'). "
                    f"difficulty must be '{difficulty}'. Audience: {audience}. Return only the JSON object."
                )
                data = self.provider.chat_json(prompt, system=system)
                self.live = self.provider.live
                mission = _coerce_mission(data, topic, difficulty)
                if mission:
                    return mission
            except Exception:
                self.live = False
        return generate_mission(topic, audience, difficulty)

    # ---- Deterministic methods (always mock, by design) -----------------------

    def game_master(self, mission: dict[str, Any], history: list[dict[str, str]], message: str) -> dict[str, Any]:
        return game_master(mission, history, message)

    def hint(self, mission: dict[str, Any], step_id: str, level: int) -> dict[str, Any]:
        return hint(mission, step_id, level)

    def evaluate(self, mission: dict[str, Any], step: dict[str, Any], choice: dict[str, Any]) -> dict[str, Any]:
        return evaluate(mission, step, choice)

    def report(self, mission: dict[str, Any], decisions: list[dict[str, Any]], hints_used: int, duration: int) -> dict[str, Any]:
        return learning_report(mission, decisions, hints_used, duration)

    def onboarding_plan(self, role: str, project: str, days: int) -> dict[str, Any]:
        return onboarding_plan(role, project, days)

    def find_expert(self, query: str, experts: list[dict[str, Any]]) -> dict[str, Any]:
        return find_expert(query, experts)

    def summarize_document(self, title: str, text: str) -> dict[str, Any]:
        return summarize_document(title, text)

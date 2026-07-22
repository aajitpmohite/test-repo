"""Escape-room mission endpoints."""
from __future__ import annotations

import copy

from fastapi import APIRouter, HTTPException

from ..ai_service import ai
from ..content import content
from ..models import (
    EvaluateRequest,
    EvaluateResponse,
    GenerateMissionRequest,
    HintRequest,
    HintResponse,
    InteractRequest,
    InteractResponse,
    ReportRequest,
    ReportResponse,
)

router = APIRouter(prefix="/api/missions", tags=["missions"])


def _sanitize(mission: dict) -> dict:
    """Return a copy safe to send to the client (no answer keys leaked)."""
    m = copy.deepcopy(mission)
    for step in m.get("steps", []):
        for choice in step.get("choices", []):
            choice.pop("correct", None)
            choice.pop("feedback", None)
    m.pop("clues", None)
    return m


def _summary(mission: dict) -> dict:
    return {
        "id": mission["id"],
        "title": mission["title"],
        "topic": mission["topic"],
        "difficulty": mission["difficulty"],
        "points": mission.get("points", 100),
        "estimatedMinutes": mission.get("estimatedMinutes", 8),
        "summary": mission.get("summary", ""),
        "steps": len(mission.get("steps", [])),
        "generated": mission.get("generated", False),
    }


@router.get("")
async def list_missions() -> list[dict]:
    return [_summary(m) for m in content.list_missions()]


@router.get("/{mission_id}")
async def get_mission(mission_id: str) -> dict:
    mission = content.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return _sanitize(mission)


@router.post("/generate")
async def generate_mission(req: GenerateMissionRequest) -> dict:
    mission = await ai.generate_mission(req.topic, req.audience, req.difficulty)
    content.add_mission(mission)
    return _sanitize(mission)


@router.post("/interact", response_model=InteractResponse)
async def interact(req: InteractRequest) -> InteractResponse:
    mission = content.get_mission(req.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    history = [t.model_dump() for t in req.history]
    result = await ai.game_master(mission, history, req.message)
    return InteractResponse(**result)


@router.post("/hint", response_model=HintResponse)
async def hint(req: HintRequest) -> HintResponse:
    mission = content.get_mission(req.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    text = ai.hint(mission, req.stepId, req.level)
    return HintResponse(hint=text, level=req.level)


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    mission = content.get_mission(req.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    step = next((s for s in mission.get("steps", []) if s["id"] == req.stepId), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    choice = next((c for c in step.get("choices", []) if c["id"] == req.choiceId), None)
    if not choice:
        raise HTTPException(status_code=404, detail="Choice not found")
    return EvaluateResponse(**ai.evaluate(mission, step, choice))


@router.post("/report", response_model=ReportResponse)
async def report(req: ReportRequest) -> ReportResponse:
    mission = content.get_mission(req.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    decisions = [d.model_dump() for d in req.decisions]
    result = await ai.learning_report(mission, decisions, req.hintsUsed, req.durationSeconds)
    return ReportResponse(**result)

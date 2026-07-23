"""Mission routes (team-scoped escape missions).

Security model:
- The full mission JSON (including the answer key) never leaves the server. The
  ``GET /{slug}`` endpoint returns a sanitized copy with correct/feedback/clues removed.
- Choices are graded server-side by ``/evaluate`` so the browser can't reveal answers.
- Each finished run is saved as a private ``MissionAttempt`` and feeds anonymized
  team insights — individual scores are never exposed to anyone but the player.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..ai_service import AIService
from ..database import get_session
from ..db_models import Mission, MissionAttempt
from ..models import (
    GenerateMissionRequest,
    Mission as MissionModel,
    MissionEvaluateRequest,
    MissionEvaluateResponse,
    MissionHintRequest,
    MissionHintResponse,
    MissionInteractRequest,
    MissionInteractResponse,
    MissionReportRequest,
    MissionReportResponse,
    MissionSummary,
    SanitizedMission,
)
from ..security import TeamContext, get_team_context, require_admin

router = APIRouter(prefix="/api/missions", tags=["missions"])
service = AIService()


def _load(session: Session, team_id: int, slug: str) -> dict[str, Any] | None:
    row = session.exec(select(Mission).where(Mission.team_id == team_id, Mission.slug == slug)).first()
    return json.loads(row.data) if row else None


def _sanitize(mission: dict[str, Any]) -> dict[str, Any]:
    """Strip the answer key (correct/feedback) and withhold clues for the client."""
    clean = {k: v for k, v in mission.items() if k not in ("steps", "clues")}
    clean["steps"] = [
        {
            "id": step.get("id"),
            "prompt": step.get("prompt"),
            "clue": step.get("clue"),
            "choices": [
                {k: v for k, v in choice.items() if k not in ("feedback", "correct")}
                for choice in step.get("choices", [])
            ],
        }
        for step in mission.get("steps", [])
    ]
    return clean


@router.get("", response_model=list[MissionSummary])
def list_missions(context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> list[MissionSummary]:
    rows = session.exec(select(Mission).where(Mission.team_id == context.team.id)).all()
    # Best attempt per mission for THIS user (progress is private to the player).
    attempts = session.exec(
        select(MissionAttempt).where(
            MissionAttempt.team_id == context.team.id, MissionAttempt.user_id == context.user.id
        )
    ).all()
    best: dict[str, MissionAttempt] = {}
    for a in attempts:
        if a.mission_slug not in best or a.score > best[a.mission_slug].score:
            best[a.mission_slug] = a

    summaries = []
    for row in rows:
        m = json.loads(row.data)
        b = best.get(row.slug)
        summaries.append(MissionSummary(
            id=row.slug,
            title=m.get("title", ""),
            topic=m.get("topic", ""),
            difficulty=m.get("difficulty", ""),
            points=m.get("points", 0),
            estimatedMinutes=m.get("estimatedMinutes", 0),
            summary=m.get("summary", ""),
            briefing=m.get("briefing", ""),
            scenario=m.get("scenario", ""),
            objectives=m.get("objectives", []),
            generated=m.get("generated", False),
            completed=b is not None,
            bestScore=b.score if b else None,
            grade=b.grade if b else None,
        ))
    return summaries


@router.get("/{slug}", response_model=SanitizedMission)
def get_mission(slug: str, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = _load(session, context.team.id, slug)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found for this team")
    return _sanitize(mission)


@router.post("/generate", response_model=MissionModel)
def generate_mission(payload: GenerateMissionRequest, context: TeamContext = Depends(require_admin), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = service.generate_mission(payload.topic, payload.audience, payload.difficulty)
    count = len(session.exec(select(Mission).where(Mission.team_id == context.team.id)).all())
    slug = f"gen-{count + 1}"
    mission["id"] = slug
    session.add(Mission(
        team_id=context.team.id,
        slug=slug,
        title=mission.get("title", ""),
        topic=mission.get("topic", ""),
        difficulty=mission.get("difficulty", ""),
        generated=True,
        data=json.dumps(mission),
        created_by=context.user.id,
    ))
    session.commit()
    return mission


@router.post("/interact", response_model=MissionInteractResponse)
def interact(payload: MissionInteractRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = _load(session, context.team.id, payload.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found for this team")
    return service.game_master(mission, payload.history, payload.message)


@router.post("/hint", response_model=MissionHintResponse)
def hint(payload: MissionHintRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = _load(session, context.team.id, payload.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found for this team")
    return service.hint(mission, payload.stepId, payload.level)


@router.post("/evaluate", response_model=MissionEvaluateResponse)
def evaluate(payload: MissionEvaluateRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = _load(session, context.team.id, payload.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found for this team")
    step = next((s for s in mission.get("steps", []) if s["id"] == payload.stepId), None)
    choice = next((c for c in step.get("choices", []) if c["id"] == payload.choiceId), None) if step else None
    if not step or not choice:
        raise HTTPException(status_code=404, detail="Step or choice not found")
    return service.evaluate(mission, step, choice)


@router.post("/report", response_model=MissionReportResponse)
def report(payload: MissionReportRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> dict[str, Any]:
    mission = _load(session, context.team.id, payload.missionId)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found for this team")
    result = service.report(mission, payload.decisions, payload.hintsUsed, payload.durationSeconds)
    # Persist the attempt privately so the player keeps their history and insights can aggregate it.
    session.add(MissionAttempt(
        team_id=context.team.id,
        user_id=context.user.id,
        mission_slug=payload.missionId,
        score=result.get("score", 0),
        grade=result.get("grade", ""),
        hints_used=payload.hintsUsed,
        duration_seconds=payload.durationSeconds,
        decisions=json.dumps(payload.decisions),
    ))
    session.commit()
    return result

"""Digital Colleague routes (team-scoped).

- ask:        grounded Q&A over the CURRENT team's documents only.
- onboarding: role-based ramp-up plan.
- acronym:    glossary lookup (global reference data).
- expert:     topic-owner finder (global reference data; matched by topic, not rank).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import retrieval
from ..ai_service import AIService
from ..config import settings
from ..content import ContentStore
from ..database import get_session
from ..models import (
    ColleagueAcronymRequest,
    ColleagueAcronymResponse,
    ColleagueAskRequest,
    ColleagueAskResponse,
    ColleagueExpertRequest,
    ColleagueExpertResponse,
    ColleagueOnboardingRequest,
    ColleagueOnboardingResponse,
)
from ..security import TeamContext, get_team_context

router = APIRouter(prefix="/api/colleague", tags=["colleague"])
service = AIService()
content_store = ContentStore(settings.data_dir)  # acronyms + experts (global reference)


@router.post("/ask", response_model=ColleagueAskResponse)
def ask(payload: ColleagueAskRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> ColleagueAskResponse:
    # For short follow-ups ("what about that?"), fold the previous user turn into the
    # retrieval query so we still fetch the right chunks. Retrieval stays restricted to
    # this team's documents so answers never leak across teams.
    prev_user = next((t.get("content", "") for t in reversed(payload.history) if t.get("role") == "user"), "")
    search_query = f"{prev_user} {payload.question}".strip()
    chunks = retrieval.search(session, context.team.id, search_query, k=4)
    answer = service.answer_question(payload.question, chunks, payload.history)
    return ColleagueAskResponse(
        answer=answer.get("answer", "I could not find a reliable answer in your team's documents."),
        sources=answer.get("sources", []),
        confidence=answer.get("confidence", "low"),
    )


@router.post("/onboarding", response_model=ColleagueOnboardingResponse)
def onboarding(payload: ColleagueOnboardingRequest, context: TeamContext = Depends(get_team_context)) -> ColleagueOnboardingResponse:
    return service.onboarding_plan(payload.role, payload.project, payload.days)


@router.post("/acronym", response_model=ColleagueAcronymResponse)
def acronym(payload: ColleagueAcronymRequest, context: TeamContext = Depends(get_team_context)) -> ColleagueAcronymResponse:
    term = payload.term.upper()
    match = next((item for item in content_store.list_acronyms() if item["term"].upper() == term), None)
    if not match:
        return ColleagueAcronymResponse(
            term=term,
            expansion="No match found",
            explanation="No common acronym definition is available for that term.",
            context="The term is not part of the seeded glossary.",
            related=[],
            matched=False,
        )
    return ColleagueAcronymResponse(
        term=term,
        expansion=match.get("expansion", ""),
        explanation=match.get("explanation", ""),
        context=match.get("context", ""),
        related=match.get("related", []),
        matched=True,
    )


@router.post("/expert", response_model=ColleagueExpertResponse)
def expert(payload: ColleagueExpertRequest, context: TeamContext = Depends(get_team_context)) -> ColleagueExpertResponse:
    return service.find_expert(payload.query, content_store.list_experts())

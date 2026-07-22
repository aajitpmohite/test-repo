"""AI Digital Colleague endpoints: Q&A, onboarding, acronyms, expert finder."""
from __future__ import annotations

from fastapi import APIRouter

from ..ai_service import ai
from ..content import content
from ..knowledge import store
from ..models import (
    AcronymRequest,
    AcronymResponse,
    AskRequest,
    AskResponse,
    ExpertRequest,
    ExpertResponse,
    OnboardingRequest,
    OnboardingResponse,
    Source,
)

router = APIRouter(prefix="/api/colleague", tags=["colleague"])


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest) -> AskResponse:
    chunks = store.search(req.question, k=4)
    result = await ai.answer_question(req.question, chunks)
    sources = [Source(**s) for s in result.get("sources", [])]
    return AskResponse(answer=result["answer"], sources=sources, confidence=result.get("confidence", "medium"))


@router.post("/onboarding", response_model=OnboardingResponse)
async def onboarding(req: OnboardingRequest) -> OnboardingResponse:
    result = await ai.onboarding_plan(req.role, req.project, req.days)
    return OnboardingResponse(**result)


@router.post("/acronym", response_model=AcronymResponse)
async def acronym(req: AcronymRequest) -> AcronymResponse:
    term = req.term.strip()
    match = content.get_acronym(term)
    if match:
        return AcronymResponse(
            term=term.upper(),
            expansion=match["expansion"],
            explanation=match["explanation"],
            context=match.get("context", ""),
            related=match.get("related", []),
            matched=True,
        )
    return AcronymResponse(
        term=term.upper(),
        expansion="Unknown",
        explanation=(
            f"'{term.upper()}' isn't in the loaded glossary yet. Ask your team lead, or an admin can "
            "add it to the acronym dictionary."
        ),
        context="",
        related=[],
        matched=False,
    )


@router.post("/expert", response_model=ExpertResponse)
async def expert(req: ExpertRequest) -> ExpertResponse:
    matches = await ai.find_expert(req.query, content.experts)
    note = (
        "Relevant contacts based on document ownership and topic match — not a performance ranking."
    )
    from ..models import ExpertMatch

    return ExpertResponse(
        query=req.query,
        matches=[ExpertMatch(**m) for m in matches],
        note=note,
    )

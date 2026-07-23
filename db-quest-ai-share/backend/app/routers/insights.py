"""Team insights (admin-only, anonymized).

Deliberately privacy-preserving: this endpoint reports ONLY aggregated statistics
(e.g. "70% identified the phishing red flag on their first try"). It never returns
individual users, names, or per-person scores — there are no leaderboards by design.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..db_models import Membership, Mission, MissionAttempt
from ..models import InsightsResponse, InsightStep, MissionInsight
from ..security import TeamContext, require_admin

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def team_insights(context: TeamContext = Depends(require_admin), session: Session = Depends(get_session)) -> InsightsResponse:
    team_id = context.team.id
    attempts = session.exec(select(MissionAttempt).where(MissionAttempt.team_id == team_id)).all()
    members = session.exec(select(Membership).where(Membership.team_id == team_id)).all()
    missions = session.exec(select(Mission).where(Mission.team_id == team_id)).all()
    member_count = max(len(members), 1)

    total = len(attempts)
    avg_score = round(sum(a.score for a in attempts) / total, 1) if total else 0.0
    active_members = len({a.user_id for a in attempts})
    grade_dist: dict[str, int] = {}
    for a in attempts:
        grade_dist[a.grade] = grade_dist.get(a.grade, 0) + 1

    mission_insights: list[MissionInsight] = []
    for row in missions:
        m_attempts = [a for a in attempts if a.mission_slug == row.slug]
        data = json.loads(row.data)
        steps_meta = data.get("steps", [])

        # Per-step "first try correct" rate across attempts.
        step_insights: list[InsightStep] = []
        for step in steps_meta:
            step_id = step.get("id")
            first_correct = 0
            counted = 0
            for a in m_attempts:
                decisions = json.loads(a.decisions or "[]")
                for d in decisions:
                    if d.get("stepId") == step_id:
                        counted += 1
                        if d.get("correct"):
                            first_correct += 1
                        break  # only the FIRST recorded decision for this step
            rate = round(first_correct / counted, 2) if counted else 0.0
            step_insights.append(InsightStep(stepId=step_id, prompt=step.get("prompt", ""), correctRate=rate))

        completed_members = len({a.user_id for a in m_attempts})
        mission_insights.append(MissionInsight(
            missionSlug=row.slug,
            title=data.get("title", row.title),
            attempts=len(m_attempts),
            averageScore=round(sum(a.score for a in m_attempts) / len(m_attempts), 1) if m_attempts else 0.0,
            completionRate=round(completed_members / member_count, 2),
            steps=step_insights,
        ))

    return InsightsResponse(
        totalAttempts=total,
        activeMembers=active_members,
        averageScore=avg_score,
        gradeDistribution=grade_dist,
        missions=mission_insights,
        note="Aggregated and anonymized. Individual scores are private and never shared as rankings.",
    )

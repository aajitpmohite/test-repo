"""Team routes: list my teams, create a team, and (admin) manage members.

Team isolation is enforced by ``get_team_context`` / ``require_admin`` which verify
the caller's membership and role before any team data is touched.
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..db_models import Membership, Team, User
from ..models import AddMemberRequest, CreateTeamRequest, MemberPublic, TeamPublic
from ..security import TeamContext, get_current_user, get_team_context, require_admin

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _unique_slug(session: Session, name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "team"
    slug, n = base[:40], 2
    while session.exec(select(Team).where(Team.slug == slug)).first() is not None:
        slug = f"{base[:40]}-{n}"
        n += 1
    return slug


@router.get("", response_model=list[TeamPublic])
def list_my_teams(user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> list[TeamPublic]:
    rows = session.exec(
        select(Membership, Team).where(Membership.user_id == user.id, Membership.team_id == Team.id)
    ).all()
    return [TeamPublic(id=t.id, name=t.name, slug=t.slug, role=m.role) for m, t in rows]


@router.post("", response_model=TeamPublic)
def create_team(payload: CreateTeamRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> TeamPublic:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Team name is required")
    team = Team(name=name, slug=_unique_slug(session, name))
    session.add(team)
    session.commit()
    session.refresh(team)
    session.add(Membership(user_id=user.id, team_id=team.id, role="admin"))
    session.commit()
    return TeamPublic(id=team.id, name=team.name, slug=team.slug, role="admin")


@router.get("/members", response_model=list[MemberPublic])
def list_members(context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> list[MemberPublic]:
    rows = session.exec(
        select(Membership, User).where(Membership.team_id == context.team.id, Membership.user_id == User.id)
    ).all()
    return [MemberPublic(id=u.id, email=u.email, fullName=u.full_name, role=m.role) for m, u in rows]


@router.post("/members", response_model=MemberPublic)
def add_member(payload: AddMemberRequest, context: TeamContext = Depends(require_admin), session: Session = Depends(get_session)) -> MemberPublic:
    email = payload.email.strip().lower()
    target = session.exec(select(User).where(User.email == email)).first()
    if not target:
        raise HTTPException(status_code=404, detail="No user with that email. Ask them to register first.")
    existing = session.exec(
        select(Membership).where(Membership.team_id == context.team.id, Membership.user_id == target.id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="That user is already on this team")
    role = "admin" if payload.role == "admin" else "member"
    session.add(Membership(user_id=target.id, team_id=context.team.id, role=role))
    session.commit()
    return MemberPublic(id=target.id, email=target.email, fullName=target.full_name, role=role)

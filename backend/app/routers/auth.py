"""Auth routes: register, login, demo sign-in, and "who am I".

These are the only content routes that do NOT require a token (health is the other).
On success they return a JWT plus the user's teams (with the user's role in each),
which the frontend stores to drive team-scoped, role-aware behaviour.
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..db_models import Membership, Team, User
from ..models import AuthResponse, LoginRequest, MeResponse, RegisterRequest, TeamPublic, UserPublic
from ..security import create_access_token, get_current_user, hash_password, verify_password
from ..seed import DEMO_ADMIN_EMAIL

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "team"
    return base[:40]


def _unique_slug(session: Session, name: str) -> str:
    slug = _slugify(name)
    candidate = slug
    n = 2
    while session.exec(select(Team).where(Team.slug == candidate)).first() is not None:
        candidate = f"{slug}-{n}"
        n += 1
    return candidate


def _user_public(user: User) -> UserPublic:
    return UserPublic(id=user.id, email=user.email, fullName=user.full_name, isDemo=user.is_demo)


def _teams_for(session: Session, user: User) -> list[TeamPublic]:
    rows = session.exec(select(Membership, Team).where(Membership.user_id == user.id, Membership.team_id == Team.id)).all()
    return [TeamPublic(id=t.id, name=t.name, slug=t.slug, role=m.role) for m, t in rows]


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, session: Session = Depends(get_session)) -> AuthResponse:
    email = payload.email.strip().lower()
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if session.exec(select(User).where(User.email == email)).first() is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(email=email, hashed_password=hash_password(payload.password), full_name=payload.fullName.strip())
    session.add(user)
    session.commit()
    session.refresh(user)

    # New users get their own workspace and become its admin.
    team_name = (payload.teamName or "").strip() or f"{payload.fullName.strip() or email.split('@')[0]}'s Team"
    team = Team(name=team_name, slug=_unique_slug(session, team_name))
    session.add(team)
    session.commit()
    session.refresh(team)
    session.add(Membership(user_id=user.id, team_id=team.id, role="admin"))
    session.commit()

    return AuthResponse(token=create_access_token(user.id), user=_user_public(user), teams=_teams_for(session, user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> AuthResponse:
    email = payload.email.strip().lower()
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return AuthResponse(token=create_access_token(user.id), user=_user_public(user), teams=_teams_for(session, user))


@router.post("/demo", response_model=AuthResponse)
def demo_login(session: Session = Depends(get_session)) -> AuthResponse:
    """One-click sign-in as the seeded demo admin (SSO stub)."""
    user = session.exec(select(User).where(User.email == DEMO_ADMIN_EMAIL)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not available (SEED_DEMO is off)")
    return AuthResponse(token=create_access_token(user.id), user=_user_public(user), teams=_teams_for(session, user))


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> MeResponse:
    return MeResponse(user=_user_public(user), teams=_teams_for(session, user))

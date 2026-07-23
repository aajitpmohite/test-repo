"""Authentication & authorization helpers.

- Passwords are hashed with PBKDF2-SHA256 (pure-Python, no native build needed).
- Sessions use stateless JWTs (HS256) signed with ``settings.jwt_secret``.
- FastAPI dependencies below turn a request's ``Authorization: Bearer <token>`` and
  ``X-Team-Id`` header into a validated (user, team, role) context, enforcing that
  the caller actually belongs to the team they are asking about.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from .config import settings
from .database import get_session
from .db_models import Membership, Team, User

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(password, hashed)
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the signed-in user from the bearer token (401 if missing/invalid)."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = _decode(credentials.credentials)
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return user


class TeamContext:
    """The validated (user, team, role) tuple for a request."""

    def __init__(self, user: User, team: Team, role: str) -> None:
        self.user = user
        self.team = team
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


def get_team_context(
    x_team_id: int | None = Header(default=None, alias="X-Team-Id"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TeamContext:
    """Resolve which team the request targets and confirm the user is a member.

    The frontend sends the selected team in the ``X-Team-Id`` header. If omitted,
    we default to the user's first team so simple calls still work.
    """
    memberships = session.exec(select(Membership).where(Membership.user_id == user.id)).all()
    if not memberships:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not belong to any team")

    membership = None
    if x_team_id is not None:
        membership = next((m for m in memberships if m.team_id == x_team_id), None)
        if membership is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this team")
    else:
        membership = memberships[0]

    team = session.get(Team, membership.team_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return TeamContext(user=user, team=team, role=membership.role)


def require_admin(context: TeamContext = Depends(get_team_context)) -> TeamContext:
    """Guard for admin-only endpoints (upload, generate mission, insights)."""
    if not context.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required for this team")
    return context

"""First-run demo seeding.

On an empty database this creates several ready-to-use demo teams so the app is
fully functional the moment it starts — no signup, no uploads. Each team gets its
own admin/member accounts plus the sample documents (indexed for search) and the
sample missions.

Demo accounts (password ``demo123``):
    demo-admin@dbquest.ai    -> Admin  (upload, generate missions, team insights)
    demo-member@dbquest.ai   -> Member (ask, onboarding, play missions)
    atlas-admin@dbquest.ai   -> Admin  of "Atlas Engineering Squad"
    atlas-member@dbquest.ai  -> Member of "Atlas Engineering Squad"
    nimbus-admin@dbquest.ai  -> Admin  of "Nimbus Cloud Platform"
    nimbus-member@dbquest.ai -> Member of "Nimbus Cloud Platform"

``demo-admin@dbquest.ai`` (the one-click demo login) is also made an admin of the
other teams, so the one-click demo can switch between all of them via the team
switcher and see each team's own members/documents/insights in isolation.

Acronyms and experts remain global reference data loaded from JSON at request time.
"""
from __future__ import annotations

import json

from sqlmodel import Session, select

from .config import settings
from .db_models import Document, Membership, Mission, Team, User
from .retrieval import index_document
from .security import hash_password

DEMO_TEAM_SLUG = "demo"
DEMO_ADMIN_EMAIL = "demo-admin@dbquest.ai"
DEMO_MEMBER_EMAIL = "demo-member@dbquest.ai"
DEMO_PASSWORD = "demo123"

# (team name, slug, admin email, admin full name, member email, member full name)
_DEMO_TEAMS = [
    ("Deutsche Bank Demo Team", DEMO_TEAM_SLUG, DEMO_ADMIN_EMAIL, "Demo Admin", DEMO_MEMBER_EMAIL, "Demo Member"),
    ("Atlas Engineering Squad", "atlas-engineering", "atlas-admin@dbquest.ai", "Atlas Admin", "atlas-member@dbquest.ai", "Atlas Member"),
    ("Nimbus Cloud Platform", "nimbus-platform", "nimbus-admin@dbquest.ai", "Nimbus Admin", "nimbus-member@dbquest.ai", "Nimbus Member"),
]


def _get_or_create_user(session: Session, email: str, full_name: str) -> User:
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        return user
    user = User(email=email, hashed_password=hash_password(DEMO_PASSWORD), full_name=full_name, is_demo=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _seed_team_content(session: Session, team: Team, admin: User) -> None:
    """Load the sample documents (indexed) and sample missions into one team."""
    docs_dir = settings.data_dir / "documents"
    if docs_dir.exists():
        for path in sorted(docs_dir.glob("*.md")):
            document = Document(
                team_id=team.id,
                title=path.stem.replace("_", " ").title(),
                source="seed",
                filename=path.name,
                content=path.read_text(encoding="utf-8"),
                uploaded_by=admin.id,
            )
            session.add(document)
            session.commit()
            session.refresh(document)
            index_document(session, document)

    missions_path = settings.data_dir / "missions.json"
    if missions_path.exists():
        for mission in json.loads(missions_path.read_text(encoding="utf-8")):
            session.add(Mission(
                team_id=team.id,
                slug=mission["id"],
                title=mission.get("title", ""),
                topic=mission.get("topic", ""),
                difficulty=mission.get("difficulty", ""),
                generated=mission.get("generated", False),
                data=json.dumps(mission),
                created_by=admin.id,
            ))
        session.commit()


def seed_if_empty(session: Session) -> None:
    """Seed the demo teams + content only when the database has no teams yet."""
    if not settings.seed_demo:
        return
    if session.exec(select(Team)).first() is not None:
        return  # already seeded

    demo_admin: User | None = None

    for name, slug, admin_email, admin_name, member_email, member_name in _DEMO_TEAMS:
        team = Team(name=name, slug=slug)
        session.add(team)
        session.commit()
        session.refresh(team)

        admin = _get_or_create_user(session, admin_email, admin_name)
        member = _get_or_create_user(session, member_email, member_name)
        if demo_admin is None:
            demo_admin = admin

        session.add(Membership(user_id=admin.id, team_id=team.id, role="admin"))
        session.add(Membership(user_id=member.id, team_id=team.id, role="member"))
        # Give the one-click demo admin visibility into every seeded team.
        if admin.id != demo_admin.id:
            session.add(Membership(user_id=demo_admin.id, team_id=team.id, role="admin"))
        session.commit()

        _seed_team_content(session, team, admin)

"""First-run demo seeding.

On an empty database this creates a ready-to-use demo team so the app is fully
functional the moment it starts — no signup, no uploads. It loads the existing
sample documents (and indexes them for search) and the five sample missions.

Demo accounts (password ``demo123``):
    demo-admin@dbquest.ai   -> Admin  (upload, generate missions, team insights)
    demo-member@dbquest.ai  -> Member (ask, onboarding, play missions)

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


def seed_if_empty(session: Session) -> None:
    """Seed the demo team + content only when the database has no teams yet."""
    if not settings.seed_demo:
        return
    if session.exec(select(Team)).first() is not None:
        return  # already seeded

    team = Team(name="Deutsche Bank Demo Team", slug=DEMO_TEAM_SLUG)
    session.add(team)
    session.commit()
    session.refresh(team)

    admin = User(email=DEMO_ADMIN_EMAIL, hashed_password=hash_password(DEMO_PASSWORD),
                 full_name="Demo Admin", is_demo=True)
    member = User(email=DEMO_MEMBER_EMAIL, hashed_password=hash_password(DEMO_PASSWORD),
                  full_name="Demo Member", is_demo=True)
    session.add(admin)
    session.add(member)
    session.commit()
    session.refresh(admin)
    session.refresh(member)

    session.add(Membership(user_id=admin.id, team_id=team.id, role="admin"))
    session.add(Membership(user_id=member.id, team_id=team.id, role="member"))
    session.commit()

    # Sample documents -> Document rows + indexed chunks.
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

    # Sample missions -> Mission rows (full JSON incl. answer key kept server-side).
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

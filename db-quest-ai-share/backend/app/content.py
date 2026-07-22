"""Loads and holds seed content (missions, acronyms, experts).

Generated missions are kept in-memory for the session so they can be played
immediately after the admin creates them.
"""
from __future__ import annotations

import json
import os

from .config import settings


def _load_json(filename: str, default):
    path = os.path.join(settings.data_dir, filename)
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


class ContentRepository:
    def __init__(self) -> None:
        self._missions: dict[str, dict] = {}
        self.acronyms: dict[str, dict] = {}
        self.experts: list[dict] = []

    def load(self) -> None:
        missions = _load_json("missions.json", [])
        self._missions = {m["id"]: m for m in missions}
        acronyms = _load_json("acronyms.json", {})
        # Normalise keys to upper-case for lookup.
        self.acronyms = {k.upper(): v for k, v in acronyms.items()}
        self.experts = _load_json("experts.json", [])

    # ---------------------------------------------------------- missions
    def list_missions(self) -> list[dict]:
        return list(self._missions.values())

    def get_mission(self, mission_id: str) -> dict | None:
        return self._missions.get(mission_id)

    def add_mission(self, mission: dict) -> None:
        self._missions[mission["id"]] = mission

    # ---------------------------------------------------------- acronyms
    def get_acronym(self, term: str) -> dict | None:
        return self.acronyms.get(term.upper())


content = ContentRepository()

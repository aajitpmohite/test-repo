from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class ContentStore:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.missions_path = data_dir / "missions.json"
        self.acronyms_path = data_dir / "acronyms.json"
        self.experts_path = data_dir / "experts.json"
        self.missions = []
        self.acronyms = []
        self.experts = []
        self.generated_missions = []
        self._load()

    def _load(self) -> None:
        self.missions = json.loads(self.missions_path.read_text(encoding="utf-8"))
        self.acronyms = json.loads(self.acronyms_path.read_text(encoding="utf-8"))
        self.experts = json.loads(self.experts_path.read_text(encoding="utf-8"))

    def list_missions(self) -> list[dict[str, Any]]:
        return self.missions + self.generated_missions

    def get_mission(self, mission_id: str) -> dict[str, Any] | None:
        for mission in self.list_missions():
            if mission["id"] == mission_id:
                return mission
        return None

    def add_generated_mission(self, mission: dict[str, Any]) -> None:
        mission["id"] = mission.get("id") or f"generated-{len(self.generated_missions) + 1}"
        self.generated_missions.append(mission)

    def list_acronyms(self) -> list[dict[str, Any]]:
        return self.acronyms

    def list_experts(self) -> list[dict[str, Any]]:
        return self.experts

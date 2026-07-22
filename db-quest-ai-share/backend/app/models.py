"""Pydantic request/response models shared across the API."""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Missions (Escape Room)
# --------------------------------------------------------------------------- #
class Choice(BaseModel):
    id: str
    text: str
    correct: bool = False
    risk: Literal["low", "medium", "high"] = "low"
    feedback: str = ""


class MissionStep(BaseModel):
    id: str
    prompt: str
    choices: list[Choice] = Field(default_factory=list)
    clue: str = ""


class Mission(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: Literal["Beginner", "Intermediate", "Expert"] = "Beginner"
    points: int = 100
    estimatedMinutes: int = 8
    summary: str = ""
    briefing: str = ""
    scenario: str = ""
    objectives: list[str] = Field(default_factory=list)
    steps: list[MissionStep] = Field(default_factory=list)
    learningPoints: list[str] = Field(default_factory=list)
    policyRefs: list[str] = Field(default_factory=list)
    generated: bool = False


class GenerateMissionRequest(BaseModel):
    topic: str = Field(..., examples=["Phishing"])
    audience: str = Field("New joiners", examples=["New joiners"])
    difficulty: Literal["Beginner", "Intermediate", "Expert"] = "Intermediate"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class InteractRequest(BaseModel):
    missionId: str
    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    difficulty: Optional[str] = None


class InteractResponse(BaseModel):
    reply: str
    revealed: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class HintRequest(BaseModel):
    missionId: str
    stepId: Optional[str] = None
    level: int = 1


class HintResponse(BaseModel):
    hint: str
    level: int


class EvaluateRequest(BaseModel):
    missionId: str
    stepId: str
    choiceId: str


class EvaluateResponse(BaseModel):
    correct: bool
    risk: str
    feedback: str
    explanation: str
    policyPrinciple: str
    realWorldAction: str


class DecisionRecord(BaseModel):
    stepId: str
    choiceId: str
    correct: bool
    risk: str


class ReportRequest(BaseModel):
    missionId: str
    decisions: list[DecisionRecord] = Field(default_factory=list)
    hintsUsed: int = 0
    durationSeconds: int = 0


class ReportResponse(BaseModel):
    score: int
    grade: str
    headline: str
    strengths: list[str]
    improvements: list[str]
    recommendedTopics: list[str]


# --------------------------------------------------------------------------- #
# Digital Colleague
# --------------------------------------------------------------------------- #
class Source(BaseModel):
    title: str
    snippet: str
    documentId: str


class AskRequest(BaseModel):
    question: str
    projectId: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"


class OnboardingRequest(BaseModel):
    role: str = "Software Engineer"
    project: str = "Payments Modernization"
    days: int = 7


class OnboardingDay(BaseModel):
    day: int
    title: str
    tasks: list[str]
    resources: list[str] = Field(default_factory=list)


class OnboardingResponse(BaseModel):
    role: str
    project: str
    plan: list[OnboardingDay]
    keyContacts: list[str] = Field(default_factory=list)
    glossary: list[dict[str, str]] = Field(default_factory=list)


class AcronymRequest(BaseModel):
    term: str


class AcronymResponse(BaseModel):
    term: str
    expansion: str
    explanation: str
    context: str
    related: list[str] = Field(default_factory=list)
    matched: bool = True


class ExpertRequest(BaseModel):
    query: str


class ExpertMatch(BaseModel):
    name: str
    role: str
    reason: str
    topics: list[str]
    contact: str


class ExpertResponse(BaseModel):
    query: str
    matches: list[ExpertMatch]
    note: str


# --------------------------------------------------------------------------- #
# Documents
# --------------------------------------------------------------------------- #
class DocumentMeta(BaseModel):
    id: str
    title: str
    source: str
    chars: int
    chunks: int


class DocumentSummaryResponse(BaseModel):
    title: str
    summary: str
    keyPoints: list[str]
    decisions: list[str]
    actionItems: list[str]
    risks: list[str]
    peopleMentioned: list[str]


class HealthResponse(BaseModel):
    status: str
    aiProvider: str
    liveAi: bool
    missions: int
    documents: int
    version: str

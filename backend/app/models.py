from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    aiProvider: str
    liveAi: bool
    missions: int
    documents: int
    version: str


class MissionChoice(BaseModel):
    id: str
    text: str
    correct: bool = False
    risk: Literal["low", "medium", "high"] = "low"
    feedback: str


class MissionStep(BaseModel):
    id: str
    prompt: str
    clue: str
    choices: list[MissionChoice]


class Mission(BaseModel):
    id: str
    title: str
    topic: Literal["Cybersecurity", "Data Privacy", "Operational Risk", "Responsible AI"]
    difficulty: Literal["Beginner", "Intermediate", "Expert"]
    points: int
    estimatedMinutes: int
    summary: str
    briefing: str
    scenario: str
    objectives: list[str]
    steps: list[MissionStep]
    learningPoints: list[str]
    policyRefs: list[str]
    clues: dict[str, dict[str, str]]
    generated: bool


class SanitizedChoice(BaseModel):
    """A choice as sent to the client: answer key (correct/feedback) stripped server-side."""

    id: str
    text: str
    risk: Literal["low", "medium", "high"] = "low"


class SanitizedStep(BaseModel):
    id: str
    prompt: str
    clue: str
    choices: list[SanitizedChoice]


class SanitizedMission(BaseModel):
    """Mission detail for gameplay: choices carry no answer key and clues are withheld."""

    id: str
    title: str
    topic: Literal["Cybersecurity", "Data Privacy", "Operational Risk", "Responsible AI"]
    difficulty: Literal["Beginner", "Intermediate", "Expert"]
    points: int
    estimatedMinutes: int
    summary: str
    briefing: str
    scenario: str
    objectives: list[str]
    steps: list[SanitizedStep]
    learningPoints: list[str]
    policyRefs: list[str]
    generated: bool


class MissionSummary(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: str
    points: int
    estimatedMinutes: int
    summary: str
    briefing: str
    scenario: str
    objectives: list[str]
    generated: bool
    # Per-user progress (from saved attempts) so the UI can show completion.
    completed: bool = False
    bestScore: int | None = None
    grade: str | None = None


class GenerateMissionRequest(BaseModel):
    topic: str
    audience: str = Field(default="team member")
    difficulty: str = Field(default="Beginner")
    # Free-text policy / scenario description the AI turns into a mission. Optional:
    # when empty the generator falls back to topic-driven archetypes.
    policy: str = Field(default="")


class MissionInteractRequest(BaseModel):
    missionId: str
    message: str
    history: list[dict[str, str]] = Field(default_factory=list)


class MissionInteractResponse(BaseModel):
    reply: str
    revealed: list[str]
    suggestions: list[str]


class MissionHintRequest(BaseModel):
    missionId: str
    stepId: str
    level: int = Field(default=1)


class MissionHintResponse(BaseModel):
    hint: str
    level: int


class MissionEvaluateRequest(BaseModel):
    missionId: str
    stepId: str
    choiceId: str


class MissionEvaluateResponse(BaseModel):
    correct: bool
    risk: str
    feedback: str
    explanation: str
    policyPrinciple: str
    realWorldAction: str


class MissionReportRequest(BaseModel):
    missionId: str
    decisions: list[dict[str, Any]] = Field(default_factory=list)
    hintsUsed: int = 0
    durationSeconds: int = 0


class MissionReportResponse(BaseModel):
    score: int
    grade: str
    headline: str
    strengths: list[str]
    improvements: list[str]
    recommendedTopics: list[str]


class ColleagueAskRequest(BaseModel):
    question: str


class ColleagueAskResponse(BaseModel):
    answer: str
    sources: list[dict[str, str]]
    confidence: str


class ColleagueOnboardingRequest(BaseModel):
    role: str
    project: str
    days: int = Field(default=7)


class ColleagueOnboardingResponse(BaseModel):
    role: str
    project: str
    plan: list[dict[str, Any]]
    keyContacts: list[dict[str, str]]
    glossary: list[dict[str, str]]


class ColleagueAcronymRequest(BaseModel):
    term: str


class ColleagueAcronymResponse(BaseModel):
    term: str
    expansion: str
    explanation: str
    context: str
    related: list[str]
    matched: bool


class ColleagueExpertRequest(BaseModel):
    query: str


class ColleagueExpertResponse(BaseModel):
    query: str
    matches: list[dict[str, Any]]
    note: str


class DocumentSummaryRequest(BaseModel):
    documentId: int | str | None = None
    text: str | None = None


class DocumentSummaryResponse(BaseModel):
    title: str
    summary: str
    keyPoints: list[str]
    decisions: list[str]
    actionItems: list[str]
    risks: list[str]
    peopleMentioned: list[str]


class DocumentItem(BaseModel):
    id: str
    title: str
    source: str
    createdAt: str


class DocumentPasteRequest(BaseModel):
    title: str
    text: str


class DocumentUploadResponse(BaseModel):
    id: str
    title: str
    source: str
    createdAt: str
    message: str


# ---------------------------------------------------------------------------
# Auth, teams, and analytics schemas (v0.2 multi-team model)
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str = ""
    teamName: str | None = None  # optional: names the workspace created for the user


class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: int
    email: str
    fullName: str
    isDemo: bool


class TeamPublic(BaseModel):
    id: int
    name: str
    slug: str
    role: str  # the CURRENT user's role in this team


class AuthResponse(BaseModel):
    token: str
    user: UserPublic
    teams: list[TeamPublic]


class MeResponse(BaseModel):
    user: UserPublic
    teams: list[TeamPublic]


class MemberPublic(BaseModel):
    id: int
    email: str
    fullName: str
    role: str


class AddMemberRequest(BaseModel):
    email: str
    role: str = "member"


class CreateTeamRequest(BaseModel):
    name: str


class DocumentPublic(BaseModel):
    id: int
    title: str
    source: str
    chunkCount: int
    createdAt: str


class InsightStep(BaseModel):
    stepId: str
    prompt: str
    correctRate: float  # 0..1 share of attempts that got this step right first try


class MissionInsight(BaseModel):
    missionSlug: str
    title: str
    attempts: int
    averageScore: float
    completionRate: float
    steps: list[InsightStep]


class InsightsResponse(BaseModel):
    totalAttempts: int
    activeMembers: int
    averageScore: float
    gradeDistribution: dict[str, int]
    missions: list[MissionInsight]
    note: str

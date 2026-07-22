# API Reference — DB Quest AI

Base URL (dev): `http://localhost:8000`. Interactive docs at `/docs` (Swagger UI).
All request/response bodies are JSON unless noted.

---

## System

### `GET /api/health`
Returns runtime status and AI mode.
```json
{ "status": "ok", "aiProvider": "mock", "liveAi": false, "missions": 5, "documents": 5, "version": "1.0.0" }
```

---

## Missions (Escape Room)

### `GET /api/missions`
List mission summaries (topic, difficulty, points, estimated time, step count).

### `GET /api/missions/{mission_id}`
Full mission for play. **Answer keys are stripped** (`correct`/`feedback` removed; `clues` hidden).

### `POST /api/missions/generate`
Generate a new mission with AI.
```json
{ "topic": "Phishing", "audience": "New joiners", "difficulty": "Intermediate" }
```
Returns a sanitized mission (also stored in-memory for immediate play).

### `POST /api/missions/interact`  → AI Game Master
```json
{ "missionId": "phishing_001", "message": "check the sender domain", "history": [] }
```
```json
{ "reply": "🔎 The sender is external…", "revealed": ["sender"], "suggestions": ["Inspect the link", "..."] }
```

### `POST /api/missions/hint`  → progressive hints
```json
{ "missionId": "phishing_001", "stepId": "step1", "level": 1 }
```
```json
{ "hint": "💡 Genuine IT never needs your token…", "level": 1 }
```

### `POST /api/missions/evaluate`  → decision feedback (server-side scoring)
```json
{ "missionId": "phishing_001", "stepId": "step1", "choiceId": "C" }
```
```json
{ "correct": true, "risk": "low", "feedback": "Correct…",
  "explanation": "…", "policyPrinciple": "…", "realWorldAction": "…" }
```

### `POST /api/missions/report`  → personalised learning report
```json
{ "missionId": "phishing_001",
  "decisions": [ { "stepId": "step1", "choiceId": "C", "correct": true, "risk": "low" } ],
  "hintsUsed": 1, "durationSeconds": 95 }
```
```json
{ "score": 88, "grade": "Risk Champion", "headline": "Risk Awareness Score: 88/100 — Risk Champion",
  "strengths": ["…"], "improvements": ["…"], "recommendedTopics": ["…"] }
```

---

## Digital Colleague

### `POST /api/colleague/ask`  → grounded Q&A
```json
{ "question": "What is the process for production deployment?" }
```
```json
{ "answer": "Based on the team documentation: …",
  "sources": [ { "title": "Production Deployment Checklist", "snippet": "…", "documentId": "seed_deployment_checklist" } ],
  "confidence": "high" }
```

### `POST /api/colleague/onboarding`
```json
{ "role": "Software Engineer", "project": "Payments Modernization", "days": 7 }
```
Returns `{ role, project, plan: [{day,title,tasks[],resources[]}], keyContacts[], glossary[] }`.

### `POST /api/colleague/acronym`
```json
{ "term": "UBR" }
```
Returns `{ term, expansion, explanation, context, related[], matched }`.

### `POST /api/colleague/expert`
```json
{ "query": "deployment pipeline" }
```
Returns `{ query, matches: [{name, role, reason, topics[], contact}], note }`.

---

## Documents

### `GET /api/documents`
List loaded documents `[{ id, title, source, chars, chunks }]`.

### `POST /api/documents/upload`  *(multipart/form-data)*
Fields: `file` (`.txt`/`.md`/`.csv`), optional `title`. Returns the created `DocumentMeta`.

### `POST /api/documents/paste`
```json
{ "title": "Meeting minutes", "text": "..." }
```

### `POST /api/documents/summarize`
```json
{ "documentId": "seed_release_notes" }
```
or `{ "title": "...", "text": "..." }`. Returns
`{ title, summary, keyPoints[], decisions[], actionItems[], risks[], peopleMentioned[] }`.

---

## Error format
Errors use FastAPI's standard shape:
```json
{ "detail": "Mission not found" }
```
Common codes: `400` (bad input), `404` (not found), `415` (unsupported file type).

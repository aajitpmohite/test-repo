"""Deterministic, offline "AI" generators.

These power the demo when no LLM provider is configured. They are intentionally
rich and context-aware so the product feels intelligent during a hackathon
presentation even with zero external dependencies or network access.

Every function here mirrors the shape returned by the live LLM path in
``ai_service`` so the rest of the app is agnostic to which brain is in use.
"""
from __future__ import annotations

import re
import uuid
from collections import Counter

# --------------------------------------------------------------------------- #
# Mission generation
# --------------------------------------------------------------------------- #
# Each archetype describes a realistic workplace threat/scenario. The generator
# fills a common 3-step "escape" structure with archetype-specific detail.
_ARCHETYPES = {
    "phishing": {
        "channel": "email",
        "actor": "an attacker impersonating a senior manager",
        "ask": "urgently upload a confidential file to an external link",
        "flags": ["external look-alike domain", "artificial urgency", "shortened link"],
        "channelName": "your official security reporting channel (Report Phishing button)",
        "policy": "Information Security & Anti-Phishing Policy",
        "clues": {
            "sender": {
                "finding": "The sender address is `m.klein@db-secure-login.com`",
                "meaning": "this is a look-alike domain, not the internal `@db.com` domain.",
            },
            "link": {
                "finding": "The link uses a shortened `bit.ly` URL that expands to `db-secure-login.com/upload`",
                "meaning": "legitimate internal tools never ask you to authenticate on external shorteners.",
            },
            "urgency": {
                "finding": "The message stresses the file must be sent 'in the next 15 minutes'",
                "meaning": "manufactured urgency is a classic social-engineering pressure tactic.",
            },
            "request": {
                "finding": "It asks you to move a confidential file to an external location",
                "meaning": "this violates data handling and would cause data leakage.",
            },
        },
    },
    "data_leak": {
        "channel": "chat request",
        "actor": "a colleague under deadline pressure",
        "ask": "send a spreadsheet of client records to a personal email 'to work on it at home'",
        "flags": ["personal email destination", "confidential client data", "no approval"],
        "channelName": "your Data Protection Officer and line manager",
        "policy": "Data Privacy & Confidential Information Policy",
        "clues": {
            "request": {
                "finding": "The file `clients_full_export.xlsx` contains names, account numbers and balances",
                "meaning": "this is Confidential / Personal data under data classification rules.",
            },
            "channel": {
                "finding": "The destination is a personal `@gmail.com` address",
                "meaning": "sending confidential data outside managed systems is a reportable data leak.",
            },
            "urgency": {
                "finding": "The colleague says they'll 'get in trouble' if it isn't sent now",
                "meaning": "pressure does not override data protection controls.",
            },
        },
    },
    "vendor": {
        "channel": "email",
        "actor": "someone claiming to be an existing vendor",
        "ask": "update the bank account for their next invoice payment",
        "flags": ["changed bank details", "unverified request", "reply-to mismatch"],
        "channelName": "Vendor Management and the verified contact on file (call-back)",
        "policy": "Third-Party Risk & Payments Control Policy",
        "clues": {
            "sender": {
                "finding": "The reply-to address differs from the vendor's domain on file",
                "meaning": "this is a hallmark of Business Email Compromise (BEC).",
            },
            "request": {
                "finding": "They request an urgent change of bank account details before an invoice run",
                "meaning": "payment detail changes require independent verification via a known number.",
            },
            "urgency": {
                "finding": "They warn the payment 'will be late' without immediate action",
                "meaning": "pressure to bypass verification is a red flag.",
            },
        },
    },
    "ai_misuse": {
        "channel": "situation",
        "actor": "a well-meaning teammate",
        "ask": "paste confidential source code and client data into a public AI chatbot to 'save time'",
        "flags": ["confidential data in public tool", "no approval", "data retention risk"],
        "channelName": "the approved internal AI platform and your AI Usage guidance",
        "policy": "Responsible AI & Acceptable Use Policy",
        "clues": {
            "request": {
                "finding": "The plan is to paste client records and proprietary code into a public LLM",
                "meaning": "confidential/personal data must never be entered into unapproved external tools.",
            },
            "channel": {
                "finding": "The public tool's terms allow the provider to retain and train on inputs",
                "meaning": "this creates data leakage and confidentiality breaches.",
            },
            "request2": {
                "finding": "An approved internal AI service is available for the same task",
                "meaning": "use sanctioned tooling that keeps data inside the bank.",
            },
        },
    },
    "client_data": {
        "channel": "phone call",
        "actor": "a caller claiming to be a client",
        "ask": "read out full account details after failing identity verification",
        "flags": ["failed verification", "pressure", "sensitive data request"],
        "channelName": "standard identity-verification procedure and your supervisor",
        "policy": "Client Data Handling & KYC Policy",
        "clues": {
            "request": {
                "finding": "The caller cannot answer two of the required security questions",
                "meaning": "identity is not verified, so account data must not be disclosed.",
            },
            "urgency": {
                "finding": "They claim an emergency and become aggressive",
                "meaning": "emotional pressure is used to bypass controls — follow procedure.",
            },
        },
    },
}

_DEFAULT_ARCHETYPE = "phishing"

_DIFFICULTY_TWIST = {
    "Beginner": "The warning signs are fairly clear if you look carefully.",
    "Intermediate": "The attempt is polished, with a realistic signature and internal jargon.",
    "Expert": "This is a highly targeted attempt: correct names, real project references and near-perfect formatting.",
}


def _match_archetype(topic: str) -> str:
    t = topic.lower()
    if any(w in t for w in ["phish", "email", "credential", "token", "mfa", "otp"]):
        return "phishing"
    if any(w in t for w in ["leak", "confidential", "exfil", "spreadsheet", "export"]):
        return "data_leak"
    if any(w in t for w in ["vendor", "supplier", "invoice", "payment", "third"]):
        return "vendor"
    if any(w in t for w in ["ai", "genai", "gpt", "llm", "chatbot", "generative"]):
        return "ai_misuse"
    if any(w in t for w in ["client", "customer", "pii", "kyc", "account"]):
        return "client_data"
    return _DEFAULT_ARCHETYPE


def generate_mission(topic: str, audience: str, difficulty: str) -> dict:
    key = _match_archetype(topic)
    arc = _ARCHETYPES[key]
    twist = _DIFFICULTY_TWIST.get(difficulty, _DIFFICULTY_TWIST["Intermediate"])
    mid = f"gen_{key}_{uuid.uuid4().hex[:6]}"

    briefing = (
        f"You are a Deutsche Bank employee. Via {arc['channel']}, {arc['actor']} asks you to "
        f"{arc['ask']}. {twist} Investigate the situation and make the safe decision to escape the mission."
    )
    scenario = (
        f"Topic: {topic}. Audience: {audience}. Difficulty: {difficulty}. "
        f"Threat vector: {arc['channel']}. The request is to {arc['ask']}. "
        f"Red flags present: {', '.join(arc['flags'])}."
    )

    steps = [
        {
            "id": "step1",
            "prompt": (
                f"You receive the {arc['channel']}. {arc['actor'].capitalize()} wants you to "
                f"{arc['ask']}. What is your first move?"
            ),
            "clue": "The safest first move is never to comply immediately, and never to ignore a possible incident.",
            "choices": [
                {"id": "A", "text": f"Do it quickly to be helpful", "correct": False, "risk": "high",
                 "feedback": "Complying immediately is exactly what the attacker wants."},
                {"id": "B", "text": "Delete it and move on", "correct": False, "risk": "medium",
                 "feedback": "Ignoring a potential incident means it may hit a colleague next."},
                {"id": "C", "text": "Pause and inspect the request for red flags before acting", "correct": True,
                 "risk": "low", "feedback": "Correct. Slow down and verify before you act."},
                {"id": "D", "text": "Forward it to a teammate to ask what they think", "correct": False,
                 "risk": "medium", "feedback": "Forwarding can spread the threat and leak details."},
            ],
        },
        {
            "id": "step2",
            "prompt": "You decide to investigate. Which indicator is the strongest evidence something is wrong?",
            "clue": f"Look at: {', '.join(arc['flags'])}.",
            "choices": [
                {"id": "A", "text": "The message is well written, so it is probably fine", "correct": False,
                 "risk": "high", "feedback": "Good writing is not proof of legitimacy — modern attacks are polished."},
                {"id": "B", "text": f"A red flag such as: {arc['flags'][0]}", "correct": True, "risk": "low",
                 "feedback": "Correct. That indicator is a classic sign of an attack."},
                {"id": "C", "text": "It mentions my manager's name, so I trust it", "correct": False, "risk": "high",
                 "feedback": "Names are easily discovered and spoofed."},
                {"id": "D", "text": "There is urgency, so I should act faster", "correct": False, "risk": "high",
                 "feedback": "Urgency is a manipulation tactic, not a reason to skip checks."},
            ],
        },
        {
            "id": "step3",
            "prompt": "You are confident this is not legitimate. How do you resolve it correctly?",
            "clue": f"Use the correct escalation channel: {arc['channelName']}.",
            "choices": [
                {"id": "A", "text": "Reply asking the sender to confirm they are real", "correct": False,
                 "risk": "medium", "feedback": "Never engage the sender — it confirms your address is active."},
                {"id": "B", "text": "Handle it quietly yourself and say nothing", "correct": False, "risk": "medium",
                 "feedback": "Silent handling means the org loses the chance to protect others."},
                {"id": "C", "text": f"Report it through {arc['channelName']}", "correct": True, "risk": "low",
                 "feedback": "Correct. Reporting protects you and every colleague."},
                {"id": "D", "text": "Comply but tell your manager afterwards", "correct": False, "risk": "high",
                 "feedback": "The damage is already done once you comply."},
            ],
        },
    ]

    return {
        "id": mid,
        "title": f"{topic.strip().title()} — Rapid Response",
        "topic": _topic_category(key),
        "difficulty": difficulty,
        "points": {"Beginner": 100, "Intermediate": 150, "Expert": 200}.get(difficulty, 100),
        "estimatedMinutes": {"Beginner": 6, "Intermediate": 9, "Expert": 12}.get(difficulty, 8),
        "summary": f"An AI-generated mission on {topic} for {audience.lower()}.",
        "briefing": briefing,
        "scenario": scenario,
        "objectives": [
            "Identify the red flags in the request",
            "Avoid taking the unsafe action",
            f"Escalate through {arc['channelName']}",
        ],
        "steps": steps,
        "learningPoints": [
            f"Requests to {arc['ask']} must always be independently verified.",
            f"Watch for: {', '.join(arc['flags'])}.",
            f"Escalate through {arc['channelName']}.",
            "Urgency and authority are the two most common manipulation levers.",
        ],
        "policyRefs": [arc["policy"], "Operational Risk Framework"],
        "clues": arc["clues"],
        "generated": True,
    }


def _topic_category(key: str) -> str:
    return {
        "phishing": "Cybersecurity",
        "data_leak": "Data Privacy",
        "vendor": "Operational Risk",
        "ai_misuse": "Responsible AI",
        "client_data": "Data Privacy",
    }.get(key, "Cybersecurity")


# --------------------------------------------------------------------------- #
# AI Game Master (adaptive investigation chat)
# --------------------------------------------------------------------------- #
def game_master(mission: dict, history: list[dict], message: str) -> dict:
    text = message.lower().strip()
    clues: dict = mission.get("clues", {})
    revealed: list[str] = []
    already = {
        t.get("_revealed")
        for t in history
        if isinstance(t, dict)
    }

    def reveal(*keys: str) -> list[str]:
        out = []
        for key in keys:
            c = clues.get(key)
            if c:
                revealed.append(key)
                out.append(f"🔎 {c['finding']} — {c['meaning']}")
        return out

    lines: list[str] = []

    # Dangerous intents first.
    if any(w in text for w in ["share", "send", "give", "provide", "upload", "paste"]) and any(
        w in text for w in ["token", "password", "credential", "otp", "code", "file", "data", "details"]
    ):
        lines.append(
            "⛔ Hold on — handing over credentials, tokens or confidential data is exactly what an attacker "
            "wants. Never share these. What could you inspect first to confirm your suspicion?"
        )
    elif any(w in text for w in ["report", "escalate", "soc", "security team", "phishing button", "dpo"]):
        lines.append(
            "✅ Strong move. Reporting through an official channel is the correct action and protects "
            "everyone. Before you finish, can you name the specific red flag that convinced you?"
        )
    elif any(w in text for w in ["verify", "call", "confirm", "call-back", "callback", "contact"]):
        lines.append(
            "✅ Good instinct — independent verification via a trusted, known contact is the right control. "
            "Attackers rely on you NOT checking."
        )
        lines.extend(reveal("request"))
    elif any(w in text for w in ["sender", "from", "address", "domain", "email", "who sent", "who really", "who is", "who ", "sent this", "sent it", "really sent", "whosent"]):
        found = reveal("sender")
        lines.extend(found or ["The sender details look plausible at a glance — but check the exact domain, not just the display name."])
    elif any(w in text for w in ["link", "url", "hover", "href", "website", "click"]):
        found = reveal("link")
        lines.extend(found or ["Hover the link without clicking. Where does it actually resolve to?"])
    elif any(w in text for w in ["attach", "file name", "document", "spreadsheet", "asking", "request", "want", "do they", "what are they", "what do they"]):
        found = reveal("request")
        lines.extend(found or ["Look at what data the file actually contains and how it is classified."])
    elif any(w in text for w in ["urgent", "urgency", "deadline", "pressure", "time"]):
        found = reveal("urgency")
        lines.extend(found or ["Notice the pressure being applied. Urgency is a manipulation tactic."])
    elif any(w in text for w in ["channel", "personal", "gmail", "external", "destination", "going", "where is", "sent to", "recipient", "where does"]):
        found = reveal("channel")
        lines.extend(found or ["Where is the data being asked to go? External destinations are a red flag."])
    elif any(w in text for w in ["hint", "help", "stuck", "what should", "not sure", "dont know", "don't know"]):
        remaining = [k for k in clues if k not in already]
        nudge = clues.get(remaining[0]) if remaining else None
        lines.append(
            f"💡 Try inspecting the {'/'.join(list(clues.keys())[:3])}. "
            + (f"For example, look closely at the {list(clues.keys())[0]}." if nudge else "")
        )
    elif any(w in text for w in ["ignore", "delete", "nothing"]):
        lines.append(
            "🤔 Ignoring it protects you personally, but a real threat could still hit a colleague. "
            "The safest outcome is to investigate and then report."
        )
    else:
        # Safety net: still surface a clue so the player always makes progress,
        # even if the exact wording didn't match a specific investigation branch.
        first = next((a for a in ["sender", "link", "request", "urgency", "channel"] if a in clues), None)
        found = reveal(first) if first else []
        if found:
            lines.extend(found)
            lines.append(
                'Keep going - ask about the link, the request, the urgency, or "How should I report it?"'
            )
        else:
            lines.append(
                'Ask me questions to uncover the solution - for example: "Who really sent this?", '
                '"Where does the link go?", "What are they asking me to do?", "Why is it so urgent?", '
                'or "How should I report it?"'
            )

    # Suggestions are phrased as the questions the player should ask next to
    # uncover each remaining clue (and finally, how to resolve it safely).
    aspect_questions = {
        "sender": "Who really sent this?",
        "link": "Where does the link actually go?",
        "request": "What are they asking me to do?",
        "urgency": "Why is it so urgent?",
        "channel": "Where is the data being sent?",
    }
    all_aspects = ["sender", "link", "request", "urgency", "channel"]
    suggestions = [aspect_questions[a] for a in all_aspects if a in clues and a not in revealed][:3]
    if not suggestions:
        suggestions = ["How should I report this?", "Which red flag is the decisive one?"]

    return {"reply": "\n\n".join(lines), "revealed": revealed, "suggestions": suggestions}


# --------------------------------------------------------------------------- #
# Hints (progressive)
# --------------------------------------------------------------------------- #
def hint(mission: dict, step_id: str | None, level: int) -> str:
    step = None
    for s in mission.get("steps", []):
        if s["id"] == step_id:
            step = s
            break
    if step is None and mission.get("steps"):
        step = mission["steps"][0]

    if level <= 1:
        base = step.get("clue") if step else "Slow down and look for red flags."
        return f"💡 {base}"
    if level == 2:
        flags = mission.get("scenario", "")
        return (
            "💡 Focus on the strongest indicator: look for a mismatched sender/domain, an external "
            "destination, or manufactured urgency. Only one option truly avoids risk."
        )
    # Level 3 - near answer without giving letter.
    if step:
        correct = next((c for c in step.get("choices", []) if c.get("correct")), None)
        if correct:
            return f"💡 The safe action is to: {correct['text'].lower()}."
    return "💡 The safest action is always: verify independently, do not share anything, and report."


# --------------------------------------------------------------------------- #
# Decision evaluation
# --------------------------------------------------------------------------- #
def evaluate(mission: dict, step: dict, choice: dict) -> dict:
    correct = bool(choice.get("correct"))
    policy = (mission.get("policyRefs") or ["Information Security Policy"])[0]
    if correct:
        explanation = (
            f"{choice.get('feedback', 'Correct.')} You avoided the unsafe action and followed the control "
            f"that protects the bank and its clients."
        )
        real = "In real life: verify via a trusted channel, never share credentials/data, and report the attempt."
    else:
        risk = choice.get("risk", "medium")
        consequence = {
            "high": "This could lead directly to account compromise, data leakage or financial loss.",
            "medium": "This weakens the control and could allow the incident to spread.",
            "low": "This is not ideal, but the risk is limited.",
        }[risk]
        explanation = f"{choice.get('feedback', 'Risky decision.')} {consequence}"
        real = "In real life: stop, do not act on the request, and escalate to the correct team immediately."
    return {
        "correct": correct,
        "risk": choice.get("risk", "low"),
        "feedback": choice.get("feedback", ""),
        "explanation": explanation,
        "policyPrinciple": f"Applies: {policy}.",
        "realWorldAction": real,
    }


# --------------------------------------------------------------------------- #
# Learning report
# --------------------------------------------------------------------------- #
def learning_report(mission: dict, decisions: list[dict], hints_used: int, duration: int) -> dict:
    total = len(decisions) or 1
    correct = sum(1 for d in decisions if d.get("correct"))
    high_risk_mistakes = sum(1 for d in decisions if not d.get("correct") and d.get("risk") == "high")

    base = (correct / total) * 80
    base -= high_risk_mistakes * 12
    base -= min(hints_used, 5) * 2
    if duration and duration < 90 and correct == total:
        base += 8  # decisive and correct
    score = int(max(5, min(100, round(base))))

    grade = (
        "Risk Champion" if score >= 85 else
        "Solid Awareness" if score >= 70 else
        "Developing" if score >= 50 else
        "Needs Practice"
    )

    strengths: list[str] = []
    improvements: list[str] = []
    if correct == total:
        strengths.append("You made the safe decision at every step.")
    elif correct:
        strengths.append(f"You handled {correct} of {total} decision points correctly.")
    if high_risk_mistakes == 0:
        strengths.append("You avoided every high-risk action (no credential sharing or data leakage).")
    if hints_used == 0:
        strengths.append("You solved the mission without hints.")

    if high_risk_mistakes:
        improvements.append("You took a high-risk action — never share credentials/data or act on urgency.")
    if correct < total:
        improvements.append("Re-check red flags (sender/domain, external destinations) before deciding.")
    if hints_used > 2:
        improvements.append("Try to identify indicators independently before asking for hints.")
    if not improvements:
        improvements.append("Maintain this standard and try an Expert-level mission next.")
    if not strengths:
        strengths.append("You completed the mission and engaged with the scenario.")

    return {
        "score": score,
        "grade": grade,
        "headline": f"Risk Awareness Score: {score}/100 — {grade}",
        "strengths": strengths,
        "improvements": improvements,
        "recommendedTopics": mission.get("policyRefs", [])[:2] or ["Phishing awareness", "Data classification"],
    }


# --------------------------------------------------------------------------- #
# Digital Colleague — Q&A over documents
# --------------------------------------------------------------------------- #
def answer_question(question: str, chunks: list[tuple]) -> dict:
    if not chunks:
        return {
            "answer": (
                "I couldn't find that in the currently loaded documents. Try uploading the relevant "
                "guide (e.g. onboarding, release notes, architecture) and ask again."
            ),
            "sources": [],
            "confidence": "low",
        }

    top_chunk, top_score = chunks[0]
    sentences = _relevant_sentences(question, [c for c, _ in chunks[:2]], limit=5)
    body = " ".join(sentences)
    answer = f"Based on the team documentation:\n\n{body}"

    sources = []
    seen = set()
    for chunk, _ in chunks:
        if chunk.document_id in seen:
            continue
        seen.add(chunk.document_id)
        snippet = chunk.text.strip().replace("\n", " ")
        sources.append({
            "title": chunk.title,
            "snippet": (snippet[:180] + "…") if len(snippet) > 180 else snippet,
            "documentId": chunk.document_id,
        })

    confidence = "high" if top_score > 2.5 else "medium" if top_score > 1.0 else "low"
    return {"answer": answer, "sources": sources, "confidence": confidence}


def _relevant_sentences(question: str, chunks: list, limit: int = 5) -> list[str]:
    q_terms = set(re.findall(r"[a-zA-Z0-9]+", question.lower()))
    scored: list[tuple[float, str]] = []
    for chunk in chunks:
        for sentence in re.split(r"(?<=[.!?])\s+|\n[-*]\s*", chunk.text):
            s = sentence.strip(" -*\t")
            if len(s) < 15:
                continue
            terms = set(re.findall(r"[a-zA-Z0-9]+", s.lower()))
            overlap = len(q_terms & terms)
            if overlap:
                scored.append((overlap + len(s) / 500.0, s))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        # Fall back to the opening of the best chunk.
        return [chunks[0].text.strip().split("\n")[0][:240]] if chunks else []
    out, seen = [], set()
    for _, s in scored:
        key = s[:40].lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s if s.endswith((".", "!", "?")) else s + ".")
        if len(out) >= limit:
            break
    return out


# --------------------------------------------------------------------------- #
# Onboarding plan
# --------------------------------------------------------------------------- #
_ONBOARDING_TEMPLATE = [
    ("Understand the big picture", [
        "Read the application/project overview and business purpose",
        "Learn what problem the system solves and who the users are",
    ], ["Onboarding Guide", "Architecture Summary"]),
    ("Learn the architecture", [
        "Study the high-level architecture and main data flow",
        "Identify the key services, databases and integrations",
    ], ["Architecture Summary"]),
    ("Set up access and environment", [
        "Request the required accesses and tooling",
        "Get your local/dev environment running end to end",
    ], ["Onboarding Guide", "Support & Incident Guide"]),
    ("Follow a request end-to-end", [
        "Trace one transaction/request through the system",
        "Understand the ETL / processing flow and validation rules",
    ], ["Architecture Summary"]),
    ("Learn how it runs in production", [
        "Read the deployment process and release controls",
        "Review common incidents and how they were resolved",
    ], ["Production Deployment Checklist", "Support & Incident Guide"]),
    ("Shadow the team", [
        "Shadow the support/on-call process",
        "Attend stand-up and a change-approval discussion",
    ], ["Support & Incident Guide"]),
    ("Deliver something small", [
        "Pick up a small, well-scoped starter ticket",
        "Raise a change following the checklist and get it reviewed",
    ], ["Production Deployment Checklist", "Release Notes - Q1 2026"]),
]


def onboarding_plan(role: str, project: str, days: int) -> dict:
    days = max(1, min(days, len(_ONBOARDING_TEMPLATE)))
    plan = []
    for i in range(days):
        title, tasks, resources = _ONBOARDING_TEMPLATE[i]
        plan.append({"day": i + 1, "title": title, "tasks": tasks, "resources": resources})
    return {
        "role": role,
        "project": project,
        "plan": plan,
        "keyContacts": [
            "Tech Lead (architecture & design questions)",
            "Release Manager (deployments & approvals)",
            "Support Lead (incidents & production issues)",
        ],
        "glossary": [
            {"term": "UAT", "meaning": "User Acceptance Testing sign-off before release"},
            {"term": "ETL", "meaning": "Extract, Transform, Load — the core data flow"},
            {"term": "RTB/CTB", "meaning": "Run vs Change the Bank workstreams"},
        ],
    }


# --------------------------------------------------------------------------- #
# Expert finder
# --------------------------------------------------------------------------- #
def find_expert(query: str, experts: list[dict]) -> list[dict]:
    q_terms = set(re.findall(r"[a-zA-Z0-9]+", query.lower()))
    ranked: list[tuple[float, dict]] = []
    for person in experts:
        haystack = " ".join(person.get("topics", []) + [person.get("role", "")] + person.get("owns", []))
        terms = set(re.findall(r"[a-zA-Z0-9]+", haystack.lower()))
        overlap = q_terms & terms
        if overlap:
            reason_topic = next((t for t in person.get("topics", []) if any(w in t.lower() for w in overlap)), None)
            reason = (
                f"Owns/authored material on {reason_topic}"
                if reason_topic
                else f"Matches on: {', '.join(list(overlap)[:3])}"
            )
            ranked.append((len(overlap), {
                "name": person["name"],
                "role": person["role"],
                "reason": reason,
                "topics": person.get("topics", []),
                "contact": person.get("contact", ""),
            }))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in ranked[:3]]


# --------------------------------------------------------------------------- #
# Document summarizer
# --------------------------------------------------------------------------- #
def summarize_document(title: str, text: str) -> dict:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    key_points = [l.lstrip("-*# ").strip() for l in lines if l.startswith(("-", "*")) or re.match(r"^\d+\.", l)]
    key_points = [k for k in key_points if len(k) > 8][:6]
    if not key_points:
        key_points = [l for l in lines if len(l) > 30][:5]

    decisions = [l for l in lines if re.search(r"\b(decided|approved|agreed|selected|chosen)\b", l, re.I)][:4]
    actions = [l for l in lines if re.search(r"\b(action|todo|must|need to|to do|owner:)\b", l, re.I)][:4]
    risks = [l for l in lines if re.search(r"\b(risk|issue|concern|blocker|caution|warning)\b", l, re.I)][:4]

    people = sorted(set(re.findall(r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b", text)))[:6]

    first_para = ""
    for l in lines:
        if not l.startswith("#") and len(l) > 40:
            first_para = l
            break
    summary = first_para or (key_points[0] if key_points else f"Summary of {title}.")

    return {
        "title": title,
        "summary": summary,
        "keyPoints": key_points or ["No explicit bullet points detected."],
        "decisions": decisions or ["No explicit decisions found."],
        "actionItems": actions or ["No explicit action items found."],
        "risks": risks or ["No explicit risks found."],
        "peopleMentioned": people or ["None detected."],
    }

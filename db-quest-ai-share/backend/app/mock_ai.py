from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "data"


def _load_json(name: str) -> Any:
    with (DATA_DIR / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _keyword_map(value: str) -> str:
    text = value.lower()
    if any(token in text for token in ["phish", "mfa", "token", "password", "email"]):
        return "phishing"
    if any(token in text for token in ["leak", "data", "export", "gmail", "client"]):
        return "data_leak"
    if any(token in text for token in ["vendor", "bank", "change", "payment", "bec"]):
        return "vendor"
    if any(token in text for token in ["ai", "chatbot", "public", "code", "client data"]):
        return "ai_misuse"
    if any(token in text for token in ["caller", "verify", "account", "details"]):
        return "client_data"
    return "phishing"


def generate_mission(topic: str, audience: str, difficulty: str) -> dict[str, Any]:
    archetype = _keyword_map(topic)
    templates = {
        "phishing": {
            "title": "Phishing at 5 PM",
            "topic": "Cybersecurity",
            "points": 180,
            "minutes": 12,
            "summary": "A fake IT-support message asks for an MFA token under pressure.",
            "briefing": "The request appears urgent and comes from a familiar-looking channel.",
            "scenario": "A colleague receives an email that looks like a legitimate IT support request. The email asks for an MFA token to restore access before a meeting.",
            "objectives": ["Spot the social engineering cues", "Protect account credentials", "Escalate appropriately"],
            "learningPoints": ["Verify requests through official channels", "Do not share MFA tokens", "Report suspicious requests quickly"],
            "policyRefs": ["Password and MFA handling", "Phishing response policy"],
            "clues": {"sender": {"finding": "The sender domain is slightly altered", "meaning": "The message is impersonating IT support"}, "urgency": {"finding": "The message pressures you to act before a meeting", "meaning": "The urgency is a manipulation tactic"}, "request": {"finding": "The request asks for an MFA token", "meaning": "That is exactly what attackers want"}},
        },
        "data_leak": {
            "title": "Confidential File Leak",
            "topic": "Data Privacy",
            "points": 220,
            "minutes": 16,
            "summary": "A colleague wants a client export emailed to personal Gmail.",
            "briefing": "The request initially feels harmless but involves regulated client data.",
            "scenario": "A teammate asks whether a large client export can be emailed to a personal Gmail account for a quick review outside the approved environment.",
            "objectives": ["Identify a data handling breach", "Use approved channels", "Protect client confidentiality"],
            "learningPoints": ["Client data must stay in approved systems", "Personal email is not a secure channel", "Ask for an approved secure transfer path"],
            "policyRefs": ["Data handling standards", "Client confidentiality policy"],
            "clues": {"channel": {"finding": "The destination is a personal Gmail account", "meaning": "This bypasses approved secure transfer routes"}, "request": {"finding": "The request is to email a full export", "meaning": "The volume and sensitivity exceed the safe threshold"}, "urgency": {"finding": "The request says it is urgent for a client call", "meaning": "Pressure is being used to bypass process"}},
        },
        "vendor": {
            "title": "Suspicious Vendor Request",
            "topic": "Operational Risk",
            "points": 260,
            "minutes": 18,
            "summary": "A vendor asks for a bank detail change via email.",
            "briefing": "The request looks routine but could signal business email compromise.",
            "scenario": "A vendor contact requests a bank detail change and attaches a new invoice to avoid an account freeze.",
            "objectives": ["Detect a potential BEC attempt", "Verify through known channels", "Safeguard payment processes"],
            "learningPoints": ["Payments must be verified through independent channels", "Unexpected banking changes are high risk", "Escalate to finance controls"],
            "policyRefs": ["Payment change controls", "Third-party risk policy"],
            "clues": {"sender": {"finding": "The sender address uses a new domain", "meaning": "It may be impersonation"}, "link": {"finding": "The invoice link points to a payment portal not on the approved vendor list", "meaning": "The change could be a spoof"}, "request": {"finding": "The message asks to change bank account details", "meaning": "This is a classic payment diversion pattern"}},
        },
        "ai_misuse": {
            "title": "AI Tool Misuse",
            "topic": "Responsible AI",
            "points": 320,
            "minutes": 20,
            "summary": "A teammate pastes client data and code into a public chatbot.",
            "briefing": "The behavior seems efficient but breaches responsible AI use boundaries.",
            "scenario": "A developer wants to debug quickly so they paste a client dataset and sample code into a public AI tool.",
            "objectives": ["Recognize responsible AI misuse", "Protect sensitive client data", "Use approved tools"],
            "learningPoints": ["Do not share regulated or client data with public AI tools", "Use approved internal AI tooling", "Assess risk before use"],
            "policyRefs": ["Responsible AI use policy", "Data protection standards"],
            "clues": {"request": {"finding": "The request is to paste client data into a public chatbot", "meaning": "That is a clear data leakage risk"}, "channel": {"finding": "The tool is public and not approved", "meaning": "It lacks the governance controls we require"}, "urgency": {"finding": "The deadline is tight and the person wants a quick answer", "meaning": "Speed is being prioritized over controls"}},
        },
        "client_data": {
            "title": "Client Data Handling",
            "topic": "Data Privacy",
            "points": 240,
            "minutes": 17,
            "summary": "A caller requests account details without completing identity verification.",
            "briefing": "The call seems urgent and the caller is pushing for immediate access.",
            "scenario": "Someone calls claiming to be a client and asks for account details before verifying identity.",
            "objectives": ["Follow verification protocols", "Protect customer data", "Escalate if verification fails"],
            "learningPoints": ["Never disclose sensitive account details without verification", "Use the secure verification process", "Escalate suspicious requests"],
            "policyRefs": ["Customer verification policy", "Privacy handling procedures"],
            "clues": {"sender": {"finding": "The caller claims to be a client but does not pass verification", "meaning": "The identity cannot be trusted yet"}, "request": {"finding": "The caller asks for account details", "meaning": "That is sensitive and should not be disclosed"}, "urgency": {"finding": "The caller demands immediate help", "meaning": "The pressure is a common tactic"}},
        },
    }

    template = templates[archetype]
    steps = []
    for step_index, step_id in enumerate(["s1", "s2", "s3"], start=1):
        prompt = f"Step {step_index}: Review the scenario and decide the safest action."
        clue = f"{list(template['clues'].keys())[step_index - 1]} clue available"
        correct_choice_id = f"{step_id}_correct"
        choices = [
            {"id": correct_choice_id, "text": "Escalate, verify, and protect the data", "correct": True, "risk": "low", "feedback": "That is the safe response."},
            {"id": f"{step_id}_alt1", "text": "Proceed with the request to be helpful", "correct": False, "risk": "high", "feedback": "That exposes the business to risk."},
            {"id": f"{step_id}_alt2", "text": "Ask a quick follow-up but share details anyway", "correct": False, "risk": "medium", "feedback": "That still bypasses the control."},
        ]
        steps.append({"id": step_id, "prompt": prompt, "clue": clue, "choices": choices})

    return {
        "id": f"mission-{len(_load_json('missions.json')) + 1}",
        "title": template["title"],
        "topic": template["topic"],
        "difficulty": difficulty,
        "points": template["points"] + (10 if difficulty == "Intermediate" else 0) + (20 if difficulty == "Expert" else 0),
        "estimatedMinutes": template["minutes"] + (3 if difficulty == "Intermediate" else 0) + (5 if difficulty == "Expert" else 0),
        "summary": template["summary"],
        "briefing": template["briefing"],
        "scenario": template["scenario"],
        "objectives": template["objectives"],
        "steps": steps,
        "learningPoints": template["learningPoints"],
        "policyRefs": template["policyRefs"],
        "clues": template["clues"],
        "generated": True,
    }


def game_master(mission: dict[str, Any], history: list[dict[str, str]], message: str) -> dict[str, Any]:
    text = message.lower()
    revealed: list[str] = []
    suggestions: list[str] = []

    if any(token in text for token in ["token", "password", "share", "send", "data", "credential"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The request is asking for privileged access — that is a serious warning sign.")
        suggestions = ["How should I report this?", "Who really sent this?", "What are they asking me to do?"]
    elif any(token in text for token in ["report", "escalate", "contact"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The safest move is to escalate through the approved process.")
        suggestions = ["Who really sent this?", "Where does the link actually go?", "Why is it so urgent?"]
    elif any(token in text for token in ["who", "sender", "from", "address", "domain", "email"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The sender identity does not line up with the trusted contact — verify before acting.")
        suggestions = ["Where does the link actually go?", "What are they asking me to do?", "Why is it so urgent?"]
    elif any(token in text for token in ["link", "url", "site", "where"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The destination link is not on the approved domain list.")
        suggestions = ["What are they asking me to do?", "Where is the data being sent?", "Why is it so urgent?"]
    elif any(token in text for token in ["request", "attach", "document", "want", "ask"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The request is to change or disclose something sensitive.")
        suggestions = ["Who really sent this?", "Where is the data being sent?", "Why is it so urgent?"]
    elif any(token in text for token in ["urgent", "deadline", "pressure", "time"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The urgency is being used to create pressure and bypass control.")
        suggestions = ["Who really sent this?", "Where does the link actually go?", "How should I report it?"]
    elif any(token in text for token in ["channel", "gmail", "external", "recipient", "sent to"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) The channel is not approved for sharing regulated information.")
        suggestions = ["How should I report this?", "What are they asking me to do?", "Who really sent this?"]
    elif any(token in text for token in ["help", "hint", "ignore", "delete"]):
        revealed.append("![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) Ignore the request and use the approved reporting path.")
        suggestions = ["How should I report this?", "Which red flag is the decisive one?"]
    else:
        clue = mission.get("clues", {}).get("sender") or mission.get("clues", {}).get("request") or mission.get("clues", {}).get("channel") or mission.get("clues", {}).get("urgency")
        if clue:
            revealed.append(f"![🔎](https://fonts.gstatic.com/s/e/notoemoji/17.0/1f50e/72.png) {clue['finding']} — {clue['meaning']}")
        suggestions = ["How should I report this?", "Which red flag is the decisive one?"]

    reply = "I am guiding you through the scenario. Ask a question or use one of the suggested prompts."
    if revealed:
        reply = "The evidence points to a risky request. " + revealed[0]

    return {"reply": reply, "revealed": revealed, "suggestions": suggestions}


def hint(mission: dict[str, Any], step_id: str, level: int) -> dict[str, Any]:
    step = next((item for item in mission.get("steps", []) if item["id"] == step_id), None)
    if not step:
        return {"hint": "The current step is unavailable.", "level": level}
    if level == 1:
        hint_text = step.get("clue", "Look for the strongest signal.")
    elif level == 2:
        hint_text = "Focus on the strongest indicator in the scenario and choose the safest action."
    else:
        hint_text = "Paraphrase the correct action as a verification and escalation step."
    return {"hint": hint_text, "level": level}


def evaluate(mission: dict[str, Any], step: dict[str, Any], choice: dict[str, Any]) -> dict[str, Any]:
    correct = bool(choice.get("correct"))
    risk = choice.get("risk", "low")
    feedback = choice.get("feedback", "Review the situation carefully.")
    explanation = "Choose the verification and escalation path that protects the business and the client."
    if correct:
        explanation = "The correct response is to pause, verify, and escalate through approved controls."
    policy_principle = mission.get("policyRefs", ["Safeguarding policy"])[0]
    real_world_action = "Escalate to the relevant control owner and use approved secure channels."
    return {
        "correct": correct,
        "risk": risk,
        "feedback": feedback,
        "explanation": explanation,
        "policyPrinciple": policy_principle,
        "realWorldAction": real_world_action,
    }


def learning_report(mission: dict[str, Any], decisions: list[dict[str, Any]], hints_used: int, duration: int) -> dict[str, Any]:
    correct_ratio = sum(1 for decision in decisions if decision.get("correct")) / max(1, len(decisions))
    high_risk_mistakes = sum(1 for decision in decisions if decision.get("risk") == "high" and not decision.get("correct"))
    score = int(correct_ratio * 80 - high_risk_mistakes * 12 - min(hints_used, 5) * 2 + 8)
    score = max(0, min(100, score))
    if score >= 85:
        grade = "Risk Champion"
    elif score >= 70:
        grade = "Solid Awareness"
    elif score >= 50:
        grade = "Developing"
    else:
        grade = "Needs Practice"
    strengths = ["You noticed the key risk indicators", "You stayed focused on safe handling"] if correct_ratio >= 0.5 else ["You engaged with the scenario thoughtfully"]
    improvements = ["Double-check the approval path", "Avoid acting under pressure"] if high_risk_mistakes else ["Consider the policy implications in each step"]
    recommended_topics = [mission.get("topic", "Compliance"), "Data handling", "Escalation"]
    return {
        "score": score,
        "grade": grade,
        "headline": "Your private learning report is ready",
        "strengths": strengths,
        "improvements": improvements,
        "recommendedTopics": recommended_topics,
    }


def answer_question(question: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    if not chunks:
        return {"answer": "I could not find a reliable answer in the available documents.", "sources": [], "confidence": "low"}
    query_terms = re.findall(r"[a-zA-Z]{3,}", question.lower())
    scored: list[tuple[float, dict[str, Any]]] = []
    for chunk in chunks:
        text = chunk.get("text", "")
        match_count = sum(1 for term in query_terms if term in text.lower())
        score = match_count + (0.2 if any(term in text.lower() for term in query_terms) else 0)
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    top = scored[0][1] if scored else chunks[0]
    sources = []
    seen = set()
    for chunk in scored[:3]:
        source = chunk[1].get("documentId", "unknown")
        if source not in seen:
            seen.add(source)
            title = chunk[1].get("title") or str(source)
            sources.append({"title": title, "snippet": chunk[1].get("text", "")[:220], "documentId": str(source)})
    confidence = "high" if scored and scored[0][0] >= 2 else "medium"
    return {"answer": top.get("text", "")[:600], "sources": sources, "confidence": confidence}


def onboarding_plan(role: str, project: str, days: int) -> dict[str, Any]:
    plan = []
    for day in range(1, min(days, 7) + 1):
        plan.append({
            "day": day,
            "title": f"Focus area {day}",
            "tasks": ["Review the core guide", "Discuss handoffs", "Prepare a status update"],
            "resources": ["Onboarding guide", "Architecture summary", "Support guide"],
        })
    key_contacts = [
        {"name": "Ava Chen", "role": "Platform Lead", "contact": "ava.chen@dbquest.local"},
        {"name": "Ravi Shah", "role": "Release Manager", "contact": "ravi.shah@dbquest.local"},
    ]
    glossary = [
        {"term": "MFA", "meaning": "Multi-factor authentication"},
        {"term": "SLA", "meaning": "Service level agreement"},
    ]
    return {"role": role, "project": project, "plan": plan, "keyContacts": key_contacts, "glossary": glossary}


def find_expert(query: str, experts: list[dict[str, Any]]) -> dict[str, Any]:
    query_terms = set(re.findall(r"[a-zA-Z]{3,}", query.lower()))
    ranked = []
    for expert in experts:
        topics = expert.get("topics", [])
        text = " ".join([expert.get("role", ""), expert.get("owns", ""), *topics]).lower()
        overlap = sum(1 for term in query_terms if term in text)
        if overlap or query.lower() in text:
            ranked.append((overlap, expert))
    ranked.sort(key=lambda item: item[0], reverse=True)
    matches = []
    for _, expert in ranked[:4]:
        matches.append({
            "name": expert.get("name"),
            "role": expert.get("role"),
            "reason": f"Matches {', '.join(expert.get('topics', [])[:2])}",
            "topics": expert.get("topics", []),
            "contact": expert.get("contact"),
        })
    return {"query": query, "matches": matches, "note": "Contacts are matched by ownership and topic relevance, not a performance ranking."}


def summarize_document(title: str, text: str) -> dict[str, Any]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    key_points = [line for line in lines if line.startswith("- ")][:6]
    decisions = [line for line in lines if "decided" in line.lower() or "approved" in line.lower()][:4]
    action_items = [line for line in lines if "action" in line.lower() or "todo" in line.lower() or "must" in line.lower()][:4]
    risks = [line for line in lines if "risk" in line.lower() or "issue" in line.lower()][:4]
    people = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", text)
    return {
        "title": title,
        "summary": f"Summary of {title} generated from the supplied content.",
        "keyPoints": [item[2:] for item in key_points] if key_points else ["The document contains core operational guidance."],
        "decisions": decisions or ["No explicit decision was captured."],
        "actionItems": action_items or ["Review the document with the team."],
        "risks": risks or ["No explicit risk was identified."],
        "peopleMentioned": list(dict.fromkeys(people)),
    }

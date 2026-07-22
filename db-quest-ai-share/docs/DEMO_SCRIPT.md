# Demo Script — DB Quest AI

A tight **5-minute** hackathon walkthrough. Everything works offline in demo mode.

---

## 0. Setup (before you present)
- Backend running on `http://localhost:8000`, frontend on `http://localhost:5173`.
- Open the app at the **Dashboard**. Sidebar footer shows the AI mode (Demo or Live).

---

## 1. The hook (30s)
> "In a large bank, knowledge isn't missing — it's **fragmented**. And mandatory training is **passive** —
> people click through without truly learning. We built **DB Quest AI**: an AI **Digital Colleague** that
> answers questions and onboards people, *and* turns policies into interactive **escape-room missions**.
> It's not just built with AI — AI is **inside** the product."

Point to the Dashboard's "How AI is embedded" panel.

---

## 2. Digital Colleague — grounded Q&A (60s)
Go to **Ask Colleague** and click the example: **"What is the process for production deployment?"**
- Highlight the **answer** and the **cited sources** ("Production Deployment Checklist", "Release Notes").
- Ask a second one: **"What changed recently in this project?"** → shows it reads the release notes.

> "Every answer is grounded in the team's own documents and shows its sources — that's what makes it
> trustworthy in a bank."

---

## 3. Onboarding + Acronyms + Experts (60s)
- **Onboarding Buddy** → keep defaults → **Generate** → show the day-by-day plan, key contacts, glossary.
- **Acronym Explainer** → click **UBR** and **IRT** → instant, context-aware definitions.
- **Expert Finder** → search **"deployment pipeline"** → returns the Release Manager with the *reason*
  ("owns the deployment checklist"). Note the disclaimer: contacts by ownership, **not** rankings.

> "New joiners get productive in minutes instead of interrupting senior staff."

---

## 4. Escape-Room Mission — learning by doing (90s)
Go to **Missions** → open **"Phishing at 5 PM"** → **Begin mission**.
- **Left panel:** make a *wrong* choice first (e.g. "Share the token") → show the AI's **per-decision
  explanation**: why it's risky, the policy principle, and the real-world action. Then choose correctly.
- **Right panel (AI Game Master):** type **"check the sender's domain"** → it reveals a clue adaptively.
  Click **Hint** → progressive hints that guide without giving the answer.
- Finish the mission → show the **personalised learning report**: private score, strengths, improvement
  areas, and key learning points.

> "The AI adapts to the player — hints get stronger, feedback is tailored, and the score stays **private**."

---

## 5. The wow — Generate a mission live (45s)
Go to **Generate Mission** → type **"Using confidential data in external AI tools"** → **Generate**.
- A brand-new, fully playable mission appears (steps, choices, learning points).
- Click **Play this mission** to prove it's real.

> "Training teams don't hand-write every scenario. An admin types a topic and AI builds the mission
> instantly — any new policy becomes interactive the same day."

---

## 6. Close (15s)
> "DB Quest AI makes the bank **faster to onboard, safer, and more engaged** — a smarter, future-ready bank.
> It runs today with zero setup, and plugs into OpenAI, Azure OpenAI or Gemini for production."

---

## Backup talking points
- **Robustness:** live LLM calls fall back to deterministic generators — the demo can't crash.
- **Security:** mission answer keys never reach the browser; evaluation is server-side.
- **Extensible:** TF-IDF retrieval swaps cleanly for FAISS/Chroma; providers are pluggable.

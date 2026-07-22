"""Generate the DB Quest AI pitch PDF.

Usage:  python generate_pitch_pdf.py
Produces: ../DB_Quest_AI_Pitch.pdf
Requires: fpdf2  (pip install fpdf2)
"""
from __future__ import annotations

import os

from fpdf import FPDF

# --- Palette ---------------------------------------------------------------
NAVY = (12, 28, 94)
BLUE = (47, 75, 219)
LIGHT = (238, 242, 255)
DARK = (24, 30, 52)
GREY = (95, 105, 128)
GREEN = (16, 122, 87)
AMBER = (180, 120, 20)

PAGE_W = 210
MARGIN = 18
CONTENT_W = PAGE_W - 2 * MARGIN


class Pitch(FPDF):
    def footer(self) -> None:
        self.set_y(-13)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(160, 165, 180)
        self.cell(
            0,
            10,
            f"DB Quest AI   |   FutureReady / Global Hackathon 2026   |   Page {self.page_no()}",
            align="C",
        )

    # Route the core-font names used throughout the script to an embedded
    # Unicode TTF (when available) so every character encodes correctly.
    _uni = False

    def set_font(self, family="", style="", size=0):  # type: ignore[override]
        if self._uni and (not family or family.lower() in ("helvetica", "arial")):
            family = "Uni"
        super().set_font(family, style, size)

    # -- building blocks ----------------------------------------------------
    def section(self, title: str) -> None:
        if self.get_y() > 250:
            self.add_page()
        self.ln(3)
        self.set_fill_color(*NAVY)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 12.5)
        self.cell(0, 8.5, f"  {title}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(2.5)
        self.set_text_color(*DARK)

    def para(self, text: str, size: float = 10.3) -> None:
        self.set_font("Helvetica", "", size)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5.4, text)
        self.ln(1.2)

    def bullet(self, text: str) -> None:
        self.set_fill_color(*BLUE)
        self.rect(self.l_margin + 1, self.get_y() + 1.9, 1.9, 1.9, "F")
        self.set_x(self.l_margin + 6)
        self.set_font("Helvetica", "", 10.2)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W - 6, 5.3, text)
        self.ln(0.6)

    def feature(self, name: str, desc: str) -> None:
        if self.get_y() > 258:
            self.add_page()
        self.set_fill_color(*BLUE)
        self.rect(self.l_margin + 1, self.get_y() + 1.9, 1.9, 1.9, "F")
        self.set_x(self.l_margin + 6)
        self.set_font("Helvetica", "B", 10.4)
        self.set_text_color(*NAVY)
        self.multi_cell(CONTENT_W - 6, 5.3, name)
        self.set_x(self.l_margin + 6)
        self.set_font("Helvetica", "", 9.8)
        self.set_text_color(*GREY)
        self.multi_cell(CONTENT_W - 6, 4.9, desc)
        self.ln(1.8)

    def sell(self, num: int, title: str, desc: str) -> None:
        if self.get_y() > 252:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(*NAVY)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 11)
        self.rect(self.l_margin, y, 8, 8, "F")
        self.text(self.l_margin + 2.4 if num < 10 else self.l_margin + 1.4, y + 5.7, str(num))
        self.set_x(self.l_margin + 12)
        self.set_font("Helvetica", "B", 10.8)
        self.set_text_color(*NAVY)
        self.multi_cell(CONTENT_W - 12, 5.4, title)
        self.set_x(self.l_margin + 12)
        self.set_font("Helvetica", "", 9.9)
        self.set_text_color(*DARK)
        self.multi_cell(CONTENT_W - 12, 5.0, desc)
        self.ln(2.2)

    def callout(self, text: str) -> None:
        self.ln(1)
        y = self.get_y()
        self.set_font("Helvetica", "I", 10.5)
        lines = self.multi_cell(CONTENT_W - 10, 5.4, text, dry_run=True, output="LINES")
        h = len(lines) * 5.4 + 6
        self.set_fill_color(*LIGHT)
        self.rect(self.l_margin, y, CONTENT_W, h, "F")
        self.set_fill_color(*BLUE)
        self.rect(self.l_margin, y, 2.2, h, "F")
        self.set_xy(self.l_margin + 6, y + 3)
        self.set_text_color(*NAVY)
        self.set_font("Helvetica", "I", 10.5)
        self.multi_cell(CONTENT_W - 10, 5.4, text)
        self.set_y(y + h)
        self.ln(2)


def build() -> str:
    pdf = Pitch(orientation="P", unit="mm", format="A4")

    # Embed a Unicode TTF (Arial on Windows) for proper text encoding. Falls
    # back silently to the built-in latin-1 core font if the TTFs are absent.
    fonts_dir = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
    styles = {"": "arial.ttf", "B": "arialbd.ttf", "I": "ariali.ttf", "BI": "arialbi.ttf"}
    if os.path.exists(os.path.join(fonts_dir, styles[""])):
        for style, fname in styles.items():
            fpath = os.path.join(fonts_dir, fname)
            if os.path.exists(fpath):
                pdf.add_font("Uni", style, fpath)
        pdf._uni = True

    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(MARGIN, 16, MARGIN)

    # ----------------------------------------------------------- COVER
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, PAGE_W, 105, "F")
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 105, PAGE_W, 3, "F")

    pdf.set_xy(0, 30)
    pdf.set_text_color(150, 170, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "DEUTSCHE BANK  -  FUTUREREADY / GLOBAL HACKATHON 2026", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 40)
    pdf.cell(0, 18, "DB Quest AI", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 15)
    pdf.set_text_color(200, 210, 255)
    pdf.cell(0, 8, "AI Digital Colleague  +  Escape Missions", align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 12)
    pdf.set_text_color(230, 235, 255)
    pdf.cell(0, 7, '"Learn faster. Work smarter. Stay compliant."', align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.set_y(120)
    pdf.set_text_color(*DARK)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "The one-line pitch", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.para(
        "DB Quest AI is an AI-powered web application that makes a bank's people faster to onboard, "
        "safer, and more engaged. It combines an AI Digital Colleague that answers project and process "
        "questions with cited sources, with an AI Escape-Room that turns policies into interactive, "
        "adaptive learning missions. The key differentiator: AI is not only used to build the app - "
        "AI is embedded inside the product.",
        size=11,
    )

    pdf.ln(2)
    # three quick stats / highlights
    box_w = (CONTENT_W - 8) / 3
    highlights = [
        ("2-in-1", "Knowledge assistant + interactive compliance training"),
        ("0 setup", "Runs fully offline in demo mode; pluggable live LLM"),
        ("8 AI", "AI features embedded across the product"),
    ]
    y0 = pdf.get_y()
    for i, (big, small) in enumerate(highlights):
        x = pdf.l_margin + i * (box_w + 4)
        pdf.set_fill_color(*LIGHT)
        pdf.rect(x, y0, box_w, 26, "F")
        pdf.set_xy(x, y0 + 3.5)
        pdf.set_text_color(*BLUE)
        pdf.set_font("Helvetica", "B", 17)
        pdf.cell(box_w, 9, big, align="C")
        pdf.set_xy(x + 2, y0 + 13)
        pdf.set_text_color(*GREY)
        pdf.set_font("Helvetica", "", 8.3)
        pdf.multi_cell(box_w - 4, 3.8, small, align="C")
    pdf.set_y(y0 + 30)

    # ----------------------------------------------------------- PROBLEM
    pdf.add_page()
    pdf.section("The Problem")
    pdf.para(
        "Large banks run on knowledge and controls - yet both quietly leak value every day:"
    )
    pdf.feature(
        "1. Knowledge exists, but it is fragmented",
        "It is scattered across SharePoint, Confluence, Teams, email, tickets and code. New joiners and "
        "engineers lose hours asking 'Who owns this? Where is the doc? What changed?' - and interrupt "
        "senior staff to find out.",
    )
    pdf.feature(
        "2. Mandatory training is passive",
        "Cybersecurity, data privacy, phishing and AI-usage training is delivered as PDFs and slides. "
        "People click through without truly learning, so they know policies in theory but may not apply "
        "them under real pressure.",
    )
    pdf.callout(
        "In a bank, one wrong decision can cause data leakage, a security incident, a regulatory issue, "
        "reputational damage or operational loss. The knowledge and the rules exist - the gap is fast "
        "access and real understanding."
    )

    # ----------------------------------------------------------- SOLUTION
    pdf.section("The Solution - one product, two pillars")
    pdf.feature(
        "Pillar 1 - AI Digital Colleague",
        "An AI knowledge assistant that answers questions about your project, process and systems with "
        "cited sources; onboards new joiners with a day-by-day plan; explains bank acronyms; finds the "
        "right expert by document ownership; and summarises documents into decisions, risks and actions.",
    )
    pdf.feature(
        "Pillar 2 - AI Escape Missions",
        "Compliance training reimagined as an interactive escape room. An AI Game Master narrates "
        "adaptively, gives progressive hints, explains every decision, and produces a private, "
        "personalised risk-awareness report. Admins can generate a brand-new mission from any topic instantly.",
    )

    # ----------------------------------------------------------- FEATURES
    pdf.section("Key Features")
    features = [
        ("Ask Digital Colleague", "Retrieval-grounded Q&A over team documents, with cited sources and a confidence signal."),
        ("AI Onboarding Buddy", "Generates a structured, role- and project-specific day-by-day onboarding plan."),
        ("AI Acronym Explainer", "Decodes bank acronyms (UBR, SFT, IRT, UAT...) with plain-language meaning and context."),
        ("AI Expert Finder", "Suggests contacts by document ownership and topic match - explicitly not a performance ranking."),
        ("Document Summariser", "Extracts key points, decisions, action items, risks and people mentioned."),
        ("Escape-Room Missions", "Adaptive Game Master, progressive hints, and per-decision policy explanations."),
        ("AI Mission Generator", "Turns any policy or risk topic into a fully playable mission in seconds."),
        ("Personalised Learning Report", "A private risk-awareness score with strengths and improvement areas."),
    ]
    for name, desc in features:
        pdf.feature(name, desc)

    # ----------------------------------------------------------- AI EMBEDDED
    pdf.section("Where AI is embedded (the differentiator)")
    pdf.para("AI is used in two ways - and the second is what wins:")
    pdf.bullet("To build it: Copilot and LLMs helped generate the UI, backend APIs, prompts and sample data.")
    pdf.bullet("Inside the product: it answers questions from documents, summarises them, generates onboarding "
               "plans, creates and narrates adaptive missions, adapts hints and feedback to each player, and "
               "produces personalised learning summaries.")
    pdf.callout(
        "We are not building just another chatbot. We are building an AI colleague that answers, onboards, "
        "finds knowledge - and turns important policies into interactive learning missions."
    )

    # ----------------------------------------------------------- DEMO FLOW
    pdf.section("Live Demo Flow (5 minutes)")
    steps = [
        "Ask the Digital Colleague 'What is the production deployment process?' - see a source-cited answer.",
        "Generate an onboarding plan, decode an acronym (UBR), and find an expert for 'deployment pipeline'.",
        "Play 'Phishing at 5 PM': make a wrong choice, see the AI explanation, then investigate with the Game Master and hints.",
        "Finish the mission and reveal the private, personalised learning report.",
        "Admin types 'Using confidential data in external AI tools' and AI generates a new playable mission live.",
    ]
    for i, s in enumerate(steps, 1):
        pdf.bullet(f"Step {i}: {s}")

    # ----------------------------------------------------------- SELLING POINTS
    pdf.add_page()
    pdf.section("Selling Points - Why We Win")
    selling = [
        ("AI inside the product, not just in the build",
         "Every core action is AI-powered - answering, summarising, onboarding, mission generation, adaptive "
         "coaching and scoring. This directly matches the theme of applying AI in practice."),
        ("Solves two real problems in one product",
         "Knowledge discovery and engaging compliance training - a broader impact and a stronger story than a "
         "single-purpose tool."),
        ("It never fails on stage",
         "The app runs fully offline with deterministic AI generators and zero API keys, and upgrades to "
         "OpenAI, Azure OpenAI or Gemini with one setting. Live calls fall back automatically if they fail."),
        ("Enterprise-ready and responsible by design",
         "Answers are grounded in documents and cite sources; mission scores are private with only aggregated "
         "team insights shared; the expert finder avoids performance judgements; mission answer keys are never "
         "sent to the browser (server-side evaluation)."),
        ("Genuinely engaging and adaptive",
         "The Game Master reacts to what the player inspects, hints get progressively stronger, and feedback is "
         "tailored - turning passive training into active learning people remember."),
        ("Instant content at zero marginal cost",
         "Training teams stop hand-writing every scenario: any new policy becomes an interactive mission the "
         "same day an admin types the topic."),
        ("Clean, extensible architecture",
         "Routers depend only on an AI service that swaps live LLM and mock transparently; the TF-IDF retriever "
         "can be replaced by FAISS/Chroma without touching the app. Easy to productionise."),
    ]
    for i, (t, d) in enumerate(selling, 1):
        pdf.sell(i, t, d)

    # ----------------------------------------------------------- BUSINESS IMPACT
    pdf.section("Business Impact")
    impacts = [
        "Faster onboarding and time-to-productivity for new joiners.",
        "Reduced dependency on senior staff for routine knowledge questions.",
        "Stronger, measurable risk and cybersecurity awareness across teams.",
        "Higher training engagement and better real-world policy adoption.",
        "Faster incident and issue resolution through instant knowledge access.",
        "Better knowledge retention as project memory is captured and reusable.",
    ]
    for s in impacts:
        pdf.bullet(s)

    # ----------------------------------------------------------- FIT + STACK
    pdf.section("Why It Fits the Deutsche Bank Theme")
    pdf.para(
        "The theme is about applying AI in practice to improve operations and shape the bank of tomorrow. "
        "DB Quest AI converts static knowledge and training into intelligent, adaptive experiences - "
        "improving risk awareness, employee learning, cybersecurity readiness, policy adoption and "
        "day-to-day efficiency."
    )
    pdf.section("Technology")
    pdf.bullet("Frontend: React 18, Vite, Tailwind CSS, React Router.")
    pdf.bullet("Backend: Python, FastAPI, Pydantic v2, httpx.")
    pdf.bullet("AI: OpenAI / Azure OpenAI / Google Gemini - or a built-in deterministic mock for offline demos.")
    pdf.bullet("Retrieval: dependency-free TF-IDF chunk search (swappable for a vector database).")
    pdf.bullet("Storage: JSON seed data plus an in-memory document store.")

    pdf.ln(3)
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.4)
    pdf.line(pdf.l_margin, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*NAVY)
    pdf.multi_cell(0, 5.6,
                   "DB Quest AI - a smarter, safer, more future-ready bank. Runs today with zero setup; "
                   "ready for production with a single configuration change.")

    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "DB_Quest_AI_Pitch.pdf")
    pdf.output(out)
    return out


if __name__ == "__main__":
    path = build()
    print(f"PDF written to: {path}")

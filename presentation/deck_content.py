# -*- coding: utf-8 -*-
"""Shared content for the Documind AI presentation (condensed 4-slide
version for a 2-3 minute talk), consumed by both build_pptx.py and
build_pdf.py so the two outputs never drift apart.
"""

ACCENT = "10B981"       # emerald
ACCENT_DARK = "047857"
BG = "0B0D0F"            # near-black
SURFACE = "14171B"
BORDER = "23262B"
TEXT = "ECEFF3"
MUTED = "9AA3B8"
BLUE = "3B82F6"
AMBER = "F59E0B"
PURPLE = "A78BFA"
PINK = "EC4899"

TITLE = "Documind AI"
SUBTITLE = "Enterprise AI Platform for Chatting, Editing, and Collaborating on PDF Documents"
TEAM = [
    "Muhammad Abdullah",
    "Raja Ali Haider",
    "Muhammad Saad",
    "Sathyaa Narayan",
]
UNIVERSITY = "Superior University"
DEPARTMENT = "Department of Computer Science"
SUPERVISOR = "Supervisor: Alen Rafugodinov"
DATE = "2026"
LIVE_URL = "https://documindai.online"
REPO_URL = "https://github.com/Abdullah001butt/rag-pdf-chatbot"

# --- Slide 2: Problem + Solution + Stack --------------------------------
PROBLEM_POINTS = [
    "Long PDFs take hours to read, cross-reference, and act on manually.",
    "Summarizing, editing, e-signing, and quizzing each need separate, disconnected apps.",
    "No shared, live workspace for teams to actually collaborate on a document together.",
    "Generic AI chat gives answers with no way to verify they're grounded in the source.",
]

SOLUTION_POINTS = [
    "One platform to chat, summarize, quiz, edit, sign, redact, and collaborate on any PDF.",
    "Every AI answer is cited and clickable — jump straight to the exact source page.",
    "Live team workspaces, an AI agent, automations, and a public developer API.",
]

TECH_STACK = [
    "React 19 + TypeScript",
    "FastAPI + WebSockets",
    "Google Gemini + LangChain",
    "FAISS Vector Search",
    "PostgreSQL",
    "Stripe Billing",
    "Docker on Render + Vercel",
]

# --- Slide 3: Features ---------------------------------------------------
CORE_FEATURES = [
    ("Chat, Summaries & Quizzes", "Ask questions with citations, generate study notes, quizzes, flashcards."),
    ("PDF Editor Suite", "Click-to-edit text, e-signatures, form filling, OCR, AI rewriting, PII redaction."),
    ("AI Agent & Automations", "Plans and executes multi-step goals; trigger-based workflows on upload."),
    ("Team Workspaces", "Shared documents, team chat, and live collaborative cursors."),
]

STANDOUT_FEATURES = [
    ("AI Audio Overview", "Two-host podcast-style discussion of any document, spoken aloud."),
    ("Knowledge Graph", "Auto-extracted entities & relationships as an interactive graph."),
    ("Live Collaborative Cursors", "Real-time WebSocket presence on shared documents."),
    ("Click-to-Locate Citations", "Click a citation to jump to and highlight the exact source page."),
]

# --- Slide 4: Architecture + Demo + Thank you ----------------------------
ARCHITECTURE_LAYERS = [
    ("Client", "React SPA (Vercel)", ACCENT),
    ("API", "FastAPI REST + WebSocket (Render, Docker)", BLUE),
    ("Data", "PostgreSQL + in-memory vector store", PURPLE),
    ("AI", "Google Gemini + FAISS", PINK),
]

CLOSING_LINKS = [
    ("Live Application", LIVE_URL),
    ("Source Code", REPO_URL),
]

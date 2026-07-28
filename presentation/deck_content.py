# -*- coding: utf-8 -*-
"""Shared content for the Documind AI presentation, consumed by both the
.pptx builder (build_pptx.py) and the .pdf builder (build_pdf.py) so the
two outputs never drift apart.
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
AUTHOR = "Abdullah"
UNIVERSITY = "Your University Name"
DEPARTMENT = "Department of Computer Science"
SUPERVISOR = "Supervisor: Dr. [Supervisor Name]"
DATE = "2026"
LIVE_URL = "https://documindai.online"
REPO_URL = "https://github.com/Abdullah001butt/rag-pdf-chatbot"

AGENDA = [
    "Problem Statement",
    "Solution Overview",
    "Technology Stack",
    "System Architecture",
    "Core Features",
    "Standout Innovations",
    "Security, Privacy & Billing",
    "Challenges & Key Learnings",
    "Live Demo",
]

PROBLEM_POINTS = [
    ("Information overload", "Long PDFs (contracts, papers, reports) take hours to read and cross-reference manually."),
    ("Scattered tooling", "Summarizing, editing, e-signing, and quizzing on a document each require separate, disconnected apps."),
    ("No real collaboration", "Teams email PDFs back and forth with no shared, live workspace to discuss them together."),
    ("Trust gap in AI answers", "Generic AI chatbots give answers with no way to verify they're actually grounded in the source."),
]

SOLUTION_POINTS = [
    "One platform to chat, summarize, quiz, edit, sign, redact, and collaborate on any PDF.",
    "Every AI answer is grounded with citations you can click to jump straight to the source page.",
    "Built-in team workspaces with live collaboration, not just file sharing.",
    "A public API so the same AI capabilities can be scripted and integrated elsewhere.",
]

TECH_STACK = [
    ("Frontend", "React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion"),
    ("Backend", "FastAPI (Python), SQLAlchemy, WebSockets"),
    ("AI / ML", "Google Gemini (gemini-3.5-flash), LangChain, FAISS vector search, gemini-embedding-2"),
    ("Database", "PostgreSQL"),
    ("Billing", "Stripe subscriptions"),
    ("Email", "Resend (transactional email)"),
    ("PDF Engine", "pdf-lib, pdfjs-dist (client-side rendering & editing)"),
    ("Deployment", "Render (backend, Docker) + Vercel (frontend)"),
]

ARCHITECTURE_LAYERS = [
    ("Client", "React SPA — Dashboard, Landing Page, Auth", ACCENT),
    ("API Layer", "FastAPI REST + WebSocket endpoints, JWT auth", BLUE),
    ("Service Layer", "RAG pipeline, billing, usage quotas, automations", AMBER),
    ("Data Layer", "PostgreSQL (users, billing, workspaces) + in-memory per-user document store", PURPLE),
    ("External", "Google Gemini API, Stripe, Resend", PINK),
]

CORE_FEATURES = [
    ("Chat with Citations", "Ask questions across multiple PDFs with clickable, page-accurate citations."),
    ("Summaries & Study Notes", "One-click structured summaries and exam-ready study notes."),
    ("Quiz & Flashcards", "Auto-generated multiple-choice quizzes and flashcards from any document."),
    ("Document Compare", "Side-by-side AI comparison of two documents' similarities and differences."),
    ("Research Assistant", "Decomposes a topic into sub-questions and synthesizes a cited research report."),
    ("PDF Editor Suite", "Click-to-edit text, e-signatures, form filling, OCR, AI rewriting, PII auto-redaction."),
    ("Batch Processing", "Run one action across many documents at once."),
    ("AI Agent", "Describe a goal in plain English; the agent plans and executes multi-step tasks."),
    ("Automations", "Trigger-based rules that auto-run AI actions whenever a matching file is uploaded."),
]

STANDOUT_FEATURES = [
    ("AI Audio Overview", "Generates a natural two-host podcast-style conversation discussing the document, played back with distinct AI voices — comparable to NotebookLM's audio overviews."),
    ("Knowledge Graph", "Extracts key entities and relationships from a document and renders an interactive, color-coded, force-directed graph — built with a custom physics simulation, no charting library."),
    ("Live Collaborative Cursors", "Real-time WebSocket presence in Team Workspaces — see teammates' cursors move live on a shared PDF, Google-Docs style."),
    ("Click-to-Locate Citations", "Every chat citation is clickable — jumps the PDF viewer straight to the cited page and flashes a highlight."),
    ("Public API", "Pro users generate personal access keys and call chat, summarization, and generation endpoints from their own code."),
]

SECURITY_POINTS = [
    ("Privacy-first storage", "Uploaded documents live in memory for your session only — never written to disk unless you explicitly save a version or share to a workspace."),
    ("Secure authentication", "Bcrypt password hashing, JWT access + refresh tokens, email verification, rate-limited password reset."),
    ("Encrypted in transit", "HTTPS everywhere, browser-only Gemini API key storage — never sent to Documind's own servers unless required for generation."),
    ("Stripe-managed billing", "Card details are handled entirely by Stripe; Documind never stores payment information."),
    ("Tiered usage quotas", "Free tier: 15 actions/day, 2 documents. Pro tier ($4.99/mo): unlimited actions, Team Workspaces, Public API."),
]

CHALLENGES = [
    ("Mid-project model deprecation", "Google deprecated gemini-2.5-flash and gemini-embedding-001 for new API keys mid-development. Required auditing every AI call site and migrating to gemini-3.5-flash / gemini-embedding-2 without breaking existing sessions."),
    ("Real-time collaboration", "Building live cursor presence required introducing WebSockets into a purely REST API, with in-memory per-workspace room management and JWT auth over a WebSocket handshake."),
    ("Privacy vs. collaboration", "The core design promise was 'documents are never stored' — Team Workspaces and Version History required carefully scoping persistent storage as an explicit, disclosed opt-in exception rather than breaking that promise silently."),
    ("Full internationalization", "Supporting English, French, Arabic, and Russian — including right-to-left layout for Arabic — across every panel in the app, not just the landing page."),
]

CLOSING_LINKS = [
    ("Live Application", LIVE_URL),
    ("Source Code", REPO_URL),
]

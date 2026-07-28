<p align="center">
  <img src="assets/logo.png" alt="Documind AI" height="90" />
</p>

<h1 align="center">Documind AI</h1>
<p align="center"><b>Enterprise Intelligence Systems</b> — Chat, edit, sign, collaborate, and automate work across PDF documents, powered by Google Gemini and Retrieval-Augmented Generation (RAG).</p>

<p align="center">
  <b><a href="https://documindai.online">🌐 Live at documindai.online</a></b>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.139-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini_3.5-Google_AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img alt="FAISS" src="https://img.shields.io/badge/FAISS-Vector_Search-00A98F?style=for-the-badge" />
  <img alt="WebSockets" src="https://img.shields.io/badge/WebSockets-Live_Collaboration-4B32C3?style=for-the-badge" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Deployed-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## Overview

**Documind AI** is a multi-tenant SaaS platform built on Retrieval-Augmented Generation (RAG) that turns PDF documents into an interactive, queryable, editable, and collaborative workspace. Users sign up, upload PDFs — including scanned/image-based documents — and chat with them, generate study material, edit and e-sign them, run AI agents against them, or bring a whole team into a shared workspace to work on them together.

The product ships as a **React 19 + TypeScript single-page app** talking to a **FastAPI backend** over REST and WebSocket, with real **Stripe billing** for Free/Pro subscription tiers, JWT auth with refresh tokens, transactional email via Resend, a **public developer API**, and full **internationalization** (English, French, Arabic, Russian — including right-to-left layout). A marketing landing page (Framer Motion) fronts the product. An earlier **Streamlit prototype** (`app.py`) is kept in the repo as a working reference/fallback but is no longer the primary interface.

**This is a live, deployed product** — not just a local demo. The frontend runs on Vercel behind a custom domain, the backend runs in a Docker container on Render with a managed Postgres database, and Stripe/Resend/Gemini are all wired to real production credentials.

Built as a university final-year project to demonstrate practical application of LLMs, embeddings, vector search, retrieval-augmented generation, real-time systems (WebSockets), and full-stack SaaS architecture (auth, persistence, tiered billing, payments, transactional email, a public API, and deployment) in a production-style system.

## 🎓 Presentation

A full project presentation is included in [`presentation/`](presentation/), available as both PowerPoint and PDF:

- [`Documind_AI_Presentation.pptx`](presentation/Documind_AI_Presentation.pptx)
- [`Documind_AI_Presentation.pdf`](presentation/Documind_AI_Presentation.pdf)

Covers the problem statement, architecture, full feature set, the four standout/innovative features, security & privacy design, and engineering challenges faced — ready for a live demo walkthrough. Regenerate either file after content changes with:

```bash
cd presentation
python build_pptx.py   # -> Documind_AI_Presentation.pptx
python build_pdf.py    # -> Documind_AI_Presentation.pdf
```

## ✨ Standout Features

These four are the platform's most distinctive capabilities — the ones that go beyond a typical "chat with your PDF" tool:

| Feature | Description |
|---|---|
| 🎙️ **AI Audio Overview** | Generates a natural two-host podcast-style conversation discussing a document, played back with two distinct AI voices via the Web Speech API — comparable to NotebookLM's audio overviews, with zero paid TTS infrastructure |
| 🕸️ **Knowledge Graph** | Extracts key entities and relationships from a document via Gemini and renders an interactive, color-coded, force-directed graph — built with a custom physics simulation in plain SVG, no charting library |
| 👥 **Live Collaborative Cursors** | Real-time WebSocket presence inside Team Workspaces — see teammates' cursors move live on a shared PDF, Google-Docs style, with a live presence avatar strip |
| 🎯 **Click-to-Locate Citations** | Every chat citation is a clickable button that opens a split PDF preview, jumps to the cited page, and flashes a highlight ring — instant visual proof an answer is grounded in the source |

## Features

### Core AI / RAG

| Feature | Description |
|---|---|
| 💬 **AI Chat with PDFs** | Ask natural-language questions answered strictly from document content, with clickable citations |
| 📚 **Multi-PDF Knowledge Base** | Upload and query multiple documents together in a single session |
| 🧠 **Multi-Turn Memory** | Follow-up questions ("what about page 3?") resolve using recent conversation context |
| ⚠️ **Not-in-Document Detection** | Answers not grounded in the uploaded PDFs are visually flagged instead of hallucinated |
| 🖼️ **OCR for Scanned PDFs** | Pages with no extractable text are rendered as images and read via Gemini Vision |
| 📝 **Smart Summaries & Study Notes** | One-click structured summaries and exam-ready study notes with headings and bolded key terms |
| ❓ **Quiz & Flashcard Generator** *(Pro)* | Auto-generated multiple-choice quizzes with scoring/explanations, and flip-card flashcards |
| 🔀 **Document Comparison** *(Pro)* | Structured similarities/differences report between any two uploaded documents |
| 🔎 **Research Assistant** *(Pro)* | Decomposes a topic into sub-questions, retrieves grounded evidence for each, and synthesizes a cited research brief |
| ⬇️ **Professional Exports** | Download summaries, notes, quizzes, flashcards, comparisons, and reports as clean `.md`/`.csv` files |

### PDF Editor Suite

| Feature | Description |
|---|---|
| ✏️ **Click-to-Edit Text** | Edit existing PDF text directly, in place, with font size/weight/color controls |
| ✍️ **E-Signatures** | Draw or type a signature, place and resize it anywhere, baked into the exported PDF |
| 📝 **Form Filling** | Fill existing fillable PDF forms, or click to design new fillable fields on any flat PDF |
| 🔍 **AI PII Auto-Redact** | Scan a page for emails, phone numbers, SSNs, and card numbers, and redact them in one click |
| ✨ **AI Rewriting** | Select any text and fix grammar or shift tone (formal/casual) instantly |
| 🕒 **Version History** | Save named snapshots of an edited document, restore or download any prior version |
| ⚡ **Batch Processing** | Run one action across many documents at once |

### Automation & Agents

| Feature | Description |
|---|---|
| 🤖 **AI Agent** | Describe a goal in plain English; the agent plans a multi-step task list and executes it automatically |
| 🔁 **Document Workflows** | n8n-style trigger rules — automatically run summary/notes/quiz/flashcards whenever a matching filename is uploaded, with email delivery of results |

### Team Collaboration

| Feature | Description |
|---|---|
| 👥 **Team Workspaces** *(Pro)* | Shared, securely persisted documents for a team, invite-by-username membership |
| 💬 **Workspace Team Chat** | Ask questions across all of a workspace's shared documents, with citations, visible to every member |
| 🖱️ **Live Collaborative Cursors** | Real-time presence — see who else is viewing a shared document and where their cursor is, live |
| ⚡ **AI Actions on Shared Docs** | Run summary/notes/quiz/flashcards directly on any workspace document |

### Developer & Insights

| Feature | Description |
|---|---|
| 🔑 **Public API** *(Pro)* | Personal access keys (`X-Api-Key`) for scripting document upload, chat, and generation from your own code — `/v1/*` |
| 📊 **Usage Analytics** | Dashboard charts (7/30/90-day) of daily activity and usage-by-feature breakdown, backed by the existing usage-quota ledger |
| 🕸️ **Knowledge Graph & 🎙️ Audio Overview** | See [Standout Features](#-standout-features) above |

### SaaS Platform

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication with Refresh Tokens** | Short-lived (30 min) access tokens with rotating, revocable refresh tokens (30 day) — auto-refreshed transparently by the frontend |
| ✉️ **Email Verification & Password Reset** | Real transactional email via Resend on a verified custom domain, with single-use, expiring tokens |
| 👤 **Account Settings** | Change password, change email, manage API keys, delete account — all self-service |
| 💾 **Persistent Chat History** | Conversations are saved per-user in the database and reloaded automatically on login |
| 🏷️ **Tiered Plans (Free / Pro)** | Free: 2 PDFs, 15 actions/day, core chat + summaries + notes. Pro ($4.99/mo): unlimited usage, Workspaces, Public API, and every advanced feature |
| 📊 **Usage Metering** | Every AI action is logged per-user and rate-limited daily on the Free tier |
| 💳 **Real Stripe Billing** | Live Stripe Checkout for upgrades, a signature-verified webhook as the source of truth, and a self-service Billing Portal |
| 🚦 **Rate Limiting** | Sliding-window limits on auth endpoints to blunt brute-force attempts |
| 🌍 **Full Internationalization** | English, French, Arabic (RTL), and Russian across every panel — landing page and dashboard alike |
| 🎨 **Enterprise Dashboard UI** | Material Symbols iconography, color-coded feature groups, Framer Motion transitions, toast notifications, skeleton loaders |
| 🖥️ **Marketing Landing Page** | Animated (Framer Motion) hero, product preview, pricing, comparison, and FAQ sections ahead of the app |

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) with hand-built shadcn-style UI primitives
- [Framer Motion](https://www.framer.com/motion/) for animation throughout the landing page and dashboard
- [React Router](https://reactrouter.com/) for client-side routing
- [Axios](https://axios-http.com/) with an interceptor-driven auto-refresh flow for expired access tokens
- [pdf-lib](https://pdf-lib.js.org/) + [pdfjs-dist](https://mozilla.github.io/pdf.js/) for all client-side PDF rendering, editing, and signature placement
- Native [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for Audio Overview playback — no paid TTS service
- Native [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) for live collaborative cursors
- Custom flat-key i18n system (`translations.ts`) covering 4 languages including RTL

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) (REST + WebSocket)
- [SQLAlchemy](https://www.sqlalchemy.org/) ORM — SQLite for local dev, Postgres in production (toggled via `DATABASE_URL`)
- [python-jose](https://github.com/mpdavis/python-jose) for JWT auth, [bcrypt](https://pypi.org/project/bcrypt/) for password hashing
- [Stripe Python SDK](https://github.com/stripe/stripe-python) for Checkout, webhooks, and the Billing Portal
- [Resend](https://resend.com/) for transactional email (verification, password reset, automation results)

**AI / RAG**
- [Google Gemini](https://ai.google.dev/) (`gemini-3.5-flash` for generation/vision OCR, `gemini-embedding-2` for embeddings) via [LangChain](https://www.langchain.com/)
- [FAISS](https://github.com/facebookresearch/faiss) for similarity search over document chunks — both per-user and per-workspace vector stores
- [PyPDF2](https://pypdf2.readthedocs.io/) for text extraction, [PyMuPDF](https://pymupdf.readthedocs.io/) for page rasterization (OCR fallback)

**Infrastructure**
- **Docker** — backend containerized, builds from repo root
- **Deployed live**: [Vercel](https://vercel.com/) (frontend, custom domain) + [Render](https://render.com/) (backend + managed Postgres, Docker)
- [Render Blueprint](render.yaml) for reproducible one-click infra provisioning

**Legacy prototype**
- [Streamlit](https://streamlit.io/) (`app.py`) — the original single-file version of the product, still functional, sharing the same `rag_core.py`/`db.py`/`auth.py`/`billing.py` modules as the FastAPI backend

## Architecture

```
┌───────────────────────┐     HTTPS / WebSocket (JWT)    ┌────────────────────────────┐
│    React Frontend        │ ─────────────────────────────► │    FastAPI Backend            │
│    (Vercel, custom          │ ◄───────────────────────────── │    (Render, Docker,              │
│    domain, i18n, Framer       │        JWT + refresh token        │    JWT auth, rate limits,           │
│    Motion, WebSocket client)   │                                    │    WebSocket presence rooms)          │
└───────────────────────┘                                        └────────────┬───────────────┘
                                                                                 │
                    ┌────────────────────────────┬────────────────────────────┼─────────────────────────┐
                    ▼                            ▼                            ▼                          ▼
       ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐   ┌──────────────────┐
       │  billing.py — tiers,    │     │  Stripe Checkout /       │     │  Resend — email,           │   │  Public API (/v1)  │
       │  usage metering, feature │     │  Webhook / Billing Portal │     │  automation results             │   │  X-Api-Key auth      │
       │  locking (Free vs Pro)   │     │  → users.tier updates      │     └──────────────────────┘   └──────────────────┘
       └──────────────────────┘     └──────────────────────┘
                    │
                    ▼
                  ┌─────────────────┐   has text?   chunks + metadata (source, page)
  PDF Upload ───► │  Text Extraction  │ ──────────►
                  │  (PyPDF2)          │
                  └────────┬─────────┘
                           │ no text (scanned page)
                           ▼
                  ┌─────────────────┐
                  │  PyMuPDF render    │──► page image ──► Gemini Vision OCR ──► extracted text
                  └─────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Text Chunking     │  (RecursiveCharacterTextSplitter)
                  └────────┬─────────┘
                           ▼
                  ┌─────────────────┐
                  │ Gemini Embeddings   │──► FAISS Vector Store
                  │ (gemini-embedding-2)│     (per-user AND per-workspace, cached by file signature)
                  └────────┬─────────┘
                           ▼
        ┌─────────────────────────────────────────────┐
        │  Retrieval (similarity_search)                  │
        │  + Prompted Gemini 3.5 Flash                      │
        └───────────────────┬───────────────────────────┘
                             ▼
  Chat / Summaries / Notes / Quiz / Flashcards / Compare / Research /
  Knowledge Graph / Audio Overview / Agent Plans / Workflows
                             ▼
              Cited answers, exports, and generated graphs/audio
                             │
                             ▼
     Postgres: users, chat_messages, usage_events, refresh_tokens,
     action_tokens, document_versions, automation_rules/runs,
     workspaces, workspace_members, workspace_documents,
     workspace_chat_messages, api_keys
```

## Project Structure

```
rag-pdf-chatbot/
├── backend/                    # FastAPI application
│   ├── main.py                  # App entrypoint, CORS, logging middleware, router registration
│   ├── config.py                 # Env var loading, production safety checks (JWT secret)
│   ├── security.py                # JWT + refresh/action/API-key token creation and hashing
│   ├── deps.py                     # Auth/DB dependencies, per-user Gemini key header, public-API-key auth
│   ├── rate_limit.py                # Sliding-window rate limiter for auth endpoints
│   ├── logging_config.py             # Structured logging setup
│   ├── email_service.py               # Resend wrapper (verification, password reset, automation results)
│   ├── schemas.py                       # Pydantic request/response models
│   ├── store.py                          # In-memory per-user AND per-workspace vector-store cache
│   ├── rag_pipeline.py                    # Glue between rag_core.py and the in-memory/workspace stores
│   ├── automation_engine.py                # Document Workflows execution engine
│   ├── stripe_service.py                     # Stripe Checkout/Portal session creation
│   ├── usage_guard.py                          # Usage/feature-lock enforcement helpers
│   ├── Dockerfile                                # Builds from repo root (see below)
│   └── routers/
│       ├── auth.py                          # signup/login/refresh/logout, verify-email,
│       │                                     #   forgot/reset-password, change-password/email, delete account
│       ├── billing.py                        # /billing/* (checkout, webhook, verify, portal)
│       ├── documents.py                        # /documents/upload, list, clear, OCR
│       ├── chat.py                              # /chat/ask, /chat/history
│       ├── generate.py                           # /generate/* (summary, notes, quiz, knowledge-graph, audio-overview, ...)
│       ├── versions.py                            # /versions/* (Document Version History)
│       ├── automations.py                          # /automations/* (Document Workflows)
│       ├── workspaces.py                            # /workspaces/* (Team Workspaces, members, shared docs, chat)
│       ├── workspace_ws.py                           # /ws/workspaces/{id} (live collaborative cursor presence)
│       ├── api_keys.py                                # /api-keys/* (Public API key management)
│       ├── public_api.py                               # /v1/* (Public API — upload, chat, generate)
│       └── analytics.py                                 # /analytics/summary (usage dashboard)
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── pages/                # LandingPage, AuthPage, ForgotPassword/ResetPassword/VerifyEmail,
│       │                          #   AccountSettings, Dashboard, Privacy/Terms
│       ├── components/            # ChatPanel, QuizPanel, PdfEditorPanel, WorkspacesPanel,
│       │                          #   AnalyticsPanel, KnowledgeGraphPanel, AudioOverviewPanel, ...
│       ├── components/landing/     # Hero, Pricing, Faq, ProductPreview, TeamAndApi, etc.
│       ├── components/ui/           # Hand-built shadcn-style Button/Card/Input/Badge/Icon/Skeleton
│       ├── context/                  # AuthContext, LanguageContext, ToastContext
│       ├── i18n/translations.ts       # EN/FR/AR/RU flat-key translation dictionaries
│       └── lib/                        # api.ts (axios client + auto-refresh interceptor), export.ts
├── presentation/                # Project presentation (this session's deliverable)
│   ├── deck_content.py           # Shared slide content consumed by both builders
│   ├── build_pptx.py              # Generates Documind_AI_Presentation.pptx
│   ├── build_pdf.py                # Generates Documind_AI_Presentation.pdf
│   ├── Documind_AI_Presentation.pptx
│   └── Documind_AI_Presentation.pdf
├── app.py                      # Legacy Streamlit prototype (still functional)
├── rag_core.py                  # Shared, framework-agnostic RAG pipeline (used by both app.py and backend/)
├── db.py                         # SQLAlchemy models — users, workspaces, automations, versions, API keys, etc.
├── auth.py                        # Signup/login logic, bcrypt hashing, validation
├── billing.py                      # Tier limits, usage metering, feature locking
├── render.yaml                      # Render Blueprint: web service + Postgres, one-click deploy
├── docker-compose.yml                # Local backend + Postgres stack for testing the Postgres path
├── requirements.txt                   # Python dependencies (Streamlit + FastAPI + Stripe + Resend)
├── .env.example                        # Backend env var template
├── assets/                               # Logo & marketing assets
├── documind.db                            # SQLite database (created at runtime, gitignored)
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google AI Studio API key](https://ai.google.dev/) (free tier available)
- A [Stripe](https://dashboard.stripe.com/register) account (test mode keys are free)
- A [Resend](https://resend.com/) account (free tier; sandbox mode works without a domain, see [Deployment](#deployment) for real delivery)

### 1. Backend setup

```bash
git clone <repository-url>
cd rag-pdf-chatbot

python -m venv myenv
myenv\Scripts\activate        # Windows
# source myenv/bin/activate   # macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# edit .env: set JWT_SECRET_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY
```

Run the API:

```bash
cd backend
python -m uvicorn main:app --port 8000 --reload
```

The backend serves at `http://localhost:8000`; the SQLite database and its tables are created automatically on first run.

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # sets VITE_API_URL=http://localhost:8000
npm run dev
```

The app opens at `http://localhost:5173` — landing page at `/`, sign in at `/login`, dashboard at `/dashboard`, account settings at `/account`.

### 3. (Optional) Stripe webhook forwarding for local dev

```bash
stripe listen --forward-to localhost:8000/billing/webhook
```

Copy the printed `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the backend.

### Running the legacy Streamlit prototype instead

```bash
streamlit run app.py
```

Opens at `http://localhost:8501`. Shares the same database and business logic as the FastAPI backend but is a single-page, non-SaaS interface (no Stripe billing, no separate frontend, no email flows).

## Usage

1. **Sign up** on the landing page or `/login`, or **log in** if you already have an account. A verification email is sent automatically.
2. **Enter your Google API key** in the sidebar (stored only in your browser, sent as a request header).
3. **Upload PDFs** — supports both text-based and scanned/image-based documents. Free tier: up to 2 at a time.
4. **Overview tab** — a personalized dashboard home with usage stats and quick-launch tiles to every feature.
5. **Chat tab** — ask questions; answers come back with clickable citations that jump the PDF preview to the exact page.
6. **Summaries / Study Notes / Knowledge Graph / Audio Overview** — pick a document and generate the corresponding artifact.
7. **Quiz / Flashcards / Compare / Research** — Pro-only; Free tier users see an upgrade prompt.
8. **Editor / Form Filler / Batch** — edit PDF text, e-sign, fill forms, redact PII, or process many files at once.
9. **Agent / Automations** — describe a goal for the AI Agent to plan and run, or set up trigger-based Document Workflows.
10. **Workspaces** *(Pro)* — create a team workspace, invite members by username, share documents, chat together, and see live collaborative cursors.
11. **Account Settings → API Keys** *(Pro)* — generate a personal access key to call the [Public API](#public-api) from your own code.
12. **Upgrade to Pro** — redirects to real Stripe Checkout; on success, the tier updates immediately (and is reconfirmed by the webhook).
13. **Export** — every generated artifact can be downloaded directly from the UI (`.md`/`.csv`).

## Public API

Pro users can generate personal access keys under **Account Settings → API Keys** and call the platform programmatically:

```bash
curl https://documindai.online/v1/chat/ask \
  -H "X-Api-Key: dk_••••••••••••" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the termination clause?"}'
```

Available endpoints: `POST /v1/documents/upload`, `GET /v1/documents`, `POST /v1/chat/ask`, `POST /v1/generate/summary`, `POST /v1/generate/notes`, `POST /v1/generate/quiz`, `POST /v1/generate/flashcards` — all sharing the same usage-quota pool as the dashboard.

## Key Design Decisions

- **Grounded answers over hallucination** — the system prompt instructs the model to explicitly say when an answer isn't supported by the uploaded documents, and the UI visually distinguishes these responses.
- **Vision-based OCR fallback** — rather than requiring a separate OCR engine (e.g. Tesseract) installed on the host machine, scanned pages are rasterized with PyMuPDF and read directly by Gemini's multimodal vision capability.
- **Shared core logic, two front ends** — `rag_core.py`, `db.py`, `auth.py`, and `billing.py` are framework-agnostic and imported by both the FastAPI backend and the legacy Streamlit app, so the RAG pipeline and business rules never drift between the two.
- **Signature-based caching** — the FAISS index and extracted page text are cached (per-user and per-workspace, in-memory on the backend) keyed by `(filename, filesize)`, so repeated questions against the same document set skip redundant re-embedding.
- **Citation-first retrieval** — every chunk stored in FAISS carries `source` and `page` metadata, allowing every answer to be traced back to its exact origin — and clicked to jump straight there.
- **Privacy by default, persistence by explicit opt-in** — uploaded documents live in memory for a session only and are never written to disk by default. Document Versions and Team Workspace documents are the two deliberate, disclosed exceptions, since a "save this version" or "share with my team" action inherently requires durable storage.
- **Tier gating at the feature level, not just usage level** — Quiz, Flashcards, Compare, Research, Team Workspaces, and the Public API are locked entirely behind the Pro tier, matching a typical SaaS "core vs. premium" split.
- **Real payments, not a simulated upgrade** — Stripe Checkout + webhook is the actual source of truth for tier changes; the frontend's post-redirect `/billing/verify` call is a UX convenience, not the authority.
- **No paid TTS/graph-library dependency for standout features** — Audio Overview uses the browser's native Web Speech API, and Knowledge Graph uses a from-scratch force-directed layout in SVG, keeping both features free to run and dependency-light.
- **In-memory WebSocket presence, not a message broker** — live collaborative cursors are broadcast via a process-local room registry; documented as needing a shared broker (e.g. Redis pub/sub) only if the backend ever scales to multiple instances.
- **Rotating refresh tokens over long-lived access tokens** — access tokens expire in 30 minutes; refresh tokens are opaque (not JWTs), hashed at rest, single-use (rotated on every refresh), and revocable server-side on logout or password reset.
- **Generic responses on password reset requests** — `/auth/forgot-password` always returns the same message regardless of whether the email exists, preventing user enumeration.
- **Real email delivery, verified in production** — Resend is configured against a verified custom domain (`documindai.online`) with DKIM/SPF/DMARC records, confirmed to deliver to arbitrary recipients, not just a sandboxed test address.

## Deployment

The backend is containerized and **actually deployed** — this isn't a hypothetical setup, it's the live configuration:

- **Frontend** → [Vercel](https://vercel.com/), custom domain (`documindai.online`), SPA rewrites configured via `frontend/vercel.json`
- **Backend** → [Render](https://render.com/), Docker web service (REST + WebSocket), defined via [`render.yaml`](render.yaml) Blueprint
- **Database** → Render-managed Postgres, wired to the backend via `DATABASE_URL`
- **Email** → Resend, domain-verified (DKIM/SPF/DMARC), sending from `noreply@documindai.online`
- **Payments** → Stripe, webhook pointed at the live backend URL

### Backend (Docker)

```bash
docker build -f backend/Dockerfile -t documind-backend .
docker run -p 8000:8000 --env-file .env documind-backend
```

The Dockerfile builds from the **repo root** as context (not `backend/` alone), since the backend imports `db.py`/`auth.py`/`billing.py`/`rag_core.py` from the project root.

To test locally against Postgres instead of SQLite:

```bash
docker compose up --build
```

This starts a Postgres container plus the backend wired to it via `DATABASE_URL` — this exact path was used to confirm Postgres compatibility before deploying to Render.

### Deploying your own instance

1. **Backend**: push to your own GitHub repo, go to [Render Blueprints](https://dashboard.render.com/blueprints), connect the repo — `render.yaml` auto-provisions the web service + Postgres database
2. **Frontend**: `vercel --prod` from `frontend/` (or connect the repo in the Vercel dashboard), set `VITE_API_URL` to your Render backend's URL
3. **Custom domain**: add an `A` record pointing to Vercel's IP (`76.76.21.21`) at your DNS provider, add the domain in Vercel's project settings
4. **Stripe**: create a new webhook endpoint in the [Stripe dashboard](https://dashboard.stripe.com/webhooks) pointing at `https://your-backend/billing/webhook`, use its signing secret
5. **Resend**: add your domain at [resend.com/domains](https://resend.com/domains), add the DKIM/SPF/DMARC DNS records it provides — once verified, email can be sent to any recipient, not just your own address

### Production environment checklist

| Variable | Notes |
|---|---|
| `ENVIRONMENT` | Set to `production` — the app **refuses to start** if `JWT_SECRET_KEY` is still the dev default in this mode |
| `JWT_SECRET_KEY` | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | Your managed Postgres connection string |
| `CORS_ORIGINS` | Your deployed frontend's URL(s), comma-separated (whitespace is stripped defensively) |
| `FRONTEND_URL` | Your deployed frontend's URL — used in Stripe redirect URLs and email links |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Switch to live keys when ready to accept real payments |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint created against your production backend URL — different from the local CLI one |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Requires a verified domain to send to arbitrary recipients — sandbox mode only delivers to your own Resend account email |
| `GOOGLE_API_KEY` | Optional server-side fallback Gemini key — per-user keys entered in the UI take priority |

## Limitations

- **PDF content isn't persisted server-side by default** — uploaded documents and the FAISS index live in the backend process's memory per user/workspace, so documents must be re-uploaded after a full server restart. The two deliberate exceptions are **Document Version History** and **Team Workspace documents**, both explicitly disclosed as persistent on the Security/Privacy pages.
- **Free-tier hosting cold starts** — Render's free web service spins down after inactivity; the first request after idle can take 20–50 seconds.
- **Live collaboration is single-instance** — WebSocket presence is held in-memory per backend process; would need a shared broker (e.g. Redis pub/sub) to work correctly if the backend ever scales horizontally.
- **No automated test suite** — correctness is currently verified through manual/live testing rather than CI-run unit/integration tests.
- **OCR accuracy** depends on scan quality and the vision model's read of the rendered page image.
- **Audio Overview voice quality** depends on the browser/OS's installed system voices (Web Speech API), not a studio-quality TTS service.
- Requires an active internet connection and a valid Google AI API key; no offline/local-model mode.

## License

This project was developed for academic purposes as a university coursework submission.

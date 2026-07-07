<p align="center">
  <img src="assets/logo.png" alt="Documind AI" height="90" />
</p>

<h1 align="center">Documind AI</h1>
<p align="center"><b>Enterprise Intelligence Systems</b> — Chat, summarize, quiz, and research across multiple PDF documents using Retrieval-Augmented Generation (RAG).</p>

<p align="center">
  <b><a href="https://documindai.online">🌐 Live at documindai.online</a></b>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.139-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini_2.5-Google_AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img alt="FAISS" src="https://img.shields.io/badge/FAISS-Vector_Search-00A98F?style=for-the-badge" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Deployed-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## Overview

**Documind AI** is a multi-tenant SaaS application built on Retrieval-Augmented Generation (RAG) that turns any collection of PDF documents into an interactive, queryable knowledge base. Users sign up, upload PDFs — including scanned/image-based documents — and ask natural-language questions, generate study material, compare documents, or run multi-step research, all backed by Google's Gemini models and a FAISS vector index.

The product ships as a **React + TypeScript single-page app** talking to a **FastAPI backend** over a JSON REST API, with real **Stripe billing** for Free/Pro subscription tiers, JWT auth with refresh tokens, and transactional email (verification/password reset) via Resend on a verified custom domain. A marketing landing page (built with Framer Motion) fronts the product. An earlier **Streamlit prototype** (`app.py`) is kept in the repo as a working reference/fallback but is no longer the primary interface.

**This is a live, deployed product** — not just a local demo. The frontend runs on Vercel behind a custom domain, the backend runs in a Docker container on Render with a managed Postgres database, and Stripe/Resend are both wired to the real production URLs.

Built as a university project to demonstrate practical application of LLMs, embeddings, vector search, retrieval-augmented generation, and full-stack SaaS architecture (auth, persistence, tiered billing, payments, transactional email, deployment) in a production-style system.

## Features

### Core AI / RAG

| Feature | Description |
|---|---|
| 💬 **AI Chat with PDFs** | Ask natural-language questions answered strictly from document content |
| 📚 **Multi-PDF Knowledge Base** | Upload and query multiple documents together in a single session |
| 🔖 **Citation-Aware Responses** | Every answer shows the exact source document and page number it was drawn from |
| 🧠 **Multi-Turn Memory** | Follow-up questions ("what about page 3?") resolve using recent conversation context |
| ⚠️ **Not-in-Document Detection** | Answers not grounded in the uploaded PDFs are visually flagged instead of hallucinated |
| 🖼️ **OCR for Scanned PDFs** | Pages with no extractable text are rendered as images and read via Gemini Vision |
| 📝 **Smart Summaries** | One-click, structured summary of any uploaded document |
| 📖 **AI Study Notes** | Exam-ready structured notes with headings and bolded key terms |
| ❓ **Quiz & MCQ Generator** *(Pro)* | Auto-generated multiple-choice quizzes with scoring and explanations |
| 🗂️ **Flashcard Generator** *(Pro)* | Flip-card style flashcards for active recall study |
| 🔀 **Document Comparison** *(Pro)* | Structured similarities/differences report between any two uploaded documents |
| 🔎 **Research Assistant** *(Pro)* | Decomposes a topic into sub-questions, retrieves grounded evidence for each, and synthesizes a cited research brief |
| ⬇️ **Professional Exports** | Download summaries, notes, quizzes, flashcards, comparisons, and reports as clean `.md`/`.csv` files |
| ⚡ **Cached Vector Index** | Re-embeds documents only when the uploaded file set actually changes |

### SaaS Platform

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication with Refresh Tokens** | Short-lived (30 min) access tokens with rotating, revocable refresh tokens (30 day) — auto-refreshed transparently by the frontend on expiry |
| ✉️ **Email Verification & Password Reset** | Real transactional email via Resend on a verified custom domain, with single-use, expiring tokens |
| 👤 **Account Settings** | Change password, change email (re-triggers verification), delete account — all self-service |
| 💾 **Persistent Chat History** | Conversations are saved per-user in the database and reloaded automatically on login |
| 🏷️ **Tiered Plans (Free / Pro)** | Free: 2 PDFs, 15 actions/day, core chat + summaries + notes. Pro: unlimited usage and all advanced features |
| 📊 **Usage Metering** | Every AI action (chat, summary, quiz, etc.) is logged per-user and rate-limited daily on the Free tier |
| 💳 **Real Stripe Billing** | Live Stripe Checkout for upgrades, a signature-verified webhook as the source of truth, and a self-service Billing Portal for cancellation |
| 🚦 **Rate Limiting** | Sliding-window limits on auth endpoints (login/signup/refresh) to blunt brute-force attempts |
| 📋 **Structured Logging** | Consistent timestamped log format across the app and Uvicorn, with request timing and security-relevant events (logins, signups, tier changes) |
| 🔑 **Per-User API Keys** | Each user supplies their own Google Gemini API key (entered once, stored only in their browser) — no shared backend key required |
| 🖥️ **Marketing Landing Page** | Animated (Framer Motion) hero, product preview, pricing, and FAQ sections ahead of the app |

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) with hand-built shadcn-style UI primitives
- [Framer Motion](https://www.framer.com/motion/) for landing page animations
- [React Router](https://reactrouter.com/) for client-side routing
- [Axios](https://axios-http.com/) with an interceptor-driven auto-refresh flow for expired access tokens

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- [SQLAlchemy](https://www.sqlalchemy.org/) ORM — SQLite for local dev, Postgres in production (toggled via `DATABASE_URL`)
- [python-jose](https://github.com/mpdavis/python-jose) for JWT auth, [bcrypt](https://pypi.org/project/bcrypt/) for password hashing
- [Stripe Python SDK](https://github.com/stripe/stripe-python) for Checkout, webhooks, and the Billing Portal
- [Resend](https://resend.com/) for transactional email (verification, password reset)

**AI / RAG**
- [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash` for generation/vision OCR, `gemini-embedding-001` for embeddings) via [LangChain](https://www.langchain.com/)
- [FAISS](https://github.com/facebookresearch/faiss) for similarity search over document chunks
- [PyPDF2](https://pypdf2.readthedocs.io/) for text extraction, [PyMuPDF](https://pymupdf.readthedocs.io/) for page rasterization (OCR fallback)

**Infrastructure**
- **Docker** — backend containerized, builds from repo root
- **Deployed live**: [Vercel](https://vercel.com/) (frontend, custom domain) + [Render](https://render.com/) (backend + managed Postgres, Docker)
- [Render Blueprint](render.yaml) (`render.yaml`) for reproducible one-click infra provisioning

**Legacy prototype**
- [Streamlit](https://streamlit.io/) (`app.py`) — the original single-file version of the product, still functional, sharing the same `rag_core.py`/`db.py`/`auth.py`/`billing.py` modules as the FastAPI backend

## Architecture

```
┌─────────────────────┐        HTTPS / JSON         ┌──────────────────────────┐
│   React Frontend      │ ───────────────────────────► │   FastAPI Backend         │
│   (Vercel, custom       │ ◄─────────────────────────── │   (Render, Docker,          │
│   domain, Framer Motion)│      JWT + refresh token       │   JWT auth, rate limits)     │
└─────────────────────┘                                  └───────────┬──────────────┘
                                                                       │
                          ┌────────────────────────────────────────────┼───────────────────┐
                          ▼                                            ▼                    ▼
             ┌──────────────────────────┐          ┌──────────────────────────┐   ┌──────────────────┐
             │  billing.py — tiers,       │          │  Stripe Checkout /         │   │  Resend — email    │
             │  usage metering, feature    │          │  Webhook / Billing Portal   │   │  verification,       │
             │  locking (Free vs Pro)      │          │  → users.tier updates        │   │  password reset        │
             └──────────────────────────┘          └──────────────────────────┘   └──────────────────┘
                          │
                          ▼
                        ┌─────────────────┐   has text?   chunks + metadata (source, page)
      PDF Upload  ───►  │  Text Extraction │ ──────────►
                        │  (PyPDF2)         │
                        └────────┬─────────┘
                                 │ no text (scanned page)
                                 ▼
                        ┌─────────────────┐
                        │  PyMuPDF render   │──► page image ──► Gemini Vision OCR ──► extracted text
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Text Chunking    │  (RecursiveCharacterTextSplitter)
                        └────────┬─────────┘
                                 ▼
                        ┌─────────────────┐
                        │ Gemini Embeddings │──► FAISS Vector Store (cached per file signature)
                        └────────┬─────────┘
                                 ▼
              ┌───────────────────────────────────────┐
              │  Retrieval (similarity_search)          │
              │  + Prompted Gemini 2.5 Flash             │
              └───────────────────┬───────────────────┘
                                  ▼
        Chat / Summaries / Notes / Quiz / Flashcards / Compare / Research
                                  ▼
                    Cited answers + downloadable exports
                                  │
                                  ▼
              Postgres: users, chat_messages, usage_events,
                    refresh_tokens, action_tokens
```

## Project Structure

```
rag-pdf-chatbot/
├── backend/                    # FastAPI application
│   ├── main.py                  # App entrypoint, CORS, logging middleware, router registration
│   ├── config.py                 # Env var loading, production safety checks (JWT secret)
│   ├── security.py                # JWT + refresh/action token creation and hashing
│   ├── deps.py                     # Auth/DB dependencies, per-user API key header
│   ├── rate_limit.py                # Sliding-window rate limiter for auth endpoints
│   ├── logging_config.py             # Structured logging setup
│   ├── email_service.py               # Resend wrapper (verification + password reset emails)
│   ├── schemas.py                       # Pydantic request/response models
│   ├── store.py                          # In-memory per-user document/vector-store cache
│   ├── rag_pipeline.py                    # Glue between rag_core.py and the in-memory store
│   ├── stripe_service.py                   # Stripe Checkout/Portal session creation
│   ├── usage_guard.py                        # Usage/feature-lock enforcement helpers
│   ├── Dockerfile                              # Builds from repo root (see below)
│   └── routers/
│       ├── auth.py                          # signup/login/refresh/logout, verify-email,
│       │                                     #   forgot/reset-password, change-password/email, delete account
│       ├── billing.py                        # /billing/* (checkout, webhook, verify, portal)
│       ├── documents.py                        # /documents/upload, list, clear
│       ├── chat.py                              # /chat/ask, /chat/history
│       └── generate.py                           # /generate/* (summary, notes, quiz, ...)
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── pages/                # LandingPage, AuthPage, ForgotPassword/ResetPassword/VerifyEmail,
│       │                          #   AccountSettings, Dashboard
│       ├── components/            # Sidebar, ChatPanel, QuizPanel, FlashcardsPanel, ...
│       ├── components/landing/     # Hero, Pricing, Faq, ProductPreview, etc.
│       ├── components/ui/           # Hand-built shadcn-style Button/Card/Input/Badge
│       ├── context/AuthContext.tsx   # Client-side auth state
│       └── lib/                       # api.ts (axios client + auto-refresh interceptor), export.ts
├── app.py                      # Legacy Streamlit prototype (still functional)
├── rag_core.py                  # Shared, framework-agnostic RAG pipeline (used by both app.py and backend/)
├── db.py                         # SQLAlchemy models (User, ChatMessage, UsageEvent, RefreshToken, ActionToken)
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
4. **Chat tab** — ask questions; answers come back with citations to the exact source page. Conversations persist across sessions.
5. **Summaries / Study Notes tabs** — pick a document and generate structured study material (Free tier).
6. **Quiz / Flashcards / Compare / Research tabs** — Pro-only; Free tier users see an upgrade prompt.
7. **Upgrade to Pro** — redirects to real Stripe Checkout; on success, the tier updates immediately (and is reconfirmed by the webhook).
8. **Account Settings** — change password/email, resend verification, or delete your account.
9. **Manage Billing** — Pro users can cancel or manage payment methods via the Stripe-hosted Billing Portal.
10. **Export** — every generated artifact can be downloaded directly from the UI (`.md`/`.csv`).

## Key Design Decisions

- **Grounded answers over hallucination** — the system prompt instructs the model to explicitly say when an answer isn't supported by the uploaded documents, and the UI visually distinguishes these responses.
- **Vision-based OCR fallback** — rather than requiring a separate OCR engine (e.g. Tesseract) installed on the host machine, scanned pages are rasterized with PyMuPDF and read directly by Gemini's multimodal vision capability.
- **Shared core logic, two front ends** — `rag_core.py`, `db.py`, `auth.py`, and `billing.py` are framework-agnostic and imported by both the FastAPI backend and the legacy Streamlit app, so the RAG pipeline and business rules never drift between the two.
- **Signature-based caching** — the FAISS index and extracted page text are cached (in-memory per-user on the backend, session state in Streamlit) keyed by `(filename, filesize)`, so repeated questions against the same document set skip redundant re-embedding.
- **Citation-first retrieval** — every chunk stored in FAISS carries `source` and `page` metadata, allowing every answer to be traced back to its exact origin.
- **Tier gating at the feature level, not just usage level** — Quiz, Flashcards, Compare, and Research are locked entirely behind the Pro tier (not just rate-limited), matching a typical SaaS "core vs. premium" split.
- **Real payments, not a simulated upgrade** — Stripe Checkout + webhook is the actual source of truth for tier changes; the frontend's post-redirect `/billing/verify` call is a UX convenience, not the authority.
- **Per-user API keys over a shared backend key** — each user brings their own Gemini key, avoiding shared-cost/rate-limit problems across users (a centralized-key mode remains available as a fallback via `GOOGLE_API_KEY` in `.env` for demo/admin use).
- **Rotating refresh tokens over long-lived access tokens** — access tokens expire in 30 minutes; a stolen access token has a short blast radius, while refresh tokens are opaque (not JWTs), hashed at rest, single-use (rotated on every refresh), and revocable server-side on logout or password reset.
- **Generic responses on password reset requests** — `/auth/forgot-password` always returns the same message regardless of whether the email exists, preventing user enumeration.
- **Real email delivery, verified in production** — Resend is configured against a verified custom domain (`documindai.online`) with DKIM/SPF/DMARC records, confirmed to deliver to arbitrary recipients, not just a sandboxed test address.

## Deployment

The backend is containerized and **actually deployed** — this isn't a hypothetical setup, it's the live configuration:

- **Frontend** → [Vercel](https://vercel.com/), custom domain (`documindai.online`), SPA rewrites configured via `frontend/vercel.json`
- **Backend** → [Render](https://render.com/), Docker web service, defined via [`render.yaml`](render.yaml) Blueprint
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

## Limitations

- **PDF content itself isn't persisted server-side** — only chat history, usage logs, and account data are stored in the database; uploaded PDFs and the FAISS index live in the backend process's memory per user, so documents must be re-uploaded after a full server restart.
- **Free-tier hosting cold starts** — Render's free web service spins down after inactivity; the first request after idle can take up to ~50 seconds.
- **No automated test suite** — correctness is currently verified through manual/live testing rather than CI-run unit/integration tests.
- **OCR accuracy** depends on scan quality and the vision model's read of the rendered page image.
- Requires an active internet connection and a valid Google AI API key; no offline/local-model mode.

## License

This project was developed for academic purposes as a university coursework submission.

<p align="center">
  <img src="assets/logo.png" alt="Documind AI" height="90" />
</p>

<h1 align="center">Documind AI</h1>
<p align="center"><b>Enterprise Intelligence Systems</b> — Chat, summarize, quiz, and research across multiple PDF documents using Retrieval-Augmented Generation (RAG).</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.139-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini_2.5-Google_AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img alt="FAISS" src="https://img.shields.io/badge/FAISS-Vector_Search-00A98F?style=for-the-badge" />
</p>

---

## Overview

**Documind AI** is a multi-tenant SaaS application built on Retrieval-Augmented Generation (RAG) that turns any collection of PDF documents into an interactive, queryable knowledge base. Users sign up, upload PDFs — including scanned/image-based documents — and ask natural-language questions, generate study material, compare documents, or run multi-step research, all backed by Google's Gemini models and a FAISS vector index.

The product ships as a **React + TypeScript single-page app** talking to a **FastAPI backend** over a JSON REST API, with real **Stripe billing** for Free/Pro subscription tiers. A marketing landing page (built with Framer Motion) fronts the product. An earlier **Streamlit prototype** (`app.py`) is kept in the repo as a working reference/fallback but is no longer the primary interface.

Built as a university project to demonstrate practical application of LLMs, embeddings, vector search, retrieval-augmented generation, and full-stack SaaS architecture (auth, persistence, tiered billing, payments) in a production-style system.

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
| 🔐 **User Authentication** | JWT-based signup/login with bcrypt-hashed passwords |
| 💾 **Persistent Chat History** | Conversations are saved per-user in the database and reloaded automatically on login |
| 🏷️ **Tiered Plans (Free / Pro)** | Free: 2 PDFs, 15 actions/day, core chat + summaries + notes. Pro: unlimited usage and all advanced features |
| 📊 **Usage Metering** | Every AI action (chat, summary, quiz, etc.) is logged per-user and rate-limited daily on the Free tier |
| 💳 **Real Stripe Billing** | Live Stripe Checkout for upgrades, a signature-verified webhook as the source of truth, and a self-service Billing Portal for cancellation |
| 🔑 **Per-User API Keys** | Each user supplies their own Google Gemini API key (entered once, stored only in their browser) — no shared backend key required |
| 🖥️ **Marketing Landing Page** | Animated (Framer Motion) hero, product preview, pricing, and FAQ sections ahead of the app |

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) with hand-built shadcn-style UI primitives
- [Framer Motion](https://www.framer.com/motion/) for landing page animations
- [React Router](https://reactrouter.com/) for client-side routing
- [Axios](https://axios-http.com/) for API calls

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- [SQLAlchemy](https://www.sqlalchemy.org/) ORM over SQLite (`documind.db`)
- [python-jose](https://github.com/mpdavis/python-jose) for JWT auth, [bcrypt](https://pypi.org/project/bcrypt/) for password hashing
- [Stripe Python SDK](https://github.com/stripe/stripe-python) for Checkout, webhooks, and the Billing Portal

**AI / RAG**
- [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash` for generation/vision OCR, `gemini-embedding-001` for embeddings) via [LangChain](https://www.langchain.com/)
- [FAISS](https://github.com/facebookresearch/faiss) for similarity search over document chunks
- [PyPDF2](https://pypdf2.readthedocs.io/) for text extraction, [PyMuPDF](https://pymupdf.readthedocs.io/) for page rasterization (OCR fallback)

**Legacy prototype**
- [Streamlit](https://streamlit.io/) (`app.py`) — the original single-file version of the product, still functional, sharing the same `rag_core.py`/`db.py`/`auth.py`/`billing.py` modules as the FastAPI backend

## Architecture

```
┌─────────────────────┐        HTTPS / JSON         ┌──────────────────────────┐
│   React Frontend      │ ───────────────────────────► │   FastAPI Backend         │
│   (Vite, Tailwind,     │ ◄─────────────────────────── │   (JWT auth, routers)      │
│   Framer Motion)       │                              └───────────┬──────────────┘
└─────────────────────┘                                          │
                                                                   ▼
                                    ┌──────────────────────────────────────────────┐
                                    │  billing.py — tier limits, usage metering      │
                                    │  Free: 2 PDFs, 15 actions/day, core features   │
                                    │  Pro:  unlimited, all features unlocked        │
                                    └───────────────────┬────────────────────────────┘
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
                  chat_messages table (persisted per user)

                     ┌──────────────────────────────┐
                     │  Stripe Checkout / Webhook /   │
                     │  Billing Portal                │──► users.tier, stripe_customer_id
                     └──────────────────────────────┘
```

## Project Structure

```
rag-pdf-chatbot/
├── backend/                    # FastAPI application
│   ├── main.py                  # App entrypoint, CORS, router registration
│   ├── config.py                 # Env var loading (.env)
│   ├── security.py                # JWT creation/verification
│   ├── deps.py                     # Auth/DB dependencies, per-user API key header
│   ├── schemas.py                   # Pydantic request/response models
│   ├── store.py                      # In-memory per-user document/vector-store cache
│   ├── rag_pipeline.py                 # Glue between rag_core.py and the in-memory store
│   ├── stripe_service.py                # Stripe Checkout/Portal session creation
│   ├── usage_guard.py                     # Usage/feature-lock enforcement helpers
│   └── routers/
│       ├── auth.py                          # /auth/signup, /auth/login
│       ├── billing.py                        # /billing/* (checkout, webhook, verify, portal)
│       ├── documents.py                        # /documents/upload, list, clear
│       ├── chat.py                              # /chat/ask, /chat/history
│       └── generate.py                           # /generate/* (summary, notes, quiz, ...)
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── pages/                # LandingPage, AuthPage, Dashboard
│       ├── components/            # Sidebar, ChatPanel, QuizPanel, FlashcardsPanel, ...
│       ├── components/landing/     # Hero, Pricing, Faq, ProductPreview, etc.
│       ├── components/ui/           # Hand-built shadcn-style Button/Card/Input/Badge
│       ├── context/AuthContext.tsx   # Client-side auth state
│       └── lib/                       # api.ts (axios client), export.ts (client-side exports)
├── app.py                      # Legacy Streamlit prototype (still functional)
├── rag_core.py                  # Shared, framework-agnostic RAG pipeline (used by both app.py and backend/)
├── db.py                         # SQLAlchemy models (User, ChatMessage, UsageEvent)
├── auth.py                        # Signup/login logic, bcrypt hashing, validation
├── billing.py                      # Tier limits, usage metering, feature locking
├── requirements.txt                 # Python dependencies (Streamlit + FastAPI + Stripe)
├── .env.example                      # Backend env var template
├── assets/                             # Logo & marketing assets
├── documind.db                          # SQLite database (created at runtime, gitignored)
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google AI Studio API key](https://ai.google.dev/) (free tier available)
- A [Stripe](https://dashboard.stripe.com/register) account (test mode keys are free)

### 1. Backend setup

```bash
git clone <repository-url>
cd rag-pdf-chatbot

python -m venv myenv
myenv\Scripts\activate        # Windows
# source myenv/bin/activate   # macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# edit .env: set JWT_SECRET_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
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

The app opens at `http://localhost:5173` — landing page at `/`, sign in at `/login`, dashboard at `/dashboard`.

### 3. (Optional) Stripe webhook forwarding for local dev

```bash
stripe listen --forward-to localhost:8000/billing/webhook
```

Copy the printed `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the backend.

### Running the legacy Streamlit prototype instead

```bash
streamlit run app.py
```

Opens at `http://localhost:8501`. Shares the same database and business logic as the FastAPI backend but is a single-page, non-SaaS interface (no Stripe billing, no separate frontend).

## Usage

1. **Sign up** on the landing page or `/login`, or **log in** if you already have an account.
2. **Enter your Google API key** in the sidebar (stored only in your browser, sent as a request header).
3. **Upload PDFs** — supports both text-based and scanned/image-based documents. Free tier: up to 2 at a time.
4. **Chat tab** — ask questions; answers come back with citations to the exact source page. Conversations persist across sessions.
5. **Summaries / Study Notes tabs** — pick a document and generate structured study material (Free tier).
6. **Quiz / Flashcards / Compare / Research tabs** — Pro-only; Free tier users see an upgrade prompt.
7. **Upgrade to Pro** — redirects to real Stripe Checkout; on success, the tier updates immediately (and is reconfirmed by the webhook).
8. **Manage Billing** — Pro users can cancel or manage payment methods via the Stripe-hosted Billing Portal.
9. **Export** — every generated artifact can be downloaded directly from the UI (`.md`/`.csv`).

## Key Design Decisions

- **Grounded answers over hallucination** — the system prompt instructs the model to explicitly say when an answer isn't supported by the uploaded documents, and the UI visually distinguishes these responses.
- **Vision-based OCR fallback** — rather than requiring a separate OCR engine (e.g. Tesseract) installed on the host machine, scanned pages are rasterized with PyMuPDF and read directly by Gemini's multimodal vision capability.
- **Shared core logic, two front ends** — `rag_core.py`, `db.py`, `auth.py`, and `billing.py` are framework-agnostic and imported by both the FastAPI backend and the legacy Streamlit app, so the RAG pipeline and business rules never drift between the two.
- **Signature-based caching** — the FAISS index and extracted page text are cached (in-memory per-user on the backend, session state in Streamlit) keyed by `(filename, filesize)`, so repeated questions against the same document set skip redundant re-embedding.
- **Citation-first retrieval** — every chunk stored in FAISS carries `source` and `page` metadata, allowing every answer to be traced back to its exact origin.
- **Tier gating at the feature level, not just usage level** — Quiz, Flashcards, Compare, and Research are locked entirely behind the Pro tier (not just rate-limited), matching a typical SaaS "core vs. premium" split.
- **Real payments, not a simulated upgrade** — Stripe Checkout + webhook is the actual source of truth for tier changes; the frontend's post-redirect `/billing/verify` call is a UX convenience, not the authority.
- **Per-user API keys over a shared backend key** — each user brings their own Gemini key, avoiding shared-cost/rate-limit problems across users (a centralized-key mode remains available as a fallback via `GOOGLE_API_KEY` in `.env` for demo/admin use).

## Limitations

- **Single-node SQLite** — fine for a coursework demo and single-instance deployment, but a production SaaS at scale would use a managed Postgres/MySQL instance for concurrent write safety.
- **PDF content itself isn't persisted server-side** — only chat history, usage logs, and account data are stored in the database; uploaded PDFs and the FAISS index live in the backend process's memory per user, so documents must be re-uploaded after a full server restart.
- **Dev-mode JWT secret** — `JWT_SECRET_KEY` defaults to an insecure placeholder; must be set to a real random string before any real deployment, and tokens currently have no refresh mechanism (24h hard expiry).
- **OCR accuracy** depends on scan quality and the vision model's read of the rendered page image.
- Requires an active internet connection and a valid Google AI API key; no offline/local-model mode.

## License

This project was developed for academic purposes as a university coursework submission.

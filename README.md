<p align="center">
  <img src="assets/logo.png" alt="Documind AI" height="90" />
</p>

<h1 align="center">Documind AI</h1>
<p align="center"><b>Enterprise Intelligence Systems</b> — Chat, summarize, quiz, and research across multiple PDF documents using Retrieval-Augmented Generation (RAG).</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="Streamlit" src="https://img.shields.io/badge/Streamlit-1.43-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" />
  <img alt="LangChain" src="https://img.shields.io/badge/LangChain-0.3-1C3C3C?style=for-the-badge" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini_2.5-Google_AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img alt="FAISS" src="https://img.shields.io/badge/FAISS-Vector_Search-00A98F?style=for-the-badge" />
</p>

---

## Overview

**Documind AI** is a multi-tenant SaaS application built on Retrieval-Augmented Generation (RAG) that turns any collection of PDF documents into an interactive, queryable knowledge base. Users sign up for an account, upload PDFs — including scanned/image-based documents — and ask natural-language questions, generate study material, compare documents, or run multi-step research, all backed by Google's Gemini models and a FAISS vector index.

Built as a university project to demonstrate practical application of LLMs, embeddings, vector search, retrieval-augmented generation, and SaaS product architecture (auth, persistence, tiered billing) in a production-style UI.

## Features

### Core AI / RAG

| Feature | Description |
|---|---|
| 💬 **AI Chat with PDFs** | Ask natural-language questions answered strictly from document content, with streaming responses |
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
| 🔐 **User Authentication** | Sign-up/login with bcrypt-hashed passwords, backed by a SQLite database |
| 💾 **Persistent Chat History** | Conversations are saved per-user and reloaded automatically on login — survives server/browser restarts |
| 🏷️ **Tiered Plans (Free / Pro)** | Free tier: 2 PDFs, 15 actions/day, core chat + summaries + notes. Pro tier: unlimited usage and all advanced features |
| 📊 **Usage Metering** | Every AI action (chat, summary, quiz, etc.) is logged per-user and rate-limited daily on the Free tier |
| ⭐ **Self-Serve Upgrade** | One-click "Upgrade to Pro" flow (billing integration point — see [Limitations](#limitations)) |
| 🔑 **Centralized API Key** | Backend-managed Gemini key via `.env` — end users never need their own API key, mirroring real SaaS cost control |

## Tech Stack

- **UI:** [Streamlit](https://streamlit.io/) with a custom enterprise dark theme
- **LLM & Embeddings:** [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash`, `gemini-embedding-001`) via [LangChain](https://www.langchain.com/)
- **Vector Store:** [FAISS](https://github.com/facebookresearch/faiss) for similarity search over document chunks
- **PDF Parsing:** [PyPDF2](https://pypdf2.readthedocs.io/) for text extraction, [PyMuPDF](https://pymupdf.readthedocs.io/) for page rasterization (OCR fallback)
- **Data handling:** Pandas for structured exports (CSV)
- **Database & Auth:** [SQLAlchemy](https://www.sqlalchemy.org/) ORM over SQLite (`documind.db`), [bcrypt](https://pypi.org/project/bcrypt/) for password hashing
- **Config:** [python-dotenv](https://pypi.org/project/python-dotenv/) for backend-managed API keys

## Architecture

```
   ┌───────────────┐      ┌──────────────────┐
   │  Sign Up / Log │─────►│  users table      │  (SQLite, bcrypt password hash, tier)
   │  In (auth.py)  │      └──────────────────┘
   └───────┬───────┘
           ▼
   ┌────────────────────────────┐
   │  Tier & Usage Gate          │◄──── usage_events table (per-user, per-day action count)
   │  (billing.py)               │      Free: 2 PDFs, 15 actions/day, core features only
   └───────┬────────────────────┘      Pro:  unlimited, all features unlocked
           ▼
                 ┌─────────────────┐
   PDF Upload →  │  Text Extraction │──── has text? ──► chunks + metadata (source, page)
                 │  (PyPDF2)        │
                 └────────┬────────┘
                          │ no text (scanned page)
                          ▼
                 ┌─────────────────┐
                 │  PyMuPDF render  │──► page image ──► Gemini Vision OCR ──► extracted text
                 └─────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Text Chunking   │  (RecursiveCharacterTextSplitter)
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ Gemini Embeddings│──► FAISS Vector Store (cached per file signature)
                 └────────┬────────┘
                          ▼
        ┌─────────────────────────────────────┐
        │  Retrieval (similarity_search)       │
        │  + Prompted Gemini 2.5 Flash          │
        └──────────────┬───────────────────────┘
                        ▼
     Chat / Summaries / Notes / Quiz / Flashcards /
          Comparison / Research Assistant
                        ▼
              Cited, streamed answers
              + downloadable exports
                        │
                        ▼
          chat_messages table (persisted per user)
```

## Project Structure

```
rag-pdf-chatbot/
├── app.py              # UI, RAG pipeline, feature logic, tab rendering
├── db.py                # SQLAlchemy models (User, ChatMessage, UsageEvent) + session/init helpers
├── auth.py              # Signup/login, bcrypt password hashing, input validation
├── billing.py           # Tier limits, usage metering, feature locking, upgrade logic
├── requirements.txt      # Python dependencies
├── .env.example          # Template for the backend-managed GOOGLE_API_KEY
├── assets/
│   └── logo.png          # Documind AI logo
├── documind.db           # SQLite database (created at runtime, gitignored)
├── faiss_index/          # Locally persisted vector index (generated at runtime)
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- A [Google AI Studio API key](https://ai.google.dev/) (free tier available)

### Installation

```bash
git clone <repository-url>
cd rag-pdf-chatbot

python -m venv myenv
myenv\Scripts\activate        # Windows
# source myenv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### Configure the backend API key (recommended)

Copy `.env.example` to `.env` and add your Gemini key so it's centrally managed instead of every user needing their own:

```bash
cp .env.example .env
# then edit .env and set GOOGLE_API_KEY=your-key-here
```

If `.env` is not configured, the app falls back to asking each user for their own API key in the sidebar (useful for local development/grading without setting up a shared key).

### Run

```bash
streamlit run app.py
```

The app opens at `http://localhost:8501`. On first run, the SQLite database (`documind.db`) and its tables are created automatically.

## Usage

1. **Sign up** for an account (username, email, password) or **log in** if you already have one.
2. **Upload PDFs** — supports both text-based and scanned/image-based documents. Free tier: up to 2 at a time.
3. **Chat tab** — ask questions; answers stream in with citations to the exact source page. Conversations are saved to your account and reload automatically next time you log in.
4. **Summaries / Study Notes tabs** — pick a document and generate structured study material (available on Free tier).
5. **Quiz / Flashcards / Compare / Research tabs** — Pro-only features; Free tier users see an upgrade prompt instead.
6. **Upgrade to Pro** — one click in the sidebar removes the daily action cap and unlocks all Pro features instantly.
7. **Export** — every generated artifact (summary, notes, quiz, flashcards, comparison, report, chat history) can be downloaded directly from the UI.

## Key Design Decisions

- **Grounded answers over hallucination** — the system prompt instructs the model to explicitly say when an answer isn't supported by the uploaded documents, and the UI visually distinguishes these responses.
- **Vision-based OCR fallback** — rather than requiring a separate OCR engine (e.g. Tesseract) installed on the host machine, scanned pages are rasterized with PyMuPDF and read directly by Gemini's multimodal vision capability.
- **Signature-based caching** — the FAISS index and extracted page text are cached in session state keyed by `(filename, filesize)` pairs, so repeated questions against the same document set skip redundant re-embedding.
- **Citation-first retrieval** — every chunk stored in FAISS carries `source` and `page` metadata, allowing every answer to be traced back to its exact origin.
- **Tier gating at the feature level, not just usage level** — Quiz, Flashcards, Compare, and Research are locked entirely behind the Pro tier (not just rate-limited), demonstrating a typical SaaS "core vs. premium" feature split rather than a single undifferentiated free trial.
- **Centralized API key over per-user keys** — with `GOOGLE_API_KEY` set in `.env`, the app operates like a real SaaS product where the provider absorbs LLM cost and users simply consume the service, rather than everyone needing their own Gemini account.

## Limitations

- **No real payment processing** — the "Upgrade to Pro" button directly flips the user's tier in the database to demonstrate the tiering concept; integrating a real payment provider (e.g. Stripe) is a natural next step for production use.
- **Single-node SQLite** — fine for a coursework demo and single-instance deployment, but a production SaaS at scale would use a managed Postgres/MySQL instance for concurrent write safety.
- **PDF content itself isn't persisted** — only chat history, usage logs, and account data are stored in the database; uploaded PDFs and the FAISS index are rebuilt per session (cached only for the session's lifetime), so documents must be re-uploaded after a full server restart.
- **OCR accuracy** depends on scan quality and the vision model's read of the rendered page image.
- Requires an active internet connection and a valid Google AI API key; no offline/local-model mode.

## License

This project was developed for academic purposes as a university coursework submission.

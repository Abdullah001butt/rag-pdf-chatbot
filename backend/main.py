import sys
import os

# Make the project root (parent of backend/) importable so we can reuse
# db.py, auth.py, billing.py, and rag_core.py without duplicating them.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from config import CORS_ORIGINS
from routers import auth, billing, documents, chat, generate

app = FastAPI(title="Documind AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(generate.router)

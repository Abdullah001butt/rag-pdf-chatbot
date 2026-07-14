import sys
import os
import time
import logging

# Make the project root (parent of backend/) importable so we can reuse
# db.py, auth.py, billing.py, and rag_core.py without duplicating them.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from config import CORS_ORIGINS
from logging_config import configure_logging
from routers import auth, billing, documents, chat, generate, versions, automations, workspaces, api_keys, public_api

configure_logging()
logger = logging.getLogger("documind.api")

app = FastAPI(title="Documind AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)")
    return response


@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("Documind AI API started.")


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(generate.router)
app.include_router(versions.router)
app.include_router(automations.router)
app.include_router(workspaces.router)
app.include_router(api_keys.router)
app.include_router(public_api.router)

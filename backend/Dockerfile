# Build from the repo root: docker build -f backend/Dockerfile -t documind-backend .
# (The backend imports db.py/auth.py/billing.py/rag_core.py from the project root,
#  so the root directory must be in the build context, not just backend/.)
FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 (Postgres) and PyMuPDF/faiss wheels build smoothly on slim.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Shared root-level modules used by both app.py (Streamlit) and backend/ (FastAPI).
COPY db.py auth.py billing.py rag_core.py ./
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

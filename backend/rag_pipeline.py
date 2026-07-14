from fastapi import HTTPException

import rag_core
from config import GOOGLE_API_KEY
from store import get_user_store


def resolve_api_key(user_api_key=None):
    return user_api_key or GOOGLE_API_KEY


def get_or_build_pages(store, api_key):
    if store["pages"] is not None:
        return store["pages"]
    pages = []
    for filename, content in store["files"].items():
        pages.extend(rag_core.get_pdf_text_with_meta(filename, content, api_key))
    store["pages"] = pages
    return pages


def get_or_build_vector_store(user_id, api_key):
    store = get_user_store(user_id)
    if not store["files"]:
        raise HTTPException(status_code=400, detail="Upload at least one PDF first.")

    signature = tuple(sorted((name, len(content)) for name, content in store["files"].items()))
    if store["vector_store"] is not None and store["signature"] == signature:
        return store["vector_store"]

    pages = get_or_build_pages(store, api_key)
    text_chunks, metadatas = rag_core.get_text_chunks_with_meta(pages)
    if not text_chunks:
        raise HTTPException(
            status_code=422,
            detail="Couldn't extract any text from the uploaded PDF(s), even after attempting OCR.",
        )
    vector_store = rag_core.build_vector_store(text_chunks, metadatas, api_key)
    store["vector_store"] = vector_store
    store["signature"] = signature
    return vector_store


def get_document_text(user_id, api_key, source_name, max_chars=30000):
    store = get_user_store(user_id)
    pages = get_or_build_pages(store, api_key)
    doc_pages = sorted([(p, t) for t, s, p in pages if s == source_name])
    if not doc_pages:
        raise HTTPException(status_code=404, detail=f"Document '{source_name}' not found in your uploads.")
    text = "\n\n".join(f"[Page {p}]\n{t}" for p, t in doc_pages)
    return text[:max_chars]


def extract_text_from_bytes(filename, file_bytes, api_key, max_chars=30000):
    """Extract text straight from raw PDF bytes, bypassing the per-user
    in-memory store — used for workspace documents, which live in the
    database rather than a session's document store.
    """
    pages = rag_core.get_pdf_text_with_meta(filename, file_bytes, api_key)
    doc_pages = sorted([(p, t) for t, s, p in pages if s == filename])
    if not doc_pages:
        raise HTTPException(status_code=422, detail=f"Couldn't extract any text from '{filename}'.")
    text = "\n\n".join(f"[Page {p}]\n{t}" for p, t in doc_pages)
    return text[:max_chars]

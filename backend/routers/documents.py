import logging

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response

import rag_core
from automation_engine import run_automations_for_upload
from billing import check_pdf_limit
from deps import get_current_user, get_user_api_key, get_db
from rag_pipeline import resolve_api_key
from store import get_user_store, reset_user_store

router = APIRouter(prefix="/documents", tags=["documents"])
logger = logging.getLogger("documind.documents")


@router.get("")
def list_documents(user=Depends(get_current_user)):
    store = get_user_store(user.id)
    return {"files": list(store["files"].keys())}


@router.get("/raw")
def get_raw_document(filename: str, user=Depends(get_current_user)):
    store = get_user_store(user.id)
    content = store["files"].get(filename)
    if content is None:
        raise HTTPException(status_code=404, detail="Document not found. Upload it first.")
    return Response(content=content, media_type="application/pdf")


@router.post("/ocr-page-boxes")
def ocr_page_boxes(
    filename: str,
    page_index: int,
    user=Depends(get_current_user),
    user_api_key: str | None = Depends(get_user_api_key),
):
    api_key = resolve_api_key(user_api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="Please enter your Google API key in the sidebar first.")
    store = get_user_store(user.id)
    content = store["files"].get(filename)
    if content is None:
        raise HTTPException(status_code=404, detail="Document not found. Upload it first.")
    try:
        boxes = rag_core.ocr_page_boxes(content, page_index, api_key)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"OCR failed to parse a response: {e}")
    return {"boxes": boxes}


@router.post("/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    store = get_user_store(user.id)
    incoming_count = len(store["files"]) + len(files)
    allowed, reason = check_pdf_limit(user.tier, incoming_count)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason)

    uploaded_names = []
    for f in files:
        content = await f.read()
        store["files"][f.filename] = content
        uploaded_names.append(f.filename)

    # Invalidate cached vector store/pages so the next question re-embeds with new files
    store["pages"] = None
    store["vector_store"] = None
    store["signature"] = None

    api_key = resolve_api_key(user_api_key)
    for filename in uploaded_names:
        try:
            run_automations_for_upload(db, user, api_key, filename)
        except Exception as e:
            # Automations must never block the upload response.
            logger.error(f"Automation execution failed for user {user.id} on {filename!r}: {e}")

    return {"files": list(store["files"].keys())}


@router.delete("")
def clear_documents(user=Depends(get_current_user)):
    reset_user_store(user.id)
    return {"files": []}

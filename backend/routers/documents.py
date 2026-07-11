from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response

from billing import check_pdf_limit
from deps import get_current_user
from store import get_user_store, reset_user_store

router = APIRouter(prefix="/documents", tags=["documents"])


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


@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...), user=Depends(get_current_user)):
    store = get_user_store(user.id)
    incoming_count = len(store["files"]) + len(files)
    allowed, reason = check_pdf_limit(user.tier, incoming_count)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason)

    for f in files:
        content = await f.read()
        store["files"][f.filename] = content

    # Invalidate cached vector store/pages so the next question re-embeds with new files
    store["pages"] = None
    store["vector_store"] = None
    store["signature"] = None

    return {"files": list(store["files"].keys())}


@router.delete("")
def clear_documents(user=Depends(get_current_user)):
    reset_user_store(user.id)
    return {"files": []}

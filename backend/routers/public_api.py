from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

import rag_core
from deps import get_db, get_api_key_user, get_user_api_key
from billing import check_pdf_limit
from usage_guard import enforce_action
from billing import record_usage
from rag_pipeline import get_or_build_vector_store, get_document_text, resolve_api_key
from store import get_user_store

router = APIRouter(prefix="/v1", tags=["public-api"])


class ChatAskRequest(BaseModel):
    question: str


class GenerateRequest(BaseModel):
    source: str


def _require_api_key(user_gemini_key):
    api_key = resolve_api_key(user_gemini_key)
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="No Gemini API key available. Pass one via the X-Gemini-Api-Key header, or configure a server-side GOOGLE_API_KEY.",
        )
    return api_key


@router.post("/documents/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    user=Depends(get_api_key_user),
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

    store["pages"] = None
    store["vector_store"] = None
    store["signature"] = None

    return {"uploaded": uploaded_names, "files": list(store["files"].keys())}


@router.get("/documents")
def list_documents(user=Depends(get_api_key_user)):
    store = get_user_store(user.id)
    return {"files": list(store["files"].keys())}


@router.post("/chat/ask")
def chat_ask(payload: ChatAskRequest, user=Depends(get_api_key_user), db=Depends(get_db), user_api_key: str | None = Depends(get_user_api_key)):
    enforce_action(db, user, "chat")
    api_key = _require_api_key(user_api_key)
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Please provide a question.")
    vector_store = get_or_build_vector_store(user.id, api_key)
    answer, citations, not_found = rag_core.answer_question(vector_store, payload.question, api_key)
    record_usage(db, user.id, "chat")
    return {"answer": answer, "citations": citations, "not_found": not_found}


@router.post("/generate/summary")
def generate_summary(payload: GenerateRequest, user=Depends(get_api_key_user), db=Depends(get_db), user_api_key: str | None = Depends(get_user_api_key)):
    enforce_action(db, user, "summary")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    result = rag_core.generate_summary(payload.source, text, api_key)
    record_usage(db, user.id, "summary")
    return {"result": result}


@router.post("/generate/notes")
def generate_notes(payload: GenerateRequest, user=Depends(get_api_key_user), db=Depends(get_db), user_api_key: str | None = Depends(get_user_api_key)):
    enforce_action(db, user, "notes")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    result = rag_core.generate_study_notes(payload.source, text, api_key)
    record_usage(db, user.id, "notes")
    return {"result": result}


@router.post("/generate/quiz")
def generate_quiz(payload: GenerateRequest, num_questions: int = 5, user=Depends(get_api_key_user), db=Depends(get_db), user_api_key: str | None = Depends(get_user_api_key)):
    enforce_action(db, user, "quiz")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    try:
        result = rag_core.generate_quiz(payload.source, text, api_key, num_questions)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Couldn't parse quiz output: {e}")
    record_usage(db, user.id, "quiz")
    return {"result": result}


@router.post("/generate/flashcards")
def generate_flashcards(payload: GenerateRequest, num_cards: int = 10, user=Depends(get_api_key_user), db=Depends(get_db), user_api_key: str | None = Depends(get_user_api_key)):
    enforce_action(db, user, "flashcards")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    try:
        result = rag_core.generate_flashcards(payload.source, text, api_key, num_cards)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Couldn't parse flashcard output: {e}")
    record_usage(db, user.id, "flashcards")
    return {"result": result}

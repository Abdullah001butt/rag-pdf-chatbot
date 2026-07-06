from fastapi import APIRouter, Depends, HTTPException

import rag_core
from db import save_chat_message, load_chat_history
from deps import get_db, get_current_user, get_user_api_key
from schemas import ChatRequest, ChatResponse
from usage_guard import enforce_action
from billing import record_usage
from rag_pipeline import get_or_build_vector_store, resolve_api_key

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history")
def history(user=Depends(get_current_user), db=Depends(get_db)):
    rows = load_chat_history(db, user.id)
    return [
        {"question": q, "answer": a, "model": m, "timestamp": t, "pdf_names": p, "citations": c}
        for q, a, m, t, p, c in rows
    ]


@router.post("/ask", response_model=ChatResponse)
def ask(
    payload: ChatRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_action(db, user, "chat")
    api_key = resolve_api_key(user_api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="Please enter your Google API key in the sidebar first.")

    vector_store = get_or_build_vector_store(user.id, api_key)
    history_rows = load_chat_history(db, user.id)
    history_pairs = [(q, a) for q, a, *_ in history_rows]

    answer, citations, not_found = rag_core.answer_question(vector_store, payload.question, api_key, history_pairs)

    save_chat_message(db, user.id, payload.question, answer, "; ".join(citations), "")
    record_usage(db, user.id, "chat")

    return ChatResponse(answer=answer, citations=citations, not_found=not_found)

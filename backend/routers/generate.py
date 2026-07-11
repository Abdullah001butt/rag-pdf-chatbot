from fastapi import APIRouter, Depends, HTTPException

import rag_core
from deps import get_db, get_current_user, get_user_api_key
from schemas import GenerateRequest, CompareRequest, ResearchRequest, RewriteTextRequest, RewriteTextResponse
from usage_guard import enforce_action, enforce_not_locked
from billing import record_usage
from rag_pipeline import get_or_build_vector_store, get_document_text, resolve_api_key

router = APIRouter(prefix="/generate", tags=["generate"])


def _require_api_key(user_api_key):
    api_key = resolve_api_key(user_api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="Please enter your Google API key in the sidebar first.")
    return api_key


@router.post("/summary")
def summary(
    payload: GenerateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_action(db, user, "summary")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    result = rag_core.generate_summary(payload.source, text, api_key)
    record_usage(db, user.id, "summary")
    return {"result": result}


@router.post("/notes")
def notes(
    payload: GenerateRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_action(db, user, "notes")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    result = rag_core.generate_study_notes(payload.source, text, api_key)
    record_usage(db, user.id, "notes")
    return {"result": result}


@router.post("/quiz")
def quiz(
    payload: GenerateRequest,
    num_questions: int = 5,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_not_locked(user, "quiz")
    enforce_action(db, user, "quiz")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    try:
        result = rag_core.generate_quiz(payload.source, text, api_key, num_questions)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Couldn't parse quiz output: {e}")
    record_usage(db, user.id, "quiz")
    return {"result": result}


@router.post("/flashcards")
def flashcards(
    payload: GenerateRequest,
    num_cards: int = 10,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_not_locked(user, "flashcards")
    enforce_action(db, user, "flashcards")
    api_key = _require_api_key(user_api_key)
    text = get_document_text(user.id, api_key, payload.source)
    try:
        result = rag_core.generate_flashcards(payload.source, text, api_key, num_cards)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Couldn't parse flashcard output: {e}")
    record_usage(db, user.id, "flashcards")
    return {"result": result}


@router.post("/compare")
def compare(
    payload: CompareRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_not_locked(user, "compare")
    enforce_action(db, user, "compare")
    api_key = _require_api_key(user_api_key)
    text_a = get_document_text(user.id, api_key, payload.source_a)
    text_b = get_document_text(user.id, api_key, payload.source_b)
    result = rag_core.generate_comparison(payload.source_a, text_a, payload.source_b, text_b, api_key)
    record_usage(db, user.id, "compare")
    return {"result": result}


@router.post("/research")
def research(
    payload: ResearchRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_not_locked(user, "research")
    enforce_action(db, user, "research")
    api_key = _require_api_key(user_api_key)
    vector_store = get_or_build_vector_store(user.id, api_key)
    try:
        report, sub_questions = rag_core.generate_research_report(payload.topic, vector_store, api_key)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Research generation failed: {e}")
    record_usage(db, user.id, "research")
    return {"report": report, "sub_questions": sub_questions}


@router.post("/rewrite-text", response_model=RewriteTextResponse)
def rewrite_text(
    payload: RewriteTextRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
    user_api_key: str | None = Depends(get_user_api_key),
):
    enforce_action(db, user, "chat")
    api_key = _require_api_key(user_api_key)
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="No text to rewrite.")
    result = rag_core.rewrite_text(payload.text, payload.instruction, api_key)
    record_usage(db, user.id, "chat")
    return RewriteTextResponse(result=result)

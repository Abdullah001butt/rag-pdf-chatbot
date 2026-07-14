from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import get_db, get_current_user
from db import (
    create_automation_rule,
    list_automation_rules,
    set_automation_rule_enabled,
    delete_automation_rule,
    list_automation_runs,
)

router = APIRouter(prefix="/automations", tags=["automations"])

VALID_ACTIONS = {"summary", "notes", "quiz", "flashcards"}


class CreateAutomationRequest(BaseModel):
    name: str
    match_keyword: str = ""
    actions: list[str]
    deliver_email: bool = True


def _rule_to_dict(rule):
    return {
        "id": rule.id,
        "name": rule.name,
        "match_keyword": rule.match_keyword,
        "actions": [a for a in rule.actions.split(",") if a],
        "deliver_email": rule.deliver_email,
        "enabled": rule.enabled,
        "created_at": rule.created_at.isoformat(),
    }


@router.get("")
def list_rules(user=Depends(get_current_user), db=Depends(get_db)):
    return {"rules": [_rule_to_dict(r) for r in list_automation_rules(db, user.id)]}


@router.post("")
def create_rule(payload: CreateAutomationRequest, user=Depends(get_current_user), db=Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Please give the automation a name.")
    actions = [a for a in payload.actions if a in VALID_ACTIONS]
    if not actions:
        raise HTTPException(status_code=400, detail="Choose at least one valid action.")
    rule = create_automation_rule(db, user.id, payload.name.strip(), payload.match_keyword.strip(), ",".join(actions), payload.deliver_email)
    return _rule_to_dict(rule)


@router.patch("/{rule_id}/toggle")
def toggle_rule(rule_id: int, enabled: bool, user=Depends(get_current_user), db=Depends(get_db)):
    ok = set_automation_rule_enabled(db, user.id, rule_id, enabled)
    if not ok:
        raise HTTPException(status_code=404, detail="Automation not found.")
    return {"enabled": enabled}


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    ok = delete_automation_rule(db, user.id, rule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Automation not found.")
    return {"deleted": True}


@router.get("/runs")
def list_runs(user=Depends(get_current_user), db=Depends(get_db)):
    runs = list_automation_runs(db, user.id)
    return {
        "runs": [
            {
                "id": r.id,
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "filename": r.filename,
                "status": r.status,
                "result_text": r.result_text,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat(),
            }
            for r in runs
        ]
    }

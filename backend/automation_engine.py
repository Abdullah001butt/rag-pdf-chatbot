"""Executes 'on upload' automation rules against a newly uploaded document.

Runs synchronously right after upload (no task queue in this deployment), so
each rule's action chain must stay fast enough to run within the upload
request. Failures in one rule/action never abort the upload itself or affect
other rules — everything is caught and recorded as a run record instead.
"""
import logging

import rag_core
from billing import check_usage, record_usage
from db import list_automation_rules, record_automation_run
from email_service import send_automation_result_email
from rag_pipeline import get_document_text

logger = logging.getLogger("documind.automation")

ACTION_LABELS = {"summary": "Summary", "notes": "Study Notes", "quiz": "Quiz", "flashcards": "Flashcards"}


def _run_action(action, filename, text, api_key):
    if action == "summary":
        return rag_core.generate_summary(filename, text, api_key)
    if action == "notes":
        return rag_core.generate_study_notes(filename, text, api_key)
    if action == "quiz":
        questions = rag_core.generate_quiz(filename, text, api_key, 5)
        lines = [f"Q{i + 1}. {q['question']} (Answer: {q['correct']})" for i, q in enumerate(questions)]
        return "\n".join(lines)
    if action == "flashcards":
        cards = rag_core.generate_flashcards(filename, text, api_key, 10)
        lines = [f"{i + 1}. {c['front']} — {c['back']}" for i, c in enumerate(cards)]
        return "\n".join(lines)
    raise ValueError(f"Unknown automation action: {action}")


def run_automations_for_upload(db, user, api_key, filename):
    rules = [r for r in list_automation_rules(db, user.id) if r.enabled]
    if not rules:
        return

    matching = [r for r in rules if not r.match_keyword or r.match_keyword.lower() in filename.lower()]
    if not matching:
        return

    if not api_key:
        for rule in matching:
            record_automation_run(
                db, rule.id, user.id, rule.name, filename, "skipped",
                error_message="No Google API key configured — automation skipped.",
            )
        return

    try:
        text = get_document_text(user.id, api_key, filename)
    except Exception as e:
        for rule in matching:
            record_automation_run(db, rule.id, user.id, rule.name, filename, "error", error_message=str(e))
        return

    for rule in matching:
        actions = [a for a in rule.actions.split(",") if a]
        sections = []
        try:
            for action in actions:
                allowed, reason = check_usage(db, user.tier, user.id, action)
                if not allowed:
                    sections.append(f"## {ACTION_LABELS.get(action, action)}\n(skipped: {reason})")
                    continue
                result = _run_action(action, filename, text, api_key)
                record_usage(db, user.id, action)
                sections.append(f"## {ACTION_LABELS.get(action, action)}\n{result}")

            result_text = "\n\n".join(sections)
            record_automation_run(db, rule.id, user.id, rule.name, filename, "success", result_text=result_text)

            if rule.deliver_email and user.email_verified:
                send_automation_result_email(user.email, user.username, rule.name, filename, result_text)
        except Exception as e:
            logger.error(f"Automation rule {rule.id} failed for user {user.id} on {filename!r}: {e}")
            record_automation_run(db, rule.id, user.id, rule.name, filename, "error", error_message=str(e))

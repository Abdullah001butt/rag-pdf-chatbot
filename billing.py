from datetime import date

from db import UsageEvent, User

TIER_LIMITS = {
    "free": {
        "max_pdfs": 2,
        "daily_actions": 15,
        "locked_features": {"quiz", "flashcards", "compare", "research"},
        "label": "Free",
    },
    "pro": {
        "max_pdfs": 10,
        "daily_actions": None,
        "locked_features": set(),
        "label": "Pro",
    },
}

FEATURE_NAMES = {
    "chat": "Chat question",
    "summary": "Summary generation",
    "notes": "Study notes generation",
    "quiz": "Quiz generation",
    "flashcards": "Flashcard generation",
    "compare": "Document comparison",
    "research": "Research report",
}


def get_tier_limits(tier):
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])


def count_today_actions(db_session, user_id):
    today = date.today()
    return (
        db_session.query(UsageEvent)
        .filter(UsageEvent.user_id == user_id, UsageEvent.event_date == today)
        .count()
    )


def is_feature_locked(tier, action):
    return action in get_tier_limits(tier)["locked_features"]


def check_usage(db_session, tier, user_id, action):
    """Return (allowed: bool, reason: str | None) without recording the event."""
    limits = get_tier_limits(tier)

    if is_feature_locked(tier, action):
        feature_name = FEATURE_NAMES.get(action, action)
        return False, f"{feature_name} is a Pro feature. Upgrade to unlock it."

    if limits["daily_actions"] is not None:
        used_today = count_today_actions(db_session, user_id)
        if used_today >= limits["daily_actions"]:
            return False, f"You've reached your Free tier daily limit ({limits['daily_actions']} actions/day). Upgrade to Pro for unlimited usage."

    return True, None


def record_usage(db_session, user_id, action):
    event = UsageEvent(user_id=user_id, action=action)
    db_session.add(event)
    db_session.commit()


def check_pdf_limit(tier, pdf_count):
    limits = get_tier_limits(tier)
    max_pdfs = limits["max_pdfs"]
    if max_pdfs is not None and pdf_count > max_pdfs:
        return False, f"Your {limits['label']} tier allows up to {max_pdfs} PDFs at a time. Remove some files or upgrade to Pro."
    return True, None


def upgrade_to_pro(db_session, user_id):
    user = db_session.query(User).filter(User.id == user_id).first()
    user.tier = "pro"
    db_session.commit()
    return user.tier


def set_user_tier(db_session, user_id, tier):
    user = db_session.query(User).filter(User.id == user_id).first()
    if user is None:
        return None
    user.tier = tier
    db_session.commit()
    return user

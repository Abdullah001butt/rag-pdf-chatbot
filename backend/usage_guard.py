from fastapi import HTTPException

from billing import check_usage, record_usage, is_feature_locked


def enforce_action(db, user, action):
    allowed, reason = check_usage(db, user.tier, user.id, action)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason)


def enforce_not_locked(user, action):
    if is_feature_locked(user.tier, action):
        raise HTTPException(status_code=403, detail=f"{action} is a Pro feature. Upgrade to unlock it.")

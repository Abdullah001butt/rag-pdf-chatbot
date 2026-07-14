from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func

from deps import get_db, get_current_user
from billing import get_tier_limits, count_today_actions, FEATURE_NAMES
from db import UsageEvent

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def usage_summary(days: int = 30, user=Depends(get_current_user), db=Depends(get_db)):
    days = max(1, min(days, 90))
    start_date = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(UsageEvent.event_date, UsageEvent.action, func.count(UsageEvent.id))
        .filter(UsageEvent.user_id == user.id, UsageEvent.event_date >= start_date)
        .group_by(UsageEvent.event_date, UsageEvent.action)
        .all()
    )

    daily_totals: dict[date, int] = {}
    action_totals: dict[str, int] = {}
    for event_date, action, count in rows:
        daily_totals[event_date] = daily_totals.get(event_date, 0) + count
        action_totals[action] = action_totals.get(action, 0) + count

    daily = []
    cursor = start_date
    today = date.today()
    while cursor <= today:
        daily.append({"date": cursor.isoformat(), "count": daily_totals.get(cursor, 0)})
        cursor += timedelta(days=1)

    by_action = [
        {"action": action, "label": FEATURE_NAMES.get(action, action.title()), "count": count}
        for action, count in sorted(action_totals.items(), key=lambda kv: -kv[1])
    ]

    limits = get_tier_limits(user.tier)
    total_period = sum(action_totals.values())
    busiest_day = max(daily, key=lambda d: d["count"]) if daily and total_period > 0 else None

    return {
        "tier": user.tier,
        "daily_limit": limits["daily_actions"],
        "used_today": count_today_actions(db, user.id),
        "total_period": total_period,
        "days": days,
        "daily": daily,
        "by_action": by_action,
        "busiest_day": busiest_day,
    }

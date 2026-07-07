import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from billing import get_tier_limits, count_today_actions, set_user_tier
from schemas import BillingStatusResponse
from deps import get_db, get_current_user
from db import User
from config import STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
from stripe_service import create_checkout_session, create_billing_portal_session, verify_checkout_session

router = APIRouter(prefix="/billing", tags=["billing"])
logger = logging.getLogger("documind.billing")


def _status_response(user, db) -> BillingStatusResponse:
    limits = get_tier_limits(user.tier)
    return BillingStatusResponse(
        tier=user.tier,
        label=limits["label"],
        max_pdfs=limits["max_pdfs"],
        daily_actions=limits["daily_actions"],
        used_today=count_today_actions(db, user.id),
        locked_features=sorted(limits["locked_features"]),
    )


@router.get("/status", response_model=BillingStatusResponse)
def status(user=Depends(get_current_user), db=Depends(get_db)):
    return _status_response(user, db)


@router.get("/config")
def config():
    return {"publishable_key": STRIPE_PUBLISHABLE_KEY}


@router.post("/checkout")
def checkout(user=Depends(get_current_user), db=Depends(get_db)):
    if user.tier == "pro":
        raise HTTPException(status_code=400, detail="You're already on the Pro plan.")
    try:
        url = create_checkout_session(db, user)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message or str(e)}")
    return {"checkout_url": url}


@router.post("/portal")
def portal(user=Depends(get_current_user)):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found yet.")
    try:
        url = create_billing_portal_session(user)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message or str(e)}")
    return {"portal_url": url}


@router.get("/verify")
def verify(session_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Called by the frontend right after Stripe redirects back, so the UI can
    reflect the upgrade immediately without waiting on the webhook."""
    try:
        session = verify_checkout_session(session_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message or str(e)}")

    metadata = session["metadata"]
    metadata_user_id = metadata["user_id"] if metadata and "user_id" in metadata else None

    if session.payment_status == "paid" and str(metadata_user_id) == str(user.id):
        set_user_tier(db, user.id, "pro")
        db.refresh(user)
        if session.subscription:
            user.stripe_subscription_id = session.subscription
            db.commit()

    return _status_response(user, db)


@router.post("/webhook")
async def webhook(request: Request, db=Depends(get_db)):
    """Stripe's server-to-server source of truth. Configure with:
    stripe listen --forward-to localhost:8000/billing/webhook
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="STRIPE_WEBHOOK_SECRET is not configured.")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        logger.warning("Rejected webhook request with invalid Stripe signature.")
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        metadata = data["metadata"]
        user_id = metadata["user_id"] if metadata and "user_id" in metadata else None
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.tier = "pro"
                subscription_id = data["subscription"] if "subscription" in data else None
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                db.commit()
                logger.info(f"User id={user.id} upgraded to Pro via checkout.session.completed")

    elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
        status_value = data["status"] if "status" in data else None
        customer_id = data["customer"] if "customer" in data else None
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            if event_type == "customer.subscription.deleted" or status_value in ("canceled", "unpaid", "incomplete_expired"):
                user.tier = "free"
                user.stripe_subscription_id = None
                db.commit()
                logger.info(f"User id={user.id} downgraded to Free ({event_type}, status={status_value})")

    return {"received": True}

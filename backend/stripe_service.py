import stripe

from config import STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_AMOUNT, FRONTEND_URL
from db import User

stripe.api_key = STRIPE_SECRET_KEY


def get_or_create_customer(db_session, user: User) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id
    customer = stripe.Customer.create(email=user.email, name=user.username, metadata={"user_id": str(user.id)})
    user.stripe_customer_id = customer.id
    db_session.commit()
    return customer.id


def create_checkout_session(db_session, user: User) -> str:
    customer_id = get_or_create_customer(db_session, user)
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Documind AI — Pro Plan"},
                    "unit_amount": STRIPE_PRO_PRICE_AMOUNT,
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }
        ],
        success_url=f"{FRONTEND_URL}/dashboard?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/dashboard?checkout=cancelled",
        metadata={"user_id": str(user.id)},
    )
    return session.url


def create_billing_portal_session(user: User) -> str:
    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/dashboard",
    )
    return session.url


def verify_checkout_session(session_id: str):
    session = stripe.checkout.Session.retrieve(session_id)
    return session

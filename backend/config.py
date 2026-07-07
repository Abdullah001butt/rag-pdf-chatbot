import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRO_PRICE_AMOUNT = int(os.getenv("STRIPE_PRO_PRICE_AMOUNT", "999"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

DATABASE_URL = os.getenv("DATABASE_URL")  # e.g. postgresql://user:pass@host:5432/documind

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Documind AI <onboarding@resend.dev>")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")
INSECURE_JWT_DEFAULTS = {"dev-only-insecure-secret-change-me", "change-me-to-a-long-random-string", ""}

if JWT_SECRET_KEY in INSECURE_JWT_DEFAULTS:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "JWT_SECRET_KEY is unset or using an insecure default while ENVIRONMENT=production. "
            "Generate one with `python -c \"import secrets; print(secrets.token_hex(32))\"` and set it in .env."
        )
    import warnings

    warnings.warn(
        "JWT_SECRET_KEY is using an insecure default. This is fine for local development only — "
        "set a real secret in .env before deploying.",
        stacklevel=2,
    )

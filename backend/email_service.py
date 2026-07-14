"""Thin wrapper around Resend for transactional emails.

If RESEND_API_KEY isn't configured, sends are skipped with a logged warning
instead of raising — so local development works without an email provider,
and the token itself is still logged so the flow can be tested end-to-end.
"""
import html
import logging

import resend

from config import RESEND_API_KEY, RESEND_FROM_EMAIL, FRONTEND_URL

logger = logging.getLogger("documind.email")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def _send(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not configured — skipping email send. Subject: {subject!r} To: {to!r}")
        return
    try:
        resend.Emails.send({"from": RESEND_FROM_EMAIL, "to": [to], "subject": subject, "html": html})
    except Exception as e:
        logger.error(f"Failed to send email to {to!r}: {e}")


def send_verification_email(to: str, username: str, token: str):
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    logger.info(f"Verification link for {to!r}: {link}")
    _send(
        to,
        "Verify your Documind AI email",
        f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Welcome to Documind AI, {username}!</h2>
            <p>Please verify your email address to finish setting up your account.</p>
            <p><a href="{link}" style="background:#10b981;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Verify Email</a></p>
            <p style="color:#888;font-size:12px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
        </div>
        """,
    )


def send_password_reset_email(to: str, username: str, token: str):
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    logger.info(f"Password reset link for {to!r}: {link}")
    _send(
        to,
        "Reset your Documind AI password",
        f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Hi {username}, we received a request to reset your Documind AI password.</p>
            <p><a href="{link}" style="background:#10b981;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
            <p style="color:#888;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
        """,
    )


def send_automation_result_email(to: str, username: str, rule_name: str, filename: str, summary_text: str):
    link = f"{FRONTEND_URL}/dashboard"
    safe_rule_name = html.escape(rule_name)
    safe_filename = html.escape(filename)
    safe_summary = html.escape(summary_text[:4000])
    _send(
        to,
        f'Your automation "{rule_name}" finished — {filename}',
        f"""
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Automation complete</h2>
            <p>Hi {html.escape(username)}, your automation <strong>{safe_rule_name}</strong> just ran on <strong>{safe_filename}</strong>.</p>
            <div style="border:1px solid #eee;border-radius:12px;padding:16px;margin:16px 0;white-space:pre-wrap;font-size:13px;color:#333;">{safe_summary}</div>
            <p><a href="{link}" style="background:#10b981;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Open Documind AI</a></p>
        </div>
        """,
    )

import logging

from fastapi import APIRouter, Depends, HTTPException

from auth import create_user, authenticate_user, hash_password, verify_password, EMAIL_RE
from schemas import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    RefreshRequest,
    AccessTokenResponse,
    LogoutRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    ChangeEmailRequest,
    DeleteAccountRequest,
    MessageResponse,
)
from security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expiry,
    generate_opaque_token,
    hash_token,
    email_verify_token_expiry,
    password_reset_token_expiry,
)
from deps import get_db, get_current_user
from db import (
    User,
    store_refresh_token,
    get_valid_refresh_token,
    revoke_refresh_token,
    revoke_all_refresh_tokens,
    store_action_token,
    get_valid_action_token,
    consume_action_token,
)
from email_service import send_verification_email, send_password_reset_email
from rate_limit import rate_limiter

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("documind.auth")


def _issue_tokens(db, user):
    access_token = create_access_token(user.id, user.username)
    raw_refresh = generate_refresh_token()
    store_refresh_token(db, user.id, hash_refresh_token(raw_refresh), refresh_token_expiry())
    return access_token, raw_refresh


def _user_response(user) -> UserResponse:
    return UserResponse(
        id=user.id, username=user.username, email=user.email, tier=user.tier, email_verified=user.email_verified
    )


def _send_verification(db, user):
    raw_token = generate_opaque_token()
    store_action_token(db, user.id, hash_token(raw_token), "email_verify", email_verify_token_expiry())
    send_verification_email(user.email, user.username, raw_token)


@router.post("/signup", response_model=TokenResponse, dependencies=[Depends(rate_limiter("signup", 5, 300))])
def signup(payload: SignupRequest, db=Depends(get_db)):
    try:
        user = create_user(db, payload.username, payload.email, payload.password)
    except ValueError as e:
        logger.warning(f"Signup rejected for username={payload.username!r}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    logger.info(f"New user signed up: id={user.id} username={user.username!r}")
    _send_verification(db, user)
    access_token, refresh_token = _issue_tokens(db, user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=_user_response(user))


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limiter("login", 10, 300))])
def login(payload: LoginRequest, db=Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        logger.warning(f"Failed login attempt for username={payload.username!r}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    logger.info(f"User logged in: id={user.id} username={user.username!r}")
    access_token, refresh_token = _issue_tokens(db, user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=_user_response(user))


@router.post("/refresh", response_model=AccessTokenResponse, dependencies=[Depends(rate_limiter("refresh", 20, 300))])
def refresh(payload: RefreshRequest, db=Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    record = get_valid_refresh_token(db, token_hash)
    if record is None:
        raise HTTPException(status_code=401, detail="Refresh token is invalid or expired. Please log in again.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")

    # Rotate: revoke the used refresh token and issue a new one.
    revoke_refresh_token(db, token_hash)
    access_token, new_refresh_token = _issue_tokens(db, user)
    return AccessTokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
def logout(payload: LogoutRequest, db=Depends(get_db)):
    revoke_refresh_token(db, hash_refresh_token(payload.refresh_token))
    return {"logged_out": True}


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return _user_response(user)


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: VerifyEmailRequest, db=Depends(get_db)):
    token_hash = hash_token(payload.token)
    record = get_valid_action_token(db, token_hash, "email_verify")
    if record is None:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise HTTPException(status_code=400, detail="User not found.")

    user.email_verified = True
    consume_action_token(db, token_hash)
    db.commit()
    logger.info(f"Email verified for user id={user.id}")
    return MessageResponse(message="Your email has been verified.")


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limiter("resend-verification", 3, 300))],
)
def resend_verification(user=Depends(get_current_user), db=Depends(get_db)):
    if user.email_verified:
        return MessageResponse(message="Your email is already verified.")
    _send_verification(db, user)
    return MessageResponse(message="Verification email sent.")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limiter("forgot-password", 5, 300))],
)
def forgot_password(payload: ForgotPasswordRequest, db=Depends(get_db)):
    email = payload.email.strip().lower()
    generic_message = MessageResponse(message="If that email is registered, a reset link has been sent.")

    if not EMAIL_RE.match(email):
        return generic_message

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        # Don't reveal whether the email exists.
        return generic_message

    raw_token = generate_opaque_token()
    store_action_token(db, user.id, hash_token(raw_token), "password_reset", password_reset_token_expiry())
    send_password_reset_email(user.email, user.username, raw_token)
    logger.info(f"Password reset requested for user id={user.id}")
    return generic_message


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db=Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    token_hash = hash_token(payload.token)
    record = get_valid_action_token(db, token_hash, "password_reset")
    if record is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise HTTPException(status_code=400, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    consume_action_token(db, token_hash)
    revoke_all_refresh_tokens(db, user.id)
    db.commit()
    logger.info(f"Password reset completed for user id={user.id}; all sessions revoked")
    return MessageResponse(message="Your password has been reset. Please log in again.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, user=Depends(get_current_user), db=Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    logger.info(f"Password changed for user id={user.id}")
    return MessageResponse(message="Your password has been updated.")


@router.post("/change-email", response_model=UserResponse)
def change_email(payload: ChangeEmailRequest, user=Depends(get_current_user), db=Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    new_email = payload.new_email.strip().lower()
    if not EMAIL_RE.match(new_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if db.query(User).filter(User.email == new_email, User.id != user.id).first():
        raise HTTPException(status_code=400, detail="That email is already in use.")

    user.email = new_email
    user.email_verified = False
    db.commit()
    logger.info(f"Email changed for user id={user.id}; re-verification required")
    _send_verification(db, user)
    return _user_response(user)


@router.delete("/account", response_model=MessageResponse)
def delete_account(payload: DeleteAccountRequest, user=Depends(get_current_user), db=Depends(get_db)):
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password.")

    user_id = user.id
    db.delete(user)
    db.commit()
    logger.info(f"Account deleted: id={user_id}")
    return MessageResponse(message="Your account has been deleted.")

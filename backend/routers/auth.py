import logging

from fastapi import APIRouter, Depends, HTTPException

from auth import create_user, authenticate_user
from schemas import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    RefreshRequest,
    AccessTokenResponse,
    LogoutRequest,
)
from security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expiry,
)
from deps import get_db
from db import (
    User,
    store_refresh_token,
    get_valid_refresh_token,
    revoke_refresh_token,
)
from rate_limit import rate_limiter

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("documind.auth")


def _issue_tokens(db, user):
    access_token = create_access_token(user.id, user.username)
    raw_refresh = generate_refresh_token()
    store_refresh_token(db, user.id, hash_refresh_token(raw_refresh), refresh_token_expiry())
    return access_token, raw_refresh


@router.post("/signup", response_model=TokenResponse, dependencies=[Depends(rate_limiter("signup", 5, 300))])
def signup(payload: SignupRequest, db=Depends(get_db)):
    try:
        user = create_user(db, payload.username, payload.email, payload.password)
    except ValueError as e:
        logger.warning(f"Signup rejected for username={payload.username!r}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    logger.info(f"New user signed up: id={user.id} username={user.username!r}")
    access_token, refresh_token = _issue_tokens(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user.id, username=user.username, email=user.email, tier=user.tier),
    )


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limiter("login", 10, 300))])
def login(payload: LoginRequest, db=Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        logger.warning(f"Failed login attempt for username={payload.username!r}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    logger.info(f"User logged in: id={user.id} username={user.username!r}")
    access_token, refresh_token = _issue_tokens(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user.id, username=user.username, email=user.email, tier=user.tier),
    )


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

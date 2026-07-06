from fastapi import APIRouter, Depends, HTTPException

from auth import create_user, authenticate_user
from schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from security import create_access_token
from deps import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db=Depends(get_db)):
    try:
        user = create_user(db, payload.username, payload.email, payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token, user=UserResponse(id=user.id, username=user.username, email=user.email, tier=user.tier))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token, user=UserResponse(id=user.id, username=user.username, email=user.email, tier=user.tier))

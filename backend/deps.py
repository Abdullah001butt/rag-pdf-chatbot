from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from db import get_session, User
from security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_user_api_key(x_gemini_api_key: str | None = Header(default=None)) -> str | None:
    """Per-user Gemini API key sent by the frontend on every request."""
    return x_gemini_api_key

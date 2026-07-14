from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from db import get_session, User, get_api_key_by_hash, touch_api_key
from security import decode_access_token, hash_token

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


def get_api_key_user(x_api_key: str | None = Header(default=None), db=Depends(get_db)) -> User:
    """Auth for the public API (/v1/*): a Documind personal access key,
    distinct from the Gemini key above. Pro-tier only.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-Api-Key header.")
    key_hash = hash_token(x_api_key)
    record = get_api_key_by_hash(db, key_hash)
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key.")
    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="API key owner not found.")
    if user.tier != "pro":
        raise HTTPException(status_code=403, detail="The public API is a Pro feature.")
    touch_api_key(db, record.id)
    return user

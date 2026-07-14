from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from deps import get_db, get_current_user
from security import generate_opaque_token, hash_token
from db import create_api_key, list_api_keys, revoke_api_key, MAX_API_KEYS_PER_USER

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class CreateApiKeyRequest(BaseModel):
    name: str = ""


def _key_to_dict(key):
    return {
        "id": key.id,
        "name": key.name,
        "key_prefix": key.key_prefix,
        "created_at": key.created_at.isoformat(),
        "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
    }


@router.get("")
def list_keys(user=Depends(get_current_user), db=Depends(get_db)):
    if user.tier != "pro":
        raise HTTPException(status_code=403, detail="The public API is a Pro feature.")
    return {"keys": [_key_to_dict(k) for k in list_api_keys(db, user.id)]}


@router.post("")
def create_key(payload: CreateApiKeyRequest, user=Depends(get_current_user), db=Depends(get_db)):
    if user.tier != "pro":
        raise HTTPException(status_code=403, detail="The public API is a Pro feature. Upgrade to generate a key.")
    if len(list_api_keys(db, user.id)) >= MAX_API_KEYS_PER_USER:
        raise HTTPException(status_code=400, detail=f"You can have at most {MAX_API_KEYS_PER_USER} active API keys.")

    raw_key = f"dk_{generate_opaque_token()}"
    key = create_api_key(db, user.id, payload.name.strip(), hash_token(raw_key), raw_key[:10])
    return {**_key_to_dict(key), "key": raw_key}


@router.delete("/{key_id}")
def delete_key(key_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    ok = revoke_api_key(db, user.id, key_id)
    if not ok:
        raise HTTPException(status_code=404, detail="API key not found.")
    return {"revoked": True}

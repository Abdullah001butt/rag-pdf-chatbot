"""In-memory per-user document/vector-store cache for the API process.
Mirrors the Streamlit session_state caching in app.py, but keyed by user_id
since FastAPI has no per-browser session state of its own.
"""

# user_id -> {"files": {filename: bytes}, "pages": [...], "vector_store": FAISS, "signature": tuple}
_user_stores: dict[int, dict] = {}

# workspace_id -> {"vector_store": FAISS, "signature": tuple}
# Separate from _user_stores since workspace documents live in the database,
# not a per-user in-memory file dict.
_workspace_stores: dict[int, dict] = {}


def get_user_store(user_id: int) -> dict:
    return _user_stores.setdefault(user_id, {"files": {}, "pages": None, "vector_store": None, "signature": None})


def reset_user_store(user_id: int):
    _user_stores[user_id] = {"files": {}, "pages": None, "vector_store": None, "signature": None}


def get_workspace_store(workspace_id: int) -> dict:
    return _workspace_stores.setdefault(workspace_id, {"vector_store": None, "signature": None})

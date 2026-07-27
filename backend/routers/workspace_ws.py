"""Live presence/cursor broadcasting for a workspace, over WebSocket.

In-memory only (per-process) — fine for a single Render web service
instance. If this ever runs multi-instance, presence would need to move
to a shared broker (e.g. Redis pub/sub) instead of the process-local
_rooms dict below.
"""
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from db import get_session, User, get_workspace_member
from security import decode_access_token

router = APIRouter(tags=["workspace-presence"])
logger = logging.getLogger("documind.presence")

CURSOR_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#a78bfa", "#ec4899", "#14b8a6", "#f97316"]

# workspace_id -> {websocket: {"user_id", "username", "color"}}
_rooms: dict[int, dict[WebSocket, dict]] = {}


def _color_for(user_id: int) -> str:
    return CURSOR_COLORS[user_id % len(CURSOR_COLORS)]


async def _broadcast(workspace_id: int, message: dict, exclude: WebSocket | None = None):
    room = _rooms.get(workspace_id, {})
    payload = json.dumps(message)
    for ws in list(room.keys()):
        if ws is exclude:
            continue
        try:
            await ws.send_text(payload)
        except Exception:
            pass


@router.websocket("/ws/workspaces/{workspace_id}")
async def workspace_presence(websocket: WebSocket, workspace_id: int, token: str = Query(...)):
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=4401)
        return

    db = get_session()
    try:
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if user is None:
            await websocket.close(code=4401)
            return
        if get_workspace_member(db, workspace_id, user.id) is None:
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await websocket.accept()
    color = _color_for(user.id)
    room = _rooms.setdefault(workspace_id, {})

    await websocket.send_text(json.dumps({"type": "presence", "users": list(room.values())}))

    room[websocket] = {"user_id": user.id, "username": user.username, "color": color}
    await _broadcast(
        workspace_id,
        {"type": "join", "user_id": user.id, "username": user.username, "color": color},
        exclude=websocket,
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except ValueError:
                continue
            if data.get("type") != "cursor":
                continue
            await _broadcast(
                workspace_id,
                {
                    "type": "cursor",
                    "user_id": user.id,
                    "username": user.username,
                    "color": color,
                    "x": data.get("x"),
                    "y": data.get("y"),
                    "page": data.get("page"),
                    "filename": data.get("filename"),
                },
                exclude=websocket,
            )
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Workspace presence socket error (workspace={workspace_id}, user={user.id}): {e}")
    finally:
        room.pop(websocket, None)
        if not room:
            _rooms.pop(workspace_id, None)
        await _broadcast(workspace_id, {"type": "leave", "user_id": user.id})

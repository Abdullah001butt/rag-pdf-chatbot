from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel

from deps import get_db, get_current_user
from db import (
    User,
    create_workspace,
    list_user_workspaces,
    get_workspace,
    get_workspace_member,
    list_workspace_members,
    add_workspace_member,
    remove_workspace_member,
    delete_workspace,
    save_workspace_document,
    list_workspace_documents,
    get_workspace_document,
    delete_workspace_document,
    MAX_WORKSPACE_MEMBERS,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class CreateWorkspaceRequest(BaseModel):
    name: str


class InviteRequest(BaseModel):
    username: str


def _require_pro(user):
    if user.tier != "pro":
        raise HTTPException(status_code=403, detail="Workspaces are a Pro feature. Upgrade to create or join one.")


def _require_membership(db, workspace_id, user_id):
    workspace = get_workspace(db, workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    member = get_workspace_member(db, workspace_id, user_id)
    if member is None:
        raise HTTPException(status_code=403, detail="You're not a member of this workspace.")
    return workspace, member


def _workspace_to_dict(db, workspace, role):
    members = list_workspace_members(db, workspace.id)
    return {
        "id": workspace.id,
        "name": workspace.name,
        "owner_id": workspace.owner_id,
        "role": role,
        "member_count": len(members),
        "created_at": workspace.created_at.isoformat(),
    }


@router.get("")
def list_workspaces(user=Depends(get_current_user), db=Depends(get_db)):
    workspaces = list_user_workspaces(db, user.id)
    result = []
    for w in workspaces:
        member = get_workspace_member(db, w.id, user.id)
        result.append(_workspace_to_dict(db, w, member.role if member else "member"))
    return {"workspaces": result}


@router.post("")
def create_new_workspace(payload: CreateWorkspaceRequest, user=Depends(get_current_user), db=Depends(get_db)):
    _require_pro(user)
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Please give the workspace a name.")
    workspace = create_workspace(db, user.id, payload.name.strip())
    return _workspace_to_dict(db, workspace, "owner")


@router.get("/{workspace_id}/members")
def get_members(workspace_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    _require_membership(db, workspace_id, user.id)
    members = list_workspace_members(db, workspace_id)
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_([m.user_id for m in members])).all()}
    return {
        "members": [
            {
                "user_id": m.user_id,
                "username": users_by_id[m.user_id].username if m.user_id in users_by_id else "unknown",
                "role": m.role,
                "joined_at": m.joined_at.isoformat(),
            }
            for m in members
        ]
    }


@router.post("/{workspace_id}/invite")
def invite_member(workspace_id: int, payload: InviteRequest, user=Depends(get_current_user), db=Depends(get_db)):
    workspace, member = _require_membership(db, workspace_id, user.id)
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="Only the workspace owner can invite members.")

    current_count = len(list_workspace_members(db, workspace_id))
    if current_count >= MAX_WORKSPACE_MEMBERS:
        raise HTTPException(status_code=400, detail=f"Workspaces are limited to {MAX_WORKSPACE_MEMBERS} members.")

    target = db.query(User).filter(User.username == payload.username.strip()).first()
    if target is None:
        raise HTTPException(status_code=404, detail="No user found with that username.")
    if get_workspace_member(db, workspace_id, target.id):
        raise HTTPException(status_code=400, detail="That user is already a member.")

    add_workspace_member(db, workspace_id, target.id)
    return {"added": True, "username": target.username}


@router.delete("/{workspace_id}/members/{target_user_id}")
def remove_member(workspace_id: int, target_user_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    workspace, member = _require_membership(db, workspace_id, user.id)
    if target_user_id == workspace.owner_id:
        raise HTTPException(status_code=400, detail="The owner can't be removed. Delete the workspace instead.")
    if member.role != "owner" and target_user_id != user.id:
        raise HTTPException(status_code=403, detail="Only the workspace owner can remove other members.")
    ok = remove_workspace_member(db, workspace_id, target_user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found.")
    return {"removed": True}


@router.delete("/{workspace_id}")
def delete_workspace_route(workspace_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    workspace, member = _require_membership(db, workspace_id, user.id)
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="Only the workspace owner can delete the workspace.")
    delete_workspace(db, workspace_id)
    return {"deleted": True}


@router.get("/{workspace_id}/documents")
def list_documents(workspace_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    _require_membership(db, workspace_id, user.id)
    docs = list_workspace_documents(db, workspace_id)
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_([d.uploaded_by_id for d in docs])).all()}
    return {
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "size_bytes": d.size_bytes,
                "uploaded_by": users_by_id[d.uploaded_by_id].username if d.uploaded_by_id in users_by_id else "unknown",
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ]
    }


@router.post("/{workspace_id}/documents/upload")
async def upload_document(
    workspace_id: int, files: list[UploadFile] = File(...), user=Depends(get_current_user), db=Depends(get_db)
):
    _require_membership(db, workspace_id, user.id)
    uploaded = []
    for f in files:
        content = await f.read()
        doc = save_workspace_document(db, workspace_id, user.id, f.filename, content)
        uploaded.append(doc.filename)
    return {"uploaded": uploaded}


@router.get("/{workspace_id}/documents/{document_id}/download")
def download_document(workspace_id: int, document_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    _require_membership(db, workspace_id, user.id)
    doc = get_workspace_document(db, workspace_id, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return Response(
        content=doc.file_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.delete("/{workspace_id}/documents/{document_id}")
def delete_document(workspace_id: int, document_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    _require_membership(db, workspace_id, user.id)
    ok = delete_workspace_document(db, workspace_id, document_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"deleted": True}

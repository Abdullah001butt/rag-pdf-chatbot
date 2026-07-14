from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response

from deps import get_db, get_current_user
from db import save_document_version, list_document_versions, get_document_version, delete_document_version

router = APIRouter(prefix="/versions", tags=["versions"])


@router.get("")
def list_versions(filename: str, user=Depends(get_current_user), db=Depends(get_db)):
    versions = list_document_versions(db, user.id, filename)
    return {
        "versions": [
            {
                "id": v.id,
                "filename": v.filename,
                "version_number": v.version_number,
                "label": v.label,
                "size_bytes": v.size_bytes,
                "created_at": v.created_at.isoformat(),
            }
            for v in versions
        ]
    }


@router.post("/save")
async def save_version(
    filename: str = Form(...),
    label: str = Form(""),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large to save as a version (max 20MB).")
    record = save_document_version(db, user.id, filename, label, content)
    return {
        "id": record.id,
        "filename": record.filename,
        "version_number": record.version_number,
        "label": record.label,
        "size_bytes": record.size_bytes,
        "created_at": record.created_at.isoformat(),
    }


@router.get("/{version_id}/download")
def download_version(version_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    record = get_document_version(db, user.id, version_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Version not found.")
    return Response(content=record.file_data, media_type="application/pdf")


@router.delete("/{version_id}")
def delete_version(version_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    deleted = delete_document_version(db, user.id, version_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Version not found.")
    return {"deleted": True}

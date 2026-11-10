from fastapi import APIRouter, HTTPException, Query

from app.services.vector_store import VectorStore
from app.services.workspace import clear_workspace, load_manifest, resolve_file

router = APIRouter(
    prefix="/files",
    tags=["Repository Files"]
)

MAX_VIEW_BYTES = 200_000


@router.get("/")
def list_files():
    """Return the currently indexed repository and its file list."""
    manifest = load_manifest()
    if not manifest:
        return {"repo": None, "uploaded_at": None, "files": [], "chunks": 0}
    return manifest


@router.get("/content")
def get_file_content(path: str = Query(..., description="Repo-relative file path")):
    """Return the text content of a single indexed file."""
    target = resolve_file(path)
    if target is None:
        raise HTTPException(status_code=404, detail="File not found.")

    content = target.read_text(encoding="utf-8", errors="ignore")
    if len(content) > MAX_VIEW_BYTES:
        content = content[:MAX_VIEW_BYTES] + "\n\n... (file truncated for display)"

    return {"path": path, "content": content}


@router.delete("/")
def clear_repository():
    """Remove the indexed repository, extracted files, and vectors."""
    clear_workspace()
    VectorStore().clear()
    return {"message": "Repository cleared."}

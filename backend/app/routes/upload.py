import io
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.chunker import chunk_text
from app.services.embeddings import get_embeddings
from app.services.vector_store import VectorStore
from app.services.workspace import (
    FILES_DIR,
    clear_workspace,
    save_manifest,
)

router = APIRouter(
    prefix="/upload",
    tags=["Code Upload"]
)

vector_store = VectorStore()

# Only index text-like source files; skip binaries and generated folders.
ALLOWED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
    ".java", ".kt", ".kts", ".scala", ".groovy", ".gradle",
    ".c", ".h", ".cpp", ".hpp", ".cc", ".hh", ".cs",
    ".go", ".rs", ".rb", ".php", ".swift", ".m", ".mm", ".dart", ".lua",
    ".pl", ".ex", ".exs", ".clj", ".hs", ".r",
    ".sh", ".bash", ".zsh", ".ps1", ".bat",
    ".sql", ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
    ".md", ".mdx", ".txt", ".xml", ".tf", ".properties", ".env.example",
}

ALLOWED_FILENAMES = {
    "dockerfile", "makefile", "procfile", "gemfile", "rakefile",
    "cmakelists.txt", "requirements.txt", "package.json",
}

IGNORED_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "venv", ".venv", "env",
    "__pycache__", "dist", "build", "out", "target", ".next", ".nuxt",
    "coverage", ".pytest_cache", ".mypy_cache", ".idea", ".vscode",
    "__MACOSX", "vendor", "bower_components",
}

MAX_FILE_BYTES = 512 * 1024          # skip individual files over 512 KB
MAX_FILES = 400                      # skip extra files after this many
MAX_CHUNKS = 250                     # bound embedding cost/time per upload


def _is_code_file(name: str) -> bool:
    lowered = name.lower()
    return Path(lowered).suffix in ALLOWED_EXTENSIONS or lowered in ALLOWED_FILENAMES


def _safe_parts(zip_name: str) -> list[str] | None:
    """Normalise a zip entry path and reject absolute/traversal paths."""
    rel = zip_name.replace("\\", "/")
    parts = [part for part in rel.split("/") if part not in ("", ".")]
    if not parts or any(part == ".." for part in parts):
        return None
    return parts


def _extract_zip(data: bytes) -> tuple[list[dict], int]:
    saved: list[dict] = []
    skipped = 0

    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue

            parts = _safe_parts(info.filename)
            if parts is None:
                skipped += 1
                continue

            # Skip hidden files and anything inside ignored directories
            if any(part.startswith(".") for part in parts):
                skipped += 1
                continue
            if any(part in IGNORED_DIRS for part in parts[:-1]):
                skipped += 1
                continue

            name = parts[-1]
            if not _is_code_file(name) or info.file_size > MAX_FILE_BYTES:
                skipped += 1
                continue

            if len(saved) >= MAX_FILES:
                skipped += 1
                continue

            target = FILES_DIR.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as src, open(target, "wb") as dst:
                dst.write(src.read())

            saved.append({"path": "/".join(parts), "size": info.file_size})

    return saved, skipped


def _save_single_file(filename: str, data: bytes) -> list[dict]:
    name = Path(filename).name
    target = FILES_DIR / name
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "wb") as f:
        f.write(data)
    return [{"path": name, "size": len(data)}]


def _build_chunks(files: list[dict]) -> list[dict]:
    chunks: list[dict] = []
    for entry in files:
        path = entry["path"]
        file_path = FILES_DIR.joinpath(*path.split("/"))
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if not text.strip():
            continue

        for index, chunk in enumerate(chunk_text(text)):
            if not chunk.strip():
                continue
            chunks.append({
                "id": f"{path}:{index}",
                "text": chunk,
                "metadata": {"path": path},
            })
            if len(chunks) >= MAX_CHUNKS:
                return chunks

    return chunks


@router.post("/")
def upload_code(file: UploadFile = File(...)):
    """
    Upload a repository (.zip) or a single source file.
    Extracts code, chunks it, embeds it, and stores it in the vector store.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    is_zip = file.filename.lower().endswith(".zip")
    if not is_zip and not _is_code_file(Path(file.filename).name):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload a .zip archive or a source code file.",
        )

    repo_name = Path(file.filename).stem if is_zip else Path(file.filename).name

    # Replace any previously indexed repository
    clear_workspace()
    vector_store.clear()

    if is_zip:
        try:
            files, skipped = _extract_zip(data)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid .zip archive.")
    else:
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File is too large (max 512 KB).")
        files = _save_single_file(file.filename, data)
        skipped = 0

    if not files:
        raise HTTPException(
            status_code=400,
            detail="No supported source files were found in the upload.",
        )

    chunks = _build_chunks(files)
    if not chunks:
        raise HTTPException(status_code=400, detail="No readable text was found in the uploaded files.")

    try:
        embeddings = get_embeddings([chunk["text"] for chunk in chunks])
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if len(embeddings) != len(chunks):
        raise HTTPException(
            status_code=502,
            detail="Embedding service returned an unexpected number of vectors. Please try again.",
        )

    vector_store.add_vectors([
        {
            "id": chunk["id"],
            "text": chunk["text"],
            "embedding": embedding,
            "metadata": chunk["metadata"],
        }
        for chunk, embedding in zip(chunks, embeddings)
    ])

    save_manifest({
        "repo": repo_name,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "files": files,
        "chunks": len(chunks),
    })

    return {
        "message": f"'{repo_name}' uploaded and indexed successfully!",
        "repo": repo_name,
        "files_indexed": len(files),
        "chunks_added": len(chunks),
        "files_skipped": skipped,
    }

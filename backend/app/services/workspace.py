import json
import shutil
from pathlib import Path

# Resolve relative to backend/app so the app works from any working directory.
APP_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = APP_DIR / "workspace"
FILES_DIR = WORKSPACE_ROOT / "files"
MANIFEST_FILE = WORKSPACE_ROOT / "manifest.json"

WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)
FILES_DIR.mkdir(parents=True, exist_ok=True)


def clear_workspace():
    """Remove all extracted files and the manifest."""
    if FILES_DIR.exists():
        shutil.rmtree(FILES_DIR)
    FILES_DIR.mkdir(parents=True, exist_ok=True)
    if MANIFEST_FILE.exists():
        MANIFEST_FILE.unlink()


def load_manifest() -> dict | None:
    if not MANIFEST_FILE.exists():
        return None
    try:
        with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def save_manifest(manifest: dict):
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


def resolve_file(rel_path: str) -> Path | None:
    """Safely resolve a repo-relative path, preventing directory traversal."""
    target = (FILES_DIR / rel_path).resolve()
    root = FILES_DIR.resolve()
    if target != root and root not in target.parents:
        return None
    return target if target.is_file() else None

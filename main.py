"""Entry point for deployments that run from the repository root.

Render (and similar hosts) build from the repo root, while the FastAPI
application lives in ``backend/``. This module puts ``backend`` on the
import path and exposes the app as ``main:app``.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402,F401

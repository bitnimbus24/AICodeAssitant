"""Entry point for deployments whose root directory is ``backend/``.

Allows ``uvicorn main:app`` to work from either the repository root or the
``backend`` directory.
"""

from app.main import app  # noqa: E402,F401

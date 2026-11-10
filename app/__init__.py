"""Compatibility shim for deployments that run ``uvicorn app.main:app`` from
the repository root.

The real application package lives in ``backend/app``. Extending ``__path__``
lets Python resolve ``app.*`` submodules from there without duplicating files.
"""

from pathlib import Path

_BACKEND_APP = Path(__file__).resolve().parent.parent / "backend" / "app"
if _BACKEND_APP.is_dir():
    __path__.append(str(_BACKEND_APP))

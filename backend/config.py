"""Configuration for LifeOS backend.

Loads Cognee Cloud credentials from `.env.local` (project root) or `.env`.
The provided keys use hyphenated names (`API-Base-URL`, `API-KEY`), which are
not valid shell identifiers, so we read them explicitly by their literal names
and fall back to conventional `COGNEE_*` names if present.
"""

import os
from pathlib import Path

from dotenv import dotenv_values

# Resolve project root (one level up from backend/)
_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent

# Merge .env.local (preferred) and .env into a single mapping without polluting
# os.environ (the hyphenated keys are not valid env var names on all shells).
_env: dict[str, str] = {}
for _name in (".env", ".env.local"):
    _path = _PROJECT_ROOT / _name
    if _path.exists():
        _env.update({k: v for k, v in dotenv_values(_path).items() if v is not None})
# Also allow real environment overrides.
_env.update({k: v for k, v in os.environ.items()})


def _first(*keys: str, default: str | None = None) -> str | None:
    for key in keys:
        val = _env.get(key)
        if val:
            return val.strip()
    return default


# Base URL of the Cognee Cloud tenant, e.g. https://tenant-xxxx.aws.cognee.ai
COGNEE_BASE_URL = (
    _first("COGNEE_BASE_URL", "API-Base-URL", "API_BASE_URL", default="") or ""
).rstrip("/")

# API key sent as the `X-Api-Key` header for the hosted tenant.
COGNEE_API_KEY = _first("COGNEE_API_KEY", "API-KEY", "API_KEY", default="") or ""

# All hosted routes are versioned under /api/v1.
API_PREFIX = "/api/v1"

# Frontend origin allowed by CORS.
FRONTEND_ORIGIN = _first("FRONTEND_ORIGIN", default="http://localhost:5173")


def assert_configured() -> None:
    """Raise a clear error if credentials are missing."""
    missing = []
    if not COGNEE_BASE_URL:
        missing.append("API-Base-URL")
    if not COGNEE_API_KEY:
        missing.append("API-KEY")
    if missing:
        raise RuntimeError(
            f"Missing Cognee Cloud credentials ({', '.join(missing)}). "
            f"Add them to {_PROJECT_ROOT / '.env.local'}."
        )

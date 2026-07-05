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

# Where the backend redirects the browser back to after an OAuth connect.
FRONTEND_APP_URL = _first("FRONTEND_APP_URL", default="http://localhost:5173/app")

# Comma-separated list of allowed CORS origins (the deployed frontend + local).
_cors_raw = _first("CORS_ORIGINS", default="") or ""
CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()] or [
    FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Also allow any *.vercel.app preview/prod deployment via regex.
CORS_ORIGIN_REGEX = _first("CORS_ORIGIN_REGEX", default=r"https://.*\.vercel\.app")

# --- OAuth connector credentials (all optional; a connector is "configured"
# only when its client id + secret are present) ---------------------------- #
GOOGLE_CLIENT_ID = _first("GOOGLE_CLIENT_ID", default="") or ""
GOOGLE_CLIENT_SECRET = _first("GOOGLE_CLIENT_SECRET", default="") or ""
GOOGLE_REDIRECT_URI = _first(
    "GOOGLE_REDIRECT_URI", default="http://localhost:8000/auth/google/callback"
)

NOTION_CLIENT_ID = _first("NOTION_CLIENT_ID", default="") or ""
NOTION_CLIENT_SECRET = _first("NOTION_CLIENT_SECRET", default="") or ""
NOTION_REDIRECT_URI = _first(
    "NOTION_REDIRECT_URI", default="http://localhost:8000/auth/notion/callback"
)

SLACK_CLIENT_ID = _first("SLACK_CLIENT_ID", default="") or ""
SLACK_CLIENT_SECRET = _first("SLACK_CLIENT_SECRET", default="") or ""
SLACK_REDIRECT_URI = _first(
    "SLACK_REDIRECT_URI", default="http://localhost:8000/auth/slack/callback"
)

# Allow OAuth over http://localhost during local dev (google-auth-oauthlib
# otherwise refuses the non-HTTPS callback).
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")


def google_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def notion_configured() -> bool:
    return bool(NOTION_CLIENT_ID and NOTION_CLIENT_SECRET)


def slack_configured() -> bool:
    return bool(SLACK_CLIENT_ID and SLACK_CLIENT_SECRET)


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

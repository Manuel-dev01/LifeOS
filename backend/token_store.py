"""Dead-simple per-provider OAuth token persistence for the single-user demo.

Stores tokens in a local JSON file (gitignored). Not for multi-user production
(no encryption, no per-user keys) — adequate for a local hackathon demo.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

# Persist to TOKEN_STORE_PATH when set (e.g. a Railway persistent volume at
# /data/.oauth_tokens.json) so connected accounts survive redeploys/restarts.
# Falls back to a file next to the code for local dev.
_PATH = Path(
    os.environ.get("TOKEN_STORE_PATH")
    or (Path(__file__).resolve().parent / ".oauth_tokens.json")
)


def _ensure_parent() -> None:
    try:
        _PATH.parent.mkdir(parents=True, exist_ok=True)
    except Exception:  # noqa: BLE001
        pass


def _load() -> dict[str, Any]:
    if not _PATH.exists():
        return {}
    try:
        return json.loads(_PATH.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}


def save(provider: str, data: dict[str, Any]) -> None:
    _ensure_parent()
    store = _load()
    store[provider] = data
    _PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")


def get(provider: str) -> Optional[dict[str, Any]]:
    return _load().get(provider)


def is_connected(provider: str) -> bool:
    return provider in _load()


def clear(provider: str) -> None:
    store = _load()
    if provider in store:
        del store[provider]
        _PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")

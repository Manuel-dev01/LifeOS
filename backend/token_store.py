"""Dead-simple per-provider OAuth token persistence for the single-user demo.

Stores tokens in a local JSON file (gitignored). Not for multi-user production
(no encryption, no per-user keys) — adequate for a local hackathon demo.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

_PATH = Path(__file__).resolve().parent / ".oauth_tokens.json"


def _load() -> dict[str, Any]:
    if not _PATH.exists():
        return {}
    try:
        return json.loads(_PATH.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}


def save(provider: str, data: dict[str, Any]) -> None:
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

"""Notion connector — OAuth + fetch recent pages as prose. Credential-gated."""

from __future__ import annotations

import base64
import logging
from typing import Any
from urllib.parse import urlencode

import httpx

import config
import token_store

logger = logging.getLogger("lifeos.notion")
PROVIDER = "notion"
_NOTION_VERSION = "2022-06-28"


def login_url() -> str:
    params = {
        "client_id": config.NOTION_CLIENT_ID,
        "response_type": "code",
        "owner": "user",
        "redirect_uri": config.NOTION_REDIRECT_URI,
    }
    return f"https://api.notion.com/v1/oauth/authorize?{urlencode(params)}"


async def exchange_code(code: str) -> dict[str, Any]:
    basic = base64.b64encode(
        f"{config.NOTION_CLIENT_ID}:{config.NOTION_CLIENT_SECRET}".encode()
    ).decode()
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.notion.com/v1/oauth/token",
            headers={"Authorization": f"Basic {basic}", "Content-Type": "application/json"},
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": config.NOTION_REDIRECT_URI,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    token_store.save(PROVIDER, data)
    return data


async def fetch_pages(limit: int = 20) -> list[str]:
    data = token_store.get(PROVIDER)
    if not data:
        return []
    token = data.get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": _NOTION_VERSION,
        "Content-Type": "application/json",
    }
    out: list[str] = []
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.notion.com/v1/search",
            headers=headers,
            json={"page_size": limit, "filter": {"property": "object", "value": "page"}},
        )
        resp.raise_for_status()
        for page in resp.json().get("results", []):
            title = _page_title(page)
            out.append(f"Notion page '{title}'.")
    return out


def _page_title(page: dict[str, Any]) -> str:
    props = page.get("properties", {})
    for prop in props.values():
        if prop.get("type") == "title":
            arr = prop.get("title", [])
            if arr:
                return "".join(t.get("plain_text", "") for t in arr)
    return "Untitled"

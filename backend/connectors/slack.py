"""Slack connector — OAuth + fetch recent channel messages. Credential-gated."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

import httpx

import config
import token_store

logger = logging.getLogger("lifeos.slack")
PROVIDER = "slack"
_USER_SCOPES = "channels:history,channels:read,search:read"


def login_url() -> str:
    params = {
        "client_id": config.SLACK_CLIENT_ID,
        "user_scope": _USER_SCOPES,
        "redirect_uri": config.SLACK_REDIRECT_URI,
    }
    return f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"


async def exchange_code(code: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": config.SLACK_CLIENT_ID,
                "client_secret": config.SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": config.SLACK_REDIRECT_URI,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    if not data.get("ok"):
        raise RuntimeError(f"Slack OAuth error: {data.get('error')}")
    token_store.save(PROVIDER, data)
    return data


def _user_token() -> str | None:
    data = token_store.get(PROVIDER)
    if not data:
        return None
    return (data.get("authed_user") or {}).get("access_token") or data.get("access_token")


async def fetch_messages(channel_limit: int = 3, msg_limit: int = 20) -> list[str]:
    token = _user_token()
    if not token:
        return []
    headers = {"Authorization": f"Bearer {token}"}
    out: list[str] = []
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        chans = await client.get(
            "https://slack.com/api/conversations.list",
            params={"types": "public_channel", "limit": channel_limit},
        )
        for ch in chans.json().get("channels", [])[:channel_limit]:
            hist = await client.get(
                "https://slack.com/api/conversations.history",
                params={"channel": ch["id"], "limit": msg_limit},
            )
            cname = ch.get("name", "channel")
            for m in hist.json().get("messages", []):
                text = (m.get("text") or "").strip()
                if text:
                    out.append(f"Slack message in #{cname}: {text[:800]}")
    return out

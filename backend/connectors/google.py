"""Google connector — Gmail + Calendar + Drive over one OAuth grant.

Exposes the OAuth dance (login_url / exchange_code) and three fetchers that
return lists of prose strings ready for cognee_client.remember_batch.
"""

from __future__ import annotations

import base64
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

import config
import token_store

logger = logging.getLogger("lifeos.google")

# Google sometimes returns 'openid' in addition to requested scopes; relax so
# the token exchange doesn't raise on the scope difference.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

PROVIDER = "google"


def _client_config() -> dict[str, Any]:
    return {
        "web": {
            "client_id": config.GOOGLE_CLIENT_ID,
            "client_secret": config.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [config.GOOGLE_REDIRECT_URI],
        }
    }


def _flow(state: str | None = None) -> Flow:
    # This is a confidential web client (we hold client_secret), so PKCE is
    # optional. We disable auto-PKCE because login and callback are separate
    # stateless requests: authorization_url() would mint a code_verifier that
    # the fresh Flow in exchange_code() can't reproduce, and Google would
    # reject the token exchange with invalid_grant. No verifier, no mismatch.
    return Flow.from_client_config(
        _client_config(),
        scopes=SCOPES,
        redirect_uri=config.GOOGLE_REDIRECT_URI,
        state=state,
        autogenerate_code_verifier=False,
    )


def login_url() -> str:
    flow = _flow()
    url, _state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return url


def exchange_code(code: str) -> Credentials:
    flow = _flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    token_store.save(
        PROVIDER,
        {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes or SCOPES),
        },
    )
    return creds


def _credentials() -> Credentials | None:
    data = token_store.get(PROVIDER)
    if not data:
        return None
    return Credentials(
        token=data.get("token"),
        refresh_token=data.get("refresh_token"),
        token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=data.get("client_id", config.GOOGLE_CLIENT_ID),
        client_secret=data.get("client_secret", config.GOOGLE_CLIENT_SECRET),
        scopes=data.get("scopes", SCOPES),
    )


# --------------------------------------------------------------------------- #
# Fetchers → prose lists
# --------------------------------------------------------------------------- #
def fetch_all(creds: Credentials) -> dict[str, list[str]]:
    """Return {'gmail': [...], 'calendar': [...], 'drive': [...]}."""
    out: dict[str, list[str]] = {}
    for name, fn in (("gmail", fetch_gmail), ("calendar", fetch_calendar), ("drive", fetch_drive)):
        try:
            out[name] = fn(creds)
        except Exception as e:  # noqa: BLE001
            logger.warning("google fetch %s failed: %s", name, e)
            out[name] = []
    return out


def fetch_gmail(creds: Credentials, limit: int = 25) -> list[str]:
    svc = build("gmail", "v1", credentials=creds, cache_discovery=False)
    listing = (
        svc.users()
        .messages()
        .list(userId="me", maxResults=limit, q="newer_than:30d")
        .execute()
    )
    out: list[str] = []
    for ref in listing.get("messages", []):
        try:
            msg = svc.users().messages().get(userId="me", id=ref["id"], format="full").execute()
            headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
            body = _extract_body(msg.get("payload", {}))
            sender = headers.get("from", "unknown")
            subject = headers.get("subject", "(no subject)")
            date = headers.get("date", "")
            snippet = (body or msg.get("snippet", "")).strip()[:2000]
            out.append(
                f"Email from {sender} on {date}. Subject: '{subject}'. {snippet}"
            )
        except Exception as e:  # noqa: BLE001
            logger.debug("skip gmail message: %s", e)
    return out


def fetch_calendar(creds: Credentials, limit: int = 25) -> list[str]:
    svc = build("calendar", "v3", credentials=creds, cache_discovery=False)
    time_min = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    events = (
        svc.events()
        .list(
            calendarId="primary",
            timeMin=time_min,
            maxResults=limit,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    out: list[str] = []
    for ev in events.get("items", []):
        summary = ev.get("summary", "Untitled event")
        start = ev.get("start", {}).get("dateTime") or ev.get("start", {}).get("date", "")
        location = ev.get("location", "")
        attendees = ", ".join(a.get("email", "") for a in ev.get("attendees", []) if a.get("email"))
        desc = (ev.get("description", "") or "").strip()[:800]
        parts = [f"Calendar event '{summary}' on {start}"]
        if location:
            parts.append(f"at {location}")
        if attendees:
            parts.append(f"with {attendees}")
        line = ", ".join(parts) + "."
        if desc:
            line += f" {desc}"
        out.append(line)
    return out


def fetch_drive(creds: Credentials, limit: int = 15) -> list[str]:
    svc = build("drive", "v3", credentials=creds, cache_discovery=False)
    files = (
        svc.files()
        .list(
            q="mimeType='application/vnd.google-apps.document' and trashed=false",
            pageSize=limit,
            fields="files(id,name)",
            orderBy="modifiedTime desc",
        )
        .execute()
    )
    out: list[str] = []
    for f in files.get("files", []):
        try:
            text = (
                svc.files()
                .export(fileId=f["id"], mimeType="text/plain")
                .execute()
            )
            if isinstance(text, bytes):
                text = text.decode("utf-8", errors="ignore")
            out.append(f"Document '{f.get('name','Untitled')}': {text.strip()[:2000]}")
        except Exception as e:  # noqa: BLE001
            logger.debug("skip drive file: %s", e)
    return out


def _extract_body(payload: dict[str, Any]) -> str:
    """Recursively pull the first text/plain body from a Gmail payload."""
    mime = payload.get("mimeType", "")
    body = payload.get("body", {})
    if mime == "text/plain" and body.get("data"):
        return _b64(body["data"])
    for part in payload.get("parts", []) or []:
        text = _extract_body(part)
        if text:
            return text
    # fall back to html stripped
    if mime == "text/html" and body.get("data"):
        import re

        return re.sub(r"<[^>]+>", " ", _b64(body["data"]))
    return ""


def _b64(data: str) -> str:
    padded = data + "=" * (-len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded).decode("utf-8", errors="ignore")
    except Exception:  # noqa: BLE001
        return ""

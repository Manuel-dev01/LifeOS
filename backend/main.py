"""LifeOS FastAPI backend — a thin, typed proxy to Cognee Cloud.

Endpoints (per CLAUDE.md contract):
    POST   /ingest/text        remember() raw text
    POST   /ingest/file        remember() an uploaded file
    POST   /ingest/calendar    remember() calendar events (ICS)
    POST   /query              recall() with cited sources (+ optional graph)
    POST   /improve            improve() — re-cognify / enrich the graph
    DELETE /forget/{name}      forget() a dataset by name or id
    GET    /datasets           list datasets (for the sidebar / forget UI)
    GET    /health             tenant connectivity check
"""

from __future__ import annotations

import logging
import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

import cognee_client
import config
import insights
import token_store
from config import FRONTEND_ORIGIN, assert_configured
from connectors import google as gconn
from connectors import notion as nconn
from connectors import slack as sconn
from ingestion import ics_to_memory_text
from models import (
    CalendarReq,
    Dataset,
    ImproveReq,
    IngestTextReq,
    QueryReq,
    QueryResp,
    StatusResp,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifeos")

app = FastAPI(title="LifeOS API", version="1.0.0", description="Personal AI Memory Vault")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    try:
        assert_configured()
        logger.info("LifeOS backend up. Cognee tenant configured.")
    except Exception as e:  # noqa: BLE001
        logger.error("Startup config problem: %s", e)


def _handle(action: str, e: Exception) -> HTTPException:
    logger.exception("%s failed", action)
    return HTTPException(status_code=502, detail=f"{action} failed: {e}")


# ------------------------------ Health ------------------------------ #
@app.get("/health")
async def health() -> dict:
    try:
        return await cognee_client.ping()
    except Exception as e:  # noqa: BLE001
        raise _handle("health", e)


# ------------------------------ Ingest ------------------------------ #
@app.post("/ingest/text", response_model=StatusResp)
async def ingest_text(req: IngestTextReq) -> StatusResp:
    try:
        result = await cognee_client.remember_text(req.text, req.dataset_name)
        insights.invalidate()
        return StatusResp(status=f"Remembered into '{req.dataset_name}'", detail=result)
    except Exception as e:  # noqa: BLE001
        raise _handle("ingest_text", e)


@app.post("/ingest/file", response_model=StatusResp)
async def ingest_file(
    file: UploadFile = File(...), dataset_name: str = "upload"
) -> StatusResp:
    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename or "upload")[1] or ".txt"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        result = await cognee_client.remember_file(
            tmp_path, dataset_name=dataset_name, filename=file.filename
        )
        insights.invalidate()
        return StatusResp(status=f"Remembered file into '{dataset_name}'", detail=result)
    except Exception as e:  # noqa: BLE001
        raise _handle("ingest_file", e)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/ingest/calendar", response_model=StatusResp)
async def ingest_calendar(req: CalendarReq) -> StatusResp:
    try:
        memory_text = ics_to_memory_text(req.ics_text)
        if not memory_text.strip():
            raise ValueError("No events parsed from ICS content.")
        result = await cognee_client.remember_text(memory_text, req.dataset_name)
        insights.invalidate()
        return StatusResp(status=f"Remembered calendar into '{req.dataset_name}'", detail=result)
    except Exception as e:  # noqa: BLE001
        raise _handle("ingest_calendar", e)


# ------------------------------ Query ------------------------------ #
@app.post("/query", response_model=QueryResp)
async def query(req: QueryReq) -> QueryResp:
    try:
        result = await cognee_client.recall(req.question, top_k=req.top_k)
        graph = None
        if req.include_graph:
            graph = cognee_client.graph_from_recall(req.question, result)
        return QueryResp(answer=result["answer"], sources=result["sources"], graph=graph)
    except Exception as e:  # noqa: BLE001
        raise _handle("query", e)


# ------------------------------ Improve ------------------------------ #
@app.post("/improve", response_model=StatusResp)
async def improve(req: ImproveReq | None = None) -> StatusResp:
    try:
        datasets = req.datasets if req else None
        result = await cognee_client.improve(datasets)
        insights.invalidate()
        return StatusResp(status="Memory improved (graph re-enriched)", detail=result)
    except Exception as e:  # noqa: BLE001
        raise _handle("improve", e)


# ------------------------------ Datasets / Forget ------------------------------ #
@app.get("/datasets", response_model=list[Dataset])
async def datasets() -> list[Dataset]:
    try:
        items = await cognee_client.list_datasets()
        return [Dataset(id=d["id"], name=d["name"]) for d in items]
    except Exception as e:  # noqa: BLE001
        raise _handle("datasets", e)


@app.delete("/forget/{name_or_id}", response_model=StatusResp)
async def forget(name_or_id: str) -> StatusResp:
    try:
        dataset_id = await cognee_client.resolve_dataset_id(name_or_id)
        if not dataset_id:
            raise HTTPException(status_code=404, detail=f"Dataset '{name_or_id}' not found")
        result = await cognee_client.forget_dataset(dataset_id)
        insights.invalidate()
        return StatusResp(status=f"Forgot dataset '{name_or_id}'", detail=result)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise _handle("forget", e)


@app.delete("/vault", response_model=StatusResp)
async def delete_vault() -> StatusResp:
    """Delete every dataset — the Settings 'Delete my vault' action."""
    try:
        datasets_ = await cognee_client.list_datasets()
        deleted = 0
        for d in datasets_:
            if d["id"]:
                await cognee_client.forget_dataset(d["id"])
                deleted += 1
        insights.invalidate()
        return StatusResp(status=f"Vault deleted ({deleted} datasets forgotten)")
    except Exception as e:  # noqa: BLE001
        raise _handle("delete_vault", e)


@app.get("/export")
async def export_vault() -> dict:
    """Dump all datasets + their data items as JSON (Settings 'Export')."""
    try:
        out = []
        for d in await cognee_client.list_datasets():
            items = await cognee_client.list_dataset_data(d["id"]) if d["id"] else []
            out.append({"dataset": d["name"], "id": d["id"], "data": items})
        return {"datasets": out}
    except Exception as e:  # noqa: BLE001
        raise _handle("export", e)


# ------------------------------ Insights (dynamic) ------------------------------ #
@app.get("/people")
async def people() -> list[dict]:
    try:
        return await insights.get_people()
    except Exception as e:  # noqa: BLE001
        raise _handle("people", e)


@app.get("/people/{name}")
async def person(name: str) -> dict:
    try:
        result = await insights.get_person(name)
        if not result:
            raise HTTPException(status_code=404, detail=f"No memories about '{name}'")
        return result
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise _handle("person", e)


@app.get("/timeline")
async def timeline() -> list[dict]:
    try:
        return await insights.get_timeline()
    except Exception as e:  # noqa: BLE001
        raise _handle("timeline", e)


@app.get("/graph")
async def graph() -> dict:
    try:
        return await insights.get_entity_graph()
    except Exception as e:  # noqa: BLE001
        raise _handle("graph", e)


# ------------------------------ Connectors / OAuth ------------------------------ #
# Google covers gmail/calendar/drive cards; notion/slack are their own providers.
_GOOGLE_CARDS = ("gmail", "calendar", "drive")


@app.get("/connectors")
async def connectors() -> dict:
    """Per-card connection + configuration status for the UI."""
    google_on = token_store.is_connected("google")
    return {
        "gmail": {"provider": "google", "configured": config.google_configured(), "connected": google_on},
        "calendar": {"provider": "google", "configured": config.google_configured(), "connected": google_on},
        "drive": {"provider": "google", "configured": config.google_configured(), "connected": google_on},
        "notion": {"provider": "notion", "configured": config.notion_configured(), "connected": token_store.is_connected("notion")},
        "slack": {"provider": "slack", "configured": config.slack_configured(), "connected": token_store.is_connected("slack")},
        "apple_notes": {"provider": None, "configured": False, "connected": False, "note": "No public API; use file import"},
    }


@app.get("/auth/{provider}/login")
async def auth_login(provider: str):
    try:
        if provider == "google":
            if not config.google_configured():
                raise HTTPException(400, "Google not configured. Add GOOGLE_CLIENT_ID/SECRET to .env.local")
            return RedirectResponse(gconn.login_url())
        if provider == "notion":
            if not config.notion_configured():
                raise HTTPException(400, "Notion not configured.")
            return RedirectResponse(nconn.login_url())
        if provider == "slack":
            if not config.slack_configured():
                raise HTTPException(400, "Slack not configured.")
            return RedirectResponse(sconn.login_url())
        raise HTTPException(404, f"Unknown provider '{provider}'")
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise _handle("auth_login", e)


@app.get("/auth/{provider}/callback")
async def auth_callback(provider: str, code: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(f"{config.FRONTEND_APP_URL}?connect_error={error}")
    if not code:
        return RedirectResponse(f"{config.FRONTEND_APP_URL}?connect_error=missing_code")
    try:
        total = 0
        if provider == "google":
            creds = await run_in_threadpool(gconn.exchange_code, code)
            fetched = await run_in_threadpool(gconn.fetch_all, creds)
            for dataset, texts in fetched.items():
                if texts:
                    await cognee_client.remember_batch(texts, dataset)
                    total += len(texts)
        elif provider == "notion":
            await nconn.exchange_code(code)
            texts = await nconn.fetch_pages()
            if texts:
                await cognee_client.remember_batch(texts, "notion")
                total += len(texts)
        elif provider == "slack":
            await sconn.exchange_code(code)
            texts = await sconn.fetch_messages()
            if texts:
                await cognee_client.remember_batch(texts, "slack")
                total += len(texts)
        else:
            return RedirectResponse(f"{config.FRONTEND_APP_URL}?connect_error=unknown_provider")

        insights.invalidate()
        return RedirectResponse(f"{config.FRONTEND_APP_URL}?connected={provider}&count={total}")
    except Exception as e:  # noqa: BLE001
        logger.exception("connect %s failed", provider)
        return RedirectResponse(f"{config.FRONTEND_APP_URL}?connect_error={type(e).__name__}")


@app.post("/connectors/{provider}/sync", response_model=StatusResp)
async def connector_sync(provider: str) -> StatusResp:
    """Re-fetch from an already-connected provider using the stored token."""
    try:
        if not token_store.is_connected(provider if provider != "gmail" else "google"):
            raise HTTPException(400, f"{provider} is not connected")
        total = 0
        if provider in _GOOGLE_CARDS or provider == "google":
            creds = await run_in_threadpool(gconn._credentials)
            fetched = await run_in_threadpool(gconn.fetch_all, creds)
            for dataset, texts in fetched.items():
                if texts:
                    await cognee_client.remember_batch(texts, dataset)
                    total += len(texts)
        elif provider == "notion":
            texts = await nconn.fetch_pages()
            await cognee_client.remember_batch(texts, "notion")
            total += len(texts)
        elif provider == "slack":
            texts = await sconn.fetch_messages()
            await cognee_client.remember_batch(texts, "slack")
            total += len(texts)
        insights.invalidate()
        return StatusResp(status=f"Synced {total} items from {provider}")
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise _handle("connector_sync", e)

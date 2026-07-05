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
from fastapi.middleware.cors import CORSMiddleware

import cognee_client
from config import FRONTEND_ORIGIN, assert_configured
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
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
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
        return StatusResp(status=f"Forgot dataset '{name_or_id}'", detail=result)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise _handle("forget", e)

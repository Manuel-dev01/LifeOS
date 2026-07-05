"""Pydantic request/response models for the LifeOS API."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# --------------------------- Requests --------------------------- #
class IngestTextReq(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to remember")
    dataset_name: str = Field("notes", description="Logical grouping for this memory")


class CalendarReq(BaseModel):
    ics_text: str = Field(..., min_length=1, description="Raw ICS calendar content")
    dataset_name: str = Field("calendar", description="Dataset to store events under")


class QueryReq(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(8, ge=1, le=50)
    include_graph: bool = Field(False, description="Also return INSIGHTS graph data")


class ImproveReq(BaseModel):
    datasets: Optional[list[str]] = Field(
        None, description="Datasets to re-enrich; None = all"
    )


# --------------------------- Responses --------------------------- #
class SourceChunk(BaseModel):
    text: str
    source: str
    score: Optional[float] = None


class QueryResp(BaseModel):
    answer: str
    sources: list[SourceChunk] = []
    graph: Optional[dict[str, Any]] = None


class Dataset(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None


class StatusResp(BaseModel):
    status: str
    detail: Optional[Any] = None

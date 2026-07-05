"""Cognee Cloud client — the single integration point for LifeOS.

Exposes the four core memory verbs used throughout the app:
    remember_text / remember_file   ->  ingest + build graph
    recall                          ->  query (GRAPH_COMPLETION)
    recall_graph                    ->  query (INSIGHTS) for visualization
    improve                         ->  re-cognify / enrich the graph
    forget_dataset / forget_item    ->  delete memory

Transport is direct REST over httpx using the `X-Api-Key` header (the hosted
tenant's auth scheme). Every call is defensive about response shapes because
the per-searchType JSON is not fully documented; normalizers extract what we
need and degrade gracefully.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

import httpx

from config import API_PREFIX, COGNEE_API_KEY, COGNEE_BASE_URL, assert_configured

logger = logging.getLogger("lifeos.cognee")

# Generous timeout: cognify/search on the cloud can take tens of seconds.
_TIMEOUT = httpx.Timeout(120.0, connect=15.0)


def _client() -> httpx.AsyncClient:
    assert_configured()
    return httpx.AsyncClient(
        base_url=COGNEE_BASE_URL,
        headers={"X-Api-Key": COGNEE_API_KEY, "Accept": "application/json"},
        timeout=_TIMEOUT,
        # Follow 307/308 trailing-slash redirects the tenant issues (method + body preserved).
        follow_redirects=True,
        # Retry transient connection failures (flaky networks / cold tenant).
        transport=httpx.AsyncHTTPTransport(retries=3),
    )


class CogneeError(RuntimeError):
    """Raised when the Cognee tenant returns a non-2xx response."""


def _raise_for_status(resp: httpx.Response, action: str) -> None:
    if resp.is_success:
        return
    body = resp.text[:800]
    logger.error("Cognee %s failed [%s]: %s", action, resp.status_code, body)
    raise CogneeError(f"Cognee {action} failed ({resp.status_code}): {body}")


def _url(path: str) -> str:
    return f"{API_PREFIX}{path}"


# --------------------------------------------------------------------------- #
# REMEMBER
# --------------------------------------------------------------------------- #
async def remember_text(text: str, dataset_name: str = "text") -> dict[str, Any]:
    """Ingest raw text and build the graph in one call.

    Tries POST /remember with a JSON-ish form first; if the tenant rejects raw
    text there, falls back to /add (multipart text file) + /cognify.
    """
    async with _client() as client:
        # Primary: /remember accepts a `data` form field with raw text.
        resp = await client.post(
            _url("/remember"),
            data={"data": text, "datasetName": dataset_name},
        )
        if resp.is_success:
            return _json_or_empty(resp)

        logger.warning(
            "/remember rejected raw text (%s); falling back to /add + /cognify",
            resp.status_code,
        )
        # Fallback: upload as an in-memory .txt file to /add, then cognify.
        files = {"data": (f"{dataset_name}.txt", text.encode("utf-8"), "text/plain")}
        add_resp = await client.post(
            _url("/add"), data={"datasetName": dataset_name}, files=files
        )
        _raise_for_status(add_resp, "add")
        return await _cognify(client, [dataset_name])


async def remember_file(
    file_path: str, dataset_name: str = "file", filename: Optional[str] = None
) -> dict[str, Any]:
    """Ingest a file (PDF, TXT, MD, CSV, JSON, DOCX) and build the graph."""
    import os

    name = filename or os.path.basename(file_path)
    with open(file_path, "rb") as fh:
        content = fh.read()
    async with _client() as client:
        files = {"data": (name, content, "application/octet-stream")}
        resp = await client.post(
            _url("/remember"), data={"datasetName": dataset_name}, files=files
        )
        if resp.is_success:
            return _json_or_empty(resp)
        # Fallback to add + cognify.
        logger.warning("/remember file failed (%s); using /add + /cognify", resp.status_code)
        add_resp = await client.post(
            _url("/add"), data={"datasetName": dataset_name}, files=files
        )
        _raise_for_status(add_resp, "add")
        return await _cognify(client, [dataset_name])


# --------------------------------------------------------------------------- #
# IMPROVE (re-cognify / enrich)
# --------------------------------------------------------------------------- #
async def improve(datasets: Optional[list[str]] = None) -> dict[str, Any]:
    """Re-run graph enrichment (memify) over the given datasets (or all)."""
    async with _client() as client:
        return await _cognify(client, datasets)


async def _cognify(
    client: httpx.AsyncClient, datasets: Optional[list[str]]
) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    if datasets:
        payload["datasets"] = datasets
    resp = await client.post(_url("/cognify"), json=payload)
    _raise_for_status(resp, "cognify")
    return _json_or_empty(resp)


# --------------------------------------------------------------------------- #
# RECALL
# --------------------------------------------------------------------------- #
async def recall(
    question: str, top_k: int = 8, datasets: Optional[list[str]] = None
) -> dict[str, Any]:
    """Query memory. Returns {'answer': str, 'sources': [{text, source, score}]}."""
    payload: dict[str, Any] = {
        "query": question,
        "searchType": "GRAPH_COMPLETION",
        "topK": top_k,
    }
    if datasets:
        payload["datasets"] = datasets
    async with _client() as client:
        resp = await client.post(_url("/search"), json=payload)
        _raise_for_status(resp, "search")
        data = _json_or_empty(resp)
    return _normalize_search(data, question)


async def search_structured(
    query: str,
    system_prompt: str,
    datasets: Optional[list[str]] = None,
    top_k: int = 40,
) -> Any:
    """Run a GRAPH_COMPLETION search with a custom systemPrompt and parse the
    answer as JSON. Used to make the tenant LLM extract structured data
    (people, timeline, entity graph) from the REAL ingested memories.

    Returns the parsed JSON (list or dict), or None if nothing parseable came
    back. Aggregates across datasets (the tenant answers per-dataset).
    """
    payload: dict[str, Any] = {
        "query": query,
        "searchType": "GRAPH_COMPLETION",
        "topK": top_k,
        "systemPrompt": system_prompt,
    }
    if datasets:
        payload["datasets"] = datasets
    async with _client() as client:
        resp = await client.post(_url("/search"), json=payload)
        _raise_for_status(resp, "search(structured)")
        data = _json_or_empty(resp)

    # Collect every per-dataset answer string, parse each as JSON, merge.
    results = data if isinstance(data, list) else data.get("results", [data])
    parsed_items: list[Any] = []
    for item in results or []:
        answer = _extract_answer(
            item.get("search_result", item) if isinstance(item, dict) else item
        )
        parsed = _parse_json_loose(answer)
        if parsed is not None:
            parsed_items.append(parsed)
    return _merge_structured(parsed_items)


def _parse_json_loose(text: str) -> Any:
    """Best-effort JSON parse: strip code fences and surrounding prose."""
    if not text or not isinstance(text, str):
        return None
    s = text.strip()
    # Strip ```json ... ``` fences.
    if s.startswith("```"):
        s = s.split("```", 2)
        s = s[1] if len(s) > 1 else text
        if s.lstrip().lower().startswith("json"):
            s = s.lstrip()[4:]
    s = s.strip()
    # Try direct parse, then a substring from first bracket to last.
    for candidate in (s, _bracket_slice(s)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except Exception:  # noqa: BLE001
            continue
    return None


def _bracket_slice(s: str) -> str:
    starts = [i for i in (s.find("["), s.find("{")) if i != -1]
    ends = [i for i in (s.rfind("]"), s.rfind("}")) if i != -1]
    if not starts or not ends:
        return ""
    return s[min(starts) : max(ends) + 1]


def _merge_structured(items: list[Any]) -> Any:
    """Merge per-dataset parsed JSON. Lists concatenate; dicts shallow-merge."""
    if not items:
        return None
    if all(isinstance(i, list) for i in items):
        merged: list[Any] = []
        for lst in items:
            merged.extend(lst)
        return merged
    if all(isinstance(i, dict) for i in items):
        out: dict[str, Any] = {}
        for d in items:
            for k, v in d.items():
                # Concatenate list-valued keys (e.g. graph nodes/edges) across
                # per-dataset results instead of overwriting.
                if isinstance(v, list) and isinstance(out.get(k), list):
                    out[k].extend(v)
                elif isinstance(v, list):
                    out[k] = list(v)
                else:
                    out.setdefault(k, v)
        return out
    # Mixed — prefer the first list, else the first item.
    for i in items:
        if isinstance(i, list):
            return i
    return items[0]


def graph_from_recall(question: str, recall_result: dict[str, Any]) -> dict[str, Any]:
    """Build a 'memory map' graph from a recall result — no extra network call.

    The hosted tenant doesn't expose INSIGHTS/TRIPLET graph endpoints, so we
    visualize what actually happened during recall: the question at the center,
    connected to each memory vault (dataset) that contributed an answer. It's a
    truthful picture of which memories lit up, and it renders instantly.
    """
    nodes: list[dict[str, Any]] = [
        {"id": "__query__", "label": _short(question, 40), "kind": "query"}
    ]
    edges: list[dict[str, Any]] = []
    seen: set[str] = set()
    for src in recall_result.get("sources", []):
        for dataset in str(src.get("source", "")).split(","):
            name = dataset.strip()
            if not name or name in seen:
                continue
            seen.add(name)
            nodes.append({"id": name, "label": name, "kind": "dataset"})
            edges.append({"source": "__query__", "target": name, "label": "recalled"})
    return {"nodes": nodes, "edges": edges}


def _short(text: str, n: int) -> str:
    text = text.strip()
    return text if len(text) <= n else text[: n - 1] + "…"


# --------------------------------------------------------------------------- #
# DATASETS / FORGET
# --------------------------------------------------------------------------- #
async def list_datasets() -> list[dict[str, Any]]:
    """Return [{id, name, ...}] for all datasets on the tenant."""
    async with _client() as client:
        resp = await client.get(_url("/datasets"))
        _raise_for_status(resp, "list_datasets")
        data = _json_or_empty(resp)
    items = data if isinstance(data, list) else data.get("datasets", data.get("data", []))
    result = []
    for d in items or []:
        if not isinstance(d, dict):
            continue
        result.append(
            {
                "id": d.get("id") or d.get("dataset_id") or d.get("datasetId"),
                "name": d.get("name") or d.get("dataset_name") or d.get("datasetName"),
                "raw": d,
            }
        )
    return result


async def list_dataset_data(dataset_id: str) -> list[dict[str, Any]]:
    """Return the data items stored in a dataset (for export)."""
    async with _client() as client:
        resp = await client.get(_url(f"/datasets/{dataset_id}/data"))
        if not resp.is_success:
            logger.warning("list_dataset_data %s -> %s", dataset_id, resp.status_code)
            return []
        data = _json_or_empty(resp)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("data", data.get("items", []))
    return []


async def resolve_dataset_id(name_or_id: str) -> Optional[str]:
    """Map a dataset name to its id (pass-through if already an id)."""
    for d in await list_datasets():
        if d["id"] == name_or_id or d["name"] == name_or_id:
            return d["id"]
    return None


async def forget_dataset(dataset_id: str) -> dict[str, Any]:
    async with _client() as client:
        resp = await client.delete(_url(f"/datasets/{dataset_id}"))
        _raise_for_status(resp, "forget_dataset")
        return _json_or_empty(resp)


async def forget_item(dataset_id: str, data_id: str) -> dict[str, Any]:
    async with _client() as client:
        resp = await client.delete(_url(f"/datasets/{dataset_id}/data/{data_id}"))
        _raise_for_status(resp, "forget_item")
        return _json_or_empty(resp)


# --------------------------------------------------------------------------- #
# Normalizers (defensive — response shapes vary by searchType)
# --------------------------------------------------------------------------- #
def _json_or_empty(resp: httpx.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return {"raw_text": resp.text}


_UNINFORMATIVE = (
    "unavailable",
    "couldn't find",
    "could not find",
    "no information",
    "no relevant",
    "not available",
    "not found",
    "i don't have",
    "i do not have",
    "no data",
    # Hedging non-answers — a dataset that lacks the fact often replies this way.
    "does not specify",
    "doesn't specify",
    "not specified",
    "does not mention",
    "doesn't mention",
    "no mention",
    "does not provide",
    "does not indicate",
    "does not contain",
    "not enough information",
    "insufficient information",
    "cannot determine",
    "can't determine",
    "unable to determine",
    "unable to",
    "i'm unable",
    "im unable",
    "isn't available",
    "isnt available",
    "is not available",
    "cannot be determined",
    "can't be determined",
    "not able to",
    "no specific",
    "is not clear",
    "isn't clear",
)


def _normalize_search(data: Any, question: str) -> dict[str, Any]:
    """Extract an answer + per-dataset citations from a GRAPH_COMPLETION response.

    The cloud returns a list of results, one per dataset:
        [{"dataset_name": "emails", "search_result": ["The budget was $45k."]}, ...]
    `search_result` is a LIST OF STRINGS (the generated answer). We collect the
    informative answers, dedupe them, pick the richest as the primary answer,
    and cite the datasets that produced them.
    """
    results = data if isinstance(data, list) else data.get("results", [data])

    informative: list[tuple[str, str]] = []  # (dataset_name, answer)
    fallback: list[tuple[str, str]] = []

    for item in results or []:
        if isinstance(item, str):
            informative.append(("memory", item.strip()))
            continue
        if not isinstance(item, dict):
            continue
        dataset_name = item.get("dataset_name") or item.get("datasetName") or "memory"
        answer = _extract_answer(item.get("search_result", item))
        if not answer:
            continue
        if _is_informative(answer):
            informative.append((dataset_name, answer))
        else:
            fallback.append((dataset_name, answer))

    pool = informative or fallback

    # Dedupe by normalized answer text, keeping the longest variant + its sources.
    by_norm: dict[str, dict[str, Any]] = {}
    for dataset_name, answer in pool:
        norm = _norm_text(answer)
        entry = by_norm.get(norm)
        if entry is None:
            by_norm[norm] = {"answer": answer, "sources": {dataset_name}}
        else:
            entry["sources"].add(dataset_name)
            if len(answer) > len(entry["answer"]):
                entry["answer"] = answer

    if not by_norm:
        return {
            "answer": (
                "I couldn't find anything in memory to answer that yet. "
                "Try ingesting more data or running Improve."
            ),
            "sources": [],
        }

    # Primary answer = the richest (longest) unique answer.
    ordered = sorted(by_norm.values(), key=lambda e: len(e["answer"]), reverse=True)
    primary = ordered[0]

    sources = [
        {"text": e["answer"], "source": ", ".join(sorted(e["sources"])), "score": None}
        for e in ordered
    ]
    return {"answer": primary["answer"], "sources": sources[:10]}


def _is_informative(text: str) -> bool:
    low = text.lower()
    return not any(marker in low for marker in _UNINFORMATIVE)


def _norm_text(text: str) -> str:
    return "".join(ch for ch in text.lower() if ch.isalnum())[:160]


def _extract_answer(sr: Any) -> str:
    """Find the generated answer within a search_result of varying shape.

    Observed cloud shape: a list of answer strings. Also handles a bare string
    or a dict with a known answer key.
    """
    if isinstance(sr, str):
        return sr.strip()
    if isinstance(sr, list):
        parts = [s.strip() for s in sr if isinstance(s, str) and s.strip()]
        return "\n\n".join(parts).strip()
    if isinstance(sr, dict):
        for key in ("answer", "completion", "text", "content", "result", "response", "output"):
            val = sr.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
            if isinstance(val, list):
                parts = [s.strip() for s in val if isinstance(s, str) and s.strip()]
                if parts:
                    return "\n\n".join(parts).strip()
    return ""


# --------------------------------------------------------------------------- #
# Connectivity check (used by smoke test and /health)
# --------------------------------------------------------------------------- #
async def ping() -> dict[str, Any]:
    """Lightweight reachability check against the tenant."""
    datasets = await list_datasets()
    return {"ok": True, "dataset_count": len(datasets), "datasets": datasets}

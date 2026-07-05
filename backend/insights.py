"""Dynamic insight extraction — People, Timeline, and the entity Graph are
derived from the REAL ingested memories (not hardcoded), by asking the Cognee
tenant LLM to return structured JSON via a custom systemPrompt.

Results are cached in-memory with a TTL and invalidated whenever data changes
(ingest/improve/forget), because each extraction is a slow LLM call.
"""

from __future__ import annotations

import time
from typing import Any, Optional

import cognee_client

# ---- simple TTL cache -------------------------------------------------------
_CACHE: dict[str, tuple[float, Any]] = {}
_TTL_SECONDS = 600  # 10 min; also cleared on data change


def invalidate() -> None:
    """Drop all cached insights (call after ingest/improve/forget)."""
    _CACHE.clear()


def _cached(key: str):
    entry = _CACHE.get(key)
    if entry and (time.monotonic() - entry[0]) < _TTL_SECONDS:
        return entry[1]
    return None


def _store(key: str, value: Any) -> Any:
    _CACHE[key] = (time.monotonic(), value)
    return value


# ---- extraction prompts -----------------------------------------------------
_PEOPLE_SYS = (
    "You are an entity extractor for a personal memory graph. From the user's "
    "memories, identify every distinct PERSON mentioned. For each person return "
    "an object with keys: name (string), role (string, their title/role or empty), "
    "org (string or empty), emails (integer count of emails they appear in), "
    "meetings (integer count of meetings/events they attend), decisions (integer "
    "count of decisions they are involved in), initials (1-2 uppercase letters). "
    "Base every number ONLY on what appears in the memories; use 0 when unknown. "
    "Do NOT list bare email addresses as separate people — attribute an email "
    "address to the human who owns it and merge duplicates of the same person. "
    "Respond with ONLY a JSON array of these objects and nothing else."
)

_PERSON_SYS = (
    "You are an entity extractor for a personal memory graph. Return a single JSON "
    "object about the named person with keys: name, role, org, first_met (string or "
    "empty), emails (int), meetings (int), decisions (int), initials (1-2 letters), "
    "and threads (array of {title, date, kind} where kind is one of email|meeting|"
    "note|decision). Use ONLY facts from the memories; 0/empty when unknown. "
    "Respond with ONLY the JSON object and nothing else."
)

_TIMELINE_SYS = (
    "You are a timeline builder for a personal memory graph. Extract every dated or "
    "orderable memory/event. Return a JSON array of objects with keys: date (string "
    "as written, e.g. 'Mar 15' or ISO), kind (one of email|meeting|note|decision|"
    "event), title (short), body (one sentence). Sort chronologically (earliest "
    "first). Use ONLY facts from the memories. Respond with ONLY the JSON array."
)

_GRAPH_SYS = (
    "You are a knowledge-graph extractor for a personal memory graph. From the "
    "memories, produce a JSON object with two keys: nodes and edges. nodes is an "
    "array of {id (short slug), label (display name), type (one of person|email|"
    "meeting|note|decision)}. edges is an array of {source (node id), target (node "
    "id), label (relationship, e.g. 'attended','sent','produced','mentions')}. "
    "Include the key people, emails, meetings, notes and decisions and how they "
    "connect. Keep it under 24 nodes. Use ONLY facts from the memories. Respond "
    "with ONLY the JSON object."
)


# ---- public API -------------------------------------------------------------
async def get_people() -> list[dict[str, Any]]:
    hit = _cached("people")
    if hit is not None:
        return hit
    data = await cognee_client.search_structured(
        "List all people across my memories with their roles and involvement counts.",
        _PEOPLE_SYS,
    )
    people = _dedupe_people(data if isinstance(data, list) else [])
    return _store("people", people)


async def get_person(name: str) -> Optional[dict[str, Any]]:
    key = f"person:{name.lower()}"
    hit = _cached(key)
    if hit is not None:
        return hit
    data = await cognee_client.search_structured(
        f"Everything about {name}: role, when first met, and recent threads.",
        _PERSON_SYS,
    )
    person = data if isinstance(data, dict) else None
    return _store(key, person)


async def get_timeline() -> list[dict[str, Any]]:
    hit = _cached("timeline")
    if hit is not None:
        return hit
    data = await cognee_client.search_structured(
        "Build a chronological timeline of every memory and event.",
        _TIMELINE_SYS,
    )
    timeline = data if isinstance(data, list) else []
    return _store("timeline", timeline)


async def get_entity_graph() -> dict[str, Any]:
    hit = _cached("graph")
    if hit is not None:
        return hit
    data = await cognee_client.search_structured(
        "Extract the knowledge graph of people, emails, meetings, notes and "
        "decisions and how they connect.",
        _GRAPH_SYS,
    )
    graph = _clean_graph(data if isinstance(data, dict) else {})
    return _store("graph", graph)


# ---- helpers ----------------------------------------------------------------
def _dedupe_people(people: list[Any]) -> list[dict[str, Any]]:
    """Merge the same person across per-dataset answers.

    The tenant answers per dataset, so one person can appear several times, each
    carrying counts (emails/meetings/decisions) scoped to that dataset. Keeping
    only the first entry dropped the rest, so a person with real meetings could
    show meetings=0. Sum numeric fields, fill empty text fields, union lists.
    """
    seen: dict[str, dict[str, Any]] = {}
    for p in people:
        if not isinstance(p, dict):
            continue
        name = str(p.get("name", "")).strip()
        if not name:
            continue
        key = name.lower()
        if key not in seen:
            merged = dict(p)
            merged.setdefault("initials", _initials(name))
            seen[key] = merged
            continue
        cur = seen[key]
        for k, v in p.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                base = cur.get(k)
                cur[k] = (base if isinstance(base, (int, float)) and not isinstance(base, bool) else 0) + v
            elif isinstance(v, list):
                cur[k] = (cur.get(k) if isinstance(cur.get(k), list) else []) + v
            elif isinstance(v, str) and v.strip() and not str(cur.get(k, "")).strip():
                cur[k] = v
    return list(seen.values())


def _clean_graph(graph: dict[str, Any]) -> dict[str, Any]:
    raw_nodes = graph.get("nodes", []) if isinstance(graph, dict) else []
    edges = graph.get("edges", []) if isinstance(graph, dict) else []
    # Dedupe nodes by id (per-dataset results are concatenated upstream).
    nodes: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for n in raw_nodes:
        if not isinstance(n, dict) or not n.get("id"):
            continue
        nid = str(n["id"])
        if nid in seen_ids:
            continue
        seen_ids.add(nid)
        nodes.append(n)
    # Keep only edges whose endpoints exist; dedupe.
    clean_edges: list[dict[str, Any]] = []
    seen_edges: set[tuple] = set()
    for e in edges:
        if not isinstance(e, dict):
            continue
        s, t = str(e.get("source")), str(e.get("target"))
        if s not in seen_ids or t not in seen_ids:
            continue
        key = (s, t, str(e.get("label", "")))
        if key in seen_edges:
            continue
        seen_edges.add(key)
        clean_edges.append(e)
    return {"nodes": nodes, "edges": clean_edges}


def _initials(name: str) -> str:
    parts = [w for w in name.split() if w]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()

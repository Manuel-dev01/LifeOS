"""Ingestion helpers — source-specific transforms before remember().

Cognee builds the richest graph from natural-language prose, so we convert
structured sources (ICS calendars, JSON notes) into descriptive sentences that
name people, dates, and relationships explicitly.
"""

from __future__ import annotations

from typing import Any

from icalendar import Calendar


def ics_to_memory_text(ics_text: str) -> str:
    """Parse ICS content into human-readable event descriptions.

    Each VEVENT becomes a sentence naming the title, time window, location, and
    attendees so Cognee can link events to the people and topics involved.
    """
    cal = Calendar.from_ical(ics_text)
    lines: list[str] = []
    for component in cal.walk():
        if component.name != "VEVENT":
            continue
        summary = str(component.get("summary", "Untitled event"))
        location = str(component.get("location", "")).strip()
        start = component.get("dtstart")
        end = component.get("dtend")
        start_s = _fmt(start)
        end_s = _fmt(end)

        attendees = _attendees(component)
        organizer = _clean_addr(str(component.get("organizer", "")))

        parts = [f"Calendar event: '{summary}'"]
        if start_s and end_s:
            parts.append(f"scheduled from {start_s} to {end_s}")
        elif start_s:
            parts.append(f"scheduled at {start_s}")
        if location:
            parts.append(f"held at {location}")
        if organizer:
            parts.append(f"organized by {organizer}")
        if attendees:
            parts.append(f"with attendees {', '.join(attendees)}")
        desc = str(component.get("description", "")).strip()
        sentence = ", ".join(parts) + "."
        if desc:
            sentence += f" Notes: {desc}"
        lines.append(sentence)

    return "\n".join(lines)


def notes_json_to_memory_text(notes: list[dict[str, Any]]) -> str:
    """Convert a list of {title, content} note objects into prose."""
    out: list[str] = []
    for n in notes:
        title = str(n.get("title", "Untitled note"))
        content = str(n.get("content", "")).strip()
        out.append(f"Meeting note '{title}': {content}")
    return "\n".join(out)


def _fmt(dt_field: Any) -> str:
    if dt_field is None:
        return ""
    try:
        dt = dt_field.dt
        # date or datetime
        if hasattr(dt, "strftime"):
            fmt = "%A %Y-%m-%d %H:%M" if hasattr(dt, "hour") else "%A %Y-%m-%d"
            return dt.strftime(fmt)
        return str(dt)
    except Exception:  # noqa: BLE001
        return str(dt_field)


def _attendees(component: Any) -> list[str]:
    raw = component.get("attendee")
    if raw is None:
        return []
    values = raw if isinstance(raw, list) else [raw]
    return [a for a in (_clean_addr(str(v)) for v in values) if a]


def _clean_addr(value: str) -> str:
    return value.replace("MAILTO:", "").replace("mailto:", "").strip()

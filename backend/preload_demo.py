"""Preload the demo storyline into Cognee Cloud.

Ingests demo_data/{emails.txt, calendar.ics, notes.json} into named datasets so
the live demo can answer multi-hop questions. Run once before demoing:

    venv/Scripts/python.exe preload_demo.py
"""

import asyncio
import json
import sys
from pathlib import Path

import cognee_client
import config
from ingestion import ics_to_memory_text, notes_json_to_memory_text

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo_data"
DS = config.MEMORY_DATASET  # everything consolidates into the one memory dataset


async def reset() -> None:
    """Forget every existing dataset for a clean demo slate."""
    datasets = await cognee_client.list_datasets()
    if not datasets:
        print("Nothing to reset.")
        return
    for d in datasets:
        if not d["id"]:
            continue
        print(f"Forgetting '{d['name']}' ...")
        try:
            await cognee_client.forget_dataset(d["id"])
        except Exception as e:  # noqa: BLE001
            print(f"  (skip) {e}")


async def main() -> None:
    if "--reset" in sys.argv:
        print("Resetting tenant (forgetting all datasets) ...")
        await reset()

    emails = (DEMO_DIR / "emails.txt").read_text(encoding="utf-8")
    ics = (DEMO_DIR / "calendar.ics").read_text(encoding="utf-8")
    notes = json.loads((DEMO_DIR / "notes.json").read_text(encoding="utf-8"))

    print(f"Ingesting emails -> dataset '{DS}' ...")
    await cognee_client.remember_text(emails, dataset_name=DS)

    print(f"Ingesting calendar -> dataset '{DS}' ...")
    await cognee_client.remember_text(ics_to_memory_text(ics), dataset_name=DS)

    print(f"Ingesting notes -> dataset '{DS}' ...")
    await cognee_client.remember_text(notes_json_to_memory_text(notes), dataset_name=DS)

    print(f"Running improve() to enrich the graph over '{DS}' ...")
    await cognee_client.improve([DS])

    print("\nDatasets now on the tenant:")
    for d in await cognee_client.list_datasets():
        print(f"  - {d['name']}  (id={d['id']})")
    print("\nPreload complete.")


if __name__ == "__main__":
    asyncio.run(main())

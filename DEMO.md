# 🎬 LifeOS — 2-Minute Demo Script

**Setup (before recording):**
```bash
# Terminal 1 — backend
cd backend && venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
# Terminal 2 — preload the story
cd backend && venv/Scripts/python.exe preload_demo.py
# Terminal 3 — frontend
cd frontend && npm run dev
```
Open **http://localhost:5173**. Confirm the green "Cognee memory online" dot and three vaults (`emails`, `calendar`, `notes`) in the sidebar.

---

### 0:00 — The hook (10s)
> "Your AI wakes up every session with no memory. LifeOS fixes that. It's a personal memory vault — feed it your emails, notes, and calendars, and it never forgets."

### 0:10 — remember (20s)
- Show the sidebar's three memory vaults, already loaded from a real product-team's emails, calendar, and meeting notes.
- Point out: *"This is scattered context — 5 emails, 2 meetings, 2 notes — the kind of thing you'd never piece together from memory."*

### 0:30 — recall / multi-hop (35s)
Ask these in the chat, one at a time. Expand **sources** on each answer to show citations:
1. **"What was the final agreed marketing budget?"** → *$45k*
   > "Notice — no single email says $45k plainly. It infers it: the proposed $50k, minus finance's correction to $45k. That's graph reasoning."
2. **"Where was the budget meeting held?"** → *Room 4B* (venue was changed in a later email)
3. **"Who was responsible for influencer campaigns?"** → *Bob*

### 1:05 — improve / real-time memory (35s) ⭐ the wow moment
- In the sidebar Text tab, paste:
  > *"From Bob: I signed the influencer deal today for $20k, part of our Q3 marketing budget."*
  Click **Remember**.
- Ask: **"How much did Bob spend on influencers?"** → it may be vague at first.
- Click **✨ Improve**. Then ask again → **"Bob spent $20k on influencer campaigns."**
  > "That's the memory getting *sharper in real time* — Cognee re-enriched the graph and linked the new deal to everything we discussed before."

### 1:40 — forget (15s)
- Click the 🗑 next to a dataset (e.g. `notes`).
- Ask a question that depended on it → the answer is gone.
  > "Surgical forgetting — one click removes a memory completely. Your data, your control."

### 1:55 — close (5s)
> "LifeOS — an AI that wakes up *with* the context, not without it. Built on open-source Cognee."

---

### Optional: Memory Graph (bonus)
Toggle **Show Memory Graph** (top-right) before asking a question to render the entities and relationships Cognee traversed as a live force-directed graph.

---

## The Cognee lifecycle, on screen
| Moment | Cognee verb | Endpoint |
|--------|-------------|----------|
| Vaults preloaded | **remember** | `POST /ingest/*` |
| Multi-hop answers | **recall** | `POST /query` |
| New email → sharper answer | **improve** | `POST /improve` |
| 🗑 delete a vault | **forget** | `DELETE /forget/{name}` |

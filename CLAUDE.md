# CLAUDE.md – LifeOS Hackathon Project Operating Manual

This file is the single source of truth for Claude Code when working on the **LifeOS** project for the "Hangover Part AI" hackathon. Follow every instruction precisely. Always explain what you are about to do, then do it. Stay incremental.

---

## 1. Project Identity & Goal
- **App:** LifeOS – Personal AI Memory Vault
- **Hackathon Theme:** "Your AI woke up in Vegas with no memory… build AI that doesn't forget"
- **Track:** Best Use of Open Source (self-hosted Cognee OSS)
- **Core requirement:** Deep use of Cognee's 4 APIs: `remember()`, `recall()`, `improve()`/`memify()`, `forget()`

---

## 2. Architecture & Data Flow

User → React Frontend → FastAPI Backend → Cognee (Python) → LLM
↓
Graph + Vector Store (LanceDB / Qdrant)

text

- **Frontend:** Vite + React, Axios, Tailwind CSS. Chat UI + Upload Panel + optional Graph Visualization.
- **Backend:** FastAPI, Python 3.11+, Cognee, Pydantic models.
- **Storage:** Local file-based LanceDB (default) or Qdrant running in Docker for production polish. Use LanceDB for easy demos.
- **LLM:** OpenAI API (or compatible), configured via Cognee config.

---

## 3. Directory Structure (DO NOT DEVIATE)
lifeos/
├── CLAUDE.md ← this file
├── backend/
│ ├── main.py # FastAPI app, CORS, startup/shutdown
│ ├── cognee_config.py # Cognee initialization, provider config
│ ├── ingestion.py # remember() wrapper for different sources
│ ├── recall.py # recall/search with graph traversal
│ ├── memory_ops.py # improve() and forget() utilities
│ ├── preload_demo.py # script to ingest demo data
│ ├── requirements.txt
│ └── .env.example
├── frontend/
│ ├── src/
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ ├── api.js # axios configured base URL
│ │ ├── components/
│ │ │ ├── ChatBox.jsx
│ │ │ ├── UploadPanel.jsx
│ │ │ ├── MemoryGraph.jsx # optional
│ │ │ └── Sidebar.jsx
│ │ └── index.css # Tailwind imports
│ ├── index.html
│ ├── package.json
│ ├── tailwind.config.js
│ ├── postcss.config.js
│ └── vite.config.js
├── demo_data/
│ ├── emails.txt
│ ├── calendar.ics
│ └── notes.json
├── README.md # winner-quality presentation
└── .gitignore

text

---

## 4. Backend Implementation Standards

### 4.1 `cognee_config.py` – Initialization
```python
import os
import cognee

async def init_cognee():
    # Set environment variables for LLM provider before any other Cognee call
    os.environ["LLM_API_KEY"] = os.getenv("OPENAI_API_KEY", "sk-placeholder")
    
    # Use LanceDB for zero-setup local vector storage
    # Cognee will use LanceDB by default if no other provider is set.
    # We still need to initialize the system.
    await cognee.prune.prune_data()
    await cognee.prune.prune_system(metadata=True)
    
    # No need to set vector provider if we want LanceDB (it's default fallback)
    # but we explicitly set it for clarity if needed.
    
    await cognee.cognify()  # starts graph/vector infrastructure
    return True
Important:

Always call init_cognee() on FastAPI startup.

Use environment variable OPENAI_API_KEY from .env file.

If a Cognee version update requires await cognee.add([...]) differently, adjust accordingly but maintain the remember/recall/improve/forget mapping.

4.2 ingestion.py – The remember() Wrapper
python
import cognee
from pathlib import Path
from typing import Optional

async def remember_text(text: str, dataset_name: str = "text", metadata: Optional[dict] = None):
    """Ingest raw text into Cognee with a dataset name."""
    await cognee.add([text], dataset_name=dataset_name)
    # immediately run cognify to process into graph
    await cognee.cognify()

async def remember_file(file_path: str, dataset_name: str = "file"):
    """Ingest a file (PDF, TXT, etc)."""
    await cognee.add([file_path], dataset_name=dataset_name)
    await cognee.cognify()

async def remember_url(url: str, dataset_name: str = "url"):
    """Cognee can directly ingest URLs if supported, else fetch and add as text."""
    # For simplicity, fetch text and pass to remember_text
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        text = resp.text[:10000]  # limit for demo
        await remember_text(text, dataset_name=dataset_name)

async def remember_calendar(ics_text: str):
    """Parse ICS and create individual events with graph connections."""
    # Use icalendar library to parse, then add events one by one with metadata
    # Each event becomes a dataset entry linked by date/attendees
    # ...
Design rule: Every ingestion must call cognify() afterwards to immediately build graph connections. This ensures real-time improvement is visible.

4.3 recall.py – Hybrid Search & Answer
python
import cognee
from typing import List, Dict

async def query_memory(question: str, top_k: int = 5) -> Dict:
    """
    Use Cognee's search which automatically routes between semantic and graph.
    Return list of source chunks, their graph context, and a generated answer.
    """
    # Get search results (cognee.search returns a list of Chunk objects)
    results = await cognee.search(query_text=question, top_k=top_k)
    
    # Extract text and source info
    context_chunks = []
    for r in results:
        chunk_data = {
            "text": r.content if hasattr(r, 'content') else str(r),
            "source": r.metadata.get("dataset_name", "unknown") if hasattr(r, 'metadata') else "unknown",
            "score": getattr(r, 'score', None)
        }
        context_chunks.append(chunk_data)
    
    # Generate answer using LLM with context
    # For hackathon, use Cognee's integrated answer generation if available,
    # else manually call the LLM (configured via cognee) with context.
    # To keep it simple, we'll implement our own completion using the LLM provider.
    answer = await _generate_answer(question, context_chunks)
    
    return {
        "answer": answer,
        "sources": context_chunks
    }

async def _generate_answer(question: str, context: list) -> str:
    # Use the OpenAI key directly since Cognee might not expose a simple completions API
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    ctx_text = "\n\n".join([c["text"] for c in context])
    prompt = f"Using only the following memory context, answer the question precisely.\nContext:\n{ctx_text}\n\nQuestion: {question}\nAnswer:"
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )
    return response.choices[0].message.content
Rule: Always return answer + cited sources. The frontend will display them.

4.4 memory_ops.py – Improve & Forget
python
import cognee

async def improve_memory():
    """Trigger the memify pipeline to re-process and enrich graph."""
    await cognee.cognify()  # re-runs graph enrichment
    # Optionally, if Cognee has explicit improve API, use that.
    return {"status": "Memory improved"}

async def forget_dataset(dataset_name: str):
    await cognee.forget(dataset_name=dataset_name)
    return {"status": f"Dataset '{dataset_name}' forgotten"}
Important: cognify() is the improvement step. We'll also schedule it periodically.

4.5 main.py – FastAPI App
Initialize Cognee on startup event.

Include CORS middleware allowing http://localhost:5173.

Endpoints:

POST /ingest/text (body: {text, dataset_name})

POST /ingest/file (multipart upload)

POST /ingest/calendar (body: {ics_text})

POST /query (body: {question})

POST /improve (trigger manual improvement)

DELETE /forget/{dataset_name}

GET /datasets (list known datasets for the forget UI)

All endpoints use async/await.

5. Frontend Implementation Standards
5.1 Tech Stack
Build: Vite + React

Styling: Tailwind CSS (utility first)

HTTP: Axios

State: React useState/useEffect only, no external state library.

5.2 UI Layout (3-column on desktop)
text
[ Sidebar (Upload & History) ] [ Main Chat Area ] [ Memory Graph (optional) ]
Sidebar: file/text upload buttons, list of ingested datasets with delete buttons.

Main: Chat-style Q&A with user/assistant bubbles. Sources shown as expandable cards.

Graph: (Bonus) D3 force-directed graph showing retrieved nodes for the last query.

5.3 Component Specs
ChatBox.jsx: input field, send button, message history (array {role, content, sources?}). Shows "Thinking..." while awaiting.

UploadPanel.jsx: tabs for "Text", "File", "Calendar". Each uploads via appropriate endpoint and refreshes dataset list.

Sidebar.jsx: fetches datasets from GET /datasets on mount, each with a "forget" icon button.

MemoryGraph.jsx: receives graph data (nodes/edges) from query response (if implemented). Use D3 in a useEffect.

5.4 API Calls (api.js)
js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

export const ingestText = (text, datasetName) => api.post('/ingest/text', { text, dataset_name: datasetName });
export const ingestFile = (formData) => api.post('/ingest/file', formData);
export const ingestCalendar = (icsText) => api.post('/ingest/calendar', { ics_text: icsText });
export const queryMemory = (question) => api.post('/query', { question });
export const improveMemory = () => api.post('/improve');
export const forgetDataset = (name) => api.delete(`/forget/${name}`);
export const getDatasets = () => api.get('/datasets');
6. Demo Data Scenario (CRITICAL)
The demo tells a cohesive story to prove cross-session memory.
Create demo_data/ with the following:

emails.txt (5 emails)

From Alice: "Team, we need to finalize the Q3 marketing budget by Friday. Currently proposed $50k."

From Bob: "I think we should allocate more to influencer campaigns, at least $20k."

From Charlie: "Finance says we have only $45k total. Let's cut print ads."

From Alice: "Meeting scheduled for Friday 3pm to decide."

From Bob: "Venue changed to Room 4B. Remember to bring the mockups."

calendar.ics (2 events)

Friday 3pm-4pm: "Budget Finalization Meeting", attendees: alice@, bob@, charlie@.

Monday 10am: "Sprint Planning", attendees: alice@, bob@.

notes.json (2 meeting notes)

{"title":"Budget Brainstorm", "content": "Alice suggested $45k cap. Bob wanted influencer heavy. Decision pending."}

{"title":"Sprint Retro", "content": "Action item: Follow up on influencer contract. Bob to lead."}

Multi-hop demo questions:

"What was the final agreed marketing budget?" (answer: $45k, inferred from emails)

"Who was responsible for influencer campaigns?" (Bob)

"Where was the budget meeting held?" (Room 4B)

"What were my action items from the sprint retro?" (follow up on influencer contract)
After improve(), a new email about "Bob signed the influencer deal for $20k" will link to earlier discussions, and a query "How much did Bob spend on influencers?" should answer $20k.

7. Step-by-Step Build Sequence (Follow Exactly)
When starting fresh or resuming, proceed in this order:

Environment: create directories, venv, install deps, init React, Tailwind.

Cognee setup: cognee_config.py and test that init_cognee() works.

Preload demo: preload_demo.py script to ingest all demo data.

Backend endpoints (ingestion first, then query, then improve/forget).

Frontend UI skeleton (sidebar + chat).

Wire API and test full flow locally.

Implement improve/forget on frontend.

Graph visualization if time permits (bonus).

README & Demo script preparation.

Polish (loading states, error handling, responsive design).

Record demo video following script.

8. Coding Conventions
Python: async/await everywhere, type hints, Pydantic models for request/response.

JavaScript: functional components, hooks, clean console error handling.

Error handling: Always return meaningful error messages to frontend.

Comments: minimal, only for complex logic. The code should be self-documenting.

No hardcoded secrets: use .env and .env.example.

9. Testing & Validation
After each backend endpoint, test with httpie or a quick curl.

Frontend: manually test each flow.

Before demo: run preload_demo.py fresh, then ask all demo questions and verify answers are correct and sources displayed.

10. Submission Requirements
Public GitHub repo with clear README.

Include a 2‑minute screen recording link (YouTube/unlisted).

Blog post draft in BLOG.md.

Tweet content in SOCIAL.md.

Ensure no proprietary data is included.

11. Claude Code Operational Mode
When given a task, read this entire file first to ensure alignment.

Always output a concise plan before making changes.

Use read_file and write_file tools as needed.

When errors occur, read the relevant code, diagnose, and fix.

After major milestones, prompt me (the user) with a status update and ask if I want to proceed.

Keep the end goal in mind: a polished, top‑1 hackathon submission.

Now, resume the project where you left off, or if starting fresh, begin with step 1 of the build sequence.


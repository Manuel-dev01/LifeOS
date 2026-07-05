# Building LifeOS: Giving AI a Memory That Never Forgets

*How we used open-source Cognee to build a personal memory vault in a weekend.*

## The problem: AI amnesia

Every large language model wakes up with a blank mind. Ask it about the budget decision from last Tuesday's email thread and it shrugs — that context died the moment the previous chat ended. Our context, meanwhile, is scattered across inboxes, meeting notes, and calendars, and *we* can't hold it all either.

For the "Hangover Part AI" hackathon — theme: *your AI woke up in Vegas with no memory* — we built **LifeOS**, a personal memory vault that fixes exactly this.

## The insight: memory is a graph, not a transcript

Most "AI memory" is just retrieval-augmented generation — stuff chunks in a vector DB, pull back the nearest ones. That fails on **multi-hop** questions. "What was the final marketing budget?" has no single sentence answer in our data: one email proposes $50k, another corrects finance down to $45k, a third confirms the meeting. The answer is *inferred across sources*.

That's where [Cognee](https://cognee.ai) comes in. Cognee doesn't just embed text — it builds a **knowledge graph** of entities and relationships, then uses vector search as a hint to find the right graph triplets and traverse them. The result is reasoning, not just retrieval.

## The four verbs

Cognee's whole memory lifecycle is four operations, and we built the demo to show every one:

- **remember** — ingest emails, files, and calendars; Cognee cognifies them into a graph.
- **recall** — ask a question; Cognee routes between semantic and graph search and generates an answer with sources.
- **improve** — re-enrich the graph; entities dedupe, new links form.
- **forget** — surgically delete a memory, permanently.

The moment that makes people lean in: we paste a new email mid-demo — *"Bob signed the influencer deal for $20k"* — hit **Improve**, and ask a question the system couldn't answer thirty seconds earlier. Now it can. The memory got **sharper in real time**.

## The build

- **Cognee Cloud** as the memory engine — a hosted graph + vector store + LLM, so no local database and no separate OpenAI key. Auth is a single `X-Api-Key` header against the tenant's `/api/v1` REST API.
- **FastAPI** backend as a thin, typed proxy. Every Cognee call funnels through one module exposing the four verbs, so the transport is swappable.
- **React + Tailwind + D3** frontend — a dark "memory-vault" dashboard with a chat pane, an upload panel, and a live force-directed graph of what Cognee traversed.

### A lesson from the trenches

The one real gotcha: the search API returns results **per dataset**, and each `search_result` is a *list of strings*, not the dict we first assumed. Datasets that lack a fact hedge politely ("the information does not specify…"). Our normalizer had to learn to prefer the concrete answer over the hedge — a small filter that turned "I'm not sure" into "$20k."

## Why it matters

LifeOS is a glimpse of AI that wakes up **with** your context instead of without it. The memory is persistent, self-improving, and yours to delete. And because it's built on open-source Cognee, anyone can self-host the whole thing.

*Try it: [github.com/your-org/lifeos](#)*

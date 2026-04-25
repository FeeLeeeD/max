# MAX Sandbox

A minimal RAG (Retrieval-Augmented Generation) playground for experimenting with vector search over email marketing documentation. Built to validate retrieval quality before productionizing.

No API, no UI for now — retrieval primitives (chunker, embedder, vector database) plus LLM generation via Portkey for end-to-end question answering.

## What's inside

- **Local embeddings** via `@xenova/transformers` (`bge-small-en-v1.5`, 384 dimensions). Model weights download on first run (~90MB), then run fully offline.
- **Postgres + pgvector** for vector storage with HNSW index and cosine similarity.
- **Paragraph-aware chunker** that splits documents at natural boundaries.
- **Idempotent ingestion**: content-hash based, safe to re-run.
- **CLI search** with interactive and batch modes, JSON output for manual review.

## Prerequisites

- Node.js **20+**
- pnpm **9+**
- Docker + Docker Compose

## Quick start

From the monorepo root:

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start Postgres + pgvector
docker compose up -d
docker compose ps   # verify "healthy" status

# 4. Apply database migrations
pnpm --filter @max/sandbox db:migrate

# 5. Verify embeddings work (first run downloads ~90MB model)
pnpm --filter @max/sandbox test:embed

# 6. Ingest sample articles
pnpm --filter @max/sandbox ingest

# 7. Try a search
pnpm --filter @max/sandbox search "how do I improve email open rate"
```

If all commands succeed, you have a working RAG retrieval pipeline.

## Project layout

```
max/
├── docker-compose.yml           # Postgres 16 + pgvector
├── db/migrations/
│   └── 001_initial.sql          # documents + chunks tables, HNSW index
├── data/
│   ├── articles/                # source .md files (ingested into DB)
│   ├── queries.json             # sample batch queries for search
│   └── output/                  # search batch results land here
└── packages/sandbox/
    └── src/
        ├── config.ts            # typed env config
        ├── db.ts                # pg Pool, query helper, closePool
        ├── embedder.ts          # local embeddings (bge-small-en-v1.5)
        ├── chunker.ts           # paragraph-aware text splitting
        ├── hash.ts              # sha256 helper
        ├── articles.ts          # loads .md files with H1 title parsing
        ├── repository.ts        # SQL access for documents and chunks
        ├── search.ts            # vector search module
        ├── llm.ts               # LLM generation via Portkey gateway
        ├── rag.ts               # RAG orchestrator (retrieve → generate)
        └── scripts/
            ├── migrate.ts       # applies SQL migrations
            ├── test-embed.ts    # smoke test for embeddings
            ├── test-chunker.ts  # smoke test for chunker
            ├── ingest.ts        # main ingestion CLI
            ├── search.ts        # search CLI (interactive + batch)
            └── ask.ts           # RAG Q&A CLI
```

## Data flow

```
data/articles/*.md
   │
   ▼
loadArticles()  →  sha256()  →  chunkText()  →  embedBatch()  →  Postgres (pgvector)
                       │
                       └─ if hash unchanged, skip (idempotent)

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   ▼                                                         │
"user query"  →  embed()  →  HNSW similarity search  →  top-K chunks with scores
```

## Commands reference

All commands run from the monorepo root.

### Database

```bash
# Start Postgres
docker compose up -d

# Stop Postgres (keeps data)
docker compose down

# Stop and wipe all data
docker compose down -v

# Apply new migrations
pnpm --filter @max/sandbox db:migrate

# Open psql shell
docker exec -it max-postgres psql -U max -d max
```

### Ingestion

```bash
# Ingest all articles from data/articles/
pnpm --filter @max/sandbox ingest
```

The script is idempotent. On each run, for every `.md` file it computes a SHA-256 hash of the content. If the hash matches what's in the DB, the file is skipped. Otherwise the document is reindexed (old chunks deleted, new chunks inserted with fresh embeddings).

**To add new articles:** drop `.md` files into `data/articles/` and run `ingest`. Each file should start with an H1 heading (`# Title`) which becomes the document title.

**To update an article:** edit the file and run `ingest`. Only changed articles get reprocessed.

**To remove an article:** delete the file AND manually remove it from the DB (the current script doesn't track deletions):

```sql
DELETE FROM documents WHERE source = 'filename.md';
-- chunks are deleted via ON DELETE CASCADE
```

### Search

**Interactive mode:**

```bash
# Basic search (default: top 5)
pnpm --filter @max/sandbox search "how do I improve open rate"

# Custom top-K
pnpm --filter @max/sandbox search "what is CTR" --top-k 3
pnpm --filter @max/sandbox search "bounce rate" -k 10

# Filter by minimum similarity score
pnpm --filter @max/sandbox search "email deliverability" --min-score 0.5
pnpm --filter @max/sandbox search "spam filter" -m 0.4
```

**Batch mode** reads queries from a JSON file, writes full results to `data/output/results-{timestamp}.json`:

```bash
pnpm --filter @max/sandbox search --batch data/queries.json
```

Query file format:

```json
[
  { "query": "how do I improve open rate", "note": "common user question" },
  { "query": "A/B testing subject lines", "note": null }
]
```

Use batch mode to evaluate retrieval quality: run 20–50 representative questions, open the JSON output, and manually review where the system finds the right chunks and where it misses.

### Asking questions (full RAG)

Requires `PORTKEY_API_KEY` in your `.env` file. Get your key from [Portkey](https://portkey.ai/docs). Optionally set `PORTKEY_VIRTUAL_KEY` and/or `PORTKEY_CONFIG` depending on your Portkey setup.

```bash
# Ask a question — retrieves chunks, sends to LLM, returns grounded answer
pnpm --filter @max/sandbox ask "how can I avoid sending emails on weekends"

# Adjust number of retrieved chunks
pnpm --filter @max/sandbox ask "what is throttling" --top-k 3

# Adjust refusal threshold (default 0.55 — queries scoring below are refused)
pnpm --filter @max/sandbox ask "what is throttling" --min-score 0.7

# Use a different model
pnpm --filter @max/sandbox ask "open rate tips" --model gpt-4o
```

Off-topic questions are automatically refused without calling the LLM, based on the retrieval score. The default threshold (0.55) is tunable via `--min-score` for experimentation.

### Sanity checks

```bash
# Smoke test embeddings (no DB involved)
pnpm --filter @max/sandbox test:embed

# Smoke test chunker (no DB involved)
pnpm --filter @max/sandbox test:chunker

# Verify DB content
docker exec -it max-postgres psql -U max -d max -c \
  "SELECT d.source, d.title, COUNT(c.id) AS chunks
   FROM documents d LEFT JOIN chunks c ON c.document_id = d.id
   GROUP BY d.id ORDER BY d.source;"

# Check all chunks have embeddings
docker exec -it max-postgres psql -U max -d max -c \
  "SELECT COUNT(*) FROM chunks WHERE embedding IS NOT NULL;"
```

## Configuration

Environment variables (see `.env.example`):

| Variable            | Default                                   | Purpose                                |
| ------------------- | ----------------------------------------- | -------------------------------------- |
| `POSTGRES_USER`     | `max`                                     | Postgres user                          |
| `POSTGRES_PASSWORD` | `max`                                     | Postgres password                      |
| `POSTGRES_DB`       | `max`                                     | Postgres database name                 |
| `DATABASE_URL`      | `postgresql://max:max@localhost:5441/max` | Full connection string used by the app |
| `PORTKEY_API_KEY`   | —                                         | Portkey API key (required for `ask`)   |
| `PORTKEY_VIRTUAL_KEY` | —                                       | Portkey virtual key (optional)         |
| `PORTKEY_CONFIG`    | —                                         | Portkey config ID (optional)           |

Chunker defaults (in `src/chunker.ts`):

- `maxTokens`: 500 (approximate, via `chars / 4` heuristic)
- `minTokens`: 100

Embedding model (in `src/embedder.ts`):

- `Xenova/bge-small-en-v1.5` — 384 dimensions, English, ~90MB

## Understanding the scores

Search returns cosine similarity scores in the `[0, 1]` range (higher = more similar, because embeddings are normalized).

Rough interpretation based on this model and typical doc-style content:

| Score         | Meaning                              |
| ------------- | ------------------------------------ |
| `0.80+`       | Near-duplicate or extremely relevant |
| `0.60 – 0.80` | Strong match, likely useful          |
| `0.40 – 0.60` | Weakly related, may or may not help  |
| `< 0.40`      | Probably irrelevant                  |

These numbers are specific to `bge-small-en-v1.5` and are not a universal benchmark. Other models return scores on different scales.

**Expect dense retrieval to struggle with short keyword queries** ("open rate") compared to natural questions ("how do I improve my open rate"). This is a known limitation — hybrid search (dense + BM25) usually fixes it, but isn't implemented in the sandbox yet.

## Known limitations

Currently this is a sandbox. It deliberately skips things a production system would need:

- **No overlap between chunks** — context at chunk boundaries can be lost
- **No reranker** — top-K from vector search goes straight to output
- **No hybrid search** — dense retrieval only, no BM25 / keyword component
- **No query expansion or reformulation**
- **No conversation history** — single-shot Q&A only, no multi-turn support
- **Sentence splitter is regex-based** — fails on edge cases like "Dr. Smith"
- **No handling of article deletions** — removed files stay in the DB until manually cleaned
- **No authentication, no rate limiting, no HTTP API**

These are natural next steps once retrieval quality on real documentation is good enough.

## Troubleshooting

**`sharp` native module error on install** — add to root `package.json`:

```json
"pnpm": {
  "onlyBuiltDependencies": ["sharp", "onnxruntime-node"]
}
```

Then `rm -rf node_modules && pnpm install`.

**`ECONNREFUSED 127.0.0.1:5432`** — Postgres isn't running. `docker compose up -d` and wait for healthy status.

**`port is already allocated`** — another Postgres is running locally on 5432. Either stop it (`brew services stop postgresql` on macOS) or change the port mapping in `docker-compose.yml` to `5433:5432` and update `DATABASE_URL` in `.env` accordingly.

**First `test:embed` or `ingest` run takes a long time** — the embedding model is downloading (~90MB from Hugging Face). Subsequent runs start in 1–2 seconds.

**Script hangs after finishing** — the pg Pool wasn't closed. Every CLI script should call `closePool()` in a `finally` block.

**Search returns unexpectedly low scores** — check that embeddings are normalized (`normalize: true` in the embedder pipeline options) and that cosine similarity (not dot product) is being used.

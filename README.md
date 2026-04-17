# MAX

Sandbox for a RAG-based AI FAQ assistant.

## Getting started

```bash
pnpm install
pnpm run hello
```

You should see `MAX sandbox initialized` followed by your Node version.

Full setup instructions (Postgres + pgvector, embedding model, ingestion scripts, HTTP API, React widget) will be added in later steps.

## Layout

This is a pnpm workspace:

- `packages/api` — entry point and, later, the HTTP API
- `packages/shared` — types and utilities shared across packages

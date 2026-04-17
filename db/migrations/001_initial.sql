-- 001_initial.sql
-- Initial schema for MAX: documents + chunks with pgvector embeddings.
-- Migration is wrapped in a transaction by the runner; statements below
-- are written idempotently where possible so a manual re-run is safe.

-- pgvector provides the `vector` column type and HNSW / IVFFlat indexes.
CREATE EXTENSION IF NOT EXISTS vector;

-- A document is a single source we ingest (file, URL, etc.).
-- `source` is the stable identifier; `content_hash` lets us detect changes
-- without re-parsing the full body.
CREATE TABLE IF NOT EXISTS documents (
  id           serial       PRIMARY KEY,
  source       text         NOT NULL UNIQUE,
  title        text,
  content_hash text         NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- Chunks are the retrieval unit: a slice of a document with its embedding.
-- Dimension 384 matches bge-small-en-v1.5 / all-MiniLM-L6-v2.
-- `embedding` is nullable so we can insert chunks first and embed in a
-- second pass if needed.
CREATE TABLE IF NOT EXISTS chunks (
  id           serial       PRIMARY KEY,
  document_id  int          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index  int          NOT NULL,
  content      text         NOT NULL,
  token_count  int,
  embedding    vector(384),
  metadata     jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

-- Speeds up the ON DELETE CASCADE path and any per-document lookups.
CREATE INDEX IF NOT EXISTS chunks_document_id_idx
  ON chunks (document_id);

-- HNSW with cosine distance. Built lazily; fine to create on an empty table.
-- NOTE: Postgres does not support IF NOT EXISTS on unnamed indexes, so we
-- name it explicitly to keep the migration idempotent.
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_cosine_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);

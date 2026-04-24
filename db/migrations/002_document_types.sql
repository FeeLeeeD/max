-- 002_document_types.sql
-- Introduce a `document_type` classifier on documents so ingestion can route
-- chunking by content shape (plain articles vs. email-thread collections,
-- and later meeting transcripts, etc.). Written idempotently so a manual
-- re-run is safe.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'article';

-- Drop-then-add pattern keeps the migration idempotent and lets us expand
-- the allowed set later without fighting Postgres's lack of "ALTER
-- CONSTRAINT ... CHECK".
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN ('article', 'email_thread_collection'));

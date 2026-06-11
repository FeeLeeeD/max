-- 003_drop_document_type.sql
-- Retire the `document_type` classifier. Document-type branching is gone: all
-- KB documents are now a single unified markdown format ingested through one
-- chunker, and no application code reads or writes this column anymore. Drop
-- the CHECK constraint first, then the column. Written idempotently so a
-- manual re-run is safe; the runner wraps this in a transaction.

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents
  DROP COLUMN IF EXISTS document_type;

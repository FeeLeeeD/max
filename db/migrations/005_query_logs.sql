-- 005_query_logs.sql
-- Observability for the /chat path: log every answered question alongside
-- MAX's answer, whether it was refused, the top retrieval score, the sources
-- used, and end-to-end latency. An optional feedback `rating` ('up'/'down')
-- lets us judge answer quality and calibrate the retrieval threshold against
-- real traffic. Written idempotently so a manual re-run is safe; the runner
-- wraps this in a transaction.

CREATE TABLE IF NOT EXISTS query_logs (
  id                   serial       PRIMARY KEY,
  question             text         NOT NULL,
  answer               text         NOT NULL,
  was_refused          boolean      NOT NULL,
  retrieval_score_top  double precision,
  sources              jsonb        NOT NULL DEFAULT '[]'::jsonb,
  latency_ms           int,
  rating               text,
  created_at           timestamptz  NOT NULL DEFAULT now()
);

-- Drop-then-add pattern keeps the migration idempotent and lets us expand the
-- allowed set later without fighting Postgres's lack of "ALTER CONSTRAINT ...
-- CHECK". NULL means "no feedback yet"; once set it must be 'up' or 'down'.
ALTER TABLE query_logs
  DROP CONSTRAINT IF EXISTS query_logs_rating_check;

ALTER TABLE query_logs
  ADD CONSTRAINT query_logs_rating_check
  CHECK (rating IS NULL OR rating IN ('up', 'down'));

-- Time-ordered log browsing (most recent first).
CREATE INDEX IF NOT EXISTS query_logs_created_at_idx
  ON query_logs (created_at);

-- Filtering by feedback when calibrating quality.
CREATE INDEX IF NOT EXISTS query_logs_rating_idx
  ON query_logs (rating);

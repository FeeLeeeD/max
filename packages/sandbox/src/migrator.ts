import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "./config.js";
import { pool } from "./db.js";

const MIGRATIONS_DIR = resolve(config.projectRoot, "db/migrations");

// Arbitrary fixed key for the migration advisory lock. Any process that runs
// migrations uses this same constant, so their runs serialize against each
// other. Chosen once for the "max" project — never change it, or already
// deployed instances would stop mutually excluding. Stays within JS safe
// integer range so it can be passed straight through as a bigint param.
const MIGRATION_LOCK_KEY = 615423789012345;

export interface MigrationLogger {
  log: (message: string) => void;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id serial primary key,
      filename text unique not null,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedFilenames(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>(
    "SELECT filename FROM _migrations",
  );
  return new Set(rows.map((r) => r.filename));
}

async function applyMigration(filename: string, sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO _migrations(filename) VALUES($1)", [
      filename,
    ]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function applyPending(logger: MigrationLogger): Promise<MigrationResult> {
  await ensureMigrationsTable();
  const alreadyApplied = await getAppliedFilenames();

  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((f) => f.endsWith(".sql")).sort();

  const applied: string[] = [];
  const skipped: string[] = [];

  if (files.length === 0) {
    logger.log(`No .sql migrations found in ${MIGRATIONS_DIR}`);
    return { applied, skipped };
  }

  for (const filename of files) {
    if (alreadyApplied.has(filename)) {
      logger.log(`skip   ${filename} (already applied)`);
      skipped.push(filename);
      continue;
    }
    const sql = await readFile(resolve(MIGRATIONS_DIR, filename), "utf8");
    await applyMigration(filename, sql);
    logger.log(`apply  ${filename}`);
    applied.push(filename);
  }

  return { applied, skipped };
}

// Single source of truth for applying migrations — used by both the CLI script
// and the API boot path. Lifecycle (closing the pool, exiting the process) is
// the caller's job; this function never does either.
export async function runMigrations(
  logger: MigrationLogger = console,
): Promise<MigrationResult> {
  // Advisory locks are per-connection, so hold a dedicated client for the
  // whole run. A session-level lock serializes concurrent runners (e.g.
  // several API instances booting together): a second process blocks here
  // until the first finishes, by which point every migration is recorded — so
  // it acquires the lock and simply skips everything. The per-file BEGIN/COMMIT
  // transactions inside applyPending are independent of this overall lock.
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    return await applyPending(logger);
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    } finally {
      client.release();
    }
  }
}

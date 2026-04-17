import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "../config.js";
import { pool, closePool } from "../db.js";

const MIGRATIONS_DIR = resolve(config.projectRoot, "db/migrations");

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

async function main(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedFilenames();

  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((f) => f.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log(`No .sql migrations found in ${MIGRATIONS_DIR}`);
    return;
  }

  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`skip   ${filename} (already applied)`);
      continue;
    }
    const sql = await readFile(resolve(MIGRATIONS_DIR, filename), "utf8");
    await applyMigration(filename, sql);
    console.log(`apply  ${filename}`);
  }
}

try {
  await main();
  await closePool();
  process.exit(0);
} catch (err) {
  console.error("Migration failed:", err);
  await closePool().catch(() => { });
  process.exit(1);
}

import { resolve } from "node:path";
import { config } from "../config.js";
import { pool, closePool } from "../db.js";
import { loadArticles, type MarkdownFile } from "../articles.js";
import { ingestDocument } from "../ingestDocument.js";

const ARTICLES_DIR = resolve(config.projectRoot, "data/articles");

interface Stats {
  processed: number;
  skipped: number;
  errors: number;
}

async function ingestArticle(
  file: MarkdownFile,
  stats: Stats,
): Promise<void> {
  // The chunk -> embed -> insert pipeline lives in ingestDocument(); we rely on
  // its includeBreadcrumb default (true) rather than passing it explicitly.
  const outcome = await ingestDocument({
    source: file.source,
    content: file.raw,
  });

  switch (outcome.status) {
    case "indexed":
      console.log(`[OK] ${file.source}: ${outcome.chunkCount} chunks inserted`);
      stats.processed += 1;
      break;
    case "skipped":
      console.log(`[SKIP] ${file.source} (unchanged)`);
      stats.skipped += 1;
      break;
    case "empty":
      console.log(
        `[WARN] ${file.source}: chunker produced 0 chunks (empty content?), skipping`,
      );
      break;
  }
}

async function totalChunks(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM chunks",
  );
  return Number(result.rows[0]?.count ?? 0);
}

// Flag any DB documents whose source filename is no longer present on disk.
// Ingest never auto-deletes — a rename or removal is an intentional action
// that the operator has to reconcile manually.
async function reportOrphans(files: MarkdownFile[]): Promise<void> {
  const onDisk = new Set(files.map((f) => f.source));
  const { rows } = await pool.query<{ source: string }>(
    "SELECT source FROM documents ORDER BY source",
  );
  const orphans = rows.map((r) => r.source).filter((s) => !onDisk.has(s));
  if (orphans.length === 0) return;

  console.log(
    `[WARN] ${orphans.length} document(s) in DB no longer exist on disk: ${orphans.join(", ")}. Clean up manually if needed.`,
  );
}

async function main(): Promise<number> {
  const files = await loadArticles(ARTICLES_DIR);

  if (files.length === 0) {
    console.log(`[WARN] No .md articles found in ${ARTICLES_DIR}`);
    return 0;
  }

  await reportOrphans(files);

  const stats: Stats = { processed: 0, skipped: 0, errors: 0 };

  for (const file of files) {
    try {
      await ingestArticle(file, stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[ERROR] ${file.source}: ${message}`);
      stats.errors += 1;
    }
  }

  const total = await totalChunks();

  console.log("");
  console.log("=== Ingestion report ===");
  console.log(`Total articles:      ${files.length}`);
  console.log(`Processed:           ${stats.processed} (re)indexed`);
  console.log(`Skipped:             ${stats.skipped} (unchanged)`);
  if (stats.errors > 0) {
    console.log(`Errors:              ${stats.errors}`);
  }
  console.log(`Total chunks in DB:  ${total}`);

  return stats.errors > 0 ? 1 : 0;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  console.error("Ingestion failed:", err);
  exitCode = 1;
} finally {
  await closePool().catch(() => {});
}
process.exit(exitCode);

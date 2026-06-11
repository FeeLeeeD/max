import { resolve } from "node:path";
import { config } from "../config.js";
import { pool, closePool } from "../db.js";
import { sha256 } from "../hash.js";
import { loadArticles, type MarkdownFile } from "../articles.js";
import { chunkMarkdown } from "../markdownChunker.js";
import { embedBatch } from "../embedder.js";
import {
  findDocumentBySource,
  upsertDocument,
  deleteChunksForDocument,
  insertChunks,
  countChunksForDocument,
} from "../repository.js";

const ARTICLES_DIR = resolve(config.projectRoot, "data/articles");

// Experiment toggle: when true, each chunk's embedded text is prefixed with its
// breadcrumb (doc title + ancestor headings). We'll evaluate this against
// retrieval quality before deciding whether to keep it.
const INCLUDE_BREADCRUMB = true;

interface Stats {
  processed: number;
  skipped: number;
  errors: number;
}

interface PreparedChunk {
  chunkIndex: number;
  content: string;
  embeddingText: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

async function ingestArticle(
  file: MarkdownFile,
  stats: Stats,
): Promise<void> {
  const { meta, chunks } = chunkMarkdown(file.raw, {
    includeBreadcrumb: INCLUDE_BREADCRUMB,
  });

  // Filename fallback for the title lives here, not in the chunker.
  const title = meta.title ?? file.source.replace(/\.md$/i, "");

  // Hash the raw file, since that's the unit of change.
  const contentHash = sha256(file.raw);
  const existing = await findDocumentBySource(file.source);

  if (existing && existing.contentHash === contentHash) {
    const chunkCount = await countChunksForDocument(existing.id);
    if (chunkCount > 0) {
      console.log(`[SKIP] ${file.source} (unchanged)`);
      stats.skipped += 1;
      return;
    }
  }

  console.log(`[PROCESS] ${file.source}`);

  const doc = await upsertDocument({
    source: file.source,
    title,
    contentHash,
  });

  await deleteChunksForDocument(doc.id);

  const prepared: PreparedChunk[] = chunks.map((chunk) => {
    const metadata: Record<string, unknown> = {
      title,
      heading: chunk.heading,
      headingPath: chunk.headingPath,
      partIndex: chunk.partIndex,
      topics: meta.topics,
    };
    if (meta.date !== null) metadata.date = meta.date;
    return {
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embeddingText: chunk.embeddingText,
      tokenCount: chunk.tokenCount,
      metadata,
    };
  });

  if (prepared.length === 0) {
    console.log(
      `[WARN] ${file.source}: chunker produced 0 chunks (empty content?), skipping`,
    );
    return;
  }

  // Embed the breadcrumb-augmented text, but store the clean content.
  const embeddings = await embedBatch(prepared.map((c) => c.embeddingText));

  const insertRows = prepared.map((chunk, i) => ({
    documentId: doc.id,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[i]!,
    metadata: chunk.metadata,
  }));

  const inserted = await insertChunks(insertRows);
  console.log(
    `[OK] ${file.source}: ${prepared.length} chunks inserted (${inserted})`,
  );
  stats.processed += 1;
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

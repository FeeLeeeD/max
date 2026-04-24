import { resolve } from "node:path";
import { config } from "../config.js";
import { pool, closePool } from "../db.js";
import { sha256 } from "../hash.js";
import { loadArticles, type ArticleFile } from "../articles.js";
import { chunkText } from "../chunker.js";
import { embedBatch } from "../embedder.js";
import {
  detectDocumentTypeFromFilename,
  type DocumentType,
} from "../documentType.js";
import { parseEmailThreads } from "../emailThreadParser.js";
import { chunkEmailThreads } from "../emailThreadChunker.js";
import {
  findDocumentBySource,
  upsertDocument,
  deleteChunksForDocument,
  insertChunks,
  countChunksForDocument,
} from "../repository.js";

const ARTICLES_DIR = resolve(config.projectRoot, "data/articles");

interface Stats {
  processed: number;
  skipped: number;
  errors: number;
}

interface PreparedChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

function prepareArticleChunks(article: ArticleFile): PreparedChunk[] {
  return chunkText(article.content).map((c) => ({
    chunkIndex: c.chunkIndex,
    content: c.content,
    tokenCount: c.tokenCount,
    metadata: { title: article.title },
  }));
}

interface PreparedEmailChunks {
  chunks: PreparedChunk[];
  threadCount: number;
}

function prepareEmailThreadChunks(article: ArticleFile): PreparedEmailChunks {
  const threads = parseEmailThreads(article.content);
  const chunks = chunkEmailThreads(threads).map((c) => ({
    chunkIndex: c.chunkIndex,
    content: c.content,
    tokenCount: c.tokenCount,
    metadata: {
      documentType: "email_thread_collection" as const,
      threadIndex: c.threadIndex,
      threadTitle: c.threadTitle,
      subject: c.subject,
      dateRange: c.dateRange,
    },
  }));
  return { chunks, threadCount: threads.length };
}

async function ingestArticle(
  article: ArticleFile,
  stats: Stats,
): Promise<void> {
  const documentType: DocumentType = detectDocumentTypeFromFilename(
    article.source,
  );

  // Meeting transcripts are recognized by filename but not yet implemented.
  // Skip cleanly so new `.transcript.md` files don't crash ingest.
  if (documentType === "meeting_transcript") {
    console.log(
      `[SKIP] ${article.source}: meeting transcripts not yet supported`,
    );
    stats.skipped += 1;
    return;
  }

  const contentHash = sha256(article.content);
  const existing = await findDocumentBySource(article.source);

  // Skip only if content AND type are both unchanged — re-routing a file
  // from article to email_thread_collection must rebuild its chunks even if
  // the bytes on disk happen to match.
  if (
    existing &&
    existing.contentHash === contentHash &&
    existing.documentType === documentType
  ) {
    const chunkCount = await countChunksForDocument(existing.id);
    if (chunkCount > 0) {
      console.log(`[SKIP] ${article.source} (unchanged, ${documentType})`);
      stats.skipped += 1;
      return;
    }
  }

  console.log(`[PROCESS] ${article.source} (${documentType})`);

  const doc = await upsertDocument({
    source: article.source,
    title: article.title,
    contentHash,
    documentType,
  });

  await deleteChunksForDocument(doc.id);

  let prepared: PreparedChunk[];
  let countsSuffix: string;
  if (documentType === "email_thread_collection") {
    const result = prepareEmailThreadChunks(article);
    prepared = result.chunks;
    countsSuffix = `${result.threadCount} threads → ${prepared.length} chunks`;
  } else {
    prepared = prepareArticleChunks(article);
    countsSuffix = `${prepared.length} chunks`;
  }

  if (prepared.length === 0) {
    console.log(
      `[WARN] ${article.source}: chunker produced 0 chunks (empty content?), skipping`,
    );
    return;
  }

  const embeddings = await embedBatch(prepared.map((c) => c.content));

  const insertRows = prepared.map((chunk, i) => ({
    documentId: doc.id,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[i]!,
    metadata: chunk.metadata,
  }));

  const inserted = await insertChunks(insertRows);
  console.log(`[OK] ${article.source}: ${countsSuffix} inserted (${inserted})`);
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
async function reportOrphans(articles: ArticleFile[]): Promise<void> {
  const onDisk = new Set(articles.map((a) => a.source));
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
  const articles = await loadArticles(ARTICLES_DIR);

  if (articles.length === 0) {
    console.log(`[WARN] No .md articles found in ${ARTICLES_DIR}`);
    return 0;
  }

  await reportOrphans(articles);

  const stats: Stats = { processed: 0, skipped: 0, errors: 0 };

  for (const article of articles) {
    try {
      await ingestArticle(article, stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[ERROR] ${article.source}: ${message}`);
      stats.errors += 1;
    }
  }

  const total = await totalChunks();

  console.log("");
  console.log("=== Ingestion report ===");
  console.log(`Total articles:      ${articles.length}`);
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

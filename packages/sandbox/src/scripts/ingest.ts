import { resolve } from "node:path";
import { config } from "../config.js";
import { pool, closePool } from "../db.js";
import { sha256 } from "../hash.js";
import { loadArticles, type ArticleFile } from "../articles.js";
import { chunkText } from "../chunker.js";
import { embedBatch } from "../embedder.js";
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

async function ingestArticle(
  article: ArticleFile,
  stats: Stats,
): Promise<void> {
  const contentHash = sha256(article.content);
  const existing = await findDocumentBySource(article.source);

  if (existing && existing.contentHash === contentHash) {
    const chunkCount = await countChunksForDocument(existing.id);
    if (chunkCount > 0) {
      console.log(`[SKIP] ${article.source} (unchanged)`);
      stats.skipped += 1;
      return;
    }
  }

  console.log(`[PROCESS] ${article.source}`);

  const doc = await upsertDocument({
    source: article.source,
    title: article.title,
    contentHash,
  });

  await deleteChunksForDocument(doc.id);

  const chunks = chunkText(article.content);
  if (chunks.length === 0) {
    console.log(
      `[WARN] ${article.source}: chunker produced 0 chunks (empty content?), skipping`,
    );
    return;
  }

  const embeddings = await embedBatch(chunks.map((c) => c.content));

  const insertRows = chunks.map((chunk, i) => ({
    documentId: doc.id,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[i]!,
    metadata: { title: article.title },
  }));

  const inserted = await insertChunks(insertRows);
  console.log(`[OK] ${article.source}: ${inserted} chunks inserted`);
  stats.processed += 1;
}

async function totalChunks(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM chunks",
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function main(): Promise<number> {
  const articles = await loadArticles(ARTICLES_DIR);

  if (articles.length === 0) {
    console.log(`[WARN] No .md articles found in ${ARTICLES_DIR}`);
    return 0;
  }

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

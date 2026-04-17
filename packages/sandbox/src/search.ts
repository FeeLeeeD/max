import { query } from "./db.js";
import { embed } from "./embedder.js";

export interface SearchResult {
  chunkId: number;
  documentId: number;
  source: string;
  title: string | null;
  chunkIndex: number;
  content: string;
  score: number;
  tokenCount: number | null;
}

export interface SearchOptions {
  topK: number;
  minScore?: number;
}

const DEFAULT_TOP_K = 5;

interface RawRow {
  chunk_id: number;
  document_id: number;
  source: string;
  title: string | null;
  chunk_index: number;
  content: string;
  token_count: number | null;
  score: string | number;
}

// pgvector's textual vector literal: '[n,n,n]'. Matches the format used on
// insert in repository.ts so the query and the index see the same shape.
function formatVector(vec: number[]): string {
  return "[" + vec.join(",") + "]";
}

export async function search(
  queryText: string,
  options?: Partial<SearchOptions>,
): Promise<SearchResult[]> {
  const trimmed = queryText.trim();
  if (trimmed.length === 0) {
    throw new Error("search: query must be a non-empty string");
  }

  const topK = options?.topK ?? DEFAULT_TOP_K;
  if (!Number.isFinite(topK) || topK < 1) {
    throw new Error(`search: topK must be a positive integer, got ${topK}`);
  }

  const embedding = await embed(trimmed);
  const vectorLiteral = formatVector(embedding);

  // ORDER BY on the raw distance expression (not on the computed `score`
  // alias) so the HNSW index on `embedding vector_cosine_ops` can serve the
  // ordering. Ordering by `score DESC` would force a sequential scan.
  const rows = await query<RawRow>(
    `
      SELECT
        c.id            AS chunk_id,
        c.document_id   AS document_id,
        d.source        AS source,
        d.title         AS title,
        c.chunk_index   AS chunk_index,
        c.content       AS content,
        c.token_count   AS token_count,
        1 - (c.embedding <=> $1::vector) AS score
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
    `,
    [vectorLiteral, topK],
  );

  const results: SearchResult[] = rows.map((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    source: r.source,
    title: r.title,
    chunkIndex: r.chunk_index,
    content: r.content,
    tokenCount: r.token_count,
    score: typeof r.score === "string" ? Number(r.score) : r.score,
  }));

  if (options?.minScore !== undefined) {
    const threshold = options.minScore;
    return results.filter((r) => r.score >= threshold);
  }
  return results;
}

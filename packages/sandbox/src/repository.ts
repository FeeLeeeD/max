import { pool, query } from "./db.js";

export interface DocumentRow {
  id: number;
  source: string;
  title: string | null;
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChunkRow {
  id: number;
  documentId: number;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// pgvector accepts the textual form '[n,n,n]' for parameterized inserts into
// a `vector` column. We build that string ourselves to avoid adding a
// pgvector client dependency.
function formatVector(vec: number[]): string {
  return "[" + vec.join(",") + "]";
}

interface RawDocumentRow {
  id: number;
  source: string;
  title: string | null;
  content_hash: string;
  created_at: Date;
  updated_at: Date;
}

function mapDocument(row: RawDocumentRow): DocumentRow {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    contentHash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findDocumentBySource(
  source: string,
): Promise<DocumentRow | null> {
  const rows = await query<RawDocumentRow>(
    `SELECT id, source, title, content_hash, created_at, updated_at
       FROM documents
      WHERE source = $1`,
    [source],
  );
  const row = rows[0];
  return row ? mapDocument(row) : null;
}

export async function upsertDocument(args: {
  source: string;
  title: string | null;
  contentHash: string;
}): Promise<DocumentRow> {
  const rows = await query<RawDocumentRow>(
    `INSERT INTO documents (source, title, content_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (source) DO UPDATE
       SET title = EXCLUDED.title,
           content_hash = EXCLUDED.content_hash,
           updated_at = now()
     RETURNING id, source, title, content_hash, created_at, updated_at`,
    [args.source, args.title, args.contentHash],
  );
  return mapDocument(rows[0]!);
}

export async function deleteChunksForDocument(
  documentId: number,
): Promise<number> {
  const result = await pool.query(
    "DELETE FROM chunks WHERE document_id = $1",
    [documentId],
  );
  return result.rowCount ?? 0;
}

export async function insertChunks(
  rows: Array<{
    documentId: number;
    chunkIndex: number;
    content: string;
    tokenCount: number;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;

  const columnsPerRow = 6;
  const placeholders: string[] = [];
  const values: unknown[] = [];

  rows.forEach((r, i) => {
    const base = i * columnsPerRow;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`,
    );
    values.push(
      r.documentId,
      r.chunkIndex,
      r.content,
      r.tokenCount,
      formatVector(r.embedding),
      JSON.stringify(r.metadata ?? {}),
    );
  });

  const sql = `
    INSERT INTO chunks
      (document_id, chunk_index, content, token_count, embedding, metadata)
    VALUES ${placeholders.join(", ")}
  `;

  const result = await pool.query(sql, values);
  return result.rowCount ?? rows.length;
}

export async function countChunksForDocument(
  documentId: number,
): Promise<number> {
  const rows = await query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM chunks WHERE document_id = $1",
    [documentId],
  );
  return Number(rows[0]?.count ?? 0);
}

export interface DocumentSummary {
  id: number;
  source: string;
  title: string | null;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RawDocumentSummaryRow {
  id: number;
  source: string;
  title: string | null;
  chunk_count: string;
  created_at: Date;
  updated_at: Date;
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const rows = await query<RawDocumentSummaryRow>(
    `SELECT d.id,
            d.source,
            d.title,
            COUNT(c.id)::text AS chunk_count,
            d.created_at,
            d.updated_at
       FROM documents d
       LEFT JOIN chunks c ON c.document_id = d.id
      GROUP BY d.id
      ORDER BY d.source`,
  );
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    chunkCount: Number(row.chunk_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteDocumentBySource(
  source: string,
): Promise<{ deleted: boolean; documentId: number | null }> {
  const rows = await query<{ id: number }>(
    "DELETE FROM documents WHERE source = $1 RETURNING id",
    [source],
  );
  const row = rows[0];
  return { deleted: Boolean(row), documentId: row?.id ?? null };
}

export async function getStats(): Promise<{
  documentCount: number;
  chunkCount: number;
  chunksWithoutEmbedding: number;
}> {
  const rows = await query<{
    document_count: string;
    chunk_count: string;
    chunks_without_embedding: string;
  }>(
    `SELECT
       (SELECT COUNT(*)::text FROM documents) AS document_count,
       (SELECT COUNT(*)::text FROM chunks) AS chunk_count,
       (SELECT COUNT(*)::text FROM chunks WHERE embedding IS NULL)
         AS chunks_without_embedding`,
  );
  const row = rows[0];
  return {
    documentCount: Number(row?.document_count ?? 0),
    chunkCount: Number(row?.chunk_count ?? 0),
    chunksWithoutEmbedding: Number(row?.chunks_without_embedding ?? 0),
  };
}

export async function deleteAllDocuments(): Promise<{
  documentsDeleted: number;
}> {
  const result = await pool.query("DELETE FROM documents");
  return { documentsDeleted: result.rowCount ?? 0 };
}

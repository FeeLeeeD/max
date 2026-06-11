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
  // document_type column is being retired; hardcoded until the migration drops it (step 2c).
  const rows = await query<RawDocumentRow>(
    `INSERT INTO documents (source, title, content_hash, document_type)
     VALUES ($1, $2, $3, 'article')
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

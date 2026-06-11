import { sha256 } from "./hash.js";
import { chunkMarkdown } from "./markdownChunker.js";
import { embedBatch } from "./embedder.js";
import {
  findDocumentBySource,
  upsertDocument,
  deleteChunksForDocument,
  insertChunks,
  countChunksForDocument,
} from "./repository.js";

// The single-document indexing pipeline: hash -> idempotency check -> chunk ->
// embed -> (re)insert. This is the reusable core shared by the CLI ingest
// script and the HTTP admin route. It knows nothing about files, the
// filesystem, or HTTP: callers hand it a stable `source` and raw markdown
// `content`, and own all reporting. Errors propagate to the caller.

export interface IngestDocumentInput {
  source: string; // stable identifier (e.g. filename)
  content: string; // raw markdown (full document incl. # title and preamble)
}

export interface IngestDocumentOptions {
  includeBreadcrumb?: boolean; // default true (matches current ingest behavior)
}

export type IngestOutcome =
  | { status: "indexed"; documentId: number; chunkCount: number; title: string }
  | { status: "skipped"; reason: "unchanged"; documentId: number }
  | { status: "empty"; reason: "no_chunks" };

export async function ingestDocument(
  input: IngestDocumentInput,
  options?: IngestDocumentOptions,
): Promise<IngestOutcome> {
  const { source, content } = input;
  const includeBreadcrumb = options?.includeBreadcrumb ?? true;

  // Hash the raw content, since that's the unit of change.
  const contentHash = sha256(content);
  const existing = await findDocumentBySource(source);

  if (existing && existing.contentHash === contentHash) {
    const chunkCount = await countChunksForDocument(existing.id);
    if (chunkCount > 0) {
      return { status: "skipped", reason: "unchanged", documentId: existing.id };
    }
  }

  const { meta, chunks } = chunkMarkdown(content, { includeBreadcrumb });

  // Filename fallback for the title lives here, not in the chunker.
  const title = meta.title ?? source.replace(/\.md$/i, "");

  // Never create chunkless document rows: an empty chunk set means there's
  // nothing retrievable, so we leave the DB untouched and report it.
  if (chunks.length === 0) {
    return { status: "empty", reason: "no_chunks" };
  }

  const doc = await upsertDocument({ source, title, contentHash });

  await deleteChunksForDocument(doc.id);

  // Embed the breadcrumb-augmented text, but store the clean content.
  const embeddings = await embedBatch(chunks.map((c) => c.embeddingText));

  const insertRows = chunks.map((chunk, i) => {
    const metadata: Record<string, unknown> = {
      title,
      heading: chunk.heading,
      headingPath: chunk.headingPath,
      partIndex: chunk.partIndex,
      topics: meta.topics,
    };
    if (meta.date !== null) metadata.date = meta.date;
    return {
      documentId: doc.id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[i]!,
      metadata,
    };
  });

  await insertChunks(insertRows);

  return {
    status: "indexed",
    documentId: doc.id,
    chunkCount: chunks.length,
    title,
  };
}

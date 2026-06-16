import { config } from "./config.js";

export const EMBEDDING_MODEL = "voyage-3.5-lite";
export const EMBEDDING_DIMENSION = 1024;

// Voyage distinguishes the embedding of stored documents from search queries.
// This MATTERS for retrieval quality: index with "document", search with
// "query". Every caller must declare which side it's on.
export type EmbeddingInputType = "query" | "document";

const VOYAGE_ENDPOINT = "https://api.voyageai.com/v1/embeddings";

// Voyage caps a single request at 1,000 inputs (and a per-model token ceiling —
// 1M tokens for voyage-3.5-lite). 128 is a conservative, adjustable default
// that keeps us well under the token ceiling even with ~800-token chunks.
const MAX_BATCH_SIZE = 128;

interface VoyageEmbeddingItem {
  object: string;
  embedding: number[];
  index: number;
}

interface VoyageEmbeddingResponse {
  object: string;
  data: VoyageEmbeddingItem[];
  model: string;
  usage: Record<string, unknown>;
}

export async function embed(
  text: string,
  inputType: EmbeddingInputType,
): Promise<number[]> {
  const [vector] = await embedBatch([text], inputType);
  return vector!;
}

export async function embedBatch(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let start = 0; start < texts.length; start += MAX_BATCH_SIZE) {
    const slice = texts.slice(start, start + MAX_BATCH_SIZE);
    const vectors = await embedChunk(slice, inputType);
    out.push(...vectors);
  }
  return out;
}

async function embedChunk(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  let response: Response;
  try {
    response = await fetch(VOYAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.voyageApiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        input_type: inputType,
        output_dimension: EMBEDDING_DIMENSION,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Voyage embeddings request failed (network error): ${message}`);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "<unreadable body>");
    throw new Error(
      `Voyage embeddings request failed: ${response.status} ${response.statusText} — ${bodyText}`,
    );
  }

  const payload = (await response.json()) as VoyageEmbeddingResponse;

  if (!Array.isArray(payload.data)) {
    throw new Error(
      `Voyage embeddings response missing "data" array: ${JSON.stringify(payload)}`,
    );
  }
  if (payload.data.length !== texts.length) {
    throw new Error(
      `Voyage embeddings count mismatch: requested ${texts.length}, got ${payload.data.length}`,
    );
  }

  // Voyage returns items in `data`, but the order is not guaranteed to match
  // the input order — sort by `index` before extracting the vectors.
  const sorted = [...payload.data].sort((a, b) => a.index - b.index);

  return sorted.map((item, i) => {
    const vec = item.embedding;
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Voyage embedding ${i} has wrong dimension: expected ${EMBEDDING_DIMENSION}, got ${
          Array.isArray(vec) ? vec.length : typeof vec
        }`,
      );
    }
    return vec;
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity: vector length mismatch (${a.length} vs ${b.length})`,
    );
  }

  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
  }
  return dot;
}

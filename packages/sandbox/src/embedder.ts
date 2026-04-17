import { pipeline } from "@xenova/transformers";

export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIMENSION = 384;

// Mean-pooled + L2-normalized vectors let us use a plain dot product as
// cosine similarity downstream.
const POOLING_OPTS = { pooling: "mean", normalize: true };

// The @xenova/transformers types for pipeline() are dynamic based on the task
// and don't cooperate well with strict TS — using `any` for the extractor is
// the pragmatic call here.
type Extractor = (
  input: string | string[],
  opts?: Record<string, unknown>,
) => Promise<any>;

let extractorPromise: Promise<Extractor> | null = null;

async function getExtractor(): Promise<Extractor> {
  if (extractorPromise) return extractorPromise;

  process.stderr.write(
    "Loading embedding model (first run downloads ~90MB)...\n",
  );

  extractorPromise = (async () => {
    const extractor = (await pipeline(
      "feature-extraction",
      EMBEDDING_MODEL,
    )) as unknown as Extractor;
    process.stderr.write("Model loaded.\n");
    return extractor;
  })();

  return extractorPromise;
}

export async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, POOLING_OPTS);
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const extractor = await getExtractor();
  const output = await extractor(texts, POOLING_OPTS);

  // For batch input the Tensor has shape [N, EMBEDDING_DIMENSION]; tolist()
  // yields a clean number[][] without manual slicing of the flat buffer.
  return output.tolist() as number[][];
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

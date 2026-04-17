export interface ChunkOptions {
  maxTokens: number;
  minTokens: number;
}

export interface Chunk {
  content: string;
  tokenCount: number;
  chunkIndex: number;
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxTokens: 500,
  minTokens: 100,
};

// Rough heuristic: ~4 characters per token for English. Good enough to pick
// chunk boundaries; not a substitute for a real tokenizer.
export function approxTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// Split on sentence-ending punctuation followed by whitespace + capital letter.
// This is intentionally naive — it will mis-split things like "Dr. Smith" or
// "e.g. foo" — but it's sufficient as a fallback for oversized paragraphs.
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Hard-slice a single oversize sentence, cutting at the last space within the
// limit where possible so we don't break mid-word.
function hardSlice(text: string, maxChars: number): string[] {
  const result: string[] = [];
  let remaining = text.trim();
  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars);
    const lastSpace = window.lastIndexOf(" ");
    const cutAt = lastSpace > maxChars * 0.5 ? lastSpace : maxChars;
    result.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }
  if (remaining.length > 0) result.push(remaining);
  return result;
}

// Greedy pack a sequence of units (paragraphs or sentences) into chunks,
// joining consecutive units with `separator` until the next one would overflow.
function packUnits(
  units: string[],
  maxTokens: number,
  separator: string,
): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (current === "") {
      current = unit;
      continue;
    }
    const candidate = current + separator + unit;
    if (approxTokenCount(candidate) <= maxTokens) {
      current = candidate;
    } else {
      chunks.push(current);
      current = unit;
    }
  }
  if (current !== "") chunks.push(current);
  return chunks;
}

export function chunkText(
  text: string,
  options?: Partial<ChunkOptions>,
): Chunk[] {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options };
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];

  const maxChars = opts.maxTokens * 4;
  const paragraphs = splitIntoParagraphs(normalized);
  const rawChunks: string[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    rawChunks.push(...packUnits(buffer, opts.maxTokens, "\n\n"));
    buffer = [];
  };

  for (const paragraph of paragraphs) {
    if (approxTokenCount(paragraph) <= opts.maxTokens) {
      buffer.push(paragraph);
      continue;
    }

    // Oversize paragraph: flush what we have, then split it by sentences and
    // pack those separately. Sentences stay joined with a single space to
    // preserve intra-paragraph prose flow.
    flushBuffer();
    const sentenceUnits: string[] = [];
    for (const sentence of splitIntoSentences(paragraph)) {
      if (approxTokenCount(sentence) > opts.maxTokens) {
        sentenceUnits.push(...hardSlice(sentence, maxChars));
      } else {
        sentenceUnits.push(sentence);
      }
    }
    rawChunks.push(...packUnits(sentenceUnits, opts.maxTokens, " "));
  }
  flushBuffer();

  // If the tail chunk is below minTokens, fold it into the previous chunk —
  // but only if doing so doesn't blow the max budget by more than 30%. This
  // avoids orphaned tiny chunks without producing grossly oversized ones.
  if (rawChunks.length >= 2) {
    const last = rawChunks[rawChunks.length - 1]!;
    if (approxTokenCount(last) < opts.minTokens) {
      const prev = rawChunks[rawChunks.length - 2]!;
      const merged = `${prev}\n\n${last}`;
      if (approxTokenCount(merged) <= opts.maxTokens * 1.3) {
        rawChunks.splice(rawChunks.length - 2, 2, merged);
      }
    }
  }

  return rawChunks.map((content, chunkIndex) => ({
    content,
    tokenCount: approxTokenCount(content),
    chunkIndex,
  }));
}

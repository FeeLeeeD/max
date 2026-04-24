import { approxTokenCount, chunkText } from "./chunker.js";
import type { EmailThread } from "./emailThreadParser.js";

const TARGET_TOKENS = 800;
const MERGE_THRESHOLD = 150;
const MERGE_CEILING = Math.floor(TARGET_TOKENS * 1.3);

export interface ThreadChunk {
  content: string;
  tokenCount: number;
  chunkIndex: number;
  threadIndex: number;
  threadTitle: string;
  subject: string | null;
  dateRange: string | null;
}

function buildHeader(t: EmailThread): string {
  const subject = t.subject ?? "—";
  const date = t.dateRange ?? "—";
  return `[Thread #${t.threadIndex}: ${t.title}]\nSubject: ${subject}\nDate: ${date}\n\n`;
}

// Split body into H3-anchored sections. The H3 heading line stays with its
// content so retrieved chunks include the "### Response from Mike..." label.
// Anything before the first H3 becomes a leading section on its own.
function splitByH3(body: string): string[] {
  const lines = body.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const joined = current.join("\n").trim();
    if (joined.length > 0) sections.push(joined);
    current = [];
  };

  for (const line of lines) {
    if (/^###\s/.test(line)) {
      flush();
    }
    current.push(line);
  }
  flush();

  return sections;
}

function chunkSingleThread(
  thread: EmailThread,
  startChunkIndex: number,
): ThreadChunk[] {
  const header = buildHeader(thread);
  const baseMeta = {
    threadIndex: thread.threadIndex,
    threadTitle: thread.title,
    subject: thread.subject,
    dateRange: thread.dateRange,
  };

  const fullContent = header + thread.body;
  if (approxTokenCount(fullContent) <= TARGET_TOKENS) {
    return [
      {
        content: fullContent,
        tokenCount: approxTokenCount(fullContent),
        chunkIndex: startChunkIndex,
        ...baseMeta,
      },
    ];
  }

  // Split path. Every chunk re-includes the header, so the per-chunk body
  // budget is reduced by the header's token cost to keep total size on
  // target. Guard against tiny/negative budgets if the header itself is
  // unusually long.
  const headerTokens = approxTokenCount(header);
  const bodyBudget = Math.max(TARGET_TOKENS - headerTokens, 100);

  const sections = splitByH3(thread.body);

  // If any single section is over-budget, fall back to the paragraph-aware
  // chunker for that section only. This keeps normal sections intact while
  // still handling one-huge-message edge cases gracefully.
  const units: string[] = [];
  for (const section of sections) {
    if (approxTokenCount(section) <= bodyBudget) {
      units.push(section);
      continue;
    }
    const subChunks = chunkText(section, { maxTokens: bodyBudget });
    for (const sub of subChunks) units.push(sub.content);
  }

  // Greedy packing, same shape as chunker.ts but parameterized on bodyBudget.
  const bodyChunks: string[] = [];
  let current = "";
  for (const u of units) {
    if (current === "") {
      current = u;
      continue;
    }
    const candidate = `${current}\n\n${u}`;
    if (approxTokenCount(candidate) <= bodyBudget) {
      current = candidate;
    } else {
      bodyChunks.push(current);
      current = u;
    }
  }
  if (current !== "") bodyChunks.push(current);

  return bodyChunks.map((body, i) => {
    const content = header + body;
    return {
      content,
      tokenCount: approxTokenCount(content),
      chunkIndex: startChunkIndex + i,
      ...baseMeta,
    };
  });
}

// The header block we prepend to every chunk ends with a blank line, so the
// body starts right after the first "\n\n". Used to splice two chunks from
// the same thread without duplicating the header.
function extractBodyAfterHeader(content: string): string {
  const sep = content.indexOf("\n\n");
  if (sep === -1) return content;
  return content.slice(sep + 2);
}

// Fold small trailing chunks (e.g. a 50-token "### Resolution" that got left
// behind by the greedy packer) back into the previous chunk from the same
// thread, as long as the merged size stays within the soft ceiling. Run
// right-to-left so a chain of tiny chunks can collapse in one pass.
function mergeTinyTrailingChunks(chunks: ThreadChunk[]): ThreadChunk[] {
  for (let i = chunks.length - 1; i > 0; i--) {
    const curr = chunks[i]!;
    const prev = chunks[i - 1]!;
    if (curr.threadIndex !== prev.threadIndex) continue;
    if (curr.tokenCount >= MERGE_THRESHOLD) continue;

    const mergedContent = `${prev.content}\n\n${extractBodyAfterHeader(curr.content)}`;
    const mergedTokens = approxTokenCount(mergedContent);
    if (mergedTokens > MERGE_CEILING) continue;

    prev.content = mergedContent;
    prev.tokenCount = mergedTokens;
    chunks.splice(i, 1);
  }

  // Renumber chunkIndex so it stays dense and monotonic after splices.
  chunks.forEach((c, i) => {
    c.chunkIndex = i;
  });
  return chunks;
}

export function chunkEmailThreads(threads: EmailThread[]): ThreadChunk[] {
  const out: ThreadChunk[] = [];
  let nextIndex = 0;
  for (const thread of threads) {
    const chunks = chunkSingleThread(thread, nextIndex);
    out.push(...chunks);
    nextIndex += chunks.length;
  }
  return mergeTinyTrailingChunks(out);
}

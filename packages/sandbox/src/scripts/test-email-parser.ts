import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { config } from "../config.js";
import { detectDocumentTypeFromFilename } from "../documentType.js";
import { parseEmailThreads, type EmailThread } from "../emailThreadParser.js";
import { chunkEmailThreads, type ThreadChunk } from "../emailThreadChunker.js";

const SAMPLE_FILE = resolve(
  config.projectRoot,
  "data/samples/sample-email-threads.email.md",
);

const TARGET_TOKENS = 800;
const TOKEN_CEILING = Math.floor(TARGET_TOKENS * 1.3);
const MIN_CHUNK_TOKENS = 150;

function preview(s: string, max: number): string {
  const collapsed = s.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max) + "...";
}

function pad(n: number | string, width: number): string {
  return String(n).padStart(width, " ");
}

function printThreadTable(threads: EmailThread[]): void {
  console.log("");
  console.log(`Parsed ${threads.length} threads:`);
  console.log(
    `  ${pad("idx", 3)}  ${pad("body", 6)}  ${pad("date", 24)}  ${"subject (truncated)"}`,
  );
  for (const t of threads) {
    console.log(
      `  ${pad(t.threadIndex, 3)}  ${pad(t.body.length, 6)}  ${pad(t.dateRange ?? "—", 24)}  ${preview(t.subject ?? "—", 60)}`,
    );
  }
}

function printChunkTable(chunks: ThreadChunk[]): void {
  console.log("");
  console.log(`Chunked into ${chunks.length} chunks:`);
  console.log(
    `  ${pad("idx", 3)}  ${pad("thr", 3)}  ${pad("tok", 4)}  starts with`,
  );
  for (const c of chunks) {
    console.log(
      `  ${pad(c.chunkIndex, 3)}  ${pad(c.threadIndex, 3)}  ${pad(c.tokenCount, 4)}  ${preview(c.content, 70)}`,
    );
  }
}

async function main(): Promise<number> {
  const failures: string[] = [];

  const detected = detectDocumentTypeFromFilename(basename(SAMPLE_FILE));
  console.log(`detectDocumentTypeFromFilename -> ${detected}`);
  if (detected !== "email_thread_collection") {
    failures.push(
      `expected detectDocumentTypeFromFilename = "email_thread_collection", got "${detected}"`,
    );
  }

  const raw = await readFile(SAMPLE_FILE, "utf8");
  const threads = parseEmailThreads(raw);
  printThreadTable(threads);

  if (threads.length !== 4) {
    failures.push(`expected exactly 4 threads, got ${threads.length}`);
  }

  const expectedIndexes = [1, 2, 3, 4];
  const actualIndexes = threads.map((t) => t.threadIndex);
  if (JSON.stringify(actualIndexes) !== JSON.stringify(expectedIndexes)) {
    failures.push(
      `expected threadIndex sequence [1,2,3,4], got [${actualIndexes.join(",")}]`,
    );
  }

  for (const t of threads) {
    if (!t.subject) {
      failures.push(`thread ${t.threadIndex} has null/empty subject`);
    }
    if (!t.dateRange) {
      failures.push(`thread ${t.threadIndex} has null/empty dateRange`);
    }
    // Metadata markers must not leak into the body at any position.
    for (const marker of ["**Date:**", "**Date Range:**", "**Subject:**"]) {
      if (t.body.includes(marker)) {
        failures.push(
          `thread ${t.threadIndex} body still contains metadata marker "${marker}"`,
        );
      }
    }
  }

  const chunks = chunkEmailThreads(threads);
  printChunkTable(chunks);

  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i]!.chunkIndex !== i) {
      failures.push(
        `chunk at position ${i} has chunkIndex=${chunks[i]!.chunkIndex} (expected ${i})`,
      );
    }
  }

  for (const c of chunks) {
    if (!c.content.startsWith("[Thread #")) {
      failures.push(
        `chunk ${c.chunkIndex} (thread ${c.threadIndex}) does not start with "[Thread #"`,
      );
    }
    if (c.tokenCount > TOKEN_CEILING) {
      failures.push(
        `chunk ${c.chunkIndex} (thread ${c.threadIndex}) tokenCount=${c.tokenCount} exceeds ceiling ${TOKEN_CEILING}`,
      );
    }
  }

  // "No tiny chunks" — every chunk >= 150 tokens, EXCEPT the degenerate case
  // where an entire thread is shorter than 150 tokens (then its single chunk
  // can legitimately be smaller).
  const byThread = new Map<number, ThreadChunk[]>();
  for (const c of chunks) {
    const arr = byThread.get(c.threadIndex) ?? [];
    arr.push(c);
    byThread.set(c.threadIndex, arr);
  }
  for (const c of chunks) {
    if (c.tokenCount >= MIN_CHUNK_TOKENS) continue;
    const group = byThread.get(c.threadIndex)!;
    const threadTotal = group.reduce((s, x) => s + x.tokenCount, 0);
    const isOnlyChunk = group.length === 1;
    if (!isOnlyChunk || threadTotal >= MIN_CHUNK_TOKENS) {
      failures.push(
        `chunk ${c.chunkIndex} (thread ${c.threadIndex}) is tiny: tokenCount=${c.tokenCount} < ${MIN_CHUNK_TOKENS}`,
      );
    }
  }

  for (const [threadIndex, group] of byThread) {
    const first = group[0]!;
    for (const c of group.slice(1)) {
      if (c.threadTitle !== first.threadTitle) {
        failures.push(
          `thread ${threadIndex}: inconsistent threadTitle across chunks`,
        );
      }
      if (c.subject !== first.subject) {
        failures.push(
          `thread ${threadIndex}: inconsistent subject across chunks`,
        );
      }
      if (c.dateRange !== first.dateRange) {
        failures.push(
          `thread ${threadIndex}: inconsistent dateRange across chunks`,
        );
      }
    }
  }

  console.log("");
  console.log("============================================");
  if (failures.length === 0) {
    console.log("OVERALL: PASS");
    return 0;
  }
  for (const f of failures) console.log(`  ! ${f}`);
  console.log("OVERALL: FAIL");
  return 1;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`test-email-parser failed: ${message}`);
  exitCode = 1;
}
process.exit(exitCode);

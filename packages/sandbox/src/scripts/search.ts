import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { config } from "../config.js";
import { closePool } from "../db.js";
import { EMBEDDING_MODEL } from "../embedder.js";
import { search, type SearchResult } from "../search.js";

const USAGE = `Usage:
  search <query...>                    Run a single query (positional words are joined).
  search --batch <path>                Run queries from a JSON file.

Options:
  -k, --top-k <n>         Number of results to return (default 5).
  -m, --min-score <f>     Drop results below this cosine similarity.
      --batch <path>      Read queries from a JSON file and write results to data/output/.
  -h, --help              Show this help.`;

interface CliOptions {
  topK: number;
  minScore: number | undefined;
  batchPath: string | undefined;
  query: string;
  help: boolean;
}

interface BatchQuery {
  query: string;
  note: string | null;
}

function parseNumberOpt(
  raw: string | undefined,
  flag: string,
): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`${flag} must be a finite number, got "${raw}"`);
  }
  return n;
}

function parseCli(argv: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      "top-k": { type: "string", short: "k" },
      "min-score": { type: "string", short: "m" },
      batch: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const topKRaw = parseNumberOpt(values["top-k"], "--top-k");
  if (topKRaw !== undefined && (!Number.isInteger(topKRaw) || topKRaw < 1)) {
    throw new Error(`--top-k must be a positive integer, got "${values["top-k"]}"`);
  }

  return {
    topK: topKRaw ?? 5,
    minScore: parseNumberOpt(values["min-score"], "--min-score"),
    batchPath: values.batch,
    query: positionals.join(" ").trim(),
    help: Boolean(values.help),
  };
}

function truncate(s: string, max: number): string {
  const collapsed = s.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max).trimEnd() + "...";
}

// Wraps a single line at `width` on word boundaries. Long single words are
// split at the width to avoid overflow. Good enough for terminal previews.
function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length === 0) continue;
    if (word.length > width) {
      if (current.length > 0) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      continue;
    }
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function metaString(m: Record<string, unknown>, key: string): string | null {
  const v = m[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function metaNumber(m: Record<string, unknown>, key: string): number | null {
  const v = m[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Chunks from email threads carry their header block inline so retrieval is
// self-contained. The CLI renders those fields separately above the preview,
// so strip the leading header to avoid showing them twice.
function stripThreadHeader(content: string): string {
  if (!content.startsWith("[Thread #")) return content;
  const sep = content.indexOf("\n\n");
  if (sep === -1) return content;
  return content.slice(sep + 2);
}

function formatEmailThreadResult(r: SearchResult, index: number): string {
  const header = `─── Result ${index + 1} ───  score: ${r.score.toFixed(4)}`;
  const threadIdx = metaNumber(r.metadata, "threadIndex");
  const threadTitle = metaString(r.metadata, "threadTitle") ?? "(untitled)";
  const subject = metaString(r.metadata, "subject") ?? "—";
  const dateRange = metaString(r.metadata, "dateRange") ?? "—";

  const idLabel = threadIdx !== null ? `#${threadIdx}` : "";
  const subjectDate = `Subject: ${subject}  |  Date: ${dateRange}`;
  const source = `Source: ${r.source} (chunk ${r.chunkIndex}${
    r.tokenCount !== null ? `, ${r.tokenCount} tokens` : ""
  })`;

  const preview = truncate(stripThreadHeader(r.content), 300);
  const body = wrap(preview, 80).join("\n");

  return [
    header,
    `📧 Email Thread ${idLabel} — ${threadTitle}`,
    subjectDate,
    source,
    "",
    body,
  ].join("\n");
}

function formatResult(r: SearchResult, index: number): string {
  if (r.metadata["documentType"] === "email_thread_collection") {
    return formatEmailThreadResult(r, index);
  }

  const tokens =
    r.tokenCount !== null ? `, ${r.tokenCount} tokens` : "";
  const header = `─── Result ${index + 1} ───  score: ${r.score.toFixed(4)}`;
  const source = `Source: ${r.source} (chunk ${r.chunkIndex}${tokens})`;
  const title = r.title ? `Title:  ${r.title}` : null;
  const preview = truncate(r.content, 300);
  const body = wrap(preview, 80).join("\n");

  const lines = [header, source];
  if (title) lines.push(title);
  lines.push("", body);
  return lines.join("\n");
}

async function runInteractive(opts: CliOptions): Promise<void> {
  const results = await search(opts.query, {
    topK: opts.topK,
    minScore: opts.minScore,
  });

  console.log(`Query: "${opts.query}"`);

  if (results.length === 0) {
    console.log("No results found.");
    return;
  }

  console.log(`Found ${results.length} result${results.length === 1 ? "" : "s"}:`);
  console.log("");
  results.forEach((r, i) => {
    console.log(formatResult(r, i));
    console.log("");
  });
}

function validateBatchInput(parsed: unknown): BatchQuery[] {
  if (!Array.isArray(parsed)) {
    throw new Error("batch file must contain a JSON array of query objects");
  }
  const out: BatchQuery[] = [];
  parsed.forEach((entry, i) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error(`batch entry ${i} must be an object, got ${typeof entry}`);
    }
    const obj = entry as Record<string, unknown>;
    if (typeof obj.query !== "string" || obj.query.trim().length === 0) {
      throw new Error(`batch entry ${i} must have a non-empty "query" string`);
    }
    let note: string | null = null;
    if (obj.note !== undefined && obj.note !== null) {
      if (typeof obj.note !== "string") {
        throw new Error(`batch entry ${i} "note" must be a string or null`);
      }
      note = obj.note;
    }
    out.push({ query: obj.query, note });
  });
  return out;
}

function timestampUtc(d: Date): string {
  const pad = (n: number, w = 2): string => String(n).padStart(w, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

async function runBatch(opts: CliOptions, batchPath: string): Promise<void> {
  const absPath = resolve(process.cwd(), batchPath);
  const raw = await readFile(absPath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`failed to parse ${batchPath} as JSON: ${message}`);
  }

  const queries = validateBatchInput(parsed);

  const runAt = new Date();
  const outputDir = resolve(config.projectRoot, "data/output");
  await mkdir(outputDir, { recursive: true });
  const outputPath = resolve(
    outputDir,
    `results-${timestampUtc(runAt)}.json`,
  );

  interface OutputEntry {
    query: string;
    note: string | null;
    results: Array<{
      score: number;
      source: string;
      chunkIndex: number;
      title: string | null;
      content: string;
    }>;
  }

  const entries: OutputEntry[] = [];

  for (const q of queries) {
    const results = await search(q.query, {
      topK: opts.topK,
      minScore: opts.minScore,
    });
    entries.push({
      query: q.query,
      note: q.note,
      results: results.map((r) => ({
        score: r.score,
        source: r.source,
        chunkIndex: r.chunkIndex,
        title: r.title,
        content: r.content,
      })),
    });
  }

  const payload = {
    runAt: runAt.toISOString(),
    model: EMBEDDING_MODEL,
    topK: opts.topK,
    minScore: opts.minScore ?? null,
    queries: entries,
  };

  await writeFile(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const relOut = relative(config.projectRoot, outputPath);
  console.log("Batch search complete.");
  console.log(`Queries: ${entries.length}`);
  console.log(`Output:  ${relOut}`);
  console.log("");
  console.log("Quick preview:");
  for (const e of entries) {
    const top = e.results[0];
    const topScore = top !== undefined ? top.score.toFixed(4) : "n/a";
    console.log(
      `  "${e.query}" -> ${e.results.length} results, top score: ${topScore}`,
    );
  }
}

async function main(): Promise<number> {
  let opts: CliOptions;
  try {
    opts = parseCli(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}\n`);
    console.error(USAGE);
    return 1;
  }

  if (opts.help) {
    console.log(USAGE);
    return 0;
  }

  if (opts.batchPath !== undefined) {
    await runBatch(opts, opts.batchPath);
    return 0;
  }

  if (opts.query.length === 0) {
    console.error("Error: missing query.\n");
    console.error(USAGE);
    return 1;
  }

  await runInteractive(opts);
  return 0;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Search failed: ${message}`);
  exitCode = 1;
} finally {
  await closePool().catch(() => {});
}
process.exit(exitCode);

import { parseArgs } from "node:util";
import { closePool } from "../db.js";
import { ask, type AnswerResult, type AnsweredSource } from "../rag.js";

const USAGE = `Usage:
  ask <question...>          Ask a question against the knowledge base.

Options:
  -k, --top-k <n>           Number of chunks to retrieve (default 5).
  -m, --min-score <f>        Refusal threshold — minimum cosine similarity (default 0.55).
      --model <id>           Model to use (default: claude-sonnet-4-5).
  -h, --help                 Show this help.`;

const LINE =
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

interface CliOptions {
  question: string;
  topK: number;
  minScore: number;
  model: string | undefined;
  help: boolean;
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
      model: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const topKRaw = parseNumberOpt(values["top-k"], "--top-k");
  if (topKRaw !== undefined && (!Number.isInteger(topKRaw) || topKRaw < 1)) {
    throw new Error(
      `--top-k must be a positive integer, got "${values["top-k"]}"`,
    );
  }

  const minScoreRaw = parseNumberOpt(values["min-score"], "--min-score");

  return {
    question: positionals.join(" ").trim(),
    topK: topKRaw ?? 5,
    minScore: minScoreRaw ?? 0.55,
    model: values.model,
    help: Boolean(values.help),
  };
}

function formatSource(src: AnsweredSource, index: number): string {
  const lines: string[] = [];
  const num = `  [${index + 1}] `;

  if (src.threadTitle) {
    const threadIdx =
      src.chunkIndex !== undefined ? `Thread #${src.chunkIndex + 1}` : "Thread";
    lines.push(`${num}📧 ${threadIdx}: ${src.threadTitle}`);
    lines.push(`       Source: ${src.source}, chunk ${src.chunkIndex}`);
    const datePart = src.dateRange ? `Date: ${src.dateRange}  |  ` : "";
    lines.push(`       ${datePart}Score: ${src.score.toFixed(4)}`);
  } else {
    lines.push(`${num}${src.source}, chunk ${src.chunkIndex}`);
    if (src.title) {
      lines.push(`       Title: ${src.title}`);
    }
    lines.push(`       Score: ${src.score.toFixed(4)}`);
  }

  return lines.join("\n");
}

function printResult(result: AnswerResult, minScore: number): void {
  console.log(LINE);
  console.log(`  Question: ${result.question}`);
  console.log(LINE);

  if (result.wasRefused) {
    console.log(`  ${result.answer}`);
    console.log(
      `  (Retrieval top score: ${result.retrievalScoreTop.toFixed(4)} — below threshold ${minScore})`,
    );
    console.log(LINE);
    return;
  }

  console.log("");
  console.log(result.answer);
  console.log("");
  console.log(LINE);

  if (result.sources.length > 0) {
    console.log("  Sources:");
    for (let i = 0; i < result.sources.length; i++) {
      console.log(formatSource(result.sources[i], i));
    }
    console.log(LINE);
  }

  console.log(
    `  Retrieval: top score ${result.retrievalScoreTop.toFixed(4)}, ${result.chunksUsed} chunks used`,
  );
  console.log(LINE);
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

  if (opts.question.length === 0) {
    console.error("Error: missing question.\n");
    console.error(USAGE);
    return 1;
  }

  const result = await ask(opts.question, {
    topK: opts.topK,
    minScore: opts.minScore,
    model: opts.model,
  });

  printResult(result, opts.minScore);
  return 0;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  exitCode = 1;
} finally {
  await closePool().catch(() => { });
}
process.exit(exitCode);

// Bulk-upload a folder of .md files to a deployed (or local) MAX API.
//
// This is an HTTP CLIENT to the admin route `POST /admin/documents` — it does
// NOT import or re-implement any RAG/chunking/embedding logic. All of that runs
// server-side; this script only reads files and POSTs raw markdown. It's how we
// populate the cloud knowledge base after a deploy.
//
// CONTRACT MIRRORED FROM: packages/api/src/routes/admin.ts
//   POST /admin/documents  body { source, content }  (Bearer admin token)
//     201 { status:"indexed", documentId, chunkCount, title }
//     200 { status:"skipped", reason:"unchanged", documentId }
//     200 { status:"empty",   reason:"no_chunks" }
//     4xx/5xx { error, ... }   (400 bad body, 401 bad token, 503 admin disabled)
// If that route's request/response shape changes, update this script.
//
// IDEMPOTENCY: re-running is safe. The server hashes content (content_hash), so
// unchanged documents come back as "skipped" — you can re-run after a partial
// failure and only the missing/changed docs get re-indexed. `source` here is the
// bare filename (e.g. `foo.md`), matching what the local `ingest` CLI uses, so
// idempotency lines up across both ingestion paths.
//
// USAGE:
//   tsx scripts/bulkUpload.ts [folder] [--api-url URL] [--token TOKEN] [--dry-run]
//   (or: pnpm --filter @max/api bulk-upload [folder] [flags])
//
//   folder      Positional. Directory of .md files. Defaults to <repoRoot>/data/articles.
//   --api-url   Target API base URL. Env: BULK_API_URL. Trailing slash trimmed. Required.
//   --token     Admin token. Env: BULK_ADMIN_TOKEN (falls back to ADMIN_TOKEN). Required.
//   --dry-run   List the files that WOULD be uploaded, then exit (sends nothing).
//
// Flags override env. Examples:
//   # dry run (no requests)
//   pnpm --filter @max/api bulk-upload data/articles --dry-run
//
//   # local API (token from your root .env — export it or pass --token)
//   BULK_API_URL=http://localhost:8000 ADMIN_TOKEN=dev-token \
//     pnpm --filter @max/api bulk-upload data/articles
//
//   # cloud API
//   BULK_API_URL=https://max-api.example.com BULK_ADMIN_TOKEN=prod-token \
//     pnpm --filter @max/api bulk-upload data/articles
//
// Exit code: 0 if zero files errored; non-zero if any file errored (so CI /
// automation can detect partial failures). No retries here — re-running is the
// safe retry (a per-request retry/backoff could be added later if needed).

import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Type-only import keeps this client in sync with the server's success contract.
// `import type` is erased at runtime, so it does NOT pull in the sandbox RAG
// modules (or their config/env validation) — nothing server-side runs here.
import type { IngestOutcome } from "@max/sandbox/ingest";

// Generic non-success body returned by the admin route ({ error, details? }).
interface AdminErrorBody {
  error: string;
  details?: unknown;
}

type AdminResponseBody = IngestOutcome | AdminErrorBody;

// Per-request timeout. Server-side embedding via Voyage can take a moment for
// large docs, so keep it generous. On timeout we classify as an error and move
// on to the next file rather than aborting the whole run.
const REQUEST_TIMEOUT_MS = 60_000;

// <repoRoot>/data/articles, derived from this file's location
// (packages/api/scripts/bulkUpload.ts -> ../../.. == repo root).
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const DEFAULT_FOLDER = resolve(repoRoot, "data/articles");

interface CliArgs {
  folder: string;
  apiUrl: string;
  token: string;
  dryRun: boolean;
  folderWasDefaulted: boolean;
}

interface ParsedFlags {
  apiUrl?: string;
  token?: string;
  dryRun: boolean;
  positionals: string[];
}

function parseFlags(argv: string[]): ParsedFlags {
  const flags: ParsedFlags = { dryRun: false, positionals: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    // Support both `--flag value` and `--flag=value` forms.
    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? undefined : arg.slice(eq + 1);
    const takeValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      const next = argv[++i];
      if (next === undefined) throw new Error(`Missing value for ${name}`);
      return next;
    };

    switch (name) {
      case "--api-url":
        flags.apiUrl = takeValue();
        break;
      case "--token":
        flags.token = takeValue();
        break;
      case "--dry-run":
        flags.dryRun = true;
        break;
      default:
        if (name.startsWith("--")) {
          throw new Error(`Unknown flag: ${name}`);
        }
        flags.positionals.push(arg);
    }
  }

  return flags;
}

function resolveArgs(argv: string[]): CliArgs {
  const flags = parseFlags(argv);

  const folderWasDefaulted = flags.positionals.length === 0;
  // Resolve relative to INIT_CWD (the directory where the user invoked pnpm/npm)
  // rather than process.cwd(), which pnpm changes to the package directory.
  // This means `./data/articles` passed from the repo root resolves correctly.
  const invocationDir = process.env.INIT_CWD ?? process.cwd();
  const folder = folderWasDefaulted
    ? DEFAULT_FOLDER
    : resolve(invocationDir, flags.positionals[0]!);

  // In dry-run mode no HTTP requests are sent, so URL and token are optional.
  // Flags override env. Token reuses the server's ADMIN_TOKEN name as a
  // fallback so a local run can lean on the same value from your .env.
  const apiUrlRaw = flags.apiUrl ?? process.env.BULK_API_URL;
  const token =
    flags.token ?? process.env.BULK_ADMIN_TOKEN ?? process.env.ADMIN_TOKEN;

  if (!flags.dryRun) {
    if (!apiUrlRaw) {
      throw new Error(
        "Target API URL is required. Set BULK_API_URL or pass --api-url <url>.",
      );
    }
    if (!token) {
      throw new Error(
        "Admin token is required. Set BULK_ADMIN_TOKEN (or ADMIN_TOKEN) or pass --token <token>.",
      );
    }
  }

  return {
    folder,
    apiUrl: apiUrlRaw ? apiUrlRaw.replace(/\/+$/, "") : "",
    token: token ?? "",
    dryRun: flags.dryRun,
    folderWasDefaulted,
  };
}

interface MarkdownFile {
  source: string; // bare filename — matches the local ingest's `source`
  path: string;
}

// Read directly with node:fs (deterministic, sorted). We intentionally do NOT
// reuse the sandbox's loadArticles(): it isn't in @max/sandbox's exports map, so
// importing it would reach past the package's public surface. Reading the dir
// here keeps this client decoupled from the RAG package.
async function discoverMarkdownFiles(folder: string): Promise<MarkdownFile[]> {
  let entries: string[];
  try {
    const s = await stat(folder);
    if (!s.isDirectory()) {
      throw new Error(`Source path is not a directory: ${folder}`);
    }
    entries = await readdir(folder);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e && e.code === "ENOENT") {
      throw new Error(`Source folder not found: ${folder}`);
    }
    throw err;
  }

  return entries
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort()
    .map((source) => ({ source, path: resolve(folder, source) }));
}

type Classification = "indexed" | "skipped" | "empty" | "error";

interface FileResult {
  source: string;
  classification: Classification;
  chunkCount: number; // 0 unless indexed
  message?: string; // populated for errors (and useful context otherwise)
}

async function uploadOne(
  file: MarkdownFile,
  apiUrl: string,
  token: string,
): Promise<FileResult> {
  let content: string;
  try {
    content = await readFile(file.path, "utf8");
  } catch (err) {
    return {
      source: file.source,
      classification: "error",
      chunkCount: 0,
      message: `failed to read file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/admin/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ source: file.source, content }),
      signal: controller.signal,
    });
  } catch (err) {
    // Network failure or timeout (AbortError) — record and continue.
    const aborted =
      err instanceof Error &&
      (err.name === "AbortError" || controller.signal.aborted);
    return {
      source: file.source,
      classification: "error",
      chunkCount: 0,
      message: aborted
        ? `request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : `network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    clearTimeout(timer);
  }

  // Body may not be JSON on unexpected failures (proxies, 5xx HTML, etc.).
  let body: AdminResponseBody | undefined;
  try {
    body = (await res.json()) as AdminResponseBody;
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    // Surface the auth/deploy edge cases with actionable messages.
    let message: string;
    if (res.status === 401) {
      message =
        "admin token rejected (check --token / BULK_ADMIN_TOKEN / ADMIN_TOKEN)";
    } else if (res.status === 503) {
      message =
        "admin routes disabled on the server (ADMIN_TOKEN not set on the API)";
    } else {
      const serverError =
        body && "error" in body ? body.error : res.statusText;
      message = `${res.status}: ${serverError ?? "request failed"}`;
    }
    return { source: file.source, classification: "error", chunkCount: 0, message };
  }

  // 2xx — classify off the body's status field (mirrors IngestOutcome).
  if (body && "status" in body) {
    switch (body.status) {
      case "indexed":
        return {
          source: file.source,
          classification: "indexed",
          chunkCount: body.chunkCount,
        };
      case "skipped":
        return {
          source: file.source,
          classification: "skipped",
          chunkCount: 0,
          message: "unchanged",
        };
      case "empty":
        return {
          source: file.source,
          classification: "empty",
          chunkCount: 0,
          message: "no_chunks",
        };
    }
  }

  return {
    source: file.source,
    classification: "error",
    chunkCount: 0,
    message: `unexpected ${res.status} response shape`,
  };
}

function printResult(r: FileResult): void {
  switch (r.classification) {
    case "indexed":
      console.log(`[indexed] ${r.source} — ${r.chunkCount} chunks`);
      break;
    case "skipped":
      console.log(`[skipped] ${r.source} (unchanged)`);
      break;
    case "empty":
      console.log(`[empty] ${r.source}`);
      break;
    case "error":
      console.log(`[error] ${r.source} — ${r.message}`);
      break;
  }
}

async function main(): Promise<number> {
  const args = resolveArgs(process.argv.slice(2));

  if (args.folderWasDefaulted) {
    console.log(`No folder given — using default: ${args.folder}`);
  }

  const files = await discoverMarkdownFiles(args.folder);

  if (files.length === 0) {
    console.log(`No .md files found in ${args.folder}`);
    return 0;
  }

  if (args.dryRun) {
    console.log(`[dry-run] ${files.length} file(s) would be uploaded to ${args.apiUrl}/admin/documents:`);
    for (const f of files) console.log(`  - ${f.source}`);
    console.log("[dry-run] no requests sent.");
    return 0;
  }

  console.log(`Uploading ${files.length} file(s) to ${args.apiUrl}/admin/documents (sequential)...`);

  const results: FileResult[] = [];
  // SEQUENTIAL: one request at a time, no concurrency. A per-file try/catch is
  // unnecessary because uploadOne never throws — it always returns a FileResult,
  // so a single failure can't abort the run; we record it and keep going.
  for (const file of files) {
    const result = await uploadOne(file, args.apiUrl, args.token);
    printResult(result);
    results.push(result);
  }

  const indexed = results.filter((r) => r.classification === "indexed");
  const skipped = results.filter((r) => r.classification === "skipped");
  const empty = results.filter((r) => r.classification === "empty");
  const errors = results.filter((r) => r.classification === "error");
  const totalChunks = indexed.reduce((sum, r) => sum + r.chunkCount, 0);

  console.log("");
  console.log("=== Upload summary ===");
  console.log(`Total files:   ${results.length}`);
  console.log(`Indexed:       ${indexed.length} (${totalChunks} chunks)`);
  console.log(`Skipped:       ${skipped.length} (unchanged)`);
  console.log(`Empty:         ${empty.length} (no chunks)`);
  console.log(`Errors:        ${errors.length}`);

  if (errors.length > 0) {
    console.log("");
    console.log("Failed files (re-run is safe — unchanged docs are skipped):");
    for (const e of errors) console.log(`  - ${e.source} — ${e.message}`);
  }

  const exitCode = errors.length > 0 ? 1 : 0;
  console.log("");
  console.log(
    exitCode === 0
      ? "Done — all files processed without errors (exit 0)."
      : `Done — ${errors.length} file(s) errored (exit 1).`,
  );
  return exitCode;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  console.error(`Bulk upload failed: ${err instanceof Error ? err.message : String(err)}`);
  exitCode = 1;
}
process.exit(exitCode);

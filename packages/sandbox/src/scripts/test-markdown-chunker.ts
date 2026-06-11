import { readFile } from "node:fs/promises";
import { approxTokenCount } from "../chunker.js";
import {
  chunkMarkdown,
  type ChunkMarkdownResult,
  type MarkdownChunk,
} from "../markdownChunker.js";

const TARGET_TOKENS = 800;

// A long answer that deliberately overflows the ~800-token target so we exercise
// the body-splitting (partIndex) path. Paragraphs are blank-line separated so
// the paragraph chunker has natural split points.
const OVERSIZED_ANSWER = Array.from({ length: 9 }, (_, i) =>
  `Paragraph ${i + 1}: Deliverability for a very large send depends on warmup, ` +
  `list hygiene, and engagement signals. Mailbox providers throttle senders who ` +
  `spike volume suddenly, so a wide delivery window protects your reputation and ` +
  `keeps hard bounces from being read as a spam signal. Authenticate with SPF, ` +
  `DKIM, and DMARC, suppress chronically inactive addresses, and ramp new IPs ` +
  `gradually rather than blasting the full list on day one.`,
).join("\n\n");

// Inline fallback sample mirroring the kb-tool format: a "# title" with
// "**Topics:**"/"**Date:**" metadata, a "## Summary"-style section, and several
// "### Question:"-style leaves — one of them oversized. Heading NAMES here are
// illustrative; the chunker keys off structure only.
const SAMPLE = `# How email throttling works with HubSpot

**Topics:** Throttling, Delivery-Window, HubSpot
**Date:** 2024-03-15

## Summary

Throttling spreads a large send across a delivery window so you do not spike
your sending reputation. It trades immediacy for safer, steadier inbox
placement, which matters most for big one-off campaigns.

## Details

### Question: How does throttling work?

When you enable throttling, the platform releases messages in batches across the
window you choose. Each batch is paced so total volume per hour stays under your
configured ceiling.

### Question: Can I exclude weekends?

Yes. Set the delivery window to weekdays only and the scheduler will skip
Saturday and Sunday, resuming Monday morning.

### Question: What are the deliverability implications of a very large send?

${OVERSIZED_ANSWER}
`;

function pad(n: number, width: number): string {
  return String(n).padStart(width, " ");
}

function indent(text: string, prefix: string): string {
  return text
    .split("\n")
    .map((l) => prefix + l)
    .join("\n");
}

function printResult(label: string, result: ChunkMarkdownResult): void {
  console.log(`\n========== ${label} ==========`);
  console.log(
    `meta: title=${JSON.stringify(result.meta.title)} ` +
      `topics=${JSON.stringify(result.meta.topics)} ` +
      `date=${JSON.stringify(result.meta.date)}`,
  );
  console.log(`chunks: ${result.chunks.length}\n`);

  for (const c of result.chunks) {
    console.log(
      `--- chunk [${pad(c.chunkIndex, 2)}] heading=${JSON.stringify(c.heading)} ` +
        `partIndex=${c.partIndex} tokens=${pad(c.tokenCount, 4)}`,
    );
    console.log(`    headingPath=${JSON.stringify(c.headingPath)}`);
    console.log(`  content:`);
    console.log(indent(c.content, "    | "));
    console.log(`  embeddingText:`);
    console.log(indent(c.embeddingText, "    > "));
    console.log("");
  }
}

function assertResult(
  result: ChunkMarkdownResult,
  includeBreadcrumb: boolean,
  isSample: boolean,
): string[] {
  const failures: string[] = [];
  const ceiling = Math.floor(TARGET_TOKENS * 1.3);
  const chunks = result.chunks;

  if (chunks.length === 0) failures.push("no chunks produced");

  chunks.forEach((c: MarkdownChunk, i) => {
    if (c.chunkIndex !== i) {
      failures.push(`chunk at position ${i} has chunkIndex=${c.chunkIndex}`);
    }
    if (c.content.trim().length === 0) {
      failures.push(`chunk ${c.chunkIndex} has empty content`);
    }
    if (c.tokenCount > ceiling) {
      failures.push(
        `chunk ${c.chunkIndex} tokenCount=${c.tokenCount} exceeds ceiling ${ceiling}`,
      );
    }
    if (approxTokenCount(c.content) !== c.tokenCount) {
      failures.push(`chunk ${c.chunkIndex} tokenCount != approxTokenCount(content)`);
    }
    // Preamble/metadata must never leak into a content chunk.
    if (/\*\*\s*topics\s*:\s*\*\*/i.test(c.content)) {
      failures.push(`chunk ${c.chunkIndex} leaked the Topics metadata line`);
    }
    if (/\*\*\s*date\s*:\s*\*\*/i.test(c.content)) {
      failures.push(`chunk ${c.chunkIndex} leaked the Date metadata line`);
    }
    // Breadcrumb contract.
    if (!includeBreadcrumb && c.embeddingText !== c.content) {
      failures.push(`chunk ${c.chunkIndex} embeddingText != content with breadcrumb off`);
    }
    if (includeBreadcrumb && c.headingPath.length > 0) {
      const expected = `[${c.headingPath.join(" > ")}]`;
      if (!c.embeddingText.startsWith(expected)) {
        failures.push(`chunk ${c.chunkIndex} missing expected breadcrumb ${expected}`);
      }
    }
  });

  if (isSample) {
    if (result.meta.title === null) failures.push("sample title should not be null");
    if (result.meta.topics.length !== 3) {
      failures.push(`sample expected 3 topics, got ${result.meta.topics.length}`);
    }
    if (result.meta.date !== "2024-03-15") {
      failures.push(`sample expected date 2024-03-15, got ${result.meta.date}`);
    }
    // The title line must not be emitted as its own chunk.
    if (chunks.some((c) => c.content.startsWith("# How email throttling"))) {
      failures.push("title line was emitted as a content chunk");
    }
    // The oversized answer must have triggered a split.
    if (!chunks.some((c) => c.partIndex !== null)) {
      failures.push("expected at least one split chunk (partIndex != null)");
    }
  }

  return failures;
}

async function main(): Promise<void> {
  const filePath = process.argv[2];
  const isSample = !filePath;
  const markdown = filePath
    ? await readFile(filePath, "utf8")
    : SAMPLE;

  console.log(
    isSample
      ? "Using inline sample document."
      : `Using file: ${filePath}`,
  );

  const withoutCrumb = chunkMarkdown(markdown, { includeBreadcrumb: false });
  const withCrumb = chunkMarkdown(markdown, { includeBreadcrumb: true });

  printResult("includeBreadcrumb: false", withoutCrumb);
  printResult("includeBreadcrumb: true", withCrumb);

  const failures = [
    ...assertResult(withoutCrumb, false, isSample),
    ...assertResult(withCrumb, true, isSample),
  ];

  console.log("============================================");
  if (failures.length === 0) {
    console.log("OVERALL: PASS");
    process.exit(0);
  }
  for (const f of failures) console.log(`  ! ${f}`);
  console.log("OVERALL: FAIL");
  process.exit(1);
}

main();

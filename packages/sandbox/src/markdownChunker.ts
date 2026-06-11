import {
  DEFAULT_CHUNK_OPTIONS,
  approxTokenCount,
  chunkText,
} from "./chunker.js";

// Header-aware chunker for kb-tool markdown. It generalizes the
// emailThreadChunker.ts pattern (split by headings -> wrap chunkText for
// oversized sections -> measure on the assembled content) to ARBITRARY heading
// depth, and crucially keys off heading *structure* only — never heading names.
// The kb-tool can rename "Summary"/"Question"/etc. freely; nothing here checks
// those strings.

const DEFAULT_MAX_TOKENS = 800;

export interface MarkdownChunk {
  content: string; // clean text (heading + body), no breadcrumb
  embeddingText: string; // content, optionally breadcrumb-prefixed
  heading: string | null; // this chunk's own heading text (null in flat fallback)
  headingPath: string[]; // doc title + ancestor headings, excludes own heading
  tokenCount: number; // approxTokenCount of content
  chunkIndex: number; // dense, monotonic across the whole document, 0-based
  partIndex: number | null; // null if section wasn't split; else 0,1,2...
}

export interface MarkdownDocMeta {
  title: string | null;
  topics: string[];
  date: string | null;
}

export interface ChunkMarkdownOptions {
  maxTokens?: number; // default 800
  includeBreadcrumb?: boolean; // default false
}

export interface ChunkMarkdownResult {
  meta: MarkdownDocMeta;
  chunks: MarkdownChunk[];
}

// --- Section tree -----------------------------------------------------------

interface Section {
  level: number; // ATX heading depth (number of leading '#')
  headingText: string; // heading text, '#' markers and trailing '#' stripped
  headingLine: string; // raw heading line, e.g. "## Summary"
  bodyLines: string[]; // direct lead-in lines, before the first child heading
  children: Section[];
}

interface SectionTree {
  roots: Section[];
  preambleLines: string[]; // lines before the very first heading
  titleSection: Section | null; // the first level-1 ('#') section, if any
}

// ATX headings only: a run of '#' followed by a space/tab, then the text.
// (We allow >6 '#' to honor the "arbitrary depth" requirement even though
// CommonMark caps at 6 — kb-tool output never goes that deep in practice.)
const HEADING_RE = /^(#+)[ \t]+(.*)$/;

// Fence open/close: 3+ backticks or tildes, optionally indented.
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/;

function headingTextOf(rest: string): string {
  // Drop an optional closing run of '#' (closed-ATX form: "## Foo ##").
  return rest.replace(/[ \t]+#+[ \t]*$/, "").trim();
}

// Walk the document line by line, building a nesting tree of sections. We must
// track fenced code blocks: a '#' inside ``` or ~~~ is code, not a heading, so
// fence state gates heading detection. Content lines attach to the most
// recently opened section (the stack top); once a child heading opens, the
// parent's bodyLines stop growing, which is exactly the "lead-in only" semantics
// we want.
function parseSectionTree(text: string): SectionTree {
  const lines = text.split("\n");
  const roots: Section[] = [];
  const stack: Section[] = [];
  const preambleLines: string[] = [];
  let titleSection: Section | null = null;
  let fence: { char: string; len: number } | null = null;

  const pushContent = (line: string) => {
    if (stack.length === 0) preambleLines.push(line);
    else stack[stack.length - 1]!.bodyLines.push(line);
  };

  for (const line of lines) {
    const fm = line.match(FENCE_RE);
    if (fm) {
      const char = fm[1]![0]!;
      const len = fm[1]!.length;
      const info = fm[2]!;
      if (fence === null) {
        // Opening fence (an info string after ``` is fine).
        fence = { char, len };
      } else if (char === fence.char && len >= fence.len && info.trim() === "") {
        // Matching closing fence: same marker char, at least as long, no info.
        fence = null;
      }
      // A fence line is always content, never a heading.
      pushContent(line);
      continue;
    }

    if (fence === null) {
      const hm = line.match(HEADING_RE);
      if (hm) {
        const level = hm[1]!.length;
        const section: Section = {
          level,
          headingText: headingTextOf(hm[2]!),
          headingLine: line.trim(),
          bodyLines: [],
          children: [],
        };
        // Pop until the top is a strictly shallower heading; that is this
        // section's parent. Equal-or-deeper headings close here.
        while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
          stack.pop();
        }
        if (stack.length === 0) roots.push(section);
        else stack[stack.length - 1]!.children.push(section);
        stack.push(section);
        if (titleSection === null && level === 1) titleSection = section;
        continue;
      }
    }

    pushContent(line);
  }

  return { roots, preambleLines, titleSection };
}

// --- Metadata ---------------------------------------------------------------

// A "**Key:** value" metadata line. We match the *shape*, then look at the key.
// Topics/Date keys are part of the documented kb-document contract (they map to
// chunk metadata), so reading them here is metadata parsing, not heading-name
// structural logic.
const META_LINE_RE = /^\s*\*\*\s*([^:*]+?)\s*:\s*\*\*\s*(.*)$/;

function parseMeta(
  preambleLines: string[],
  titleSection: Section | null,
): MarkdownDocMeta {
  const title = titleSection ? titleSection.headingText : null;
  // Metadata can live before the first heading OR as the title's lead-in
  // (the common kb-tool shape: "# Title", then "**Topics:**"/"**Date:**").
  const metaLines = [
    ...preambleLines,
    ...(titleSection ? titleSection.bodyLines : []),
  ];

  let topics: string[] = [];
  let date: string | null = null;

  for (const line of metaLines) {
    const m = line.match(META_LINE_RE);
    if (!m) continue;
    const key = m[1]!.trim().toLowerCase();
    const value = m[2]!.trim();
    if (key === "topics") {
      topics = value
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    } else if (key === "date") {
      date = value.length > 0 ? value : null;
    }
  }

  return { title, topics, date };
}

// --- Leaf collection --------------------------------------------------------

// A chunk-to-be: a heading plus its body text, before token-splitting. heading
// is null only in the flat fallback (handled separately, not via this path).
interface RawChunk {
  heading: string;
  headingLine: string;
  headingPath: string[];
  body: string;
}

// Recurse the tree and emit one RawChunk per leaf section. Parents with
// sub-sections are not emitted on their own; their structure routes into
// children. Two special cases:
//   - The title section's direct lead-in (Topics/Date/any intro text) is
//     document metadata and is never a content chunk.
//   - A non-title parent that has BOTH a lead-in paragraph AND sub-sections:
//     emit the lead-in as its own chunk only if it's substantial (>= minTokens);
//     otherwise fold it into the first child so we don't strand a tiny sliver.
function collectChunks(
  sections: Section[],
  parentPath: string[],
  titleSection: Section | null,
): RawChunk[] {
  const out: RawChunk[] = [];

  for (const section of sections) {
    const isTitle = section === titleSection;
    const body = section.bodyLines.join("\n").trim();

    if (section.children.length === 0) {
      // Leaf. The title-with-no-children case means the doc was just a title +
      // metadata, which carries no content chunk.
      if (isTitle) continue;
      out.push({
        heading: section.headingText,
        headingLine: section.headingLine,
        headingPath: parentPath,
        body,
      });
      continue;
    }

    // headingPath excludes a chunk's OWN heading, so children's path includes
    // this section's heading text.
    const childPath = [...parentPath, section.headingText];
    const childChunks = collectChunks(section.children, childPath, titleSection);

    if (isTitle || body.length === 0) {
      out.push(...childChunks);
      continue;
    }

    if (
      approxTokenCount(body) >= DEFAULT_CHUNK_OPTIONS.minTokens ||
      childChunks.length === 0
    ) {
      // Substantial lead-in: stands on its own under this heading.
      out.push({
        heading: section.headingText,
        headingLine: section.headingLine,
        headingPath: parentPath,
        body,
      });
      out.push(...childChunks);
    } else {
      // Tiny lead-in: fold into the first child's body. It then renders under
      // the child's heading — an acceptable, simple choice for a short intro.
      const first = childChunks[0]!;
      first.body =
        first.body.length > 0 ? `${body}\n\n${first.body}` : body;
      out.push(...childChunks);
    }
  }

  return out;
}

// --- Assembly ---------------------------------------------------------------

function buildContent(headingLine: string | null, body: string): string {
  const b = body.trim();
  if (!headingLine) return b;
  const h = headingLine.trim();
  return b.length === 0 ? h : `${h}\n\n${b}`;
}

function buildEmbeddingText(
  content: string,
  headingPath: string[],
  includeBreadcrumb: boolean,
): string {
  if (!includeBreadcrumb || headingPath.length === 0) return content;
  return `[${headingPath.join(" > ")}]\n\n${content}`;
}

function makeChunk(
  content: string,
  heading: string | null,
  headingPath: string[],
  partIndex: number | null,
  chunkIndex: number,
  includeBreadcrumb: boolean,
): MarkdownChunk {
  return {
    content,
    embeddingText: buildEmbeddingText(content, headingPath, includeBreadcrumb),
    heading,
    headingPath,
    tokenCount: approxTokenCount(content),
    chunkIndex,
    partIndex,
  };
}

export function chunkMarkdown(
  markdown: string,
  options?: ChunkMarkdownOptions,
): ChunkMarkdownResult {
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const includeBreadcrumb = options?.includeBreadcrumb ?? false;

  const normalized = markdown.replace(/\r\n/g, "\n");
  const { roots, preambleLines, titleSection } = parseSectionTree(normalized);
  const meta = parseMeta(preambleLines, titleSection);

  const chunks: MarkdownChunk[] = [];

  // Flat fallback: no headings at all. Run the whole doc through the paragraph
  // chunker; partIndex carries the chunkText index, per the contract.
  if (roots.length === 0) {
    for (const c of chunkText(normalized, { maxTokens })) {
      chunks.push({
        content: c.content,
        embeddingText: c.content,
        heading: null,
        headingPath: [],
        tokenCount: c.tokenCount,
        chunkIndex: c.chunkIndex,
        partIndex: c.chunkIndex,
      });
    }
    return { meta, chunks };
  }

  const rawChunks = collectChunks(roots, [], titleSection);

  let index = 0;
  for (const raw of rawChunks) {
    const content = buildContent(raw.headingLine, raw.body);
    if (content.trim().length === 0) continue; // safety: never emit empties

    // Limit is measured on the assembled content (heading + body), matching how
    // emailThreadChunker.ts measures header + body.
    if (approxTokenCount(content) <= maxTokens || raw.body.trim().length === 0) {
      chunks.push(
        makeChunk(content, raw.heading, raw.headingPath, null, index++, includeBreadcrumb),
      );
      continue;
    }

    // Oversized leaf: split the BODY and re-attach the heading to every part.
    // Because each part repeats the heading line, reduce the body budget by the
    // heading's token cost so assembled parts stay near target (same trick
    // emailThreadChunker.ts uses for its repeated header). Floor at minTokens to
    // avoid a tiny/negative budget for an unusually long heading.
    const headingCost = approxTokenCount(`${raw.headingLine}\n\n`);
    const bodyBudget = Math.max(
      maxTokens - headingCost,
      DEFAULT_CHUNK_OPTIONS.minTokens,
    );
    const parts = chunkText(raw.body, { maxTokens: bodyBudget });

    if (parts.length <= 1) {
      // Body didn't actually split further — emit as a single, unsplit chunk.
      chunks.push(
        makeChunk(content, raw.heading, raw.headingPath, null, index++, includeBreadcrumb),
      );
      continue;
    }

    parts.forEach((part, partIndex) => {
      const partContent = buildContent(raw.headingLine, part.content);
      chunks.push(
        makeChunk(
          partContent,
          raw.heading,
          raw.headingPath,
          partIndex,
          index++,
          includeBreadcrumb,
        ),
      );
    });
  }

  return { meta, chunks };
}

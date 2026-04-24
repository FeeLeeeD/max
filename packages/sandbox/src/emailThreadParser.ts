export interface EmailThread {
  threadIndex: number;
  title: string;
  dateRange: string | null;
  subject: string | null;
  body: string;
}

// Sections are separated by horizontal rules on their own line. Allow 3-or-more
// dashes so authors who type "-----" don't silently lose a delimiter.
const SECTION_DELIMITER = /\n---+\n/;

const THREAD_HEADER_RE = /^##\s+Thread\s+(\d+):\s*(.+)$/;
// Matches both `**Date:**` and `**Date Range:**`. We store both forms in the
// `dateRange` field without differentiating — downstream doesn't care.
const DATE_RE = /^\*\*Date(?:\s+Range)?:\*\*\s*(.+)$/i;
const SUBJECT_RE = /^\*\*Subject:\*\*\s*(.+)$/i;

export function parseEmailThreads(fileContent: string): EmailThread[] {
  const normalized = fileContent.replace(/\r\n/g, "\n");
  const sections = normalized.split(SECTION_DELIMITER);

  const threads: EmailThread[] = [];
  const seenIndexes = new Set<number>();

  for (const rawSection of sections) {
    const section = rawSection.trim();
    if (section.length === 0) continue;

    // Accept the section iff it contains a "## Thread N:" line somewhere —
    // works both when there's an intro section (filtered out here because it
    // lacks the heading) and when the file has no intro and the very first
    // section IS Thread 1.
    if (!/^##\s+Thread\s+\d+:/m.test(section)) continue;

    let threadIndex: number | null = null;
    let title: string | null = null;
    let dateRange: string | null = null;
    let subject: string | null = null;
    const bodyLines: string[] = [];

    // Line-by-line sieve: metadata lines are extracted AND removed, so the
    // final body is guaranteed to be free of `**Date:**` / `**Date Range:**`
    // / `**Subject:**` markers no matter where in the section they appeared.
    for (const line of section.split("\n")) {
      const trimmed = line.trimEnd();

      if (threadIndex === null) {
        const threadMatch = trimmed.match(THREAD_HEADER_RE);
        if (threadMatch) {
          threadIndex = Number.parseInt(threadMatch[1]!, 10);
          title = threadMatch[2]!.trim();
          continue;
        }
      }

      const dateMatch = trimmed.match(DATE_RE);
      if (dateMatch) {
        dateRange = dateMatch[1]!.trim();
        continue;
      }

      const subjectMatch = trimmed.match(SUBJECT_RE);
      if (subjectMatch) {
        subject = subjectMatch[1]!.trim();
        continue;
      }

      bodyLines.push(line);
    }

    if (threadIndex === null || !Number.isFinite(threadIndex)) {
      const preview = section.slice(0, 80).replace(/\s+/g, " ");
      console.warn(
        `[emailThreadParser] skipping malformed thread header: "${preview}"`,
      );
      continue;
    }

    const body = bodyLines.join("\n").trim();
    if (body.length === 0) {
      console.warn(
        `[emailThreadParser] skipping thread #${threadIndex} (${title ?? "<untitled>"}): empty body`,
      );
      continue;
    }

    if (seenIndexes.has(threadIndex)) {
      console.warn(
        `[emailThreadParser] duplicate thread index #${threadIndex}; keeping first occurrence`,
      );
      continue;
    }
    seenIndexes.add(threadIndex);

    threads.push({
      threadIndex,
      title: title ?? "",
      dateRange,
      subject,
      body,
    });
  }

  threads.sort((a, b) => a.threadIndex - b.threadIndex);
  return threads;
}

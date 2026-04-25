import { search, type SearchResult } from "./search.js";
import { generate } from "./llm.js";

export interface AnsweredSource {
  source: string;
  chunkIndex: number;
  title: string | null;
  score: number;
  contentPreview: string;
  threadTitle?: string;
  subject?: string;
  dateRange?: string;
}

export interface AnswerResult {
  question: string;
  answer: string;
  sources: AnsweredSource[];
  retrievalScoreTop: number;
  chunksUsed: number;
  wasRefused: boolean;
}

export interface AskOptions {
  topK?: number;
  minScore?: number;
  model?: string;
}

const REFUSAL_ANSWER =
  "I don't have enough information in the knowledge base to answer this " +
  "question confidently. Please contact support for help.";

const SYSTEM_PROMPT = `You are MAX, a support assistant for Seventh Sense — a product that optimizes
email delivery timing and engagement for HubSpot. You answer user questions
about how the product works, best practices, and troubleshooting.

STRICT RULES:

Answer ONLY using information from the provided context below. Do not use
external knowledge about email marketing or other tools beyond what the
context says.

If the context does not contain enough information to answer the question
confidently, say so clearly. Suggest the user contact support.

Never invent feature names, UI elements, settings, or numeric values that
are not explicitly stated in the context.

Keep answers concise: 2-4 short paragraphs maximum. Avoid padding and
marketing language.

Write in plain English, as a knowledgeable support agent would. No bullet
lists unless the context itself is inherently list-like (multiple discrete
items).

Do not include citations like [1] or (source: ...) in the answer itself —
sources will be listed separately by the calling system.`;

function buildUserPrompt(
  question: string,
  results: SearchResult[],
): string {
  const chunks = results
    .map(
      (r, i) =>
        `[Source ${i + 1}: ${r.source}, chunk ${r.chunkIndex}]\n${r.content}`,
    )
    .join("\n\n");

  return (
    `Context from the knowledge base (most relevant first):\n\n` +
    `${chunks}\n\n` +
    `User question: ${question}\n` +
    `Please answer the question based only on the context above.`
  );
}

function metaString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = metadata[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function buildSource(r: SearchResult): AnsweredSource {
  const preview =
    r.content.length <= 200 ? r.content : r.content.slice(0, 200).trimEnd();

  const src: AnsweredSource = {
    source: r.source,
    chunkIndex: r.chunkIndex,
    title: r.title,
    score: r.score,
    contentPreview: preview,
  };

  const threadTitle = metaString(r.metadata, "threadTitle");
  const subject = metaString(r.metadata, "subject");
  const dateRange = metaString(r.metadata, "dateRange");

  if (threadTitle) src.threadTitle = threadTitle;
  if (subject) src.subject = subject;
  if (dateRange) src.dateRange = dateRange;

  return src;
}

export async function ask(
  question: string,
  options?: AskOptions,
): Promise<AnswerResult> {
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    throw new Error("Question must be a non-empty string.");
  }

  const topK = options?.topK ?? 5;
  const minScore = options?.minScore ?? 0.55;

  const results = await search(trimmed, { topK });

  if (results.length === 0 || results[0].score < minScore) {
    return {
      question: trimmed,
      answer: REFUSAL_ANSWER,
      sources: [],
      retrievalScoreTop: results[0]?.score ?? 0,
      chunksUsed: 0,
      wasRefused: true,
    };
  }

  const userPrompt = buildUserPrompt(trimmed, results);
  const generation = await generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    model: options?.model,
  });

  return {
    question: trimmed,
    answer: generation.text,
    sources: results.map(buildSource),
    retrievalScoreTop: results[0].score,
    chunksUsed: results.length,
    wasRefused: false,
  };
}

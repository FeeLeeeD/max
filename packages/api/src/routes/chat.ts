import { Hono } from "hono";
import { z } from "zod";
import { ask } from "@max/sandbox/rag";
import { insertQueryLog } from "@max/sandbox/repository";

export const chatRoute = new Hono();

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  // Optional knobs the frontend may send.
  topK: z.number().int().positive().max(20).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

chatRoute.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      400,
    );
  }

  const { messages, topK, minScore } = parsed.data;

  // SINGLE-TURN: use only the last user message; history is ignored.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return c.json({ error: "No user message found" }, 400);
  }

  try {
    const startedAt = Date.now();
    const result = await ask(lastUser.content, { topK, minScore });

    const sources = result.sources.map((s) => ({
      source: s.source,
      title: s.title,
      score: s.score,
      preview: s.contentPreview,
    }));
    const wasRefused = result.wasRefused;
    const retrievalScoreTop = result.retrievalScoreTop ?? null;
    const latencyMs = Date.now() - startedAt;

    // Best-effort observability: persist a log row so the widget can attach
    // feedback later (logId). A logging failure must NEVER break the answer —
    // we swallow it, record logId as null, and still return the response.
    let logId: number | null = null;
    try {
      const log = await insertQueryLog({
        question: lastUser.content,
        answer: result.answer,
        wasRefused,
        retrievalScoreTop,
        sources,
        latencyMs,
      });
      logId = log.id;
    } catch (logErr) {
      console.error("query log failed", logErr);
    }

    // ADDITIVE contract change: `logId` is new; prior fields are unchanged.
    // The widget's API client type must be updated to match (handled in L3).
    // ADDITIVE (D1): `retrieval` + `minScoreUsed` are debug fields for the
    // eval harness — `retrieval` is ALWAYS populated (incl. on refusal) so we
    // can see found chunks + scores when MAX refuses. Widget wiring is D2.
    return c.json({
      answer: result.answer,
      sources,
      wasRefused,
      retrievalScoreTop,
      logId,
      retrieval: result.retrieval,
      minScoreUsed: result.minScoreUsed,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return c.json({ error: "Failed to generate answer" }, 500);
  }
});

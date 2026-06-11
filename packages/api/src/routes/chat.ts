import { Hono } from "hono";
import { z } from "zod";
import { ask } from "@max/sandbox/rag";

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
    const result = await ask(lastUser.content, { topK, minScore });

    return c.json({
      answer: result.answer,
      sources: result.sources.map((s) => ({
        source: s.source,
        title: s.title,
        score: s.score,
        preview: s.contentPreview,
      })),
      wasRefused: result.wasRefused,
      retrievalScoreTop: result.retrievalScoreTop,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return c.json({ error: "Failed to generate answer" }, 500);
  }
});

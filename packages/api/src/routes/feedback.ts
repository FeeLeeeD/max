import { Hono } from "hono";
import { z } from "zod";
import { setFeedback } from "@max/sandbox/repository";

export const feedbackRoute = new Hono();

const FeedbackRequestSchema = z.object({
  logId: z.number().int().positive(),
  rating: z.enum(["up", "down"]),
});

feedbackRoute.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = FeedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      400,
    );
  }

  const { logId, rating } = parsed.data;

  try {
    const { updated } = await setFeedback(logId, rating);
    if (!updated) {
      return c.json({ error: "Unknown logId" }, 404);
    }
    return c.json({ status: "ok" });
  } catch (err) {
    console.error("Feedback error:", err);
    return c.json({ error: "Failed to record feedback" }, 500);
  }
});

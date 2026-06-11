import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatRoute } from "./routes/chat.js";
import { healthRoute } from "./routes/health.js";
import { adminRoute } from "./routes/admin.js";

export const app = new Hono();

// Basic CORS — permissive for dev. Tightened in Step 3.
app.use("*", cors());

app.route("/health", healthRoute);
app.route("/chat", chatRoute);
app.route("/admin", adminRoute);

app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler — don't leak internals.
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiConfig } from "./config.js";
import { chatRoute } from "./routes/chat.js";
import { feedbackRoute } from "./routes/feedback.js";
import { healthRoute } from "./routes/health.js";
import { adminRoute } from "./routes/admin.js";

export const app = new Hono();

// Fail loud, not silent: an empty allow-list blocks every cross-origin browser
// request. Without this warning a misconfigured deploy looks "up" but the widget
// gets opaque CORS errors. Logged once at module load (boot).
if (apiConfig.allowedOrigins.length === 0) {
  console.warn(
    "[cors] ALLOWED_ORIGINS is empty — all cross-origin requests will be blocked. " +
      "Set ALLOWED_ORIGINS (comma-separated), e.g. http://localhost:5173 for local " +
      "widget dev, or the deployed widget URL in cloud.",
  );
}

// Allow-list CORS. Passing the origin array makes Hono echo a request's Origin
// only when it's in the list (otherwise it sends no Access-Control-Allow-Origin,
// so the browser blocks it). An empty array therefore blocks all cross-origin
// requests — there is intentionally no allow-all fallback.
app.use(
  "*",
  cors({
    origin: apiConfig.allowedOrigins,
    // Methods actually used: GET (/health, /admin/*), POST (/chat, /feedback,
    // /admin/documents), DELETE (/admin/documents/:source, /admin/all), plus
    // OPTIONS preflight.
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    // Headers clients send: Content-Type (JSON bodies), Authorization (admin
    // bearer token), X-Confirm (DELETE /admin/all guard).
    allowHeaders: ["Authorization", "Content-Type", "X-Confirm"],
  }),
);

app.route("/health", healthRoute);
app.route("/chat", chatRoute);
app.route("/feedback", feedbackRoute);
app.route("/admin", adminRoute);

app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler — don't leak internals.
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

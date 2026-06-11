import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { apiConfig } from "../config.js";

// Constant-time compare guarded by a length check: timingSafeEqual throws on
// length mismatch, and the length itself isn't secret, so we short-circuit
// unequal lengths before the byte comparison.
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const adminAuth: MiddlewareHandler = async (c, next) => {
  const { adminToken } = apiConfig;
  if (!adminToken) {
    return c.json({ error: "admin disabled" }, 503);
  }

  const header = c.req.header("Authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const provided = header.slice(prefix.length);
  if (!tokensMatch(provided, adminToken)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  await next();
};

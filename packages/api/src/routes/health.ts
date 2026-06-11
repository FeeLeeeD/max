import { Hono } from "hono";
import { query } from "@max/sandbox/db";

export const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  try {
    await query("SELECT 1");
    return c.json({ status: "ok", db: "connected" });
  } catch {
    return c.json({ status: "degraded", db: "error" }, 503);
  }
});

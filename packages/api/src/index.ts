import { serve } from "@hono/node-server";
import { closePool } from "@max/sandbox/db";
import { app } from "./app.js";
import { apiConfig } from "./config.js";

const server = serve(
  { fetch: app.fetch, port: apiConfig.port },
  (info) => {
    console.log(`Server listening on http://localhost:${info.port}`);
  },
);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}, shutting down...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
    }
    try {
      await closePool();
    } catch (poolErr) {
      console.error("Error closing database pool:", poolErr);
    }
    process.exit(err ? 1 : 0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

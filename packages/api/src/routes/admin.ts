import { Hono } from "hono";
import { z } from "zod";
import { ingestDocument } from "@max/sandbox/ingest";
import {
  listDocuments,
  deleteDocumentBySource,
  getStats,
  deleteAllDocuments,
} from "@max/sandbox/repository";
import { adminAuth } from "../middleware/adminAuth.js";

export const adminRoute = new Hono();

// Every admin route sits behind the shared-token guard.
adminRoute.use("*", adminAuth);

const IngestRequestSchema = z.object({
  source: z.string().min(1),
  content: z.string().min(1),
});

adminRoute.post("/documents", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = IngestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      400,
    );
  }

  const { source, content } = parsed.data;

  try {
    const outcome = await ingestDocument({ source, content });
    switch (outcome.status) {
      case "indexed":
        return c.json(
          {
            status: "indexed",
            documentId: outcome.documentId,
            chunkCount: outcome.chunkCount,
            title: outcome.title,
          },
          201,
        );
      case "skipped":
        return c.json({
          status: "skipped",
          reason: "unchanged",
          documentId: outcome.documentId,
        });
      case "empty":
        return c.json({ status: "empty", reason: "no_chunks" });
    }
  } catch (err) {
    console.error("Admin ingest error:", err);
    return c.json({ error: "Failed to index document" }, 500);
  }
});

adminRoute.get("/documents", async (c) => {
  const documents = await listDocuments();
  return c.json({ documents });
});

adminRoute.delete("/documents/:source", async (c) => {
  const source = decodeURIComponent(c.req.param("source"));
  const { deleted, documentId } = await deleteDocumentBySource(source);
  if (!deleted) {
    return c.json({ error: "Document not found" }, 404);
  }
  return c.json({ status: "deleted", documentId });
});

adminRoute.get("/stats", async (c) => {
  const stats = await getStats();
  return c.json(stats);
});

adminRoute.delete("/all", async (c) => {
  if (c.req.header("X-Confirm") !== "true") {
    return c.json(
      { error: "Confirmation required", hint: "Set header X-Confirm: true" },
      400,
    );
  }
  const { documentsDeleted } = await deleteAllDocuments();
  return c.json({ status: "deleted-all", documentsDeleted });
});

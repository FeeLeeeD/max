import { apiUrl } from "@/config";

// Types mirror packages/api/src/routes/chat.ts exactly. Keep them in sync:
// if the API response shape changes there, change it here too.
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  source: string;
  title: string | null;
  score: number;
  preview: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  wasRefused: boolean;
  retrievalScoreTop: number;
  // Best-effort observability id from the server (null when the log write
  // failed). The UI attaches feedback to it via sendFeedback().
  logId: number | null;
}

// Thrown when the server responds with a non-2xx status.
export class ChatApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.details = details;
  }
}

interface SendChatOptions {
  topK?: number;
  minScore?: number;
  signal?: AbortSignal;
}

export async function sendChat(
  userMessage: string,
  opts: SendChatOptions = {},
): Promise<ChatResponse> {
  const { topK, minScore, signal } = opts;

  // SINGLE-TURN: the backend only reads the last user message and ignores
  // history, so we send just this one message — not the conversation.
  const body = {
    messages: [{ role: "user", content: userMessage }],
    ...(topK !== undefined ? { topK } : {}),
    ...(minScore !== undefined ? { minScore } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Let aborts propagate distinctly so callers can tell a cancel apart from
    // a real failure.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      `Could not reach the MAX API at ${apiUrl}. Is the server running?`,
    );
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const serverError =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : res.statusText || "Request failed";
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? (payload as { details: unknown }).details
        : undefined;
    throw new ChatApiError(serverError, res.status, details);
  }

  return (await res.json()) as ChatResponse;
}

interface SendFeedbackOptions {
  signal?: AbortSignal;
}

// Records a thumbs up/down against a logged query (null clears it — undo).
// Mirrors sendChat's fetch and error conventions; returns nothing on success
// (server replies { status }).
export async function sendFeedback(
  logId: number,
  rating: "up" | "down" | null,
  opts: SendFeedbackOptions = {},
): Promise<void> {
  const { signal } = opts;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId, rating }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      `Could not reach the MAX API at ${apiUrl}. Is the server running?`,
    );
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const serverError =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : res.statusText || "Request failed";
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? (payload as { details: unknown }).details
        : undefined;
    throw new ChatApiError(serverError, res.status, details);
  }
}

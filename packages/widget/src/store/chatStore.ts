import { create } from "zustand";
import {
  sendChat,
  sendFeedback,
  ChatApiError,
  type ChatMessage,
  type ChatSource,
  type RetrievalDebugItem,
} from "@/api/chatClient";

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  // Kept alongside messages so W3 can render sources / refusal state without
  // restructuring the messages array yet.
  lastSources: ChatSource[];
  lastWasRefused: boolean;
  // Debug fields (D2) for the latest answer: the full retrieval set with
  // per-item threshold checks, and the minScore those checks used. Always
  // populated by /chat (incl. on refusal); the debug panel renders them.
  lastRetrieval: RetrievalDebugItem[];
  lastMinScore: number | null;
  // Observability id of the latest answer; the UI (L4) attaches feedback to it.
  // null when no answer yet or the server's log write failed.
  lastLogId: number | null;
  // Latest feedback the user gave for the current answer (optimistic). L4
  // reflects this; reset whenever a new answer arrives.
  lastFeedback: "up" | "down" | null;

  sendMessage: (content: string) => Promise<void>;
  submitFeedback: (rating: "up" | "down") => Promise<void>;
  reset: () => void;
}

// Tracks the in-flight request so a new send can cancel the previous one.
// Lives outside the store state on purpose: it's a transport detail, not
// something the UI should render or re-render on.
let activeController: AbortController | null = null;

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  lastSources: [],
  lastWasRefused: false,
  lastRetrieval: [],
  lastMinScore: null,
  lastLogId: null,
  lastFeedback: null,

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Cancel any request still in flight before starting a new one.
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    set((state) => ({
      messages: [...state.messages, { role: "user", content: trimmed }],
      isLoading: true,
      error: null,
    }));

    try {
      const res = await sendChat(trimmed, { signal: controller.signal });
      set((state) => ({
        messages: [
          ...state.messages,
          { role: "assistant", content: res.answer },
        ],
        lastSources: res.sources,
        lastWasRefused: res.wasRefused,
        lastRetrieval: res.retrieval,
        lastMinScore: res.minScoreUsed,
        lastLogId: res.logId,
        // A new answer invalidates any prior feedback selection.
        lastFeedback: null,
        isLoading: false,
      }));
    } catch (err) {
      // A superseded request was aborted — leave state for the newer send.
      if (err instanceof DOMException && err.name === "AbortError") return;

      const message =
        err instanceof ChatApiError || err instanceof Error
          ? err.message
          : "Something went wrong";
      // Do not push a broken assistant message; just surface the error.
      set({ error: message, isLoading: false });
    } finally {
      if (activeController === controller) activeController = null;
    }
  },

  submitFeedback: async (rating) => {
    const { lastLogId, lastFeedback } = get();
    // Can't attach feedback without a logged query (no answer yet, or the
    // server's log write failed and returned a null logId).
    if (lastLogId === null) return;

    // Toggle: clicking the already-active rating clears it (undo); clicking the
    // other rating switches. The route/repo just persist whatever we send.
    const next = lastFeedback === rating ? null : rating;

    // Optimistically reflect the selection (may be null); revert if it fails.
    set({ lastFeedback: next, error: null });

    try {
      await sendFeedback(lastLogId, next);
    } catch (err) {
      const message =
        err instanceof ChatApiError || err instanceof Error
          ? err.message
          : "Could not record feedback";
      set({ lastFeedback, error: message });
    }
  },

  reset: () => {
    activeController?.abort();
    activeController = null;
    set({
      messages: [],
      isLoading: false,
      error: null,
      lastSources: [],
      lastWasRefused: false,
      lastRetrieval: [],
      lastMinScore: null,
      lastLogId: null,
      lastFeedback: null,
    });
  },
}));

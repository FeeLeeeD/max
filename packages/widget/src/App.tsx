import { useState } from "react";
import { useChatStore } from "@/store/chatStore";

// ⚠️ W2 TEMPORARY HARNESS — exists only to exercise the chat store/API client
// by hand. No styling or design intended. REPLACE this entire component with
// the real chat UI in W3 (Figma-driven).
function App() {
  const [input, setInput] = useState("");
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const reset = useChatStore((s) => s.reset);

  const onSend = () => {
    void sendMessage(input);
    setInput("");
  };

  return (
    <main>
      <h1>MAX widget — W2 store harness (temporary)</h1>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={onSend} disabled={isLoading}>
          Send
        </button>
        <button onClick={reset}>Reset</button>
      </div>
      <pre>
        {JSON.stringify({ messages, isLoading, error }, null, 2)}
      </pre>
    </main>
  );
}

export default App;

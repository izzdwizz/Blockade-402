import { useState, type KeyboardEvent } from "react";
import type { SessionStatus } from "../hooks/useChatSession";

interface ChatInputProps {
  status: SessionStatus;
  disabled: boolean;
  onSend: (prompt: string) => void;
}

export function ChatInput({ status, disabled, onSend }: ChatInputProps) {
  const [draft, setDraft] = useState("");
  const isBusy = status === "thinking";

  function handleSend() {
    if (!draft.trim() || isBusy || disabled) return;
    onSend(draft);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="input-bar__field">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything…"
        rows={1}
        disabled={disabled || isBusy}
      />
      <button
        type="button"
        className="input-bar__send"
        onClick={handleSend}
        disabled={disabled || isBusy || !draft.trim()}
        aria-label="Send"
      >
        ↑
      </button>
    </div>
  );
}

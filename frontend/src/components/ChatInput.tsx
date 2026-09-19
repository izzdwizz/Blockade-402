import { useRef, useState, type KeyboardEvent } from "react";
import type { Tier } from "../api";
import { FREE_CHAR_CAP } from "../constants";
import type { SessionStatus } from "../hooks/useChatSession";

interface ChatInputProps {
  tier: Tier;
  status: SessionStatus;
  disabled: boolean;
  onSend: (prompt: string) => void;
}

export function ChatInput({ tier, status, disabled, onSend }: ChatInputProps) {
  const [draft, setDraft] = useState("");
  const autoTriggered = useRef(false);
  const cap = tier === "free" ? FREE_CHAR_CAP : undefined;
  const atCap = cap !== undefined && draft.length >= cap;
  const isBusy = status === "thinking";

  function handleChange(value: string) {
    const next = cap !== undefined ? value.slice(0, cap) : value;
    setDraft(next);
    if (cap !== undefined && next.length >= cap && !autoTriggered.current) {
      autoTriggered.current = true;
      onSend(next);
    }
  }

  function handleSend() {
    if (!draft.trim() || isBusy || disabled) return;
    autoTriggered.current = false;
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
    <div>
      <div className="input-bar__field">
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything…"
          rows={1}
          maxLength={cap}
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
      {cap !== undefined && (
        <div className={`input-bar__meta ${atCap ? "input-bar__meta--at-cap" : ""}`}>
          <span>{atCap ? "Free limit reached" : "Free tier"}</span>
          <span>
            {draft.length} / {cap}
          </span>
        </div>
      )}
    </div>
  );
}

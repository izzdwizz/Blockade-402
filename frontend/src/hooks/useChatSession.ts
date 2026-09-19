import { useState } from "react";
import { fetchAsk, type PaymentTerms, type Tier } from "../api";
import { usePayment } from "./usePayment";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type SessionStatus = "idle" | "thinking" | "paying" | "verifying" | "error";

interface PendingPaywall {
  prompt: string;
  terms: PaymentTerms;
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `m${nextId}`;
}

export function useChatSession() {
  const { walletAddress, payTerms } = usePayment();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tier, setTier] = useState<Tier>("free");
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [pendingPaywall, setPendingPaywall] = useState<PendingPaywall | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(prompt: string) {
    if (!prompt.trim()) return;
    setError(null);
    setMessages((m) => [...m, { id: makeId(), role: "user", content: prompt }]);
    setStatus("thinking");

    try {
      const result = await fetchAsk(prompt, { wallet: walletAddress });
      if (result.ok) {
        setTier(result.tier);
        setMessages((m) => [...m, { id: makeId(), role: "assistant", content: result.response }]);
        setStatus("idle");
      } else {
        setPendingPaywall({ prompt, terms: result.terms });
        setStatus("idle");
      }
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  async function unlockAndRetry() {
    if (!pendingPaywall) return;
    setStatus("paying");

    try {
      const txHash = await payTerms(pendingPaywall.terms);
      setStatus("verifying");

      const result = await fetchAsk(pendingPaywall.prompt, { wallet: walletAddress, txHash });
      if (result.ok) {
        setTier(result.tier);
        setMessages((m) => [...m, { id: makeId(), role: "assistant", content: result.response }]);
        setPendingPaywall(null);
        setStatus("idle");
      } else {
        setError("payment verification failed");
        setStatus("error");
      }
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  function dismissError() {
    setError(null);
    setStatus("idle");
  }

  return {
    messages,
    tier,
    status,
    pendingPaywall,
    error,
    walletAddress,
    sendMessage,
    unlockAndRetry,
    dismissError,
  };
}

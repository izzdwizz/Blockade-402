import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { fetchAsk, type Tier } from "../api";
import { useFreeUsage } from "./useFreeUsage";
import { useTileUnlock } from "./useTileUnlock";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type SessionStatus = "idle" | "thinking" | "paying" | "verifying" | "error";

const DOWNGRADE_SEEN_KEY = "arc402:chat-downgrade-seen";

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `m${nextId}`;
}

export function useChatSession() {
  const { getAccessToken } = usePrivy();
  const freeUsage = useFreeUsage("chat", 3);
  const unlock = useTileUnlock("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeSeen, setDowngradeSeen] = useState(
    () => localStorage.getItem(DOWNGRADE_SEEN_KEY) === "true",
  );

  useEffect(() => {
    if (unlock.walletAddress) {
      unlock.checkUnlocked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlock.walletAddress]);

  const tier: Tier = unlock.isUnlocked ? "paid" : "free";

  async function sendMessage(prompt: string) {
    if (!prompt.trim()) return;
    setError(null);

    const isPaid = unlock.isUnlocked;
    const wasExhausted = !isPaid && freeUsage.isExhausted;
    const quality = isPaid || !wasExhausted ? "full" : "brief";

    setMessages((m) => [...m, { id: makeId(), role: "user", content: prompt }]);
    setStatus("thinking");

    try {
      // Only fetch a token on paid calls — memory (what the token unlocks)
      // is itself a paid perk, so there's no reason to pay the token-fetch
      // cost on free-tier requests.
      const accessToken = isPaid ? await getAccessToken() : undefined;
      const result = await fetchAsk(prompt, {
        wallet: unlock.walletAddress,
        quality,
        accessToken: accessToken ?? undefined,
      });
      setMessages((m) => [...m, { id: makeId(), role: "assistant", content: result.response }]);
      setStatus("idle");

      if (!isPaid) {
        freeUsage.recordUse();
        if (wasExhausted && !downgradeSeen) {
          localStorage.setItem(DOWNGRADE_SEEN_KEY, "true");
          setDowngradeSeen(true);
          setShowDowngradeModal(true);
        }
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
    error,
    freeRemaining: freeUsage.remaining,
    downgradeSeen,
    showDowngradeModal,
    dismissDowngradeModal: () => setShowDowngradeModal(false),
    unlock,
    sendMessage,
    dismissError,
  };
}

import type { Tier } from "../api";
import type { SessionStatus } from "../hooks/useChatSession";

export function PresenceIndicator({ tier, status }: { tier: Tier; status: SessionStatus }) {
  const isThinking = status === "thinking" || status === "paying" || status === "verifying";
  const classes = [
    "presence-orb",
    tier === "paid" ? "presence-orb--paid" : "",
    isThinking ? "presence-orb--thinking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} aria-hidden="true" />;
}

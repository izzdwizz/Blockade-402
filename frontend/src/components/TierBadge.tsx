import type { Tier } from "../api";
import { FREE_CHAR_CAP } from "../constants";

export function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "paid") {
    return <span className="tier-badge tier-badge--paid">● Paid — unlocked</span>;
  }
  return <span className="tier-badge">Free — {FREE_CHAR_CAP} char cap</span>;
}

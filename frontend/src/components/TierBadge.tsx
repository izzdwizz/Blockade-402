import type { Tier } from "../api";

interface TierBadgeProps {
  tier: Tier;
  remaining: number;
  clickable: boolean;
  onClickUpgrade?: () => void;
}

export function TierBadge({ tier, remaining, clickable, onClickUpgrade }: TierBadgeProps) {
  if (tier === "paid") {
    return <span className="tier-badge tier-badge--paid">● Paid — unlocked</span>;
  }

  const label =
    remaining > 0
      ? `Free — ${remaining} full answer${remaining === 1 ? "" : "s"} left today`
      : "Free — brief answers only";

  if (clickable) {
    return (
      <button type="button" className="tier-badge tier-badge--clickable" onClick={onClickUpgrade}>
        {label} · Upgrade
      </button>
    );
  }

  return <span className="tier-badge">{label}</span>;
}

import type { PaymentTerms } from "../api";
import type { SessionStatus } from "../hooks/useChatSession";
import { formatUsdc } from "../utils/formatUsdc";

export function PaywallPrompt({
  terms,
  status,
  onUnlock,
}: {
  terms: PaymentTerms;
  status: SessionStatus;
  onUnlock: () => void;
}) {
  const isBusy = status === "paying" || status === "verifying";
  const label =
    status === "paying"
      ? "Confirm in wallet…"
      : status === "verifying"
        ? "Verifying on Arc…"
        : `Pay $${formatUsdc(terms.amount)} & unlock`;

  return (
    <div className="paywall-prompt">
      <div className="paywall-prompt__text">
        <strong>Free limit reached</strong>
        One payment unlocks full-length questions and answers for this session.
      </div>
      <button
        type="button"
        className="pill-button pill-button--accent"
        onClick={onUnlock}
        disabled={isBusy}
      >
        {label}
      </button>
    </div>
  );
}

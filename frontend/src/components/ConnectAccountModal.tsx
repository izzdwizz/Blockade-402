interface ConnectAccountModalProps {
  variant: "informational" | "blocking";
  tileName: string;
  priceUsdc: string;
  authenticated: boolean;
  onClose?: () => void;
  onConnect: () => void;
  onPay: () => void;
  isBusy?: boolean;
}

export function ConnectAccountModal({
  variant,
  tileName,
  priceUsdc,
  authenticated,
  onClose,
  onConnect,
  onPay,
  isBusy = false,
}: ConnectAccountModalProps) {
  const dismissable = variant === "informational";

  return (
    <div
      className="modal-backdrop"
      onClick={dismissable ? onClose : undefined}
      role="presentation"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {dismissable && (
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Dismiss">
            ×
          </button>
        )}

        {variant === "informational" ? (
          <>
            <h3 className="modal-card__title">You've used today's free full answers</h3>
            <p className="modal-card__body">
              Further chats today will get brief answers instead. Pay a few cents in USDC on Arc
              anytime to remove the daily limit.
            </p>
          </>
        ) : (
          <>
            <h3 className="modal-card__title">You've used today's free tries of {tileName}</h3>
            <p className="modal-card__body">
              Connect an account to pay ${priceUsdc} per use, unlimited, for the rest of the day.
            </p>
          </>
        )}

        <div className="modal-card__actions">
          {!authenticated ? (
            <button type="button" className="pill-button" onClick={onConnect} disabled={isBusy}>
              Connect account
            </button>
          ) : (
            <button type="button" className="pill-button pill-button--accent" onClick={onPay} disabled={isBusy}>
              {isBusy ? "Confirm in wallet…" : `Pay $${priceUsdc} & unlock`}
            </button>
          )}
          {dismissable && (
            <button type="button" className="pill-button pill-button--outline" onClick={onClose}>
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

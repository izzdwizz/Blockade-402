import { useState } from "react";
import { ChatInput } from "../ChatInput";
import { ChatThread } from "../ChatThread";
import { ConnectAccountModal } from "../ConnectAccountModal";
import { PresenceIndicator } from "../PresenceIndicator";
import { TierBadge } from "../TierBadge";
import { useChatSession } from "../../hooks/useChatSession";
import { getTile } from "../../tiles";

const tile = getTile("chat")!;

export function ChatTile() {
  const {
    messages,
    tier,
    status,
    error,
    freeRemaining,
    downgradeSeen,
    showDowngradeModal,
    dismissDowngradeModal,
    unlock,
    sendMessage,
    dismissError,
  } = useChatSession();
  const [manualUpgradeOpen, setManualUpgradeOpen] = useState(false);

  const showModal = showDowngradeModal || manualUpgradeOpen;

  function closeModal() {
    dismissDowngradeModal();
    setManualUpgradeOpen(false);
  }

  const badge = (
    <TierBadge
      tier={tier}
      remaining={freeRemaining}
      clickable={tier === "free" && downgradeSeen}
      onClickUpgrade={() => setManualUpgradeOpen(true)}
    />
  );

  return (
    <>
      <div className="chat-panel">
        {messages.length === 0 ? (
          <div className="chat-panel__empty">
            <PresenceIndicator tier={tier} status={status} />
            <div>
              <div className="chat-panel__empty-title">Ask the being.</div>
              <p className="chat-panel__empty-body">
                3 full-length answers free per day, then brief answers. Pay a
                few cents in USDC on Arc to unlock unlimited full-length
                answers, instantly.
              </p>
            </div>
            {badge}
          </div>
        ) : (
          <ChatThread messages={messages} status={status} />
        )}
      </div>

      <div className="input-bar">
        <div className="container" style={{ maxWidth: 720 }}>
          {messages.length > 0 && <div style={{ marginBottom: 12 }}>{badge}</div>}
          <ChatInput status={status} disabled={false} onSend={sendMessage} />
          {error && (
            <div className="paywall-prompt__error">
              <span>{error}</span>
              <button type="button" className="pill-button pill-button--sm" onClick={dismissError}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ConnectAccountModal
          variant="informational"
          tileName={tile.name}
          priceUsdc={tile.priceUsdc}
          authenticated={unlock.authenticated}
          onClose={closeModal}
          onConnect={unlock.login}
          onPay={async () => {
            const ok = await unlock.payAndUnlock();
            if (ok) closeModal();
          }}
          isBusy={unlock.status === "paying" || unlock.status === "verifying"}
        />
      )}
    </>
  );
}

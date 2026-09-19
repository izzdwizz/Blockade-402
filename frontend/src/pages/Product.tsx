import { ChatInput } from "../components/ChatInput";
import { ChatThread } from "../components/ChatThread";
import { PaywallPrompt } from "../components/PaywallPrompt";
import { PresenceIndicator } from "../components/PresenceIndicator";
import { TierBadge } from "../components/TierBadge";
import { TopBar } from "../components/TopBar";
import { useChatSession } from "../hooks/useChatSession";
import { useTheme } from "../hooks/useTheme";
import "./Product.css";

export function Product() {
  const { theme, toggleTheme } = useTheme();
  const {
    messages,
    tier,
    status,
    pendingPaywall,
    error,
    walletAddress,
    sendMessage,
    unlockAndRetry,
    dismissError,
  } = useChatSession();

  return (
    <div className="product">
      <TopBar theme={theme} onToggleTheme={toggleTheme} walletAddress={walletAddress} />

      <div className="chat-panel">
        {messages.length === 0 ? (
          <div className="chat-panel__empty">
            <PresenceIndicator tier={tier} status={status} />
            <div>
              <div className="chat-panel__empty-title">Ask the being.</div>
              <p className="chat-panel__empty-body">
                A few free questions, short answers. Pay a few cents in USDC on
                Arc to unlock full-length answers, instantly.
              </p>
            </div>
            <TierBadge tier={tier} />
          </div>
        ) : (
          <ChatThread messages={messages} status={status} />
        )}
      </div>

      <div className="input-bar">
        <div className="container" style={{ maxWidth: 720 }}>
          {pendingPaywall ? (
            <PaywallPrompt terms={pendingPaywall.terms} status={status} onUnlock={unlockAndRetry} />
          ) : (
            <ChatInput tier={tier} status={status} disabled={false} onSend={sendMessage} />
          )}
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
    </div>
  );
}

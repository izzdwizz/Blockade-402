import { useState } from "react";
import { ConnectAccountModal } from "../ConnectAccountModal";
import { useTileGate } from "../../hooks/useTileGate";
import { checkIban, type IbanCheckResult } from "../../utils/validateIban";
import { getTile } from "../../tiles";

const tile = getTile("iban")!;

export function IbanTool() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<IbanCheckResult | null>(null);
  const { freeUsage, unlock, showModal, setShowModal, attemptUse } = useTileGate("iban");

  function handleCheck() {
    if (!attemptUse()) return;
    setResult(checkIban(value));
  }

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <h1 className="tool-panel__title">{tile.name}</h1>
        {!unlock.isUnlocked && (
          <span className="tier-badge">{freeUsage.remaining} free left today</span>
        )}
        {unlock.isUnlocked && <span className="tier-badge tier-badge--paid">● Unlocked</span>}
      </div>

      <div className="tool-panel__body">
        <input
          className="tool-panel__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. DE89 3704 0044 0532 0130 00"
        />
        <button
          type="button"
          className="pill-button"
          onClick={handleCheck}
          disabled={!value.trim()}
        >
          Validate
        </button>

        {result && (
          <div
            className={`tool-panel__result ${result.valid ? "tool-panel__result--valid" : "tool-panel__result--invalid"}`}
          >
            {result.valid
              ? `Valid — ${result.countryName} (${result.countryCode})`
              : "Invalid IBAN — checksum failed"}
          </div>
        )}
      </div>

      {showModal && (
        <ConnectAccountModal
          variant="blocking"
          tileName={tile.name}
          priceUsdc={tile.priceUsdc}
          authenticated={unlock.authenticated}
          onConnect={unlock.login}
          onPay={async () => {
            const ok = await unlock.payAndUnlock();
            if (ok) setShowModal(false);
          }}
          isBusy={unlock.status === "paying" || unlock.status === "verifying"}
        />
      )}
    </div>
  );
}

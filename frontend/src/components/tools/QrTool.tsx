import { useState } from "react";
import QRCode from "qrcode";
import { BackToGrid } from "../BackToGrid";
import { ConnectAccountModal } from "../ConnectAccountModal";
import { useTileGate } from "../../hooks/useTileGate";
import { getTile } from "../../tiles";

const tile = getTile("qr")!;

export function QrTool() {
  const [value, setValue] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { freeUsage, unlock, showModal, setShowModal, attemptUse } = useTileGate("qr");

  async function handleGenerate() {
    if (!attemptUse()) return;
    try {
      setError(null);
      const url = await QRCode.toDataURL(value, { width: 320, margin: 2 });
      setDataUrl(url);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="tool-panel">
      <BackToGrid />
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
          placeholder="Paste a link or type text…"
        />
        <button
          type="button"
          className="pill-button"
          onClick={handleGenerate}
          disabled={!value.trim()}
        >
          Generate QR code
        </button>

        {error && <div className="tool-panel__result tool-panel__result--invalid">{error}</div>}

        {dataUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <img src={dataUrl} alt="Generated QR code" width={200} height={200} />
            <a href={dataUrl} download="qr-code.png" className="text-link">
              Download PNG
            </a>
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

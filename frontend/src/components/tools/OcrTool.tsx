import { useState } from "react";
import scribe from "scribe.js-ocr";
import { ConnectAccountModal } from "../ConnectAccountModal";
import { useTileGate } from "../../hooks/useTileGate";
import { getTile } from "../../tiles";

const tile = getTile("ocr")!;

export function OcrTool() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const { freeUsage, unlock, showModal, setShowModal, attemptUse } = useTileGate("ocr");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!attemptUse()) {
      event.target.value = "";
      return;
    }

    setStatus("processing");
    setText("");
    try {
      const extracted = await scribe.extractText([file]);
      setText(extracted);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      event.target.value = "";
    }
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
        <input type="file" accept="image/*" onChange={handleFileChange} className="tool-panel__input" />

        {status === "processing" && <p className="tool-panel__status">Processing image…</p>}
        {status === "error" && (
          <div className="tool-panel__result tool-panel__result--invalid">
            Failed to process the image.
          </div>
        )}

        <textarea className="tool-panel__output" value={text} readOnly rows={10} />
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

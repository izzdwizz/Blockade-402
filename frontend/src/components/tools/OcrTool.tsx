import { useRef, useState } from "react";
import scribe from "scribe.js-ocr";
import { MdCheckCircle, MdOutlineUploadFile } from "react-icons/md";
import { BackToGrid } from "../BackToGrid";
import { ConnectAccountModal } from "../ConnectAccountModal";
import { useTileGate } from "../../hooks/useTileGate";
import { formatOcrText } from "../../utils/formatOcrText";
import { getTile } from "../../tiles";

const tile = getTile("ocr")!;

export function OcrTool() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { freeUsage, unlock, showModal, setShowModal, attemptUse } = useTileGate("ocr");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!attemptUse()) {
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setStatus("processing");
    setText("");
    try {
      const extracted = await scribe.extractText([file]);
      setText(formatOcrText(extracted));
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      event.target.value = "";
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
      <p className="tool-panel__intro">
        One of four resources gated by the same Arc-402 payment rail — pay
        once, extract text from any image, entirely in your browser.
      </p>

      <div className="tool-panel__body">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="ocr-upload__input"
        />
        <button
          type="button"
          className={`ocr-upload ${fileName ? "ocr-upload--filled" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {fileName ? (
            <>
              <MdCheckCircle className="ocr-upload__icon ocr-upload__icon--done" />
              <span className="ocr-upload__label">{fileName}</span>
              <span className="ocr-upload__hint">Click to choose a different image</span>
            </>
          ) : (
            <>
              <MdOutlineUploadFile className="ocr-upload__icon" />
              <span className="ocr-upload__label">Choose an image</span>
              <span className="ocr-upload__hint">PNG, JPG — processed locally, never uploaded</span>
            </>
          )}
        </button>

        {status === "processing" && <p className="tool-panel__status">Processing image…</p>}
        {status === "error" && (
          <div className="tool-panel__result tool-panel__result--invalid">
            Failed to process the image.
          </div>
        )}

        <pre
          className={`tool-panel__output tool-panel__output--pre ${text ? "" : "tool-panel__output--placeholder"}`}
        >
          {text || "Extracted text will appear here."}
        </pre>
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

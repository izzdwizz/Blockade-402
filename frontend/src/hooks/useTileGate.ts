import { useEffect, useState } from "react";
import { useFreeUsage } from "./useFreeUsage";
import { useTileUnlock } from "./useTileUnlock";

/** Shared gating shape for the frontend-only tiles (OCR/QR/IBAN): 3 free
 * uses/day (client-side), then hard-blocked behind a paid unlock. */
export function useTileGate(tileId: string) {
  const freeUsage = useFreeUsage(tileId, 3);
  const unlock = useTileUnlock(tileId);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (unlock.walletAddress) {
      unlock.checkUnlocked();
    }
    // Only re-check when the wallet identity changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlock.walletAddress]);

  /** Call before running the tile's local computation. Returns true if the
   * run should proceed (either already paid, or a free use was available and
   * has now been consumed); false means the blocking modal was raised. */
  function attemptUse(): boolean {
    if (unlock.isUnlocked) return true;
    if (!freeUsage.isExhausted) {
      freeUsage.recordUse();
      return true;
    }
    setShowModal(true);
    return false;
  }

  return { freeUsage, unlock, showModal, setShowModal, attemptUse };
}

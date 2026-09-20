import { useState } from "react";
import { fetchUnlock, type PaymentTerms } from "../api";
import { usePayment } from "./usePayment";

export type UnlockStatus = "idle" | "checking" | "paying" | "verifying" | "unlocked" | "error";

export function useTileUnlock(tileId: string) {
  const { walletAddress, authenticated, login, payTerms } = usePayment();
  const [status, setStatus] = useState<UnlockStatus>("idle");
  const [terms, setTerms] = useState<PaymentTerms | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkUnlocked(): Promise<boolean> {
    if (!walletAddress) return false;
    setStatus("checking");
    try {
      const result = await fetchUnlock(tileId, { wallet: walletAddress });
      if (result.ok) {
        setStatus("unlocked");
        return true;
      }
      setTerms(result.terms);
      setStatus("idle");
      return false;
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
      return false;
    }
  }

  // Requires a wallet already connected — the caller connects first (e.g. via
  // ConnectAccountModal's "Connect" step) and only then offers "Pay". Keeping
  // these as two explicit steps avoids relying on Privy's wallet state
  // updating synchronously within a single async call.
  async function payAndUnlock(): Promise<boolean> {
    setError(null);
    if (!walletAddress) {
      setError("connect a wallet first");
      setStatus("error");
      return false;
    }

    try {
      let activeTerms = terms;
      if (!activeTerms) {
        const check = await fetchUnlock(tileId, { wallet: walletAddress });
        if (check.ok) {
          setStatus("unlocked");
          return true;
        }
        activeTerms = check.terms;
        setTerms(check.terms);
      }

      setStatus("paying");
      const txHash = await payTerms(activeTerms);

      setStatus("verifying");
      const result = await fetchUnlock(tileId, { wallet: walletAddress, txHash });
      if (!result.ok) {
        setTerms(result.terms);
        setError("payment verification failed");
        setStatus("error");
        return false;
      }

      setStatus("unlocked");
      return true;
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
      return false;
    }
  }

  return {
    status,
    terms,
    error,
    isUnlocked: status === "unlocked",
    checkUnlocked,
    payAndUnlock,
    walletAddress,
    authenticated,
    login,
  };
}

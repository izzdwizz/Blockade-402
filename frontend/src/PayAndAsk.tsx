import { useState, useReducer } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider, Contract } from "ethers";
import {
  initialPayAndAskState,
  payAndAskReducer,
  type PaymentTerms,
} from "./payAndAskReducer";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";

const PAYMENT_VERIFIER_ABI = [
  "function pay(address resource, uint256 amount, bytes32 requestHash) external",
];

async function fetchAsk(prompt: string, txHash?: string): Promise<
  { ok: true; response: string } | { ok: false; terms: PaymentTerms }
> {
  const params = new URLSearchParams({ prompt });
  if (txHash) params.set("tx_hash", txHash);

  const res = await fetch(`${API_BASE_URL}/ask?${params.toString()}`);
  const body = await res.json();
  if (res.status === 402) {
    return { ok: false, terms: body as PaymentTerms };
  }
  return { ok: true, response: body.response as string };
}

export function PayAndAsk() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [prompt, setPrompt] = useState("");
  const [state, dispatch] = useReducer(payAndAskReducer, initialPayAndAskState);

  async function handleAsk() {
    try {
      const result = await fetchAsk(prompt);
      if (!result.ok) {
        dispatch({ type: "CHALLENGE_RECEIVED", terms: result.terms });
      }
    } catch (err) {
      dispatch({ type: "FAILED", error: (err as Error).message });
    }
  }

  async function handlePay() {
    if (state.status !== "challenged" || !state.terms) return;
    dispatch({ type: "PAY_STARTED" });

    try {
      if (!authenticated) await login();
      const wallet = wallets[0];
      if (!wallet) throw new Error("no embedded wallet available");

      const provider = new BrowserProvider(await wallet.getEthereumProvider());
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, PAYMENT_VERIFIER_ABI, signer);

      const tx = await contract.pay(
        state.terms.resource,
        BigInt(state.terms.amount),
        state.terms.request_hash,
      );
      const receipt = await tx.wait();

      dispatch({ type: "PAY_SUBMITTED", txHash: receipt.hash });
      await handleVerify(receipt.hash);
    } catch (err) {
      dispatch({ type: "FAILED", error: (err as Error).message });
    }
  }

  async function handleVerify(txHash: string) {
    try {
      const result = await fetchAsk(prompt, txHash);
      if (result.ok) {
        dispatch({ type: "VERIFIED", response: result.response });
      } else {
        dispatch({ type: "FAILED", error: "payment verification failed" });
      }
    } catch (err) {
      dispatch({ type: "FAILED", error: (err as Error).message });
    }
  }

  return (
    <div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask the AI something..."
        disabled={state.status !== "idle" && state.status !== "error"}
      />

      {(state.status === "idle" || state.status === "error") && (
        <button onClick={handleAsk} disabled={!prompt}>
          Ask
        </button>
      )}

      {state.status === "challenged" && state.terms && (
        <button onClick={handlePay}>
          Pay {(Number(state.terms.amount) / 1_000_000).toFixed(2)} USDC &amp; Continue
        </button>
      )}

      {state.status === "paying" && <p>Confirm the payment in your wallet...</p>}
      {state.status === "verifying" && <p>Verifying payment on Arc...</p>}

      {state.status === "served" && (
        <div>
          <p>{state.response}</p>
          <button onClick={() => dispatch({ type: "RESET" })}>Ask again</button>
        </div>
      )}

      {state.status === "error" && <p role="alert">Error: {state.error}</p>}
    </div>
  );
}

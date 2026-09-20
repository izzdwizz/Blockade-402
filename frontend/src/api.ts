export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface PaymentTerms {
  amount: string;
  recipient: string;
  chain_id: number;
  resource: string;
  request_hash: string;
}

export type Tier = "free" | "paid";

export interface AskResult {
  response: string;
  tier: Tier;
}

// /ask never 402s — unpaid callers are always served (full quality if their
// wallet is already unlocked for the chat tile, brief otherwise). `quality`
// is accepted for forward compatibility but the server currently only ever
// honors it downward — an unpaid caller can't request "full" and get it,
// the wallet's unlocked status is what actually decides that.
export async function fetchAsk(
  prompt: string,
  opts: { wallet?: string; quality?: "full" | "brief" } = {},
): Promise<AskResult> {
  const params = new URLSearchParams({ prompt });
  if (opts.wallet) params.set("wallet", opts.wallet);
  if (opts.quality) params.set("quality", opts.quality);

  const res = await fetch(`${API_BASE_URL}/ask?${params.toString()}`);
  const body = await res.json();
  return { response: body.response as string, tier: body.tier as Tier };
}

export type UnlockResult = { ok: true } | { ok: false; terms: PaymentTerms };

export async function fetchUnlock(
  tileId: string,
  opts: { wallet: string; txHash?: string },
): Promise<UnlockResult> {
  const params = new URLSearchParams({ wallet: opts.wallet });
  if (opts.txHash) params.set("tx_hash", opts.txHash);

  const res = await fetch(`${API_BASE_URL}/unlock/${tileId}?${params.toString()}`);
  const body = await res.json();

  if (res.status === 402) {
    return { ok: false, terms: body as PaymentTerms };
  }
  return { ok: true };
}

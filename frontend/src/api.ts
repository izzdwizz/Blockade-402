export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface PaymentTerms {
  amount: string;
  recipient: string;
  chain_id: number;
  resource: string;
  request_hash: string;
}

export type Tier = "free" | "paid";

export type AskResult =
  | { ok: true; response: string; tier: Tier }
  | { ok: false; terms: PaymentTerms };

export async function fetchAsk(
  prompt: string,
  opts: { wallet?: string; txHash?: string } = {},
): Promise<AskResult> {
  const params = new URLSearchParams({ prompt });
  if (opts.wallet) params.set("wallet", opts.wallet);
  if (opts.txHash) params.set("tx_hash", opts.txHash);

  const res = await fetch(`${API_BASE_URL}/ask?${params.toString()}`);
  const body = await res.json();

  if (res.status === 402) {
    return { ok: false, terms: body as PaymentTerms };
  }
  return { ok: true, response: body.response as string, tier: body.tier as Tier };
}

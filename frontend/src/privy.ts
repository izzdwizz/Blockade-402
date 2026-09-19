import type { PrivyClientConfig } from "@privy-io/react-auth";

// Arc mainnet as a custom EVM network for Privy's embedded wallet.
// Chain ID / RPC per https://docs.arc.io/integrate/connect-to-arc#mainnet.
//
// Arc's native gas token is USDC at 18 decimals — this is what wallets use for
// balance/gas display. That's a *different* representation from the ERC-20 USDC
// interface PaymentVerifier.pay() transfers against (0x3600...0000, 6 decimals,
// see CONTRACT_ADDRESS / USDC_ADDRESS in the other .env files). Per Arc's docs,
// both are views onto the same underlying balance — never sum them as two assets.
export const arcChain = {
  id: Number(import.meta.env.VITE_ARC_CHAIN_ID ?? 0),
  name: "Arc",
  network: "arc",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ARC_RPC_URL ?? ""] },
    public: { http: [import.meta.env.VITE_ARC_RPC_URL ?? ""] },
  },
};

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  defaultChain: arcChain,
  supportedChains: [arcChain],
};

export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";

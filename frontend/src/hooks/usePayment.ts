import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider, Contract } from "ethers";
import type { PaymentTerms } from "../api";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const PAYMENT_VERIFIER_ABI = [
  "function pay(address resource, uint256 amount, bytes32 requestHash) external",
];

export function usePayment() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  async function payTerms(terms: PaymentTerms): Promise<string> {
    if (!authenticated) await login();
    const wallet = wallets[0];
    if (!wallet) throw new Error("no embedded wallet available");

    const provider = new BrowserProvider(await wallet.getEthereumProvider());
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, PAYMENT_VERIFIER_ABI, signer);

    const tx = await contract.pay(terms.resource, BigInt(terms.amount), terms.request_hash);
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  return { walletAddress, authenticated, login, payTerms };
}

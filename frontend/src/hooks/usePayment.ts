import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider, Contract, isAddress, MaxUint256 } from "ethers";
import type { PaymentTerms } from "../api";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
// USDC's ERC-20 interface address is identical on Arc mainnet and testnet
// (confirmed directly against both — see README's Network table).
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const PAYMENT_VERIFIER_ABI = [
  "function pay(address resource, uint256 amount, bytes32 requestHash) external",
];
const USDC_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export function usePayment() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  async function payTerms(terms: PaymentTerms): Promise<string> {
    if (!isAddress(CONTRACT_ADDRESS)) {
      throw new Error(
        "VITE_CONTRACT_ADDRESS is not set to a valid contract address — check frontend/.env",
      );
    }

    if (!authenticated) await login();
    const wallet = wallets[0];
    if (!wallet) throw new Error("no embedded wallet available");

    const provider = new BrowserProvider(await wallet.getEthereumProvider());
    const signer = await provider.getSigner();
    const payerAddress = await signer.getAddress();
    const amount = BigInt(terms.amount);

    // Approve once for a large allowance rather than the exact tiny amount each
    // time — pay() can only ever pull what its own caller (the payer) authorizes
    // per call, so a standing allowance doesn't let anyone else spend more than
    // the payer explicitly sends via pay(); it just avoids a second wallet
    // confirmation on every future payment.
    const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
    const allowance: bigint = await usdc.allowance(payerAddress, CONTRACT_ADDRESS);
    if (allowance < amount) {
      const approveTx = await usdc.approve(CONTRACT_ADDRESS, MaxUint256);
      await approveTx.wait();
    }

    const contract = new Contract(CONTRACT_ADDRESS, PAYMENT_VERIFIER_ABI, signer);
    const tx = await contract.pay(terms.resource, amount, terms.request_hash);
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  return { walletAddress, authenticated, login, payTerms };
}

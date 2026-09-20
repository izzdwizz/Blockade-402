import { usePrivy, useWallets } from "@privy-io/react-auth";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  if (authenticated && walletAddress) {
    return (
      <span className="wallet-button">
        <span className="wallet-button__dot" />
        {truncate(walletAddress)}
      </span>
    );
  }

  return (
    <button type="button" className="wallet-button" onClick={() => login()}>
      Connect wallet
    </button>
  );
}

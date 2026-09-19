import { Link } from "react-router-dom";
import type { Theme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnectButton } from "./WalletConnectButton";

export function TopBar({
  theme,
  onToggleTheme,
  walletAddress,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  walletAddress?: string;
}) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__left">
          <Link to="/" className="topbar__wordmark">
            BlockAid<sup>®</sup>
          </Link>
          <span className="topbar__divider" />
          <span className="topbar__demo-tag">Arc Ask — live demo</span>
        </div>
        <div className="topbar__right">
          <WalletConnectButton walletAddress={walletAddress} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </div>
  );
}

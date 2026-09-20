import { Link } from "react-router-dom";
import type { Theme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnectButton } from "./WalletConnectButton";

export function TopBar({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__left">
          <Link to="/" className="topbar__wordmark">
            Arc-402
          </Link>
        </div>
        <div className="topbar__right">
          <WalletConnectButton />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </div>
  );
}

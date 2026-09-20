import type { Theme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnectButton } from "./WalletConnectButton";
import { Wordmark } from "./Wordmark";

export function TopBar({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  return (
    <div className={`topbar ${theme == "light" ? "!bg-white" : ""}`}>
      <div className="container topbar__inner">
        <div className="topbar__left">
          <Wordmark className="topbar__wordmark" />
        </div>
        <div className="topbar__right">
          <WalletConnectButton />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </div>
  );
}

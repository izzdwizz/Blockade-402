import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { useTheme } from "../hooks/useTheme";
import "./Product.css";

export function Product() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  // Every /product page gets the faint checkered background except chat,
  // which already has its own dense message-bubble UI.
  const showCheckerboard = pathname !== "/product/chat";

  return (
    <div className={`product ${showCheckerboard ? "product--checkered" : ""}`}>
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <Outlet />
    </div>
  );
}

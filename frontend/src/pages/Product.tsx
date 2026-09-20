import { Outlet } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { useTheme } from "../hooks/useTheme";
import "./Product.css";

export function Product() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="product">
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <Outlet />
    </div>
  );
}

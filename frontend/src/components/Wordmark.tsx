import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`wordmark ${className}`}>
      <Logo size={22} />
      <span>
        Arc-402<sup>®</sup>
      </span>
    </Link>
  );
}

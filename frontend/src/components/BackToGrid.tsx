import { Link } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

export function BackToGrid() {
  return (
    <Link to="/product" className="tool-panel__back">
      <MdArrowBack /> Back
    </Link>
  );
}

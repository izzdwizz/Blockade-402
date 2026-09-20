import { Link } from "react-router-dom";
import {
  HiOutlineChatBubbleLeftRight,
  MdOutlineDocumentScanner,
  MdOutlineQrCode2,
  MdOutlineAccountBalance,
} from "./tileIcons";
import type { Tile } from "../tiles";

const ICONS: Record<string, typeof HiOutlineChatBubbleLeftRight> = {
  chat: HiOutlineChatBubbleLeftRight,
  ocr: MdOutlineDocumentScanner,
  qr: MdOutlineQrCode2,
  iban: MdOutlineAccountBalance,
};

export function TileCard({ tile, compact = false }: { tile: Tile; compact?: boolean }) {
  const Icon = ICONS[tile.id];

  return (
    <Link to={tile.route} className={`tile-card ${compact ? "tile-card--compact" : ""}`}>
      <span className="tile-card__icon">{Icon && <Icon />}</span>
      <span className="tile-card__name">{tile.name}</span>
      <span className="tile-card__description">{tile.description}</span>
      <span className="tile-card__price">${tile.priceUsdc}</span>
    </Link>
  );
}

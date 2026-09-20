import { TILES } from "../tiles";
import { TileCard } from "./TileCard";

export function TileGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`tile-grid ${compact ? "tile-grid--compact" : ""}`}>
      {TILES.map((tile) => (
        <TileCard key={tile.id} tile={tile} compact={compact} />
      ))}
    </div>
  );
}

import { Logo } from "./Logo";
import { TileCard } from "./TileCard";
import { TILES } from "../tiles";

export function TileGrid() {
  return (
    <div className="tile-orbit">
      <div className="tile-orbit__center">
        <Logo size={48} />
        <p className="tile-orbit__tagline">Pick a capability</p>
      </div>
      {TILES.map((tile, i) => (
        <div className={`tile-orbit__slot tile-orbit__slot--${i}`} key={tile.id}>
          <TileCard tile={tile} />
        </div>
      ))}
    </div>
  );
}

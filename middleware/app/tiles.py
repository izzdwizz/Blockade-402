from dataclasses import dataclass


@dataclass(frozen=True)
class TileConfig:
    id: str
    price_usdc: int  # 6-decimal USDC base units


# Static, not a plugin system — there are only a handful of known tiles for
# this submission. "agent" is reserved for a later phase and deliberately
# absent here.
TILES: dict[str, TileConfig] = {
    "chat": TileConfig(id="chat", price_usdc=5_000),  # $0.005
    "ocr": TileConfig(id="ocr", price_usdc=10_000),  # $0.01
    "qr": TileConfig(id="qr", price_usdc=1_000),  # $0.001
    "iban": TileConfig(id="iban", price_usdc=2_000),  # $0.002
}


def price_for_tile(tile_id: str) -> int:
    tile = TILES.get(tile_id)
    if tile is None:
        raise KeyError(f"unknown tile_id: {tile_id}")
    return tile.price_usdc

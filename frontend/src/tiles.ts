export type TileMode = "standard" | "agent"; // "agent" reserved for a later phase

export interface Tile {
  id: string;
  name: string;
  description: string;
  mode: TileMode;
  priceUsdc: string; // display string — mirrors middleware/app/tiles.py, keep in sync manually
  freeUsesPerDay: number;
  hasBriefFallback: boolean; // only chat degrades to a shorter answer instead of blocking
  route: string;
}

export const TILES: Tile[] = [
  {
    id: "chat",
    name: "Chat",
    description: "Ask the being anything.",
    mode: "standard",
    priceUsdc: "0.005",
    freeUsesPerDay: 3,
    hasBriefFallback: true,
    route: "/product/chat",
  },
  {
    id: "ocr",
    name: "OCR",
    description: "Extract text from an image.",
    mode: "standard",
    priceUsdc: "0.01",
    freeUsesPerDay: 3,
    hasBriefFallback: false,
    route: "/product/ocr",
  },
  {
    id: "qr",
    name: "QR Code Generator",
    description: "Turn text or a link into a QR code.",
    mode: "standard",
    priceUsdc: "0.001",
    freeUsesPerDay: 3,
    hasBriefFallback: false,
    route: "/product/qr",
  },
  {
    id: "iban",
    name: "IBAN Validator",
    description: "Validate an IBAN checksum.",
    mode: "standard",
    priceUsdc: "0.002",
    freeUsesPerDay: 3,
    hasBriefFallback: false,
    route: "/product/iban",
  },
];

export function getTile(id: string): Tile | undefined {
  return TILES.find((tile) => tile.id === id);
}

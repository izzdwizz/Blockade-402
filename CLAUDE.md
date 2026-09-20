# Arc-402

A "payable internet" vending machine: a grid of small capabilities (chat, OCR, QR
generation, IBAN validation), each gated by the same `PaymentVerifier` contract and
FastAPI middleware, settled in USDC on Arc. Built for the Arc Microgrants program.

## Repo layout

```
contracts/    Foundry project — PaymentVerifier.sol + tests + deploy script
middleware/   FastAPI service — /unlock/{tile_id}, /ask, Redis-backed unlock state
frontend/     React + Vite + Privy — landing page + the /product tile grid
render.yaml   Render Blueprint — middleware, frontend, and Redis services
```

## Styling — read this before touching any frontend UI

**Do not remove or "clean up" existing styling — including inline Tailwind utility
classes (`!py-14`, `py-5`, etc.) — unless the user explicitly asks you to change that
specific styling.** The primary styling system is hand-rolled CSS against the design
tokens in `frontend/src/index.css` (`--bg`, `--fg`, `--accent`, `--radius-*`,
`--transition-*`) and the shared classes in `frontend/src/ui/kit.css`
(`.pill-button`, `.text-link`, `.container`, `.eyebrow`). Tailwind is installed
(`@tailwindcss/vite`) and the user sometimes layers Tailwind utility classes on top of
existing hand-rolled classes for fine-tuning (spacing tweaks, one-off overrides) —
these are intentional edits, not scaffolding to be reverted. When implementing a new
feature or fixing a bug elsewhere in a file, leave surrounding className strings and
CSS exactly as they are. If a change genuinely requires touching styling you didn't
add, call it out before doing it rather than silently "fixing" it.

## Design system reference

- Colors/spacing/radii/transitions: `frontend/src/index.css` (light/dark via
  `[data-theme='light'|'dark']` on `documentElement`, set by `useTheme()`).
- Reusable primitives: `frontend/src/ui/kit.css`.
- Page-specific styles live next to their page: `Landing.css`, `Product.css`.
- Theme is independent of paid/free tier — never let tier state change the color
  scheme.

## Architecture notes

- `PaymentVerifier.sol` is generic — `resource`/`requestHash` gate any resource, not
  just one. `requestHash` must include the payer's wallet address (see
  `middleware/app/x402.py::compute_request_hash`) — the contract's `settledRequests`
  mapping is global, not scoped per-payer, so a hash that omits the wallet collides
  across different payers.
- Tile pricing and the known tile set live in `middleware/app/tiles.py` (static dict,
  not a plugin system — there are only a handful of tiles).
- Unlock state (`(wallet, tile_id) → unlocked until <timestamp>`) is Redis-backed
  (`middleware/app/tile_store.py`) so it survives a redeploy — this replaced an
  earlier in-memory store that got wiped on every restart.
- Free-tier usage counting (3 uses/day per tile) is entirely client-side
  (`frontend/src/hooks/useFreeUsage.ts`, localStorage) — an accepted, demo-scale
  tradeoff, not tracked server-side anywhere.
- Chat is one tile among several (`frontend/src/components/tools/ChatTile.tsx`), no
  longer the whole product — its unlock goes through the same generic
  `/unlock/{tile_id}` route as every other tile.

## Commands

- Contracts: `cd contracts && forge test`
- Middleware: `cd middleware && source .venv/bin/activate && pytest`
- Frontend: `cd frontend && npx tsc -b && npm run test && npm run lint`

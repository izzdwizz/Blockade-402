# Arc-402

The Payable Internet — any API, file, or computation gated behind one payment
primitive, paid in USDC and settled instantly on [Arc](https://arc.io). A grid of
small tiles (chat, OCR, QR generation, IBAN validation) all run through the exact
same `PaymentVerifier` contract and x402-shaped middleware: click a tile, hit a
`402 Payment Required`, pay a few cents through an embedded Privy wallet, get the
result — with the payment settled and verifiable on the
[Arc Explorer](https://explorer.arc.io).

Built for the [Arc Microgrants](https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq) program.

## Network

| | |
| --- | --- |
| Chain ID | `5042` |
| RPC URL | `https://rpc.mainnet.arc.io` |
| Explorer | `https://explorer.arc.io` |
| USDC (ERC-20 interface) | `0x3600000000000000000000000000000000000000` (6 decimals) |
| Native gas token | USDC (18 decimals) — same underlying balance as the ERC-20 view above, just a different decimal representation. Never treat them as two separate balances. |

## What it uses Arc for

Every tile unlock is metered by an onchain USDC payment settled on Arc. The
`PaymentVerifier` contract is a single, resource-agnostic settlement rail: it
pulls USDC from the payer to a resource owner and emits a `PaymentSettled` event
tagged with a request hash scoped to `(resource, tile, wallet, payload)`. The
middleware reads that event straight off Arc's RPC to decide whether to unlock a
given tile for a given wallet — payment becomes a transport-layer concern instead
of a separate billing system per resource, which is the whole point of x402, and
the whole point of routing every tile through the same contract instead of one
contract per capability.

## Architecture

```
User clicks a tile (browser, Privy wallet)
  -> GET /unlock/:tileId           [middleware]
  <- 402 + payment terms (tile-specific price)
  -> pay() on PaymentVerifier       [Arc mainnet]
  <- PaymentSettled event
  -> GET /unlock/:tileId?tx_hash=  [middleware]
  -> verify event via Arc RPC, mark (wallet, tileId) unlocked in Redis
  <- {"unlocked": true}
  -> tile runs: backend call (chat) or in-browser (OCR/QR/IBAN)
```

Unlock state is TTL'd in Redis, keyed by `(wallet, tile)` — one payment unlocks a
tile for every call that wallet makes until the TTL expires, not just the call
that paid, and survives a middleware redeploy (an in-memory store would not).

## Repo layout

```
contracts/    Foundry project — PaymentVerifier.sol + tests + deploy script
middleware/   FastAPI service — generic /unlock/:tileId + /ask, Arc RPC verification, OpenAI call
frontend/     React + Vite + Privy — landing page + the /product tile grid
```

## Running locally

**Contracts**
```
cd contracts
forge test
```

**Middleware**
```
cd middleware
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # fill in ARC_RPC_URL, CONTRACT_ADDRESS, OPENAI_API_KEY, etc.
redis-server &          # or point REDIS_URL in .env at any reachable Redis
pytest
uvicorn app.main:app --reload
```

Tile-unlock tests use an in-memory fake and never touch Redis; only the running
server needs a real `REDIS_URL`.

**Frontend**
```
cd frontend
npm install
cp .env.example .env   # fill in VITE_PRIVY_APP_ID, VITE_CONTRACT_ADDRESS, VITE_ARC_*
npm run test
npm run dev
```

## Deployment

### Deployer wallet

Use a dedicated wallet for deploying and (if it also acts as the demo payer)
transacting — don't reuse a personal wallet's private key in `.env`. Generate one
with Foundry:

```
cast wallet new
```

Fund the resulting address with a small amount of USDC on Arc mainnet (gas on Arc
targets ~$0.001 per ERC-20 transfer, so a few dollars covers deployment and dozens
of demo calls with margin). Since native gas and the ERC-20 balance are the same
underlying USDC, funding the address once covers both gas and any `pay()` calls it
makes directly.

### Testnet first

Test the full pay flow with test tokens before risking real USDC. Arc testnet:
chain ID `5042002`, RPC `https://rpc.testnet.arc.io`, explorer
`https://explorer.testnet.arc.io`. The USDC ERC-20 interface address
(`0x3600...0000`) is identical on both networks. Get testnet USDC for your
deployer wallet from [faucet.circle.com](https://faucet.circle.com), then deploy
with `ARC_RPC=https://rpc.testnet.arc.io` in `contracts/.env`.

**`contracts/.env`, `middleware/.env`, and `frontend/.env` must all point at the
same network at the same time** — chain ID, RPC URL, and contract address need to
agree across all three, or payments will verify against the wrong chain and
silently fail (or throw an ENS-resolution error in the frontend if the contract
address is left blank).

### Mainnet cutover

```
cd contracts
cp .env.example .env
# ARC_RPC=https://rpc.mainnet.arc.io
# PRIVATE_KEY=<deployer wallet private key — never commit>
# USDC_ADDRESS=0x3600000000000000000000000000000000000000
# MIN_PRICE=1000   # 0.001 USDC, the cheapest tile's price — see middleware/app/tiles.py

forge script script/Deploy.s.sol --rpc-url $ARC_RPC --broadcast
```

Per-tile pricing itself lives in [`middleware/app/tiles.py`](middleware/app/tiles.py),
not `contracts/.env` — `MIN_PRICE` only sets the contract's on-chain floor, which
must be at or below the cheapest tile's price or that tile's payments revert with
`Underpayment`. If a new tile is added below the current floor, lower it again
with the contract's owner-only `setMinPrice()` — no redeploy needed:
```
cast send <CONTRACT_ADDRESS> "setMinPrice(uint256)" <new floor> --rpc-url $ARC_RPC --private-key $PRIVATE_KEY
```

This prints the deployed `PaymentVerifier` address. Arc's docs don't currently
document an Etherscan-compatible verification endpoint for Foundry's `--verify`
flag, so treat "confirmed on the explorer" as: open
`https://explorer.arc.io/address/<contract address>` and `https://explorer.arc.io/tx/<deploy tx hash>`
and confirm they resolve — that's the link the submission needs, source
verification isn't required for the microgrant.

Point `middleware/.env` (`CONTRACT_ADDRESS`, `ARC_RPC_URL=https://rpc.mainnet.arc.io`,
`ARC_CHAIN_ID=5042`) and `frontend/.env` (`VITE_CONTRACT_ADDRESS`, same RPC/chain ID)
at the deployed contract, redeploy both services, and run the full flow once against
mainnet before recording the demo. The transaction hash from that live `pay()` call
is the Arc Explorer link for the submission.

## Deploying to Render

[`render.yaml`](render.yaml) at the repo root is a Render Blueprint — three
services, no manual dashboard setup beyond secrets:

- **`arc402-redis`** — Render's managed Key Value (Redis-compatible) store
  backing tile-unlock state.
- **`blockaid-middleware`** — the FastAPI app, built from
  [`middleware/Dockerfile`](middleware/Dockerfile). Gets `REDIS_URL` injected
  automatically via `fromService` — no manual wiring needed for that one var.
- **`blockaid-frontend`** — the React app, built as a static site from `frontend/`.

Steps:

1. Push this repo to GitHub, then in the Render dashboard: **New → Blueprint**,
   point it at the repo. Render reads `render.yaml` and creates all three services.
2. Render will pause on the `sync: false` env vars and ask you to fill them in —
   `CONTRACT_ADDRESS`, `RESOURCE_ADDRESS`, `OPENAI_API_KEY`, `VITE_PRIVY_APP_ID`,
   `VITE_CONTRACT_ADDRESS`. These are marked `sync: false` because they're
   secrets or deployment-specific values that shouldn't live in the repo.
3. `VITE_API_BASE_URL` (frontend) and `CORS_ORIGINS` (middleware) reference each
   other's URLs — Render assigns those URLs on first deploy, so there's a
   chicken-and-egg step: deploy once, copy each service's `*.onrender.com` URL
   from the dashboard, paste them into the other service's env var, and Render
   redeploys automatically on env var change.
4. The middleware's `Dockerfile` binds to Render's `$PORT` automatically — no
   changes needed there.

## Does the paid tier need a database for conversation memory?

Not for what's built — that question is answered differently than it used to be.
Tile-unlock state (which wallet paid for which tile, and until when) now lives in
Redis, not a database — a natural fit, since it's all short-lived TTL'd state, and
it also fixes the reliability gap an in-memory store had (a redeploy used to wipe
every unlock and force re-payment; Redis survives that). Conversation *history* is
still out of scope on purpose — every `/ask` call is single-turn with no memory,
per the build plan's explicit descoping of "Memory" as a stretch goal. If chat
should feel conversational later, the lower-risk path is still to have the
**frontend** replay its already-held `messages` state in each request rather than
adding a second storage layer for it — a real database only earns its complexity
if memory needs to survive a page reload or follow a wallet across
devices — worth flagging as a real v2 step, not a gap in what's shipped now.

## What's out of scope (v1)

- No token-based metering — flat USDC price per tile.
- No oracle-based dispute resolution.
- No conversation memory (single-turn chat only, by design — see above).
- No production-grade rate limiting beyond the 3-free-uses-per-day client counter.
- The fifth "Agent Resource" tile (an autonomous agent paying for itself via a
  dedicated wallet) is a planned follow-up, not implemented here.

These are the natural v2 steps if this goes further than a microgrant prototype.

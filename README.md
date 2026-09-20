# Arc LLM Paywall

A pay-per-call AI endpoint on [Arc mainnet](https://arc.io), gated by an x402-shaped
USDC payment. A person opens the demo page, asks a question, gets a `402 Payment
Required` challenge, pays a few cents in USDC through an embedded Privy wallet, and
gets back a real OpenAI response — with the payment settled and verifiable on the
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

Every LLM call is metered by an onchain USDC payment settled on Arc. The
`PaymentVerifier` contract is the settlement rail: it pulls USDC from the payer to
the resource owner and emits a `PaymentSettled` event tagged with a request hash.
The middleware reads that event straight off Arc's RPC to decide whether to serve
the request — payment becomes a transport-layer concern instead of a separate
billing system, which is the whole point of x402.

## Architecture

```
User (browser, Privy wallet)
  -> GET /ask                      [middleware]
  <- 402 + payment terms
  -> pay() on PaymentVerifier       [Arc mainnet]
  <- PaymentSettled event
  -> GET /ask?tx_hash=...          [middleware]
  -> verify event via Arc RPC
  -> call OpenAI
  <- 200 + response
```

## Repo layout

```
contracts/    Foundry project — PaymentVerifier.sol + tests + deploy script
middleware/   FastAPI service — x402 handshake, Arc RPC verification, OpenAI call
frontend/     React + Vite + Privy — the live demo page
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
pytest
uvicorn app.main:app --reload
```

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
# MIN_PRICE=10000   # 0.01 USDC per call, in 6-decimal base units

forge script script/Deploy.s.sol --rpc-url $ARC_RPC --broadcast
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

[`render.yaml`](render.yaml) at the repo root is a Render Blueprint — two
services, no manual dashboard setup beyond secrets:

- **`blockaid-middleware`** — the FastAPI app, built from
  [`middleware/Dockerfile`](middleware/Dockerfile).
- **`blockaid-frontend`** — the React app, built as a static site from `frontend/`.

Steps:

1. Push this repo to GitHub, then in the Render dashboard: **New → Blueprint**,
   point it at the repo. Render reads `render.yaml` and creates both services.
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

## Should the paid tier have a database for conversation memory?

Not yet, and probably not at all for this. Right now every `/ask` call is a
single-turn request with no history — that's intentional per the build plan
("Memory" was explicitly descoped as a stretch goal, since the character-cap
mechanism alone makes free-vs-paid obvious without it). If you want the paid
tier to feel conversational, the lower-risk path is to have the **frontend**
replay the visible message history in each request body (it already holds
`messages` in `useChatSession` state) rather than standing up a database —
stateless on the server, and Render's free-tier containers can restart/sleep
at any time anyway, so anything server-held in memory (like the current
`PaidSessionStore`) isn't durable regardless. A database earns its complexity
only if you want memory to survive a page reload or follow a wallet across
devices — worth flagging as a real v2 step, not a gap in what's shipped now.

## What's out of scope (v1)

- No token-based metering — flat USDC price per call.
- No oracle-based dispute resolution.
- Single protected resource/endpoint only.
- No production-grade rate limiting beyond a simple call cap.

These are the natural v2 steps if this goes further than a microgrant prototype.



## Product enhancement: free tier, paid unlock, UI

The core idea is right — a free tier that's genuinely restricted, an easy path to paid, and a UI where the contrast is felt, not just described. Scrutinizing the pieces before locking them in, since this adds real scope beyond the original one-endpoint prototype.

### Free-tier restriction — skip character count, it's not interesting

A character or token cap is the generic, forgettable version of this — every AI free tier does it and a demo judge won't register it as a reason to pay. Three restrictions are worth it instead, and they're strong specifically because each one turns something already true about Arc or the product into a felt experience:

| Restriction | Free | Paid (one x402 payment unlocks it) | Why it's interesting |
| --- | --- | --- | --- |
| **Speed** | Response artificially queued/delayed (a few seconds) | Served at Arc's actual sub-second finality — payment clears and the answer appears almost instantly | This turns Arc's own headline technical feature into something a demo audience *feels* in real time, not a spec sheet claim |
| **Memory** | Every message is stateless — the being has no memory of the last thing you said | Paying unlocks a persistent thread — it remembers the conversation | Ties directly into the "sentient being" framing: paying literally makes it remember you exist. That's a genuinely different hook than "more tokens" |
| **Depth** | A smaller/cheaper model, short answers | The flagship model, full-length answers | The plainest lever, and the fallback if the other two prove too fiddly to build in time |

**Finalized mechanism: a hard length cap, not a subtle one.** Free tier caps both the input (roughly one sentence — e.g. 200 characters) and the response (a short answer only); hitting the input cap blocks further typing and surfaces the paywall inline, right in the input field. Paid removes both caps outright — full-length questions, full-length answers. This is the headline mechanism because it's the only candidate that's visually obvious to a live audience without narration: a character counter hitting a wall, then vanishing after payment. Speed (serving the paid response at Arc's actual sub-second finality) layers on as a reinforcing detail, not the primary mechanism. Memory (persistent conversation) is a good stretch goal post-submission but adds session-state complexity not needed to make the contrast obvious.

### Free → paid: not a manual toggle

A button a user flips themselves undercuts the pitch — if free already works, why would anyone toggle themselves into paying? The gate should be automatic: the free cap is hit, the UI surfaces the unlock prompt in place (not a redirect), and a successful payment through the existing x402 flow flips the session's state. A manual "Go Pro" button can still exist as a secondary entry point for someone who wants the upgraded experience immediately without waiting to hit the cap — that's a fine addition, just not the primary mechanism.

Architecturally this rides on what's already built: the FastAPI middleware already verifies a `PaymentSettled` event per call. Extend it to also flip a short-lived session flag (tied to the connected wallet, not a login system) so a payment unlocks the better experience for the calls that follow, not only the one it paid for — avoids needing a separate auth system for something this small.

### UI direction

The "sentient being" framing translates well into concrete choices: generous whitespace, soft grays rather than pure black text, one accent color reserved for the paid state so it reads as a real state change rather than decoration. Instead of a generic spinner, a single soft **presence indicator** — a breathing/pulsing orb or dot representing the being — that is visibly dim and slow in free mode and brightens with an instant response in paid mode. That's the UI doing the same job as the speed restriction above: the difference is seen, not read. Chat thread + single input field, as described — no extra chrome needed for a demo this size.

Theme (light/dark) is independent of tier — free and paid users get the identical light/dark toggle, and theme choice never signals or changes tier. The free/paid difference lives entirely in the input/response caps and the presence indicator's behavior, never in the color scheme.

### Free vs. paid — the demo moment (financial idea dropped)

The market-data/stock idea is dropped — a second data integration wasn't worth the added risk and dependency for this submission, and the length cap above now does the job of making free vs. paid obvious without it. The demo becomes one clean beat: ask a real question on free, hit the cap mid-sentence, pay in USDC on Arc, watch the same question go through in full and return instantly. One endpoint, one moment, nothing external to depend on.

### Where this leaves the plan

The original execution prompt above still stands as the build order for the core payment loop — contract, middleware, frontend, testnet, mainnet. This section is the next layer once that loop works end to end: session-based tiering, the presence-indicator UI, and the two demo prompts (general + financial-flavored). Sequencing it after, not instead of, keeps the Oct 14 deadline realistic.

## UI structure

Structural scaffolding only — the visual design is yours; this is routing, layout regions, components, and state.

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page — marketing, explains the product, CTA into the app |
| `/product` | The application itself — the chat interface, behind this path as specified |

One screen at `/product`, not a sub-router — tier (free/paid) and theme (light/dark) are both client-side state, not separate routes, since neither should cost a page reload.

### `/product` layout regions

```
┌─ AppShell ──────────────────────────────────────────────┐
│  TopBar: wordmark (left)  ·  ThemeToggle + WalletConnectButton (right)  │
├─ ChatPanel ───────────────────────────────────────────────┤
│  PresenceIndicator (centered, above the thread when empty)             │
│  ChatThread (scrollable message list, MessageBubble per turn)          │
├─ InputBar ───────────────────────────────────────────────┤
│  TextField + live char counter · Send button                          │
│  PaywallPrompt (appears inline here only when the free cap is hit)     │
└─────────────────────────────────────────────────────────
```

### Component list

| Component | Responsibility |
| --- | --- |
| `AppShell` | Page frame, holds theme context and layout regions |
| `ThemeToggle` | Light/dark switch, persisted client-side, independent of tier |
| `WalletConnectButton` | Privy connect/status — shows connected address once linked |
| `TierBadge` | Small, quiet indicator of remaining free messages or "Paid" state |
| `PresenceIndicator` | The orb — dim/slow idle in free tier, brightens on a paid response |
| `ChatThread` / `MessageBubble` | Renders the conversation |
| `ChatInput` | Text field with live character count against the tier's cap |
| `PaywallPrompt` | Inline (not a modal) — shows price, triggers the Privy payment flow, dismisses and unlocks input on success |

### State

| State | Scope | Notes |
| --- | --- | --- |
| `theme` | `light \| dark` | Persisted client-side (e.g. localStorage), fully orthogonal to tier |
| `tier` | `free \| paid` | Derived from a verified payment tied to the connected wallet, not a login |
| `messagesRemaining` | free tier only | Counts down, resets on a successful payment |
| `walletConnected` | boolean | From Privy |
| `messages` | array | The chat history for the current session |

## Landing page (`/`)

Content, not final copy — sized to what a grant reviewer or a curious visitor needs in under a minute.

**Hero**

- Headline: a plain-language line naming what it does (e.g. "Ask anything. Pay only for what you use.")
- Subhead: one sentence naming Arc and the mechanic (e.g. "A few free questions, then micropayments in USDC on Arc unlock full answers — instantly.")
- Primary CTA: "Try it free" → `/product`
- Secondary link: "How it works" (scrolls down, not a second route)

**How it works (3 steps)**

1. Ask — a short free question, no signup
2. Hit the free cap — see exactly where it stops
3. Pay in USDC on Arc — unlocked instantly, full-length answers from then on

**Free vs. paid (simple comparison)**

|  | Free | Paid |
| --- | --- | --- |
| Question length | Capped (≈200 characters) | Unlimited |
| Answer length | Short | Full |
| Speed | Standard | Arc's sub-second settlement |
| Cost | $0 | A few cents in USDC per unlock |

**Trust strip** Short line of what it's built on, each linked: "Powered by OpenAI · Wallets by Privy · Settled on Arc" — doubles as the technical credibility signal a grant reviewer is scanning for.

**Footer** Repo link, live contract on Arcscan, builder profile (GitHub/X/Farcaster) — the same three things the microgrant submission itself asks for, so the landing page can double as the submission's public face.

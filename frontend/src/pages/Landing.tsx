import { Link } from "react-router-dom";
import "./Landing.css";
import { ThemeToggle } from "../components/ThemeToggle";
import { TileCard } from "../components/TileCard";
import { useTheme } from "../hooks/useTheme";
import { TILES } from "../tiles";

const STEPS = [
  {
    title: "Pick a capability",
    body: "Chat, OCR, a QR code, an IBAN check — one grid, one payment rail underneath all of it.",
  },
  {
    title: "Hit a 402",
    body: "The exact price for that one thing, shown upfront, tied to a request hash that's yours alone.",
  },
  {
    title: "Pay in USDC on Arc",
    body: "Unlocked instantly, at Arc's sub-second settlement — no account, no subscription.",
  },
];

const COMPARISON = [
  {
    label: "Chat",
    free: "Capped questions, short answers",
    paid: "Unlimited length",
  },
  {
    label: "OCR / QR / IBAN",
    free: "3 free uses per day",
    paid: "Unlimited uses",
  },
  {
    label: "Cost",
    free: "$0",
    paid: "A fraction of a cent to a few cents in USDC",
  },
];

export function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      <nav className="landing__nav py-5">
        <div className="container landing__nav-inner">
          <span className="landing__wordmark">Arc-402</span>
          <div className="landing__nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#tiles">The tiles</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Repo
            </a>
          </div>
          <div className="landing__nav-right">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="nav-cta"
            >
              <span className="nav-cta__dot" />
              View source
            </a>
          </div>
        </div>
      </nav>

      <header className="container hero !py-14">
        <div className="fade-in">
          <p className="eyebrow hero__eyebrow">
            Payment infrastructure · Built on Arc
          </p>
          <h1 className="hero__headline">
            A Payable
            <br />
            Internet.
          </h1>
          <p className="hero__subhead">
            Any API, file, or computation — gated behind one payment primitive,
            paid in USDC, settled instantly on Arc.
          </p>
          <div className="hero__ctas">
            <Link to="/product" className="pill-button">
              Try it free →
            </Link>
            <a href="#how-it-works" className="text-link">
              See how it works
            </a>
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card__glow" />
          <div className="demo-card__grid" />
          <div className="demo-card__flow">
            <div className="demo-card__step">
              <span className="demo-card__step-dot" />
              GET /unlock/:tileId
            </div>
            <div className="demo-card__step">
              <span className="demo-card__step-dot" />
              402 Payment Required
            </div>
            <div className="demo-card__step demo-card__step--active">
              <span className="demo-card__step-dot" />
              PaymentSettled · verified
            </div>
          </div>
          <div className="demo-card__body">
            <div className="demo-card__label">
              <h3>PaymentVerifier</h3>
              <span>Arc mainnet · 5042</span>
            </div>
            <div className="demo-card__meta">
              <span>USDC · 6 decimals</span>
              <span className="demo-card__price">One contract, every tile</span>
            </div>
          </div>
        </div>
      </header>

      <section className="container stats">
        <div className="stats__item">
          <div className="stats__number">&lt;1s</div>
          <div className="stats__label">Arc settlement finality</div>
        </div>
        <div className="stats__item">
          <div className="stats__number">4</div>
          <div className="stats__label">Resources, one payment primitive</div>
        </div>
        <div className="stats__item">
          <div className="stats__number">$0.001</div>
          <div className="stats__label">Cheapest unlock on the grid</div>
        </div>
        <div className="stats__item">
          <p className="stats__note">
            No API keys, no subscriptions — a wallet and an on-chain receipt
            stand in for billing infrastructure entirely.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="container section !py-14">
        <p className="eyebrow section__eyebrow">How it works</p>
        <h2 className="section__title">Three steps, no signup.</h2>
        <p className="section__subtitle">
          Every tile below runs through the exact same settlement contract —
          this isn't five separate apps, it's one payment rail wired to
          different things you might want.
        </p>
        <div className="flow-steps">
          {STEPS.map((step, i) => (
            <div className="flow-step" key={step.title}>
              <div className="flow-step__index">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flow-step__title">{step.title}</div>
              <div className="flow-step__body">{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="tiles" className="container section !py-14">
        <p className="eyebrow section__eyebrow">The vending machine</p>
        <h2 className="section__title">One primitive, many resources.</h2>
        <p className="section__subtitle">
          Click a tile, hit a 402, pay, get the result — the same rail under
          every one of these.
        </p>
        <div className="tile-grid tile-grid--compact">
          {TILES.map((tile) => (
            <TileCard key={tile.id} tile={tile} compact />
          ))}
        </div>
      </section>

      <section className="container section !py-10">
        <div className="demo-callout">
          <div>
            <p className="eyebrow section__eyebrow">Free vs. paid</p>
            <h2 className="demo-callout__title">
              The contrast is felt, not described.
            </h2>
            <p className="demo-callout__body">
              A few free uses of anything, no wallet required. Connect and pay a
              few cents to remove the limit — instantly, at Arc's settlement
              speed.
            </p>
            <Link to="/product" className="pill-button">
              Try the grid →
            </Link>
          </div>
          <div className="compare">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Free</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td>{row.free}</td>
                    <td className="compare__paid">{row.paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="trust">
          <span>
            Settled on <strong>Arc</strong> · Wallets by <strong>Privy</strong>{" "}
            · Open source
          </span>
        </div>
      </div>

      <footer className="container footer !py-3">
        <span className="footer__copy">
          © {new Date().getFullYear()} Arc-402
        </span>
        <div className="footer__links">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            Repo
          </a>
          <a href="https://explorer.arc.io" target="_blank" rel="noreferrer">
            Contract on Arc Explorer
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer">
            Builder profile
          </a>
        </div>
      </footer>
    </div>
  );
}

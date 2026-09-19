import { Link } from "react-router-dom";
import "./Landing.css";

const FLOW_STEPS = [
  {
    title: "Request hits the resource",
    body: "A client calls the protected endpoint. No API key, no subscription — just a request.",
  },
  {
    title: "402 Payment Required",
    body: "The middleware answers with machine-readable terms: amount, recipient, chain, a hash tying the payment to this exact request.",
  },
  {
    title: "Settled on Arc",
    body: "The client pays the PaymentVerifier contract in USDC. Arc's sub-second finality means the payment is final almost immediately.",
  },
  {
    title: "Verified & served",
    body: "The middleware reads the PaymentSettled event straight off Arc's RPC, confirms it matches, and serves the resource.",
  },
];

const COMPARISON = [
  {
    label: "Question length",
    free: "Capped (≈200 characters)",
    paid: "Unlimited",
  },
  { label: "Answer length", free: "Short", paid: "Full" },
  { label: "Speed", free: "Standard", paid: "Arc's sub-second settlement" },
  { label: "Cost", free: "$0", paid: "A few cents in USDC per unlock" },
];

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing__nav py-4">
        <div className="container landing__nav-inner">
          <span className="landing__wordmark">
            BlockAid<sup>®</sup>
          </span>
          <div className="landing__nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#demo">Live demo</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Repo
            </a>
          </div>
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
      </nav>

      <header className="container hero">
        <div className="fade-in">
          {/* <p className="eyebrow hero__eyebrow">
            Payment infrastructure · Built on Arc
          </p> */}
          <h1 className="hero__headline pt-20">
            Gate anything.
            <br />
            Settle instantly.
          </h1>
          <p className="hero__subhead !text-base">
            BlockAid is an x402 paywall architecture — a settlement contract, a
            verifying middleware, and a wallet prompt — that turns any endpoint
            into a pay-per-call resource, billed in USDC on Arc.
          </p>
          <div className="hero__ctas">
            <Link to="/product" className="pill-button">
              See the live demo →
            </Link>
            <a href="#how-it-works" className="text-link mt-1">
              View the working principle
            </a>
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card__glow" />
          <div className="demo-card__grid" />
          <div className="demo-card__flow">
            <div className="demo-card__step">
              <span className="demo-card__step-dot" />
              GET /resource
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
              <span className="demo-card__price">$0.005 / call</span>
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
          <div className="stats__number">3</div>
          <div className="stats__label">
            Moving parts — contract, middleware, wallet
          </div>
        </div>
        <div className="stats__item">
          <div className="stats__number">$0.005</div>
          <div className="stats__label">Minimum viable micropayment</div>
        </div>
        <div className="stats__item">
          <p className="stats__note">
            No API keys, no subscriptions — a wallet and an on-chain receipt
            stand in for billing infrastructure entirely.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="container section !py-10">
        <p className="eyebrow section__eyebrow">Architecture</p>
        <h2 className="section__title">Four steps, no custody.</h2>
        <p className="section__subtitle">
          PaymentVerifier never holds a balance — it's a thin, auditable
          settlement rail that pulls USDC straight from payer to resource owner
          and emits proof.
        </p>
        <div className="flow-steps">
          {FLOW_STEPS.map((step, i) => (
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

      <section id="demo" className="container section">
        <div className="demo-callout py-8">
          <div>
            <p className="eyebrow section__eyebrow">See it live</p>
            <h2 className="demo-callout__title">
              Arc Ask — a paywalled AI endpoint built on BlockAid.
            </h2>
            <p className="demo-callout__body">
              To show the architecture actually working, we built Arc Ask: a
              free tier that's genuinely restricted, and a single USDC payment
              that unlocks the full experience — instantly, at Arc's settlement
              speed.
            </p>
            <Link to="/product" className="pill-button">
              Try Arc Ask →
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
            Powered by <strong>OpenAI</strong> · Wallets by{" "}
            <strong>Privy</strong> · Settled on <strong>Arc</strong>
          </span>
        </div>
      </div>

      <footer className="container footer !py-3 !text-xs">
        <span className="footer__copy">
          © {new Date().getFullYear()} BlockAid
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

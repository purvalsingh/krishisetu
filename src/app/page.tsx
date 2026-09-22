import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, MicroNote, Stat, Stats } from "@/components/ui";
import { Magnetic } from "@/components/magnetic";
import { ECONOMICS } from "@/lib/config";
import { priceStack } from "@/lib/pricing";
import { perKg, rupees } from "@/lib/money";

/** The worked example uses the same function that prices a real order. */
const example = priceStack({
  grams: 1000,
  farmerPaisePerKg: 3400,
  referencePaisePerKg: 5500,
  perOrderHandlingPaise: 0,
});

const SPLIT = [
  { label: "Farmer", paise: example.farmerProceedsPaise, color: "var(--green)" },
  { label: "Transport", paise: example.logisticsPaise, color: "#6b8cae" },
  { label: "Packing & handling", paise: example.handlingPaise, color: "var(--amber)" },
  { label: "Site fee", paise: example.siteFeePaise, color: "#8a7fae" },
];

const REASONS = [
  ["Pooled line haul", "Several farms share the same vehicle."],
  ["Cluster pickup by default", "One known stop keeps the last mile lean."],
  ["Nothing moves unsold", "Orders are confirmed before dispatch."],
  ["An under-filled run does not go", "Held runs show the shortfall honestly."],
];

const ROLES = [
  { icon: "🌱", role: "Farmer", name: "Sanjay Patil", note: "Raigad Bhaji Utpadak FPO", phone: "9800000101" },
  { icon: "⌂", role: "Household buyer", name: "Anjali Deshpande", note: "Nerul Sector 6 pickup point", phone: "9800000301" },
  { icon: "▰", role: "Transporter", name: "Imran Shaikh", note: "Tata Ace · MH43 AB 1234", phone: "9800000201" },
  { icon: "▤", role: "Operator", name: "Platform operator", note: "Run planning desk", phone: "9800000001" },
];

export default function Landing() {
  const total = SPLIT.reduce((s, p) => s + p.paise, 0);
  const share = (paise: number) => Math.round((paise / total) * 100);

  return (
    <>
      <Nav />
      <Shell>
        <div className="landing-hero">
          <div>
            <div className="eyebrow">SIH26033 · TEAM LOGIC_LORDS · RAIT</div>
            <h1>The farmer names their price. Everything after that is shared transport and a bill you can read.</h1>
            <p>
              KrishiSetu pools produce from Raigad farms into one neighbourhood run, so a small harvest can travel
              without losing its margin to a half-empty vehicle.
            </p>
            <div className="hero-actions">
              <Magnetic>
                <Link href="/market" className="btn btn-primary">
                  Browse today&apos;s produce <Arrow />
                </Link>
              </Magnetic>
              <Link href="/login" className="btn btn-secondary">
                Sign in to a demonstration account
              </Link>
            </div>
          </div>

          <div className="hero-note">
            <span className="eyebrow" style={{ margin: 0 }}>
              THE WHOLE MECHANIC
            </span>
            <b>Several farms</b>
            <DownArrow />
            <b>One tempo</b>
            <DownArrow />
            <b>One pickup point</b>
          </div>
        </div>

        <Stats count={4}>
          <Stat label="Farmer keeps" value={perKg(example.farmerPaisePerKg)} tone="positive" />
          <Stat label="Buyer pays" value={perKg(example.landedPaisePerKg)} />
          <Stat label="Quick-commerce reference" value={perKg(example.referencePaisePerKg)} tone="warning" />
          <Stat label="Minimum vehicle fill" value={`${ECONOMICS.MIN_FILL_FRACTION * 100}%`} />
        </Stats>

        <div className="two-col">
          <Card>
            <div className="eyebrow">TRANSPARENT BILL · TOMATO</div>
            <h2>Where one kilogram goes</h2>

            <div className="bars">
              <div className="bar">
                {SPLIT.map((p) => (
                  <span key={p.label} style={{ width: `${(p.paise / total) * 100}%`, background: p.color }} />
                ))}
              </div>
              <div className="legend">
                {SPLIT.map((p) => (
                  <span key={p.label}>
                    <i style={{ background: p.color }} />
                    {p.label} {share(p.paise)}%
                  </span>
                ))}
              </div>
            </div>

            <div className="line-items">
              <span>
                Farmer&apos;s rate <b>{rupees(example.farmerProceedsPaise)}</b>
              </span>
              <span>
                Transport <b>{rupees(example.logisticsPaise)}</b>
              </span>
              <span>
                Packing and handling <b>{rupees(example.handlingPaise)}</b>
              </span>
              <span>
                Site fee <b>{rupees(example.siteFeePaise)}</b>
              </span>
              <strong>
                Total <b>{rupees(example.totalPaise)}</b>
              </strong>
            </div>

            <MicroNote>
              Illustrative inputs: a ₹34/kg farmer rate against an assumed ₹55/kg quick-commerce reference. Neither is
              a measured pilot figure.
            </MicroNote>
          </Card>

          <Card>
            <div className="eyebrow">WHY IT WORKS</div>
            <h2>Why the delivery leg does not lose money</h2>
            <ol className="plain-list">
              {REASONS.map(([title, note], i) => (
                <li key={title}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{title}</strong>
                    <small>{note}</small>
                  </span>
                </li>
              ))}
            </ol>
            <MicroNote>
              A weekly household basket is about six kilograms. A dedicated rider drop would eat a tenth of it, so
              collection from a neighbourhood point is the default and door delivery is free only above{" "}
              {rupees(ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE)}.
            </MicroNote>
          </Card>
        </div>

        <div className="role-grid">
          {ROLES.map((r) => (
            <Card key={r.phone}>
              <div className="role-icon">{r.icon}</div>
              <div className="eyebrow">{r.role}</div>
              <h3>{r.name}</h3>
              <p>{r.note}</p>
              <Link href={`/login?as=${r.phone}`}>
                Sign in <Arrow />
              </Link>
            </Card>
          ))}
        </div>

        <MicroNote>
          KrishiSetu is a student project name and is not affiliated with any government body. Mandi prices come from
          the Government of India open data portal and are dated observations, not guaranteed floor prices.
          Demonstration accounts, listings and order history are synthetic and labelled as such.{" "}
          <Link href="/positioning" className="text-link">
            Where we differ from the incumbents <Arrow />
          </Link>
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

function DownArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

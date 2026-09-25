import Link from "next/link";
import { Footer, Nav } from "@/components/nav";
import { Arrow } from "@/components/ui";
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
  { label: "Transport", paise: example.logisticsPaise, color: "var(--c-transport)" },
  { label: "Packing & handling", paise: example.handlingPaise, color: "var(--amber)" },
  { label: "Site fee", paise: example.siteFeePaise, color: "var(--c-fee)" },
];

const REASONS = [
  ["Pooled line haul", "Several farms share the same vehicle."],
  ["Cluster pickup by default", "One known stop keeps the last mile lean."],
  ["Nothing moves unsold", "Orders are confirmed before dispatch."],
  ["An under-filled run does not go", "Held runs show the shortfall honestly."],
];

const ROLES = [
  { role: "Farmer", name: "Sanjay Patil", note: "Raigad Bhaji Utpadak FPO", phone: "9800000101" },
  { role: "Household buyer", name: "Anjali Deshpande", note: "Nerul Sector 6 pickup point", phone: "9800000301" },
  { role: "Transporter", name: "Imran Shaikh", note: "Tata Ace · MH43 AB 1234", phone: "9800000201" },
  { role: "Operator", name: "Platform operator", note: "Run planning desk", phone: "9800000001" },
];

/** The landing page is a ledger in five folios, one idea per screen. */
export default function Landing() {
  const total = SPLIT.reduce((s, p) => s + p.paise, 0);
  const share = (paise: number) => Math.round((paise / total) * 100);

  return (
    <>
      <Nav />
      <main className="ledger">
        <div className="margin-rule" aria-hidden>
          <i />
        </div>

        <section className="folio">
          <Folio n="01" label="The entry" />
          <div className="folio-split">
            <div>
              <div className="eyebrow">SIH26033 · Team Logic_Lords · RAIT</div>
              <h1>
                <span className="line">The farmer</span>
                <span className="line">
                  names <em>their price.</em>
                </span>
                <span className="line">The rest is on the bill.</span>
              </h1>
              <p className="lede">
                KrishiSetu pools produce from Raigad farms into one neighbourhood run, so a small harvest can travel
                without losing its margin to a half-empty vehicle.
              </p>
              <div className="hero-actions">
                <Link href="/market" className="btn btn-primary">
                  Browse today&apos;s produce <Arrow />
                </Link>
                <Link href="/login" className="btn btn-secondary">
                  Sign in to a demonstration account
                </Link>
              </div>
            </div>
            <div>
              <div className="eyebrow">The whole mechanic</div>
              <ol className="entries">
                <li>
                  <span>i.</span> Several farms <b>list</b>
                </li>
                <li>
                  <span>ii.</span> One tempo <b>pools</b>
                </li>
                <li>
                  <span>iii.</span> One pickup point <b>collects</b>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="folio">
          <Folio n="02" label="The bill" />
          <div className="folio-split">
            <div>
              <div className="eyebrow">Transparent bill · Tomato</div>
              <h2>Where one kilogram goes.</h2>
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
            <div>
              <ol className="entries">
                <li>
                  Farmer&apos;s rate <b>{rupees(example.farmerProceedsPaise)}</b>
                </li>
                <li>
                  Transport <b>{rupees(example.logisticsPaise)}</b>
                </li>
                <li>
                  Packing and handling <b>{rupees(example.handlingPaise)}</b>
                </li>
                <li>
                  Site fee <b>{rupees(example.siteFeePaise)}</b>
                </li>
                <li className="total">
                  Total <b>{rupees(example.totalPaise)}</b>
                </li>
              </ol>
              <p className="micro-note">
                Illustrative inputs: a ₹34/kg farmer rate against an assumed ₹55/kg quick-commerce reference. Neither
                is a measured pilot figure.
              </p>
            </div>
          </div>
        </section>

        <section className="folio">
          <Folio n="03" label="The figures" />
          <div>
            <h2>Four numbers the whole design answers to.</h2>
            <div className="figures">
              <div className="figure positive">
                <strong>{perKg(example.farmerPaisePerKg)}</strong>
                <small>Farmer keeps: their own accepted rate, never deducted from</small>
              </div>
              <div className="figure">
                <strong>{perKg(example.landedPaisePerKg)}</strong>
                <small>Buyer pays, landed at the pickup point</small>
              </div>
              <div className="figure warning">
                <strong>{perKg(example.referencePaisePerKg)}</strong>
                <small>Quick-commerce reference (assumed)</small>
              </div>
              <div className="figure">
                <strong>{ECONOMICS.MIN_FILL_FRACTION * 100}%</strong>
                <small>Minimum vehicle fill before a run is dispatched</small>
              </div>
            </div>
          </div>
        </section>

        <section className="folio">
          <Folio n="04" label="The reasons" />
          <div>
            <h2>Why the delivery leg does not lose money.</h2>
            <ol className="reasons">
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
            <p className="micro-note">
              A weekly household basket is about six kilograms. A dedicated rider drop would eat a tenth of it, so
              collection from a neighbourhood point is the default and door delivery is free only above{" "}
              {rupees(ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE)}.
            </p>
          </div>
        </section>

        <section className="folio">
          <Folio n="05" label="The accounts" />
          <div>
            <h2>Open an account book.</h2>
            <div className="accounts">
              {ROLES.map((r) => (
                <Link key={r.phone} href={`/login?as=${r.phone}`}>
                  <span className="account-initial">{r.role[0]}</span>
                  <span>
                    <span className="eyebrow">{r.role}</span>
                    <strong>{r.name}</strong>
                    <small>{r.note}</small>
                  </span>
                  <span className="go">
                    Sign in <Arrow />
                  </span>
                </Link>
              ))}
            </div>
            <p className="micro-note colophon">
              KrishiSetu is a student project name and is not affiliated with any government body. Mandi prices come
              from the Government of India open data portal and are dated observations, not guaranteed floor prices.
              Demonstration accounts, listings and order history are synthetic and labelled as such.{" "}
              <Link href="/positioning" className="text-link">
                Where we differ from the incumbents <Arrow />
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Folio({ n, label }: { n: string; label: string }) {
  return (
    <div className="folio-no" aria-hidden>
      f. {label}
      <b>{n}</b>
    </div>
  );
}

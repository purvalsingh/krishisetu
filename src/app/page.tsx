import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { BillBar, Card, SourceNote, Stat } from "@/components/ui";
import { ECONOMICS } from "@/lib/config";
import { priceStack } from "@/lib/pricing";
import { rupees, perKg } from "@/lib/money";

/** The worked example on the landing page uses the same pricing code as a real order. */
const example = priceStack({
  grams: 1000,
  farmerPaisePerKg: 3400,
  referencePaisePerKg: 5500,
  perOrderHandlingPaise: 0,
});

const ROLES = [
  {
    href: "/login?as=9800000101",
    title: "Farmer",
    body: "List what you have, see which crop is in demand and where, set the net price you will accept, and watch your produce travel in a shared vehicle.",
  },
  {
    href: "/login?as=9800000301",
    title: "Household buyer",
    body: "Buy the exact quantity you need, see every line of the bill, and collect from the pickup point in your own neighbourhood.",
  },
  {
    href: "/login?as=9800000201",
    title: "Transporter",
    body: "Accept a full run instead of a half-empty trip: several farms collected, one cluster delivered, distance and payment agreed in advance.",
  },
  {
    href: "/login?as=9800000001",
    title: "Operator",
    body: "Plan runs, see why an order was rejected, watch the fill threshold, and check whether the fee actually covers the cost.",
  },
];

export default async function Landing() {
  return (
    <>
      <Nav />
      <Shell>
        <section className="py-10">
          <p className="text-xs font-medium uppercase tracking-widest text-brand">
            SIH26033 · Team Logic_Lords · RAIT
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            The farmer names their price. Everything after that is shared transport and a bill you can read.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-inksoft">
            A small farmer cannot fill a tempo alone, so a single trip eats the margin. KrishiSetu pools the
            produce of several farmers who are all sending to the same neighbourhood, moves it once, and drops
            it at one pickup point that a hundred households already live around. The farmer&apos;s accepted
            amount is an input to the price, never a residual left over after everyone else is paid.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/market" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Browse today&apos;s produce
            </Link>
            <Link href="/login" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-panel2">
              Sign in to a demonstration account
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Farmer keeps" value={perKg(example.farmerPaisePerKg)} note="Set by the farmer before dispatch and never reduced by us" tone="good" />
          <Stat label="Buyer pays" value={perKg(example.landedPaisePerKg)} note="Every line itemised on the order" />
          <Stat label="Quick-commerce reference" value={perKg(example.referencePaisePerKg)} note="Assumed retail rate for the same commodity" tone="warn" />
          <Stat label="Minimum vehicle fill" value={`${ECONOMICS.MIN_FILL_FRACTION * 100}%`} note="Below this the run is held, not dispatched at a loss" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title="Where one kilogram of tomato goes" subtitle="Worked with the same function that prices a real order">
            <BillBar
              parts={[
                { label: "Farmer", paise: example.farmerProceedsPaise, color: "var(--brand)" },
                { label: "Transport", paise: example.logisticsPaise, color: "#6b8cae" },
                { label: "Packing and handling", paise: example.handlingPaise, color: "var(--accent)" },
                { label: "Site fee", paise: example.siteFeePaise, color: "#8a7fae" },
              ]}
            />
            <dl className="tabular mt-4 space-y-1.5 text-sm">
              <Row label="Farmer accepted proceeds" value={rupees(example.farmerProceedsPaise)} strong />
              <Row label="Collection and line haul" value={rupees(example.logisticsPaise)} />
              <Row label="Grading, packing, spoilage buffer" value={rupees(example.handlingPaise)} />
              <Row label="Site fee" value={rupees(example.siteFeePaise)} />
              <Row label="Buyer pays" value={rupees(example.totalPaise)} strong />
            </dl>
            <SourceNote>
              Illustrative inputs. A ₹34/kg farmer price is compared against an assumed ₹55/kg quick-commerce
              rate and an assumed ₹25/kg comparable mandi net. None of these three is a measured pilot figure.
            </SourceNote>
          </Card>

          <Card title="Why the delivery leg does not lose money" subtitle="The design choice that makes the arithmetic work">
            <ol className="space-y-3 text-sm leading-relaxed text-inksoft">
              <li>
                <span className="font-medium text-ink">Pooled line haul.</span> A full tempo carries produce for
                roughly ₹3 per kilogram. The same vehicle carrying one farmer&apos;s 200 kg costs five times that
                per kilogram. Pooling farmers who share a destination is the whole saving.
              </li>
              <li>
                <span className="font-medium text-ink">Cluster pickup by default.</span> A weekly household basket
                is about six kilograms. A dedicated rider drop would eat a tenth of it, so the default is one
                neighbourhood point with a stated collection window, and in-society delivery is a priced extra.
              </li>
              <li>
                <span className="font-medium text-ink">Nothing moves unsold.</span> The vehicle is loaded against
                confirmed orders only, so there is no dark-store stock to write off.
              </li>
              <li>
                <span className="font-medium text-ink">A run that is too empty does not go.</span> Below{" "}
                {ECONOMICS.MIN_FILL_FRACTION * 100}% fill the orders roll to the next window with an explanation,
                rather than being delivered at a loss that someone would eventually have to recover from farmers.
              </li>
            </ol>
          </Card>
        </div>

        <div className="mt-6">
          <Link href="/positioning" className="text-sm font-medium text-brand hover:underline">
            Where we differ from Ninjacart, DeHaat, AgriBazaar, WayCool and Arya.ag — and where we do not →
          </Link>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-inksoft">Four ways in</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <Link key={r.href} href={r.href} className="rounded-xl border border-line bg-panel p-4 transition hover:border-brand">
              <h3 className="text-sm font-semibold">{r.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-inksoft">{r.body}</p>
              <span className="mt-3 inline-block text-xs font-medium text-brand">Sign in →</span>
            </Link>
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-inksoft">
          KrishiSetu is a student project name and is not affiliated with any government body. Mandi prices shown
          in the application come from the Government of India open data portal and are dated observations, not
          guaranteed floor prices. Demonstration accounts, listings and order history are synthetic and labelled
          as such.
        </p>
      </Shell>
    </>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : "text-inksoft"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

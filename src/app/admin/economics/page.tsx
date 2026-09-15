import { Nav, Shell } from "@/components/nav";
import { Card, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { kg, rupees } from "@/lib/money";

/**
 * The break-even screen exists so the shortfall is visible rather than hidden.
 * If the fee does not cover the variable cost, more orders make it worse, and
 * this page says so in those words.
 */
export default async function EconomicsPage() {
  await requireRole("ADMIN");

  const orders = await prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "BATCHED", "COLLECTED", "IN_TRANSIT", "READY_FOR_PICKUP", "DELIVERED"] } },
    include: { lines: true },
  });
  const batches = await prisma.batch.findMany({ where: { status: { notIn: ["CANCELLED"] } } });

  const completed = orders.filter((o) => o.status === "DELIVERED" || o.status === "READY_FOR_PICKUP");
  const n = completed.length || orders.length;

  const siteFee = orders.reduce((s, o) => s + o.siteFeePaise, 0);
  const farmerTotal = orders.reduce((s, o) => s + o.farmerProceedsPaise, 0);
  const buyerTotal = orders.reduce((s, o) => s + o.totalPaise, 0);
  const grams = orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);

  const quotedLogistics = orders.reduce((s, o) => s + o.logisticsPaise, 0);
  const actualTransport = batches.reduce((s, b) => s + b.transportCostPaise, 0);

  const feePerOrder = n ? Math.round(siteFee / n) : 0;
  const variablePerOrder = ECONOMICS.VARIABLE_PLATFORM_COST_PAISE_PER_ORDER;
  const contribution = feePerOrder - variablePerOrder;
  const breakEvenOrders = contribution > 0 ? Math.ceil(ECONOMICS.MONTHLY_FIXED_COST_PAISE / contribution) : null;

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Economics</h1>
        <p className="mt-1 max-w-3xl text-sm text-inksoft">
          Fulfilment pays for itself line by line, by construction. Fixed cost does not. This page reports both
          against the orders actually in the database, using the assumptions in{" "}
          <code className="rounded bg-panel2 px-1 text-xs">docs/UNIT_ECONOMICS.md</code>.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders counted" value={String(orders.length)} note={`${kg(grams)} of produce`} />
          <Stat label="Buyers pay" value={rupees(buyerTotal)} />
          <Stat
            label="Farmers receive"
            value={rupees(farmerTotal)}
            tone="good"
            note={buyerTotal ? `${((farmerTotal / buyerTotal) * 100).toFixed(0)}% of every rupee billed` : undefined}
          />
          <Stat label="Site fee, gross" value={rupees(siteFee)} note="Before payment processing, hosting and support" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card title="Break-even" subtitle="M ÷ (s − v), and only when s exceeds v">
            <dl className="tabular space-y-1.5 text-sm">
              <Row label="Site fee retained per order (s)" value={rupees(feePerOrder)} />
              <Row label="Variable platform cost per order (v)" value={rupees(variablePerOrder)} />
              <Row label="Contribution per order (s − v)" value={rupees(contribution)} strong />
              <Row label="Assumed monthly fixed cost (M)" value={rupees(ECONOMICS.MONTHLY_FIXED_COST_PAISE)} />
              <Row
                label="Orders per month to break even"
                value={breakEvenOrders ? breakEvenOrders.toLocaleString("en-IN") : "unreachable at this fee"}
                strong
              />
            </dl>

            {contribution <= 0 ? (
              <p className="mt-3 rounded-lg border border-danger/40 bg-dangersoft px-3 py-2.5 text-xs leading-relaxed text-danger">
                The fee retained per order does not cover the variable cost per order. More orders would increase
                the loss, not reduce it. The fee, the scope of service or the cost base has to change. Reducing the
                farmer&apos;s accepted proceeds is not one of the available levers.
              </p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-inksoft">
                At roughly {Math.round((breakEvenOrders ?? 0) / 8 / 4.3)} orders per cluster per run day, that is
                about {Math.max(1, Math.round((breakEvenOrders ?? 0) / 120 / 8))} clusters running twice a week. A
                single-cluster pilot covers its fulfilment cost but not this fixed cost, and that shortfall is real
                rather than an accounting artefact.
              </p>
            )}
          </Card>

          <Card title="Quoted against actual" subtitle="The buyer's price is held even when the run costs more">
            <dl className="tabular space-y-1.5 text-sm">
              <Row label="Logistics quoted to buyers" value={rupees(quotedLogistics)} />
              <Row label="Transport actually agreed with transporters" value={rupees(actualTransport)} />
              <Row
                label="Variance carried by the platform"
                value={rupees(quotedLogistics - actualTransport)}
                strong
              />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-inksoft">
              A negative variance is the platform absorbing a costlier run than it quoted. It is not passed back to
              the farmer and it is not billed to the buyer after the fact. Persistent negative variance means the
              quoted rate per kilogram in the configuration is wrong and should be corrected openly.
            </p>
            <SourceNote>
              Quoted rates are {rupees(ECONOMICS.QUOTED_LINE_HAUL_PAISE_PER_KG)}/kg line haul plus{" "}
              {rupees(ECONOMICS.QUOTED_CLUSTER_LEG_PAISE_PER_KG)}/kg for the cluster leg. Actual transport is the
              distance of the planned route at the transporter&apos;s own per-kilometre rate.
            </SourceNote>
          </Card>
        </div>

        <Card className="mt-5" title="What these figures are not">
          <ul className="space-y-2 text-sm leading-relaxed text-inksoft">
            <li>They are computed over synthetic demonstration orders, so they size the model rather than measure a business.</li>
            <li>No production cost is recorded for any farmer, so no column here is farming profit.</li>
            <li>Payment processing applies to the whole collected amount, so the site fee is gross revenue, not margin.</li>
            <li>Hosting, support, maps and messaging are inside the assumed fixed cost, not itemised per order.</li>
          </ul>
        </Card>
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

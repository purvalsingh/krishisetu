import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Stat, Stats } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { kg, rupees } from "@/lib/money";

/**
 * The break-even screen exists so a shortfall is visible rather than hidden. If
 * the fee does not cover the variable cost, more orders make it worse, and this
 * page says exactly that.
 */
export default async function EconomicsPage() {
  await requireRole("ADMIN");

  const orders = await prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "BATCHED", "COLLECTED", "IN_TRANSIT", "READY_FOR_PICKUP", "DELIVERED"] } },
    include: { lines: true },
  });
  const batches = await prisma.batch.findMany({ where: { status: { notIn: ["CANCELLED"] } } });

  const n = orders.length || 1;
  const siteFee = orders.reduce((s, o) => s + o.siteFeePaise, 0);
  const farmerTotal = orders.reduce((s, o) => s + o.farmerProceedsPaise, 0);
  const buyerTotal = orders.reduce((s, o) => s + o.totalPaise, 0);
  const grams = orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);

  const quotedLogistics = orders.reduce((s, o) => s + o.logisticsPaise, 0);
  const actualTransport = batches.reduce((s, b) => s + b.transportCostPaise, 0);
  const variance = quotedLogistics - actualTransport;

  const feePerOrder = Math.round(siteFee / n);
  const variablePerOrder = ECONOMICS.VARIABLE_PLATFORM_COST_PAISE_PER_ORDER;
  const contribution = feePerOrder - variablePerOrder;
  const breakEven = contribution > 0 ? Math.ceil(ECONOMICS.MONTHLY_FIXED_COST_PAISE / contribution) : null;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="OPERATOR DESK · ECONOMICS"
          title="Does this pay for itself?"
          subtitle="Fulfilment pays for itself line by line, by construction. Fixed cost does not. Both are reported below against the orders actually in the database."
        />

        <Stats count={4}>
          <Stat label="Orders counted" value={String(orders.length)} note={`${kg(grams)} of produce`} />
          <Stat label="Buyers pay" value={rupees(buyerTotal)} />
          <Stat
            label="Farmers receive"
            value={rupees(farmerTotal)}
            tone="positive"
            note={buyerTotal ? `${((farmerTotal / buyerTotal) * 100).toFixed(0)}% of every rupee billed` : undefined}
          />
          <Stat label="Site fee, gross" value={rupees(siteFee)} note="Before processing, hosting and support" />
        </Stats>

        <div className="two-col">
          <Card>
            <div className="eyebrow">BREAK-EVEN</div>
            <h2>M ÷ (s − v), and only when s exceeds v</h2>

            <dl className="definition">
              <dt>Site fee retained per order (s)</dt>
              <dd>{rupees(feePerOrder)}</dd>
              <dt>Variable platform cost per order (v)</dt>
              <dd>{rupees(variablePerOrder)}</dd>
              <dt>Contribution per order (s − v)</dt>
              <dd>{rupees(contribution)}</dd>
              <dt>Assumed monthly fixed cost (M)</dt>
              <dd>{rupees(ECONOMICS.MONTHLY_FIXED_COST_PAISE)}</dd>
              <dt>Orders per month to break even</dt>
              <dd>{breakEven ? breakEven.toLocaleString("en-IN") : "unreachable at this fee"}</dd>
            </dl>

            {contribution <= 0 ? (
              <div className="warning-box">
                The fee retained per order does not cover the variable cost per order. More orders would increase the
                loss, not reduce it. The fee, the scope of service or the cost base has to change. Reducing the
                farmer&apos;s accepted proceeds is not one of the available levers.
              </div>
            ) : (
              <p className="method" style={{ marginTop: 18 }}>
                At roughly 120 orders per cluster per run day, that is about{" "}
                {Math.max(1, Math.round((breakEven ?? 0) / 120 / 8))} clusters running twice a week. A single-cluster
                pilot covers its fulfilment cost but not this fixed cost, and that shortfall is real rather than an
                accounting artefact.
              </p>
            )}
          </Card>

          <Card>
            <div className="eyebrow">QUOTED AGAINST ACTUAL</div>
            <h2>The buyer&apos;s price is held even when the run costs more</h2>

            <div className="variance">
              <span>
                Logistics quoted to buyers <b>{rupees(quotedLogistics)}</b>
              </span>
              <span>
                Transport actually agreed with transporters <b>{rupees(actualTransport)}</b>
              </span>
              <span className={variance >= 0 ? "positive-text" : "warning-text"}>
                Variance carried by the platform <b>{rupees(variance)}</b>
              </span>
            </div>

            <p className="method" style={{ marginTop: 18 }}>
              A negative variance is the platform absorbing a costlier run than it quoted. It is not passed back to the
              farmer and it is not billed to the buyer after the fact. Persistent negative variance means the quoted
              rate per kilogram in the configuration is wrong and should be corrected openly.
            </p>

            <MicroNote>
              Quoted rates are {rupees(ECONOMICS.QUOTED_LINE_HAUL_PAISE_PER_KG)}/kg line haul plus{" "}
              {rupees(ECONOMICS.QUOTED_CLUSTER_LEG_PAISE_PER_KG)}/kg for the cluster leg. Actual transport is the
              planned route distance at the transporter&apos;s own per-kilometre rate.
            </MicroNote>
          </Card>
        </div>

        <Card>
          <div className="eyebrow">LIMITS</div>
          <h2>What these figures are not</h2>
          <div className="caveats">
            <span>Computed over synthetic demonstration orders, so they size the model rather than measure a business.</span>
            <span>No production cost is recorded for any farmer, so no column here is farming profit.</span>
            <span>Payment processing applies to the whole collected amount, so the site fee is gross revenue, not margin.</span>
            <span>Hosting, support, maps and messaging sit inside the assumed fixed cost, not itemised per order.</span>
          </div>
        </Card>
      </Shell>
      <Footer />
    </>
  );
}

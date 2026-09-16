import { notFound } from "next/navigation";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Stat, Stats, Status, TableWrap, Tag } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { kg, rupees } from "@/lib/money";

type Explanation = {
  lines: string[];
  rejections: { orderId: string; reason: string; detail?: string; buyer?: string }[];
  baselineDistanceKm: number | null;
  minimumFillFraction: number;
  feasible: boolean;
};

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      cluster: true,
      transporter: { include: { user: true } },
      stops: { orderBy: { seq: "asc" } },
      orders: {
        include: {
          customer: { include: { user: true } },
          lines: { include: { commodity: true, allocations: { include: { farmer: { include: { user: true } } } } } },
        },
      },
    },
  });
  if (!batch) notFound();

  const explanation = batch.explanation as unknown as Explanation;
  const farmerTotal = batch.orders.reduce((s, o) => s + o.farmerProceedsPaise, 0);
  const buyerTotal = batch.orders.reduce((s, o) => s + o.totalPaise, 0);
  const siteFeeTotal = batch.orders.reduce((s, o) => s + o.siteFeePaise, 0);
  const quotedLogistics = batch.orders.reduce((s, o) => s + o.logisticsPaise, 0);
  const variance = quotedLogistics - batch.transportCostPaise;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow={`RUN · VERSION ${batch.version}`}
          title={batch.cluster.name.replace(" pickup point", "")}
          subtitle={`${batch.windowDate.toISOString().slice(0, 10)} · ${batch.transporter ? `${batch.transporter.user.name}, ${batch.transporter.vehicleReg}` : "no transporter assigned"}`}
          action={
            <Status tone={batch.status === "COMPLETED" ? "good" : batch.status === "PROPOSED" ? "warning" : "pending"}>
              {batch.status.replaceAll("_", " ").toLowerCase()}
            </Status>
          }
        />

        <Stats count={4}>
          <Stat
            label="Fill"
            value={`${(batch.fillFraction * 100).toFixed(0)}%`}
            tone={batch.fillFraction >= ECONOMICS.MIN_FILL_FRACTION ? "positive" : "warning"}
            note={`${kg(batch.loadGrams)} of ${kg(batch.capacityGrams)} · minimum ${ECONOMICS.MIN_FILL_FRACTION * 100}%`}
          />
          <Stat
            label="Planned distance"
            value={`${batch.distanceKm} km`}
            note={explanation.baselineDistanceKm ? `Fixed-order baseline ${explanation.baselineDistanceKm} km` : undefined}
          />
          <Stat
            label="Transport cost"
            value={rupees(batch.transportCostPaise)}
            note={`Quoted to buyers ${rupees(quotedLogistics)}`}
            tone={variance >= 0 ? "positive" : "warning"}
          />
          <Stat label="Site fee collected" value={rupees(siteFeeTotal)} />
        </Stats>

        <div className="two-col">
          <Card>
            <div className="eyebrow">ENGINE EXPLANATION</div>
            <h2>Why this run looks like this</h2>
            <ul className="check-list">
              {explanation.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            {explanation.rejections.length > 0 && (
              <div className="left-out" style={{ marginTop: 18 }}>
                <b>Left out of this run</b>
                {explanation.rejections.slice(0, 12).map((r) => (
                  <span key={r.orderId}>
                    {r.buyer ?? r.orderId} — {r.reason}
                    {r.detail ? ` (${r.detail})` : ""}
                  </span>
                ))}
                {explanation.rejections.length > 12 && (
                  <span>and {explanation.rejections.length - 12} more with the same reasons.</span>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div className="eyebrow">ROUTE</div>
            <h2>Pickups in visiting order, then the drop</h2>
            {batch.stops.map((s) => (
              <div key={s.id} className="mini-stop">
                <b>{s.seq}</b>
                <span>
                  {s.label} <Tag tone={s.kind === "DROP" ? "green" : undefined}>{s.kind.toLowerCase()}</Tag>
                  <small>
                    {kg(s.grams)} · about {Math.floor(s.etaMinutes / 60)} h {s.etaMinutes % 60} min in · load after{" "}
                    {kg(s.loadAfterGrams)}
                    {s.handoverAt ? ` · handed over ${s.handoverAt.toISOString().slice(11, 16)}` : ""}
                  </small>
                </span>
              </div>
            ))}
            <MicroNote>
              Distances are straight-line with a 1.3 detour factor at an assumed {ECONOMICS.AVERAGE_SPEED_KMPH} km/h,
              not a live traffic estimate. The route is a feasible nearest-neighbour plan compared against a
              fixed-order baseline over the same stops; it is not claimed to be optimal.
            </MicroNote>
          </Card>
        </div>

        <Card>
          <div className="eyebrow">MONEY IN THIS RUN</div>
          <h2>Every rupee reconciled</h2>

          <div className="stats four inner-stats">
            <div className="stat">
              <div className="eyebrow">Buyers pay</div>
              <strong>{rupees(buyerTotal)}</strong>
            </div>
            <div className="stat positive">
              <div className="eyebrow">Farmers receive</div>
              <strong>{rupees(farmerTotal)}</strong>
              <small>{((farmerTotal / (buyerTotal || 1)) * 100).toFixed(0)}% of the buyer bill</small>
            </div>
            <div className="stat">
              <div className="eyebrow">Transporter receives</div>
              <strong>{rupees(batch.transportCostPaise)}</strong>
            </div>
            <div className={`stat ${variance >= 0 ? "positive" : "warning"}`}>
              <div className="eyebrow">Site fee less transport variance</div>
              <strong>{rupees(siteFeeTotal + Math.min(0, variance))}</strong>
              <small>Gross, before payment processing and fixed cost</small>
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>From farm</th>
                <th>Farmer receives</th>
              </tr>
            </thead>
            <tbody>
              {batch.orders.slice(0, 40).flatMap((o) =>
                o.lines.flatMap((l) =>
                  l.allocations.map((a) => (
                    <tr key={a.id}>
                      <td>{o.customer.user.name}</td>
                      <td>
                        {l.commodity.imageEmoji} {l.commodity.name}
                      </td>
                      <td>{kg(a.grams)}</td>
                      <td>
                        {a.farmer.user.name}, {a.farmer.village}
                      </td>
                      <td className="positive-text">{rupees(a.proceedsPaise)}</td>
                    </tr>
                  )),
                ),
              )}
            </tbody>
          </TableWrap>

          <MicroNote>
            One buyer line can be filled from several farms. Each farm&apos;s share is its own row, so the produce and
            the money both stay traceable to the farmer who grew it. Showing the first 40 orders of {batch.orders.length}.
          </MicroNote>
        </Card>
      </Shell>
      <Footer />
    </>
  );
}

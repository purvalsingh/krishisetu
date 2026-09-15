import { notFound } from "next/navigation";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, SourceNote, Stat } from "@/components/ui";
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

  return (
    <>
      <Nav />
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{batch.cluster.name}</h1>
            <p className="mt-1 text-sm text-inksoft">
              {batch.windowDate.toISOString().slice(0, 10)} · version {batch.version} ·{" "}
              {batch.transporter ? `${batch.transporter.user.name}, ${batch.transporter.vehicleReg}` : "no transporter assigned"}
            </p>
          </div>
          <Badge tone={batch.status === "COMPLETED" ? "good" : "brand"}>{batch.status.replaceAll("_", " ").toLowerCase()}</Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Fill"
            value={`${(batch.fillFraction * 100).toFixed(0)}%`}
            tone={batch.fillFraction >= ECONOMICS.MIN_FILL_FRACTION ? "good" : "bad"}
            note={`${kg(batch.loadGrams)} of ${kg(batch.capacityGrams)}, minimum ${ECONOMICS.MIN_FILL_FRACTION * 100}%`}
          />
          <Stat label="Planned distance" value={`${batch.distanceKm} km`} note={explanation.baselineDistanceKm ? `Fixed-order baseline ${explanation.baselineDistanceKm} km` : undefined} />
          <Stat
            label="Transport cost"
            value={rupees(batch.transportCostPaise)}
            note={`Quoted to buyers ${rupees(quotedLogistics)}`}
            tone={batch.transportCostPaise <= quotedLogistics ? "good" : "bad"}
          />
          <Stat label="Site fee collected" value={rupees(siteFeeTotal)} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card title="Why this run looks like this" subtitle="Accepted and rejected combinations, in the engine's own words">
            <ul className="space-y-2 text-sm leading-relaxed text-inksoft">
              {explanation.lines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {explanation.rejections.length > 0 && (
              <div className="mt-4 rounded-lg border border-line bg-panel2 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-inksoft">Left out of this run</h3>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {explanation.rejections.map((r) => (
                    <li key={r.orderId}>
                      <span className="font-medium">{r.buyer ?? r.orderId}</span>
                      <span className="text-inksoft"> — {r.reason}{r.detail ? ` (${r.detail})` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Route" subtitle="Pickups in visiting order, then the cluster drop">
            <ol className="space-y-2">
              {batch.stops.map((s) => (
                <li key={s.id} className="flex items-start gap-3 rounded-lg border border-line px-3 py-2">
                  <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs">
                    {s.seq}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {s.label} <Badge tone={s.kind === "DROP" ? "brand" : "neutral"}>{s.kind.toLowerCase()}</Badge>
                    </div>
                    <div className="tabular text-xs text-inksoft">
                      {kg(s.grams)} · arrives about {Math.floor(s.etaMinutes / 60)} h {s.etaMinutes % 60} min in · load after{" "}
                      {kg(s.loadAfterGrams)}
                      {s.handoverAt ? ` · handed over ${s.handoverAt.toISOString().slice(11, 16)}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <SourceNote>
              Distances are straight-line with a 1.3 detour factor and a {ECONOMICS.AVERAGE_SPEED_KMPH} km/h assumed
              average speed, not a live traffic estimate. The route is a feasible nearest-neighbour plan compared
              against a fixed-order baseline over the same stops; it is not claimed to be optimal.
            </SourceNote>
          </Card>
        </div>

        <Card className="mt-5" title="Money in this run" subtitle="Every rupee reconciled between buyer, farmer and transport">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Buyers pay" value={rupees(buyerTotal)} />
            <Stat label="Farmers receive" value={rupees(farmerTotal)} tone="good" note={`${((farmerTotal / (buyerTotal || 1)) * 100).toFixed(0)}% of the buyer bill`} />
            <Stat label="Transporter receives" value={rupees(batch.transportCostPaise)} />
            <Stat
              label="Site fee less transport variance"
              value={rupees(siteFeeTotal - Math.max(0, batch.transportCostPaise - quotedLogistics))}
              tone={siteFeeTotal - Math.max(0, batch.transportCostPaise - quotedLogistics) >= 0 ? "good" : "bad"}
              note="Gross, before payment processing and fixed cost"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="tabular w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-inksoft">
                <tr>
                  <th className="py-2 pr-4 font-medium">Buyer</th>
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium">Quantity</th>
                  <th className="py-2 pr-4 font-medium">From farm</th>
                  <th className="py-2 pr-4 font-medium">Farmer receives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {batch.orders.flatMap((o) =>
                  o.lines.flatMap((l) =>
                    l.allocations.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2 pr-4">{o.customer.user.name}</td>
                        <td className="py-2 pr-4">
                          {l.commodity.imageEmoji} {l.commodity.name}
                        </td>
                        <td className="py-2 pr-4">{kg(a.grams)}</td>
                        <td className="py-2 pr-4 text-inksoft">
                          {a.farmer.user.name}, {a.farmer.village}
                        </td>
                        <td className="py-2 pr-4 font-medium text-brand">{rupees(a.proceedsPaise)}</td>
                      </tr>
                    )),
                  ),
                )}
              </tbody>
            </table>
          </div>
          <SourceNote>
            One buyer line can be filled from several farms. Each farm&apos;s share is its own row so the produce and
            the money both stay traceable to the farmer who grew it.
          </SourceNote>
        </Card>
      </Shell>
    </>
  );
}

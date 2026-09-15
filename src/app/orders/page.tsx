import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { kg, rupees } from "@/lib/money";
import { ReportIssue } from "./report";

const STATUS_TONE = {
  DRAFT: "neutral",
  CONFIRMED: "brand",
  BATCHED: "brand",
  COLLECTED: "warn",
  IN_TRANSIT: "warn",
  READY_FOR_PICKUP: "good",
  DELIVERED: "good",
  CANCELLED: "bad",
} as const;

export default async function OrdersPage() {
  const session = await requireRole("CUSTOMER");
  const customer = await prisma.customerProfile.findUnique({ where: { userId: session.userId } });
  if (!customer) return null;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, status: { not: "DRAFT" } },
    include: {
      lines: { include: { commodity: true, allocations: { include: { farmer: { include: { user: true } } } } } },
      cluster: true,
      batch: { include: { transporter: { include: { user: true } }, stops: true } },
      qualityReports: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>

        {orders.length === 0 ? (
          <div className="mt-5">
            <Empty>
              No orders yet. <Link href="/market" className="text-brand">Browse today&apos;s produce →</Link>
            </Empty>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {orders.map((o) => {
              const farms = [
                ...new Set(o.lines.flatMap((l) => l.allocations.map((a) => `${a.farmer.user.name}, ${a.farmer.village}`))),
              ];
              return (
                <Card
                  key={o.id}
                  title={`${o.windowDate.toISOString().slice(0, 10)} · ${o.cluster.name}`}
                  subtitle={o.tier === "LAST_LEG" ? "Delivered to your door from the pickup point" : "Collect from the pickup point, 6 pm to 9 pm"}
                  action={<Badge tone={STATUS_TONE[o.status]}>{o.status.replaceAll("_", " ").toLowerCase()}</Badge>}
                >
                  <ul className="divide-y divide-line">
                    {o.lines.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                        <span className="text-sm">
                          {l.commodity.imageEmoji} {l.commodity.name} · {kg(l.grams)}
                        </span>
                        <span className="tabular text-sm">{rupees(Math.round((l.pricePaisePerKg * l.grams) / 1000))}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="tabular mt-3 space-y-1 border-t border-line pt-3 text-sm">
                    <div className="flex justify-between text-inksoft">
                      <dt>Farmer proceeds</dt>
                      <dd>{rupees(o.farmerProceedsPaise)}</dd>
                    </div>
                    <div className="flex justify-between text-inksoft">
                      <dt>Transport</dt>
                      <dd>{rupees(o.logisticsPaise)}</dd>
                    </div>
                    <div className="flex justify-between text-inksoft">
                      <dt>Packing, handling and pickup point</dt>
                      <dd>{rupees(o.handlingPaise)}</dd>
                    </div>
                    <div className="flex justify-between text-inksoft">
                      <dt>Site fee</dt>
                      <dd>{rupees(o.siteFeePaise)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <dt>Total</dt>
                      <dd>{rupees(o.totalPaise)}</dd>
                    </div>
                  </dl>

                  {farms.length > 0 && (
                    <p className="mt-3 text-xs text-inksoft">
                      Fulfilled from {farms.length} farm{farms.length > 1 ? "s" : ""}: {farms.join("; ")}.
                    </p>
                  )}
                  {o.qualityReports.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {o.qualityReports.map((r) => (
                        <li key={r.id} className="rounded-lg border border-line bg-panel2 px-3 py-2 text-xs">
                          <span className="font-medium">{r.reason.replaceAll("_", " ").toLowerCase()}</span>{" "}
                          <Badge tone={r.status === "OPEN" ? "warn" : r.status === "RESOLVED" ? "good" : "neutral"}>
                            {r.status.toLowerCase()}
                          </Badge>
                          <p className="mt-1 text-inksoft">{r.description}</p>
                          {r.resolutionNote && (
                            <p className="mt-1 text-inksoft">
                              Outcome: {r.resolutionNote}
                              {r.buyerRefundPaise > 0 ? ` · refund ${rupees(r.buyerRefundPaise)}` : ""}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    ["READY_FOR_PICKUP", "DELIVERED", "COLLECTED"].includes(o.status) && <ReportIssue orderId={o.id} />
                  )}

                  {o.batch && (
                    <p className="mt-1 text-xs text-inksoft">
                      Run version {o.batch.version} ·{" "}
                      {o.batch.transporter ? `${o.batch.transporter.user.name}, ${o.batch.transporter.vehicleReg}` : "transporter not yet assigned"} ·{" "}
                      {o.batch.stops.length} stops · {o.batch.distanceKm} km
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <SourceNote>
          An order may be filled from more than one farm. The grade you chose is honoured, and the farms that
          supplied it are named above once the run is planned.
        </SourceNote>
      </Shell>
    </>
  );
}

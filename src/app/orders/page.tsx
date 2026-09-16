import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Status, Tag } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clusterFill } from "@/lib/market";
import { ShareRun } from "@/components/share-run";
import { kg, rupees } from "@/lib/money";
import { ReportIssue } from "./report";

const STATUS_TONE = {
  DRAFT: "pending",
  CONFIRMED: "pending",
  BATCHED: "pending",
  COLLECTED: "warning",
  IN_TRANSIT: "warning",
  READY_FOR_PICKUP: "good",
  DELIVERED: "good",
  CANCELLED: "warning",
} as const;

export default async function OrdersPage() {
  const session = await requireRole("CUSTOMER");
  const customer = await prisma.customerProfile.findUnique({ where: { userId: session.userId } });
  if (!customer) return null;

  const next = await prisma.order.findFirst({
    where: { customerId: customer.id, status: { in: ["CONFIRMED", "BATCHED"] } },
    include: { cluster: true },
    orderBy: { windowDate: "asc" },
  });
  const fill = next ? await clusterFill(next.clusterId, next.windowDate) : null;

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
        <PageTitle
          eyebrow="HOUSEHOLD BUYER · ORDERS"
          title="My orders"
          subtitle="Every order shows the four lines it is made of, and names the farms that filled it once the run is planned."
        />

        {next && fill && (
          <ShareRun
            clusterId={next.clusterId}
            clusterName={next.cluster.name}
            fraction={fill.fraction}
            shortfallKg={kg(fill.shortfallGrams)}
            willGo={fill.willGo}
            minimumPercent={fill.minimumFillFraction * 100}
          />
        )}

        {orders.length === 0 ? (
          <div className="empty">
            <span>📦</span>
            <h2>No orders yet</h2>
            <p>Your confirmed orders and their bills will appear here.</p>
            <Link href="/market" className="btn btn-primary">
              Browse produce
            </Link>
          </div>
        ) : (
          orders.map((o) => {
            const farms = [
              ...new Set(o.lines.flatMap((l) => l.allocations.map((a) => `${a.farmer.user.name}, ${a.farmer.village}`))),
            ];
            return (
              <Card key={o.id} className="order-card">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">
                      {o.windowDate.toISOString().slice(0, 10)} · {o.cluster.name.replace(" pickup point", "")}
                    </div>
                    <h2>
                      {o.tier === "LAST_LEG" ? "Delivered to your door" : "Collect from the pickup point, 6 pm to 9 pm"}
                    </h2>
                  </div>
                  <Status tone={STATUS_TONE[o.status]}>{o.status.replaceAll("_", " ").toLowerCase()}</Status>
                </div>

                <div className="order-items">
                  {o.lines.map((l) => (
                    <span key={l.id}>
                      <span>
                        {l.commodity.imageEmoji} {l.commodity.name} · {kg(l.grams)}
                      </span>
                      <b>{rupees(Math.round((l.pricePaisePerKg * l.grams) / 1000))}</b>
                    </span>
                  ))}
                </div>

                <div className="order-bill">
                  <span>
                    Farmer proceeds <b>{rupees(o.farmerProceedsPaise)}</b>
                  </span>
                  <span>
                    Transport <b>{rupees(o.logisticsPaise)}</b>
                  </span>
                  <span>
                    Packing, handling and pickup point <b>{rupees(o.handlingPaise)}</b>
                  </span>
                  <span>
                    Site fee <b>{rupees(o.siteFeePaise)}</b>
                  </span>
                  <strong>
                    Total <b>{rupees(o.totalPaise)}</b>
                  </strong>
                </div>

                {farms.length > 0 && (
                  <p className="micro-note">
                    Fulfilled from {farms.length} farm{farms.length > 1 ? "s" : ""}: {farms.join("; ")}.
                    {o.batch
                      ? ` Run version ${o.batch.version} · ${o.batch.transporter ? `${o.batch.transporter.user.name}, ${o.batch.transporter.vehicleReg}` : "transporter not yet assigned"} · ${o.batch.stops.length} stops · ${o.batch.distanceKm} km.`
                      : ""}
                  </p>
                )}

                {o.qualityReports.length > 0 ? (
                  o.qualityReports.map((r) => (
                    <div key={r.id} className="complaint-text">
                      <Tag tone={r.status === "OPEN" ? "amber" : "green"}>{r.reason.replaceAll("_", " ").toLowerCase()}</Tag>{" "}
                      <Tag>{r.status.toLowerCase()}</Tag>
                      <p style={{ margin: "8px 0 0" }}>{r.description}</p>
                      {r.resolutionNote && (
                        <p className="micro-note" style={{ marginTop: 8 }}>
                          Outcome: {r.resolutionNote}
                          {r.buyerRefundPaise > 0 ? ` · refund ${rupees(r.buyerRefundPaise)}` : ""}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  ["READY_FOR_PICKUP", "DELIVERED", "COLLECTED"].includes(o.status) && <ReportIssue orderId={o.id} />
                )}
              </Card>
            );
          })
        )}

        <MicroNote>
          A photograph and a handover record are evidence, not a verdict. A complaint is resolved by a person, and any
          refund or adjustment is written down with its reason.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

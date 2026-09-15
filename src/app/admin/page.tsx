import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { nextWindow } from "@/lib/market";
import { kg, rupees } from "@/lib/money";
import { planRunAction, releaseBatchAction } from "@/app/actions/ops";

export default async function AdminHome() {
  await requireRole("ADMIN");

  const window = nextWindow();
  const [clusters, transporters, pending, batches] = await Promise.all([
    prisma.cluster.findMany({ orderBy: { name: "asc" } }),
    prisma.transporterProfile.findMany({ include: { user: true } }),
    prisma.order.findMany({
      where: { status: "CONFIRMED", batchId: null },
      include: { lines: true, cluster: true, customer: { include: { user: true } } },
    }),
    prisma.batch.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      include: { cluster: true, transporter: { include: { user: true } }, orders: true, stops: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const pendingByCluster = clusters.map((c) => {
    const orders = pending.filter((o) => o.clusterId === c.id);
    const grams = orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);
    // Preview the fill against the vehicle that would actually be hired: the
    // smallest one that can carry the waiting load.
    const capacities = transporters.map((t) => t.capacityGrams).sort((a, b) => a - b);
    const bestFit = capacities.find((c) => c >= grams) ?? capacities.at(-1) ?? 0;
    return { cluster: c, orders, grams, fill: bestFit ? grams / bestFit : 0, largest: bestFit };
  });

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="mt-1 max-w-3xl text-sm text-inksoft">
          Plan one run per cluster per window. A run is only worth dispatching above{" "}
          {ECONOMICS.MIN_FILL_FRACTION * 100}% of vehicle capacity; below that the orders are held and rolled to the
          next window rather than delivered at a loss.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Orders waiting to be planned" value={String(pending.length)} />
          <Stat label="Quantity waiting" value={kg(pending.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0))} />
          <Stat label="Next window" value={window.toISOString().slice(0, 10)} note="06:00 UTC collection start" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {pendingByCluster.map(({ cluster, orders, grams, fill, largest }) => {
            const ready = fill >= ECONOMICS.MIN_FILL_FRACTION;
            return (
              <Card key={cluster.id} title={cluster.name} subtitle={`Host: ${cluster.hostName}`}>
                <div className="tabular text-sm">
                  <div className="flex justify-between">
                    <span className="text-inksoft">Waiting orders</span>
                    <span>{orders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-inksoft">Quantity</span>
                    <span>{kg(grams)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-inksoft">Fill against {kg(largest)} vehicle</span>
                    <span className={ready ? "font-semibold text-brand" : "font-semibold text-accent"}>
                      {(fill * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, fill * 100)}%`,
                      background: ready ? "var(--brand)" : "var(--accent)",
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-inksoft">
                  {ready
                    ? "Above the minimum fill. This run pays for itself."
                    : `Below the ${ECONOMICS.MIN_FILL_FRACTION * 100}% threshold. Planning it will show the shortfall and hold the run.`}
                </p>

                <form action={planRunAction} className="mt-3 space-y-2">
                  <input type="hidden" name="clusterId" value={cluster.id} />
                  <input type="hidden" name="windowDate" value={window.toISOString()} />
                  <select
                    name="transporterId"
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
                    defaultValue=""
                  >
                    <option value="">Choose the vehicle automatically</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user.name} · {t.vehicleType} · {kg(t.capacityGrams)}
                        {t.refrigerated ? " · refrigerated" : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={orders.length === 0}
                    className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    Plan this run
                  </button>
                </form>
              </Card>
            );
          })}
        </div>

        <Card className="mt-5" title="Planned and running">
          {batches.length === 0 ? (
            <Empty>No run has been planned yet. Plan one above to see the accepted and rejected orders.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabular w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-inksoft">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Cluster</th>
                    <th className="py-2 pr-4 font-medium">Window</th>
                    <th className="py-2 pr-4 font-medium">Orders</th>
                    <th className="py-2 pr-4 font-medium">Load</th>
                    <th className="py-2 pr-4 font-medium">Fill</th>
                    <th className="py-2 pr-4 font-medium">Stops</th>
                    <th className="py-2 pr-4 font-medium">Distance</th>
                    <th className="py-2 pr-4 font-medium">Transport</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2 pr-4">
                        <Link href={`/admin/batches/${b.id}`} className="text-brand hover:underline">
                          {b.cluster.name.replace(" pickup point", "")}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-inksoft">{b.windowDate.toISOString().slice(0, 10)}</td>
                      <td className="py-2 pr-4">{b.orders.length}</td>
                      <td className="py-2 pr-4">{kg(b.loadGrams)}</td>
                      <td className={`py-2 pr-4 ${b.fillFraction >= ECONOMICS.MIN_FILL_FRACTION ? "text-brand" : "text-accent"}`}>
                        {(b.fillFraction * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 pr-4">{b.stops.length}</td>
                      <td className="py-2 pr-4">{b.distanceKm} km</td>
                      <td className="py-2 pr-4">{rupees(b.transportCostPaise)}</td>
                      <td className="py-2 pr-4">
                        <Badge tone={b.status === "COMPLETED" ? "good" : b.status === "PROPOSED" ? "warn" : "brand"}>
                          {b.status.replaceAll("_", " ").toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {!b.dispatchedAt && b.status !== "COMPLETED" && (
                          <form action={releaseBatchAction}>
                            <input type="hidden" name="batchId" value={b.id} />
                            <button className="rounded-lg border border-line px-2.5 py-1 text-xs hover:bg-panel2">
                              Release
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <SourceNote>
            Releasing a run returns every reserved kilogram to its listing and puts the orders back in the queue. A
            run that has already been dispatched cannot be released this way; it needs an operator exception with a
            recorded reason.
          </SourceNote>
        </Card>
      </Shell>
    </>
  );
}

import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, Empty, MicroNote, PageTitle, Status, TableWrap } from "@/components/ui";
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
      include: { lines: true },
    }),
    prisma.batch.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      include: { cluster: true, transporter: { include: { user: true } }, orders: true, stops: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const capacities = transporters.map((t) => t.capacityGrams).sort((a, b) => a - b);
  const waitingGrams = pending.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="OPERATOR DESK · RUN PLANNING"
          title="Plan the next shared run"
          subtitle={`Orders fit first. The vehicle moves only when the load is worth moving: below ${ECONOMICS.MIN_FILL_FRACTION * 100}% of capacity the run is held and the orders roll to the next window, rather than being delivered at a loss.`}
          action={
            batches[0] ? (
              <Link href={`/admin/batches/${batches[0].id}`} className="btn btn-primary">
                Open planned run <Arrow />
              </Link>
            ) : undefined
          }
        />

        <div className="stats three">
          <div className="stat">
            <div className="eyebrow">Orders waiting</div>
            <strong>{pending.length}</strong>
          </div>
          <div className="stat">
            <div className="eyebrow">Quantity waiting</div>
            <strong>{kg(waitingGrams)}</strong>
          </div>
          <div className="stat">
            <div className="eyebrow">Next window</div>
            <strong>
              {window.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
            </strong>
            <small>06:00 UTC collection start</small>
          </div>
        </div>

        <div className="cluster-grid">
          {clusters.map((cluster) => {
            const orders = pending.filter((o) => o.clusterId === cluster.id);
            const grams = orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);
            // Preview the fill against the vehicle that would actually be hired:
            // the smallest one that can carry the waiting load.
            const bestFit = capacities.find((c) => c >= grams) ?? capacities.at(-1) ?? 0;
            const fill = bestFit ? grams / bestFit : 0;
            const ready = fill >= ECONOMICS.MIN_FILL_FRACTION;

            return (
              <Card key={cluster.id} className={`cluster ${ready ? "" : "held-card"}`.trim()}>
                <div className="eyebrow">CLUSTER</div>
                <h2>{cluster.name.replace(" pickup point", "")}</h2>
                <p>
                  Host: <span>{cluster.hostName}</span> · {orders.length} waiting orders · {kg(grams)}
                </p>

                <div className="fill-line">
                  <span>Fill against {kg(bestFit)} vehicle</span>
                  <b>{(fill * 100).toFixed(0)}%</b>
                </div>
                <div className="progress">
                  <i className={ready ? "" : "amber-fill"} style={{ width: `${Math.min(100, fill * 100)}%` }} />
                </div>

                <p className={ready ? "positive-text" : "warning-text"}>
                  {ready
                    ? "Above the minimum fill. This run pays for itself."
                    : `Below the ${ECONOMICS.MIN_FILL_FRACTION * 100}% threshold. Planning it will show the shortfall and hold the run.`}
                </p>

                <form action={planRunAction}>
                  <input type="hidden" name="clusterId" value={cluster.id} />
                  <input type="hidden" name="windowDate" value={window.toISOString()} />
                  <select name="transporterId" defaultValue="">
                    <option value="">Choose the vehicle automatically</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user.name} · {t.vehicleType} · {kg(t.capacityGrams)}
                        {t.refrigerated ? " · refrigerated" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary" disabled={orders.length === 0}>
                    Plan this run
                  </button>
                </form>
              </Card>
            );
          })}
        </div>

        <Card>
          <div className="eyebrow">PLANNED AND RUNNING</div>
          <h2>Every run and what it carries</h2>

          {batches.length === 0 ? (
            <Empty icon="🚚">No run has been planned yet. Plan one above to see the accepted and rejected orders.</Empty>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Window</th>
                  <th>Orders</th>
                  <th>Load</th>
                  <th>Fill</th>
                  <th>Stops</th>
                  <th>Distance</th>
                  <th>Transport</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/batches/${b.id}`} className="text-link">
                        {b.cluster.name.replace(" pickup point", "")}
                      </Link>
                    </td>
                    <td>{b.windowDate.toISOString().slice(0, 10)}</td>
                    <td>{b.orders.length}</td>
                    <td>{kg(b.loadGrams)}</td>
                    <td className={b.fillFraction >= ECONOMICS.MIN_FILL_FRACTION ? "positive-text" : "warning-text"}>
                      {(b.fillFraction * 100).toFixed(0)}%
                    </td>
                    <td>{b.stops.length}</td>
                    <td>{b.distanceKm} km</td>
                    <td>{rupees(b.transportCostPaise)}</td>
                    <td>
                      <Status tone={b.status === "COMPLETED" ? "good" : b.status === "PROPOSED" ? "warning" : "pending"}>
                        {b.status.replaceAll("_", " ").toLowerCase()}
                      </Status>
                    </td>
                    <td>
                      {!b.dispatchedAt && b.status !== "COMPLETED" && (
                        <form action={releaseBatchAction}>
                          <input type="hidden" name="batchId" value={b.id} />
                          <button className="text-btn danger">Release</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}

          <MicroNote>
            Releasing a run returns every reserved kilogram to its listing and puts the orders back in the queue. A run
            already dispatched cannot be released this way; it needs an operator exception with a recorded reason.
          </MicroNote>
        </Card>
      </Shell>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { kg, rupees } from "@/lib/money";
import { acceptRunAction } from "@/app/actions/ops";

export default async function TransporterHome() {
  const session = await requireRole("TRANSPORTER");
  const profile = await prisma.transporterProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });
  if (!profile) return null;

  const batches = await prisma.batch.findMany({
    where: { transporterId: profile.id, status: { notIn: ["CANCELLED"] } },
    include: { cluster: true, stops: { orderBy: { seq: "asc" } }, orders: true },
    orderBy: [{ windowDate: "asc" }, { createdAt: "desc" }],
  });

  const offered = batches.filter((b) => b.status === "AWAITING_TRANSPORTER" || b.status === "PROPOSED");
  const mine = batches.filter((b) => ["ACCEPTED", "DISPATCHED"].includes(b.status));
  const done = batches.filter((b) => b.status === "COMPLETED");
  const earned = done.reduce((s, b) => s + b.transportCostPaise, 0);

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">{profile.user.name}</h1>
        <p className="mt-1 text-sm text-inksoft">
          {profile.vehicleType} · {profile.vehicleReg} · {kg(profile.capacityGrams)} capacity ·{" "}
          {rupees(profile.ratePaisePerKm)}/km{profile.refrigerated ? " · refrigerated" : ""}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Runs offered to me" value={String(offered.length)} />
          <Stat label="Runs in hand" value={String(mine.length)} />
          <Stat label="Earned on completed runs" value={rupees(earned)} tone="good" />
        </div>

        <Card className="mt-5" title="Offered runs" subtitle="Distance, load and payment are known before you accept">
          {offered.length === 0 ? (
            <Empty>No run is waiting for you. The operator plans runs once enough orders share a cluster.</Empty>
          ) : (
            <ul className="space-y-3">
              {offered.map((b) => {
                const belowFill = b.fillFraction < ECONOMICS.MIN_FILL_FRACTION;
                return (
                  <li key={b.id} className="rounded-lg border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{b.cluster.name}</div>
                        <div className="tabular text-xs text-inksoft">
                          {b.windowDate.toISOString().slice(0, 10)} · {b.stops.filter((s) => s.kind === "PICKUP").length} farm
                          pickups, one drop · {kg(b.loadGrams)} · {b.distanceKm} km · {b.orders.length} buyer orders
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular text-sm font-semibold">{rupees(b.transportCostPaise)}</span>
                        {belowFill ? (
                          <Badge tone="warn">held below minimum fill</Badge>
                        ) : (
                          <form action={acceptRunAction}>
                            <input type="hidden" name="batchId" value={b.id} />
                            <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                              Accept this run
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <SourceNote>
            Payment is the planned route distance at your own per-kilometre rate. A run held below{" "}
            {ECONOMICS.MIN_FILL_FRACTION * 100}% fill is not offered for acceptance, because a half-empty trip does
            not pay for itself for you either.
          </SourceNote>
        </Card>

        {mine.length > 0 && (
          <Card className="mt-5" title="Runs in hand">
            <ul className="space-y-3">
              {mine.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
                  <div>
                    <div className="text-sm font-medium">{b.cluster.name}</div>
                    <div className="tabular text-xs text-inksoft">
                      {b.windowDate.toISOString().slice(0, 10)} · {b.stops.length} stops · {kg(b.loadGrams)} ·{" "}
                      {b.distanceKm} km
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={b.status === "DISPATCHED" ? "warn" : "brand"}>{b.status.toLowerCase()}</Badge>
                    <Link href={`/transporter/runs/${b.id}`} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-panel2">
                      Open run sheet
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {done.length > 0 && (
          <Card className="mt-5" title="Completed">
            <ul className="divide-y divide-line">
              {done.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm first:pt-0">
                  <span>
                    {b.cluster.name} · {b.windowDate.toISOString().slice(0, 10)}
                  </span>
                  <span className="tabular font-medium">{rupees(b.transportCostPaise)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Shell>
    </>
  );
}

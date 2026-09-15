import { notFound } from "next/navigation";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { kg, rupees } from "@/lib/money";
import { completeRunAction, dispatchRunAction, recordHandoverAction } from "@/app/actions/ops";

export default async function RunSheet({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("TRANSPORTER");
  const { id } = await params;

  const profile = await prisma.transporterProfile.findUnique({ where: { userId: session.userId } });
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      cluster: true,
      stops: { orderBy: { seq: "asc" } },
      orders: { include: { customer: { include: { user: true } }, lines: { include: { commodity: true } } } },
    },
  });
  if (!batch || !profile || batch.transporterId !== profile.id) notFound();

  const dispatched = batch.status === "DISPATCHED";
  const allHandedOver = batch.stops.every((s) => s.handoverAt);

  return (
    <>
      <Nav />
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{batch.cluster.name}</h1>
            <p className="mt-1 text-sm text-inksoft">
              {batch.windowDate.toISOString().slice(0, 10)} · {batch.stops.length} stops · run version {batch.version}
            </p>
          </div>
          <Badge tone={batch.status === "COMPLETED" ? "good" : dispatched ? "warn" : "brand"}>
            {batch.status.replaceAll("_", " ").toLowerCase()}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Stat label="Load" value={kg(batch.loadGrams)} note={`${(batch.fillFraction * 100).toFixed(0)}% of your vehicle`} />
          <Stat label="Distance" value={`${batch.distanceKm} km`} />
          <Stat label="You receive" value={rupees(batch.transportCostPaise)} tone="good" />
          <Stat label="Buyer orders" value={String(batch.orders.length)} />
        </div>

        {batch.status === "ACCEPTED" && (
          <form action={dispatchRunAction} className="mt-5">
            <input type="hidden" name="batchId" value={batch.id} />
            <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Start this run
            </button>
            <p className="mt-2 text-xs text-inksoft">
              Once the run starts, the allocation is frozen. A cancellation or a shortage after this point needs the
              operator, and both the change and the reason are recorded.
            </p>
          </form>
        )}

        <Card className="mt-5" title="Stops in order">
          <ol className="space-y-2">
            {batch.stops.map((s) => (
              <li key={s.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs">
                      {s.seq}
                    </span>
                    <div>
                      <div className="text-sm font-medium">
                        {s.label} <Badge tone={s.kind === "DROP" ? "brand" : "neutral"}>{s.kind.toLowerCase()}</Badge>
                      </div>
                      <div className="tabular text-xs text-inksoft">
                        {kg(s.grams)} · arrives about {Math.floor(s.etaMinutes / 60)} h {s.etaMinutes % 60} min in · load
                        after {kg(s.loadAfterGrams)} ·{" "}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=15/${s.lat}/${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline"
                        >
                          map
                        </a>
                      </div>
                      {s.handoverNote && <p className="mt-1 text-xs text-inksoft">{s.handoverNote}</p>}
                    </div>
                  </div>

                  {s.handoverAt ? (
                    <Badge tone="good">recorded {s.handoverAt.toISOString().slice(11, 16)}</Badge>
                  ) : dispatched ? (
                    <form action={recordHandoverAction} className="flex items-center gap-2">
                      <input type="hidden" name="stopId" value={s.id} />
                      <input
                        name="note"
                        placeholder="Weight agreed, any shortage"
                        className="w-48 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                      />
                      <button className="rounded-lg border border-line px-2.5 py-1.5 text-xs hover:bg-panel2">
                        Record handover
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-inksoft">start the run to record handovers</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <SourceNote>
            A handover record is evidence of what was collected and when. It is not an automatic guarantee of grade
            or weight; a dispute still needs a person to resolve it.
          </SourceNote>
        </Card>

        <Card className="mt-5" title="What is on board, by buyer">
          <ul className="divide-y divide-line">
            {batch.orders.map((o) => (
              <li key={o.id} className="py-2.5 first:pt-0">
                <div className="text-sm font-medium">
                  {o.customer.user.name}{" "}
                  <Badge tone={o.tier === "LAST_LEG" ? "warn" : "neutral"}>
                    {o.tier === "LAST_LEG" ? "door delivery" : "collects at the point"}
                  </Badge>
                </div>
                <div className="tabular text-xs text-inksoft">
                  {o.lines.map((l) => `${l.commodity.name} ${kg(l.grams)}`).join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {dispatched && (
          <form action={completeRunAction} className="mt-5">
            <input type="hidden" name="batchId" value={batch.id} />
            <button
              disabled={!allHandedOver}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Complete the run
            </button>
            <p className="mt-2 text-xs text-inksoft">
              {allHandedOver
                ? "Completing the run marks every buyer order ready and releases each farmer's amount for settlement."
                : "Record a handover at every stop before completing the run."}
            </p>
          </form>
        )}
      </Shell>
    </>
  );
}

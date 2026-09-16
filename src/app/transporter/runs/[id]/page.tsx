import { notFound } from "next/navigation";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, MicroNote, PageTitle, Stat, Stats, Status, Tag } from "@/components/ui";
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
        <PageTitle
          eyebrow={`RUN SHEET · VERSION ${batch.version}`}
          title={batch.cluster.name.replace(" pickup point", "")}
          subtitle={`${batch.windowDate.toISOString().slice(0, 10)} · ${batch.stops.length} stops · ${batch.orders.length} buyer orders`}
          action={
            <Status tone={batch.status === "COMPLETED" ? "good" : dispatched ? "warning" : "pending"}>
              {batch.status.replaceAll("_", " ").toLowerCase()}
            </Status>
          }
        />

        <Stats count={4}>
          <Stat label="Load" value={kg(batch.loadGrams)} note={`${(batch.fillFraction * 100).toFixed(0)}% of your vehicle`} />
          <Stat label="Distance" value={`${batch.distanceKm} km`} />
          <Stat label="You receive" value={rupees(batch.transportCostPaise)} tone="positive" />
          <Stat label="Buyer orders" value={String(batch.orders.length)} />
        </Stats>

        {batch.status === "ACCEPTED" && (
          <Card>
            <div className="eyebrow">BEFORE YOU START</div>
            <h2>Starting the run freezes the allocation</h2>
            <p className="method">
              After dispatch, a cancellation or a shortage needs the operator, and both the change and its reason are
              recorded. Nothing is quietly rewritten once a journey is under way.
            </p>
            <form action={dispatchRunAction} style={{ marginTop: 18 }}>
              <input type="hidden" name="batchId" value={batch.id} />
              <button className="btn btn-primary">
                Start this run <Arrow />
              </button>
            </form>
          </Card>
        )}

        <Card className="run-stops">
          <div className="eyebrow">STOPS IN ORDER</div>
          <h2>Pickups first, then the cluster drop</h2>

          {batch.stops.map((s) => (
            <div key={s.id} className="stop">
              <div className="stop-number">{s.seq}</div>
              <div>
                <div className="stop-head">
                  <h2>{s.label}</h2>
                  <Tag tone={s.kind === "DROP" ? "green" : undefined}>{s.kind.toLowerCase()}</Tag>
                </div>
                <p>
                  {kg(s.grams)} · arrives about {Math.floor(s.etaMinutes / 60)} h {s.etaMinutes % 60} min in · load after{" "}
                  {kg(s.loadAfterGrams)} ·{" "}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=15/${s.lat}/${s.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    map
                  </a>
                </p>
                {s.handoverNote && <p>{s.handoverNote}</p>}
              </div>

              <div className="handover">
                {s.handoverAt ? (
                  <Status tone="good">recorded {s.handoverAt.toISOString().slice(11, 16)}</Status>
                ) : dispatched ? (
                  <form action={recordHandoverAction} className="report-form">
                    <input type="hidden" name="stopId" value={s.id} />
                    <input name="note" placeholder="Weight agreed, any shortage" />
                    <button className="btn btn-secondary">Record handover</button>
                  </form>
                ) : (
                  <span className="method">start the run to record handovers</span>
                )}
              </div>
            </div>
          ))}

          <MicroNote>
            A handover record is evidence of what was collected and when. It is not an automatic guarantee of grade or
            weight; a dispute still needs a person to resolve it.
          </MicroNote>
        </Card>

        <Card>
          <div className="eyebrow">ON BOARD</div>
          <h2>What is loaded, by buyer</h2>
          {batch.orders.map((o) => (
            <div key={o.id} className="mini-stop">
              <b>·</b>
              <span>
                {o.customer.user.name}{" "}
                <Tag tone={o.tier === "LAST_LEG" ? "amber" : undefined}>
                  {o.tier === "LAST_LEG" ? "door delivery" : "collects at the point"}
                </Tag>
                <small>{o.lines.map((l) => `${l.commodity.name} ${kg(l.grams)}`).join(" · ")}</small>
              </span>
            </div>
          ))}
        </Card>

        {dispatched && (
          <Card>
            <div className="eyebrow">FINISH</div>
            <h2>Complete the run</h2>
            <p className="method">
              {allHandedOver
                ? "Completing marks every buyer order ready and releases each farmer's amount for settlement."
                : "Record a handover at every stop before completing the run."}
            </p>
            <form action={completeRunAction} style={{ marginTop: 18 }}>
              <input type="hidden" name="batchId" value={batch.id} />
              <button className="btn btn-primary" disabled={!allHandedOver}>
                Complete the run <Arrow />
              </button>
            </form>
          </Card>
        )}
      </Shell>
      <Footer />
    </>
  );
}

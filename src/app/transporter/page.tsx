import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, Empty, MicroNote, PageTitle, SectionHead, Stat, Stats, Status } from "@/components/ui";
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
  const inHand = batches.filter((b) => ["ACCEPTED", "DISPATCHED"].includes(b.status));
  const done = batches.filter((b) => b.status === "COMPLETED");
  const earned = done.reduce((s, b) => s + b.transportCostPaise, 0);

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="TRANSPORTER DESK"
          title={profile.user.name}
          subtitle={`${profile.vehicleType} · ${profile.vehicleReg} · ${kg(profile.capacityGrams)} capacity · ${rupees(profile.ratePaisePerKm)}/km${profile.refrigerated ? " · refrigerated" : ""}`}
          action={
            inHand[0] ? (
              <Link href={`/transporter/runs/${inHand[0].id}`} className="btn btn-secondary">
                Open run sheet <Arrow />
              </Link>
            ) : undefined
          }
        />

        <Stats count={3}>
          <Stat label="Runs offered" value={String(offered.length)} />
          <Stat label="Runs in hand" value={String(inHand.length)} tone="positive" />
          <Stat label="Earned on completed runs" value={rupees(earned)} />
        </Stats>

        {offered.length === 0 && inHand.length === 0 && (
          <Empty icon="🚚">No run is waiting for you. The operator plans runs once enough orders share a cluster.</Empty>
        )}

        {offered.map((b) => {
          const held = b.fillFraction < ECONOMICS.MIN_FILL_FRACTION;
          const pickups = b.stops.filter((s) => s.kind === "PICKUP").length;

          return held ? (
            <Card key={b.id} className="held-card">
              <SectionHead
                eyebrow={`HELD RUN · ${b.cluster.name.replace(" pickup point", "").toUpperCase()}`}
                title="Below minimum vehicle fill"
                action={<Status tone="warning">Held · {(b.fillFraction * 100).toFixed(0)}% fill</Status>}
              />
              <p>
                {kg(b.loadGrams)} across {b.orders.length} orders. This run is not dispatched, because a half-empty
                trip does not pay for itself for you either. The orders roll to the next window.
              </p>
            </Card>
          ) : (
            <Card key={b.id} className="offer-card">
              <SectionHead
                eyebrow={`OFFERED RUN · ${b.cluster.name.replace(" pickup point", "").toUpperCase()}`}
                title={`${b.windowDate.toISOString().slice(0, 10)} · ${pickups} farm pickups, one drop`}
                action={<Status tone="good">Above minimum fill</Status>}
              />

              <div className="offer-grid">
                <div>
                  <b>{kg(b.loadGrams)}</b>
                  <small>load</small>
                </div>
                <div>
                  <b>{b.distanceKm} km</b>
                  <small>distance</small>
                </div>
                <div>
                  <b>{b.orders.length}</b>
                  <small>buyer orders</small>
                </div>
                <div>
                  <b>{rupees(b.transportCostPaise)}</b>
                  <small>your payment</small>
                </div>
              </div>

              <form action={acceptRunAction}>
                <input type="hidden" name="batchId" value={b.id} />
                <button className="btn btn-primary">
                  Accept this run <Arrow />
                </button>
              </form>
            </Card>
          );
        })}

        {inHand.map((b) => (
          <Card key={b.id}>
            <SectionHead
              eyebrow={`IN HAND · ${b.cluster.name.replace(" pickup point", "").toUpperCase()}`}
              title={`${b.windowDate.toISOString().slice(0, 10)} · ${b.stops.length} stops`}
              action={<Status tone={b.status === "DISPATCHED" ? "warning" : "pending"}>{b.status.toLowerCase()}</Status>}
            />
            <div className="offer-grid">
              <div>
                <b>{kg(b.loadGrams)}</b>
                <small>load</small>
              </div>
              <div>
                <b>{b.distanceKm} km</b>
                <small>distance</small>
              </div>
              <div>
                <b>{(b.fillFraction * 100).toFixed(0)}%</b>
                <small>of your vehicle</small>
              </div>
              <div>
                <b>{rupees(b.transportCostPaise)}</b>
                <small>your payment</small>
              </div>
            </div>
            <Link href={`/transporter/runs/${b.id}`} className="btn btn-secondary">
              Open run sheet <Arrow />
            </Link>
          </Card>
        ))}

        {done.length > 0 && (
          <Card>
            <div className="eyebrow">COMPLETED</div>
            <h2>Runs finished</h2>
            {done.map((b) => (
              <div key={b.id} className="mini-stop">
                <b>✓</b>
                <span>
                  {b.cluster.name.replace(" pickup point", "")}
                  <small>
                    {b.windowDate.toISOString().slice(0, 10)} · {kg(b.loadGrams)} · {b.distanceKm} km
                  </small>
                </span>
                <strong style={{ marginLeft: "auto" }}>{rupees(b.transportCostPaise)}</strong>
              </div>
            ))}
          </Card>
        )}

        <MicroNote>
          Payment is the planned route distance at your own per-kilometre rate, agreed before you accept. A run held
          below {ECONOMICS.MIN_FILL_FRACTION * 100}% fill is never offered for acceptance.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

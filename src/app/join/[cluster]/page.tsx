import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Stat, Stats } from "@/components/ui";
import { prisma } from "@/lib/db";
import { clusterFill, marketOffers } from "@/lib/market";
import { kg, rupees } from "@/lib/money";

/**
 * The public invitation page.
 *
 * A run goes when enough of one neighbourhood is buying, so the honest way to
 * ask for more orders is to show exactly how far off the threshold is. Works
 * signed out, because the whole point is that it gets forwarded.
 */
export default async function JoinPage({ params }: { params: Promise<{ cluster: string }> }) {
  const { cluster: clusterId } = await params;

  const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });
  if (!cluster) notFound();

  const [fill, offers] = await Promise.all([clusterFill(clusterId), marketOffers()]);
  const cheapest = [...offers]
    .filter((o) => o.stack.savingVsReferencePaise > 0)
    .sort((a, b) => b.stack.savingVsReferencePaise - a.stack.savingVsReferencePaise)
    .slice(0, 4);

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow={`${cluster.city.toUpperCase()} · ${cluster.name.replace(" pickup point", "").toUpperCase()}`}
          title={fill.willGo ? "This run is going." : "Help this run reach the truck."}
          subtitle={
            fill.willGo
              ? `Enough of the neighbourhood has ordered, so the vehicle moves on ${fill.windowDate.toISOString().slice(0, 10)}. Orders are still open until the run is planned.`
              : `A vehicle only leaves the farms when the load is worth moving. This neighbourhood is ${kg(fill.shortfallGrams)} short of the ${fill.minimumFillFraction * 100}% minimum for the ${fill.windowDate.toISOString().slice(0, 10)} run.`
          }
          action={
            <Link href="/market" className="btn btn-primary">
              Add your order
            </Link>
          }
        />

        <Card>
          <div className="eyebrow">PROGRESS TO THE {fill.minimumFillFraction * 100}% MINIMUM</div>
          <h2>
            {kg(fill.grams)} of {kg(fill.targetGrams)} needed
          </h2>

          <div className="fill-line">
            <span>
              {fill.orders} household{fill.orders === 1 ? "" : "s"} ordering · {kg(fill.vehicleGrams)} vehicle
            </span>
            <b>{(fill.fraction * 100).toFixed(0)}%</b>
          </div>
          <div className="progress">
            <i className={fill.willGo ? "" : "amber-fill"} style={{ width: `${Math.min(100, fill.fraction * 100)}%` }} />
          </div>

          <p className={fill.willGo ? "positive-text" : "warning-text"}>
            {fill.willGo
              ? "Above the minimum fill. The farmers' produce travels once, and the transport cost per kilogram stays low."
              : `${kg(fill.shortfallGrams)} to go. Below the threshold the run is held and every order rolls to the next window — nothing is delivered at a loss, and nobody's price is quietly raised to cover it.`}
          </p>

          <MicroNote>
            Pooling is the whole mechanic: a farmer with 200 kg cannot fill a tempo alone, and hiring one for that
            load costs roughly five times as much per kilogram as a full vehicle. More neighbours on one run is what
            makes the farmer&apos;s rate and your price work at the same time.
          </MicroNote>
        </Card>

        <Stats count={3}>
          <Stat label="Collection point" value={cluster.name.replace(" pickup point", "")} note={`Host: ${cluster.hostName}`} />
          <Stat label="Collection window" value="6 pm – 9 pm" note={fill.windowDate.toISOString().slice(0, 10)} />
          <Stat
            label="Door delivery"
            value={rupees(cluster.lastLegFeePaise)}
            note="Free above a ₹500 basket"
            tone="positive"
          />
        </Stats>

        {cheapest.length > 0 && (
          <Card>
            <div className="eyebrow">ON THIS RUN</div>
            <h2>What your neighbours are buying</h2>
            {cheapest.map((o) => (
              <div key={o.commodity.id} className="produce-row">
                <span className="crop-emoji">{o.commodity.imageEmoji}</span>
                <span>
                  <b>{o.commodity.name}</b>
                  <small>
                    {o.farmCount} farm{o.farmCount > 1 ? "s" : ""} · {o.villages.join(", ")} · {rupees(o.stack.savingVsReferencePaise)}/kg
                    under the quick-commerce rate
                  </small>
                </span>
                <strong>
                  {rupees(o.stack.landedPaisePerKg)}
                  <small>/kg</small>
                </strong>
              </div>
            ))}
            <Link href="/market" className="btn btn-primary" style={{ marginTop: 18 }}>
              See everything and order
            </Link>
          </Card>
        )}

        <MicroNote>
          Prices are built upward from the rate each farmer accepted; the comparison rate is an assumed
          quick-commerce figure, not a live scrape. KrishiSetu is a student project and is not affiliated with any
          government body.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

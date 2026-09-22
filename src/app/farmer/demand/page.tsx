import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Spark } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableGrams } from "@/lib/farmer";
import { getOpportunities } from "@/lib/insights";
import { surplusPlacements } from "@/lib/surplus";
import { kg, perKg } from "@/lib/money";

export default async function DemandPage() {
  const session = await requireRole("FARMER");
  const opportunities = await getOpportunities();

  // The lot is already cut: what is still unsold has to go somewhere this week.
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: session.userId } });
  const openListings = profile
    ? (
        await prisma.listing.findMany({
          where: { farmerId: profile.id, status: "ACTIVE" },
          include: { commodity: true },
        })
      ).filter((l) => availableGrams(l) > 0)
    : [];
  const plans = (await Promise.all(openListings.map((l) => surplusPlacements(l.id)))).filter(
    (p) => p !== null && p.unsoldGrams > 0,
  ) as NonNullable<Awaited<ReturnType<typeof surplusPlacements>>>[];
  const newest = opportunities.find((o) => o.latestObservedOn);

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="FARMER DESK · DECISION SUPPORT"
          title="What to grow and sell"
          subtitle="Each crop is scored on three things: how demand in the pickup clusters is expected to move, which way the mandi price is moving, and how little of it other farmers have already listed. A crop with rising demand that nobody has listed is worth more to you than a high headline price with a queue of sellers."
          action={
            newest ? (
              <span className="data-note">
                All prices · {newest.benchmarkSource} · {newest.latestObservedOn?.toISOString().slice(0, 10)}
              </span>
            ) : undefined
          }
        />

        {opportunities.map((o, i) => (
          <Card key={o.commodityId} className="demand-card">
            <div className="rank">
              <span>{i + 1}</span>
            </div>

            <div className="demand-main">
              <div className="demand-head">
                <span className="crop-emoji">{o.emoji}</span>
                <h2>{o.name}</h2>
                <span className={`pill ${o.demandChangePct >= 0 ? "green" : "amber"}`}>
                  Demand {o.demandChangePct >= 0 ? "+" : ""}
                  {o.demandChangePct.toFixed(1)}%
                </span>
                <span className={`pill ${o.priceChangePct >= 0 ? "green" : "amber"}`}>
                  Price {o.priceChangePct >= 0 ? "+" : ""}
                  {o.priceChangePct.toFixed(1)}%
                </span>
                <span className="pill">{o.demandSupplyRatio.toFixed(2)}× listed supply</span>
              </div>

              <p>
                Next week: {kg(o.predictedGrams)} expected, somewhere between {kg(o.loGrams)} and {kg(o.hiGrams)}.
                Farmers have {kg(o.listedGrams)} listed right now. Latest mandi reference{" "}
                {o.latestModalPaisePerKg ? perKg(o.latestModalPaisePerKg) : "not available"}
                {o.latestObservedOn
                  ? ` (${o.benchmarkSource?.toLowerCase()}, ${o.latestObservedOn.toISOString().slice(0, 10)})`
                  : ""}
                .
              </p>

              <Spark history={o.recentSeries} forecast={o.forecastSeries} />
              <small>
                16 weeks observed · 4 weeks predicted · {o.demandFit.chosen === "ridge" ? "fitted model" : "naive baseline"} over {o.demandFit.sampleSize} weeks
              </small>
            </div>

            <div className="neighbourhood">
              <div className="eyebrow">WHERE THE DEMAND IS</div>
              {o.topClusters.map((c) => (
                <b key={c.clusterId}>
                  {c.name.replace(" pickup point", "")} <span>{kg(c.predictedGrams)}</span>
                </b>
              ))}
            </div>

            <div className="method bottom">
              Model error {o.demandFit.modelMape.toFixed(1)}% · naive baseline error {o.demandFit.baselineMape.toFixed(1)}% ·
              the lower of the two is what is plotted
            </div>
          </Card>
        ))}

        {plans.length > 0 && (
          <Card>
            <div className="eyebrow">WHERE THE REST SHOULD GO</div>
            <h2>Your unsold quantity, placed</h2>
            <p>
              These are pickup points that can still take what is left of a lot in the next window. A point is only
              offered when the produce reaches it inside its freshness limit and the forecast there is not already
              covered by confirmed orders. Nothing here is reserved; it is where to send it, not a sale.
            </p>

            {plans.map((plan) => {
              const offered = plan.placements.filter((d) => d.absorbGrams > 0);
              const dropped = plan.placements.filter((d) => d.rejectedFor);
              return (
                <div key={plan.listingId} className="surplus-plan">
                  <div className="demand-head">
                    <b>{plan.commodityName}</b>
                    <span className="pill">{kg(plan.unsoldGrams)} unsold</span>
                    <span className={`pill ${plan.placeableGrams >= plan.unsoldGrams ? "green" : "amber"}`}>
                      {kg(plan.placeableGrams)} placeable
                    </span>
                  </div>

                  {offered.length === 0 ? (
                    <small>
                      No pickup point can take this lot in the next window. Hold it, or drop the asking rate so it
                      clears where demand already exists.
                    </small>
                  ) : (
                    offered.map((d) => (
                      <div key={d.clusterId} className="listing-row">
                        <div>
                          <b>{d.name.replace(" pickup point", "")}</b> <small>{d.city}</small>
                        </div>
                        <span>
                          {kg(d.absorbGrams)} of {kg(d.unmetGrams)} uncovered
                          <br />
                          <small>
                            {d.roadKm.toFixed(0)} km · {d.hoursToSpare.toFixed(0)} h of freshness to spare
                          </small>
                        </span>
                        <span className={`pill ${d.runConfirmed ? "green" : "amber"}`}>
                          {d.runConfirmed ? "run confirmed" : `${(d.fillFraction * 100).toFixed(0)}% filled`}
                        </span>
                      </div>
                    ))
                  )}

                  {dropped.length > 0 && (
                    <small>
                      Not offered: {dropped.map((d) => `${d.name.replace(" pickup point", "")} — ${d.rejectedFor}`).join(" · ")}
                    </small>
                  )}
                </div>
              );
            })}

            <MicroNote>
              Order matters: each point is offered only what the ones above it could not take, so the same kilogram is
              never promised to two places.
            </MicroNote>
          </Card>
        )}

        <Card>
          <div className="eyebrow">HOW TO READ THIS</div>
          <h2>What these numbers cannot tell you</h2>
          <div className="caveats">
            <span>
              The demand history behind these figures is synthetic until the pilot produces real fulfilled orders. It
              shows the method runs end to end; it does not show accuracy about real households.
            </span>
            <span>
              A fitted model is used only when it beat the four-week median baseline on a chronological holdout. The
              pill on each row says which one you are seeing.
            </span>
            <span>
              Predicted demand is not a confirmed order. Interest and searches are weaker evidence than a paid,
              accepted order, and are counted separately.
            </span>
            <span>
              This is a demand and price signal, not agronomic advice. Whether a crop suits your soil, water and
              season is your judgement, not the model&apos;s.
            </span>
          </div>
        </Card>

        <MicroNote>
          Every figure here carries its method and its sample size. When the model cannot beat a naive baseline, the
          baseline is what is shown, and the page says so rather than dressing it up.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

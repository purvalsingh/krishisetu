import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Spark } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getOpportunities } from "@/lib/insights";
import { kg, perKg } from "@/lib/money";

export default async function DemandPage() {
  await requireRole("FARMER");
  const opportunities = await getOpportunities();
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

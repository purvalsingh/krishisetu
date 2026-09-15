import { Nav, Shell } from "@/components/nav";
import { Badge, Card, SourceNote, Spark } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getOpportunities } from "@/lib/insights";
import { kg, perKg } from "@/lib/money";

export default async function DemandPage() {
  await requireRole("FARMER");
  const opportunities = await getOpportunities();

  const anyModelWon = opportunities.some((o) => o.demandFit.chosen === "ridge");

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">What to grow and sell</h1>
        <p className="mt-1 max-w-3xl text-sm text-inksoft">
          Each crop below is scored on three things: how demand in the pickup clusters is expected to move, which
          way the mandi price is moving, and how much of that crop other farmers have already listed. A crop with
          rising demand that nobody has listed is worth more to you than a crop with a high headline price and a
          queue of sellers.
        </p>

        <div className="mt-5 space-y-3">
          {opportunities.map((o, i) => (
            <Card key={o.commodityId}>
              <div className="flex flex-wrap items-start gap-5">
                <div className="flex items-baseline gap-3">
                  <span className="tabular w-6 text-sm text-inksoft">{i + 1}</span>
                  <span className="text-3xl">{o.emoji}</span>
                </div>

                <div className="min-w-[210px] flex-1">
                  <h2 className="text-base font-semibold">{o.name}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Badge tone={o.demandChangePct >= 0 ? "good" : "bad"}>
                      Demand {o.demandChangePct >= 0 ? "+" : ""}
                      {o.demandChangePct.toFixed(1)}%
                    </Badge>
                    <Badge tone={o.priceChangePct >= 0 ? "good" : "bad"}>
                      Price {o.priceChangePct >= 0 ? "+" : ""}
                      {o.priceChangePct.toFixed(1)}%
                    </Badge>
                    <Badge tone={o.demandSupplyRatio > 1 ? "warn" : "neutral"}>
                      {o.demandSupplyRatio.toFixed(2)}× listed supply
                    </Badge>
                    <Badge tone={o.demandFit.chosen === "ridge" ? "brand" : "neutral"}>
                      {o.demandFit.chosen === "ridge" ? "fitted model" : "naive baseline"}
                    </Badge>
                  </div>
                  <p className="tabular mt-2 text-xs leading-relaxed text-inksoft">
                    Next week: {kg(o.predictedGrams)} expected, somewhere between {kg(o.loGrams)} and {kg(o.hiGrams)}.
                    Farmers have {kg(o.listedGrams)} listed right now. Latest mandi reference{" "}
                    {o.latestModalPaisePerKg ? perKg(o.latestModalPaisePerKg) : "not available"}
                    {o.latestObservedOn ? ` (${o.benchmarkSource?.toLowerCase()}, ${o.latestObservedOn.toISOString().slice(0, 10)})` : ""}.
                  </p>
                </div>

                <div className="shrink-0">
                  <Spark history={o.recentSeries} forecast={o.forecastSeries} />
                  <p className="mt-1 text-[10px] text-inksoft">26 weeks observed, 4 weeks predicted</p>
                </div>

                <div className="min-w-[190px]">
                  <div className="text-[11px] uppercase tracking-wide text-inksoft">Where the demand is</div>
                  <ul className="tabular mt-1 space-y-1 text-xs">
                    {o.topClusters.map((c) => (
                      <li key={c.clusterId} className="flex justify-between gap-3">
                        <span className="text-inksoft">{c.name.replace(" pickup point", "")}</span>
                        <span>{kg(c.predictedGrams)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <SourceNote>
                Holdout error {o.demandFit.modelMape.toFixed(1)}% for the fitted model against{" "}
                {o.demandFit.baselineMape.toFixed(1)}% for the four-week median baseline, over {o.demandFit.sampleSize}{" "}
                weeks. The lower of the two is what is plotted.
              </SourceNote>
            </Card>
          ))}
        </div>

        <Card className="mt-5" title="How to read this, and what it cannot tell you">
          <ul className="space-y-2 text-sm leading-relaxed text-inksoft">
            <li>
              The demand history behind these numbers is <span className="text-ink">synthetic</span> until the pilot
              has produced real fulfilled orders. It shows that the method works end to end; it does not show that
              the method is accurate about real households.
            </li>
            <li>
              A fitted model is only used when it beat the naive baseline on a chronological holdout.{" "}
              {anyModelWon
                ? "Some crops below are using the fitted model and some are using the baseline; the badge on each row says which."
                : "On this data the baseline currently wins everywhere, so the baseline is what you are seeing."}
            </li>
            <li>
              This is a demand and price signal, not agronomic advice. Whether a crop suits your soil, water and
              season is your judgement, not the model&apos;s.
            </li>
          </ul>
        </Card>
      </Shell>
    </>
  );
}

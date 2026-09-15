import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { availableGrams, farmerOverview } from "@/lib/farmer";
import { getOpportunities } from "@/lib/insights";
import { kg, perKg, rupees } from "@/lib/money";
import { translator } from "@/lib/i18n";

export default async function FarmerHome() {
  const session = await requireRole("FARMER");
  const data = await farmerOverview(session.userId);
  if (!data) return null;

  const t = translator(data.profile.user.language);
  const opportunities = (await getOpportunities()).slice(0, 5);
  const top = opportunities[0];
  const active = data.listings.filter((l) => l.status === "ACTIVE");

  return (
    <>
      <Nav />
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("greeting")}, {data.profile.user.name}</h1>
            <p className="mt-1 text-sm text-inksoft">
              {data.profile.village}, {data.profile.district}
              {data.profile.fpoName ? ` · ${data.profile.fpoName}` : ""}
            </p>
          </div>
          <Link href="/farmer/listings" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
            {t("listProduce")}
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("moneyAwaiting")} value={rupees(data.awaiting)} note={t("moneyAwaitingNote")} tone="warn" />
          <Stat label={t("alreadyReceived")} value={rupees(data.settled)} tone="good" />
          <Stat label={t("soldThrough")} value={kg(data.soldGrams)} />
          <Stat label={t("listingsLive")} value={String(active.length)} note={`${kg(active.reduce((s, l) => s + availableGrams(l), 0))} ${t("stillAvailable")}`} />
        </div>

        {top && (
          <Card
            className="mt-5"
            title={t("worthSending")}
            subtitle={t("worthSendingNote")}
            action={<Link href="/farmer/demand" className="text-xs font-medium text-brand">{t("fullWorking")} →</Link>}
          >
            <div className="flex flex-wrap items-start gap-5">
              <div className="text-4xl">{top.emoji}</div>
              <div className="min-w-[200px] flex-1">
                <h3 className="text-lg font-semibold">{top.name}</h3>
                <p className="mt-1 text-sm text-inksoft">
                  {t("predictedDemand")} {kg(top.predictedGrams)}, {t("against")} {kg(top.listedGrams)}{" "}
                  {t("listedToday")}. {t("strongestArea")}{" "}
                  <span className="text-ink">{top.topClusters[0]?.name}</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={top.demandChangePct >= 0 ? "good" : "bad"}>
                    {t("demand")} {top.demandChangePct >= 0 ? "+" : ""}
                    {top.demandChangePct.toFixed(1)}%
                  </Badge>
                  <Badge tone={top.priceChangePct >= 0 ? "good" : "bad"}>
                    {t("price")} {top.priceChangePct >= 0 ? "+" : ""}
                    {top.priceChangePct.toFixed(1)}%
                  </Badge>
                  <Badge tone={top.demandSupplyRatio > 1 ? "warn" : "neutral"}>
                    {top.demandSupplyRatio.toFixed(2)}{t("timesListedSupply")}
                  </Badge>
                </div>
              </div>
              <div className="grid min-w-[180px] gap-2">
                <Stat
                  label={t("latestMandi")}
                  value={top.latestModalPaisePerKg ? perKg(top.latestModalPaisePerKg) : t("notAvailable")}
                  note={
                    top.latestObservedOn
                      ? `${top.benchmarkSource} · ${top.latestObservedOn.toISOString().slice(0, 10)} · ${top.benchmarkAgeDays} days old`
                      : "No dated observation stored yet"
                  }
                />
              </div>
            </div>
            <SourceNote>
              Prediction method: {top.demandFit.chosen === "ridge" ? "fitted model" : "naive baseline"} over{" "}
              {top.demandFit.sampleSize} weeks. Holdout error was {top.demandFit.modelMape.toFixed(1)}% for the model
              and {top.demandFit.baselineMape.toFixed(1)}% for the baseline; whichever was lower is what you are
              seeing. Demand history is synthetic until the pilot produces fulfilled orders.
            </SourceNote>
          </Card>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card title={t("myProduce")} action={<Link href="/farmer/listings" className="text-xs font-medium text-brand">{t("manage")} →</Link>}>
            {active.length === 0 ? (
              <Empty>{t("nothingListed")}</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {active.slice(0, 6).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <div>
                      <div className="text-sm font-medium">
                        {l.commodity.imageEmoji} {l.commodity.name}{" "}
                        <Badge tone={l.grade === "IMPERFECT" ? "warn" : "neutral"}>{t("grade")} {l.grade}</Badge>
                      </div>
                      <div className="tabular text-xs text-inksoft">
                        {kg(availableGrams(l))} {t("available")} · {kg(l.reservedGrams)} {t("reserved")}
                        {l.prebooking ? " · prebooking" : ""}
                      </div>
                    </div>
                    <div className="tabular text-right text-sm font-semibold">{perKg(l.askPaisePerKg)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("transportArranged")} subtitle={t("transportArrangedNote")}>
            {data.runs.length === 0 ? (
              <Empty>{t("noRun")}</Empty>
            ) : (
              <ul className="space-y-3">
                {data.runs.map((b) => {
                  const stop = b.stops.find((s) => s.refId === data.profile.id);
                  return (
                    <li key={b.id} className="rounded-lg border border-line bg-panel2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{b.cluster.name}</span>
                        <Badge tone={b.status === "DISPATCHED" ? "good" : "neutral"}>{b.status.toLowerCase()}</Badge>
                      </div>
                      <div className="tabular mt-1 text-xs text-inksoft">
                        {b.windowDate.toISOString().slice(0, 10)} · stop {stop?.seq} of {b.stops.length} ·{" "}
                        {stop ? kg(stop.grams) : ""} from you
                        {b.transporter ? ` · ${b.transporter.user.name}, ${b.transporter.vehicleReg}` : " · transporter not yet assigned"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card className="mt-5" title={t("recentAllocations")} action={<Link href="/farmer/earnings" className="text-xs font-medium text-brand">{t("allEarnings")} →</Link>}>
          {data.allocations.length === 0 ? (
            <Empty>{t("noAllocations")}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabular w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-inksoft">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{t("produce")}</th>
                    <th className="py-2 pr-4 font-medium">{t("quantity")}</th>
                    <th className="py-2 pr-4 font-medium">{t("rate")}</th>
                    <th className="py-2 pr-4 font-medium">{t("goingTo")}</th>
                    <th className="py-2 pr-4 font-medium">{t("amount")}</th>
                    <th className="py-2 font-medium">{t("payment")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.allocations.slice(0, 8).map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-4">{a.listing.commodity.name}</td>
                      <td className="py-2 pr-4">{kg(a.grams)}</td>
                      <td className="py-2 pr-4">{perKg(a.listing.askPaisePerKg)}</td>
                      <td className="py-2 pr-4 text-inksoft">{a.orderLine.order.cluster.name}</td>
                      <td className="py-2 pr-4 font-semibold">{rupees(a.proceedsPaise)}</td>
                      <td className="py-2">
                        <Badge tone={a.settled ? "good" : "warn"}>{a.settled ? t("paid") : t("awaiting")}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Shell>
    </>
  );
}

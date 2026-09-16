import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, Empty, MicroNote, PageTitle, SectionHead, Stat, Stats, Status, TableWrap, Tag } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { availableGrams, farmerOverview } from "@/lib/farmer";
import { getOpportunities } from "@/lib/insights";
import { translator } from "@/lib/i18n";
import { kg, perKg, rupees } from "@/lib/money";

export default async function FarmerHome() {
  const session = await requireRole("FARMER");
  const data = await farmerOverview(session.userId);
  if (!data) return null;

  const t = translator(data.profile.user.language);
  const opportunities = (await getOpportunities()).slice(0, 5);
  const top = opportunities[0];
  const active = data.listings.filter((l) => l.status === "ACTIVE");
  const run = data.runs[0];
  const runStop = run?.stops.find((s) => s.refId === data.profile.id);

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="FARMER DESK"
          title={`${t("greeting")}, ${data.profile.user.name}`}
          subtitle={`${data.profile.village}, ${data.profile.district}${data.profile.fpoName ? ` · ${data.profile.fpoName}` : ""}`}
          action={
            <Link href="/farmer/listings" className="btn btn-primary">
              {t("listProduce")} <Arrow />
            </Link>
          }
        />

        <Stats count={4}>
          <Stat label={t("moneyAwaiting")} value={rupees(data.awaiting)} note={t("moneyAwaitingNote")} tone="warning" />
          <Stat label={t("alreadyReceived")} value={rupees(data.settled)} tone="positive" />
          <Stat label={t("soldThrough")} value={kg(data.soldGrams)} />
          <Stat
            label={t("listingsLive")}
            value={String(active.length)}
            note={`${kg(active.reduce((s, l) => s + availableGrams(l), 0))} ${t("stillAvailable")}`}
          />
        </Stats>

        {top && (
          <Card className="decision">
            <div className="decision-copy">
              <div className="eyebrow">
                DECISION SUPPORT · {top.benchmarkSource ?? "NO BENCHMARK"}
              </div>
              <div className="crop-hero">
                <span>{top.emoji}</span>
                <div>
                  <h2>{t("worthSending")}</h2>
                  <p>
                    <b>{top.name}</b>. {t("predictedDemand")} <b>{kg(top.predictedGrams)}</b>, {t("against")}{" "}
                    {kg(top.listedGrams)} {t("listedToday")}. {t("strongestArea")}{" "}
                    <b>{top.topClusters[0]?.name.replace(" pickup point", "")}</b>.
                  </p>
                </div>
              </div>

              <div className="pills">
                <span>
                  {t("demand")} {top.demandChangePct >= 0 ? "+" : ""}
                  {top.demandChangePct.toFixed(1)}%
                </span>
                <span>
                  {t("price")} {top.priceChangePct >= 0 ? "+" : ""}
                  {top.priceChangePct.toFixed(1)}%
                </span>
                <span>
                  {top.demandSupplyRatio.toFixed(2)}
                  {t("timesListedSupply")}
                </span>
              </div>

              <small className="method">
                {top.demandFit.chosen === "ridge" ? "Fitted model" : "Naive baseline"} · {top.demandFit.sampleSize} weeks ·
                model error {top.demandFit.modelMape.toFixed(1)}% v baseline {top.demandFit.baselineMape.toFixed(1)}% ·
                demand history is synthetic until the pilot produces fulfilled orders.{" "}
                <Link href="/farmer/demand" className="text-link">
                  {t("fullWorking")} <Arrow />
                </Link>
              </small>
            </div>

            <div className="reference">
              <div className="eyebrow">{t("latestMandi")}</div>
              <strong>{top.latestModalPaisePerKg ? perKg(top.latestModalPaisePerKg) : t("notAvailable")}</strong>
              <small>
                {top.latestObservedOn
                  ? `${top.benchmarkSource} · ${top.latestObservedOn.toISOString().slice(0, 10)} · ${top.benchmarkAgeDays} days old`
                  : "No dated observation stored yet"}
              </small>
            </div>
          </Card>
        )}

        <div className="two-col">
          <Card>
            <SectionHead
              eyebrow="MY PRODUCE"
              title={active.length === 1 ? "One listing is live" : `${active.length} listings are live`}
              action={
                <Link href="/farmer/listings" className="text-link">
                  {t("manage")} <Arrow />
                </Link>
              }
            />
            {active.length === 0 ? (
              <Empty icon="🌱">{t("nothingListed")}</Empty>
            ) : (
              active.slice(0, 5).map((l) => (
                <div key={l.id} className="produce-row">
                  <span className="crop-emoji">{l.commodity.imageEmoji}</span>
                  <span>
                    <b>{l.commodity.name}</b>
                    <small>
                      {kg(availableGrams(l))} {t("available")} · {kg(l.reservedGrams)} {t("reserved")}{" "}
                      <Tag tone={l.grade === "IMPERFECT" ? "amber" : undefined}>
                        {t("grade")} {l.grade}
                      </Tag>
                    </small>
                  </span>
                  <strong>
                    {rupees(l.askPaisePerKg)}
                    <small>/kg</small>
                  </strong>
                </div>
              ))
            )}
          </Card>

          <Card>
            <SectionHead eyebrow="POOLED RUN" title={t("transportArranged")} />
            {!run || !runStop ? (
              <Empty icon="🚚">{t("noRun")}</Empty>
            ) : (
              <div className="run-preview">
                <b>
                  {run.transporter ? `${run.transporter.vehicleReg} · ${run.transporter.vehicleType}` : "Transporter not yet assigned"}
                </b>
                <span>
                  {run.windowDate.toISOString().slice(0, 10)} · stop {runStop.seq} of {run.stops.length} ·{" "}
                  {run.cluster.name}
                </span>
                <strong>{kg(runStop.grams)} being collected</strong>
                <div className="progress">
                  <i style={{ width: `${Math.min(100, run.fillFraction * 100)}%` }} />
                </div>
                <small className="method">
                  Run is {(run.fillFraction * 100).toFixed(0)}% full. {t("transportArrangedNote")}.
                </small>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <SectionHead
            eyebrow="RECENT ALLOCATIONS"
            title="Where the produce went"
            action={
              <Link href="/farmer/earnings" className="text-link">
                {t("allEarnings")} <Arrow />
              </Link>
            }
          />
          {data.allocations.length === 0 ? (
            <Empty icon="🧾">{t("noAllocations")}</Empty>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>{t("produce")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("rate")}</th>
                  <th>{t("goingTo")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("payment")}</th>
                </tr>
              </thead>
              <tbody>
                {data.allocations.slice(0, 8).map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.listing.commodity.imageEmoji} {a.listing.commodity.name}
                    </td>
                    <td>{kg(a.grams)}</td>
                    <td>{rupees(a.listing.askPaisePerKg)}</td>
                    <td>{a.orderLine.order.cluster.name.replace(" pickup point", "")}</td>
                    <td>{rupees(a.proceedsPaise)}</td>
                    <td>
                      <Status tone={a.settled ? "good" : "pending"}>{a.settled ? t("paid") : t("awaiting")}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <MicroNote>
          The rate you accepted is the rate you are paid. No commission, listing charge or logistics cost is deducted
          from it anywhere in this system.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

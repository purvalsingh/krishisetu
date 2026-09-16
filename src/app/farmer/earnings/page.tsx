import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Stat, Stats, Status, TableWrap } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { farmerOverview } from "@/lib/farmer";
import { getLatestBenchmarks } from "@/lib/insights";
import { translator } from "@/lib/i18n";
import { kg, perKg, rupees } from "@/lib/money";

/** What the same produce would have netted at the mandi, less the farmer's own selling cost. */
const ASSUMED_MANDI_SELLING_COST_PAISE_PER_KG = 300;

export default async function EarningsPage() {
  const session = await requireRole("FARMER");
  const data = await farmerOverview(session.userId);
  if (!data) return null;

  const t = translator(data.profile.user.language);
  const benchmarks = await getLatestBenchmarks();

  const rows = data.allocations.map((a) => {
    const benchmark = benchmarks.get(a.listing.commodityId);
    const comparablePerKg = benchmark
      ? Math.max(0, benchmark.modalPaisePerKg - ASSUMED_MANDI_SELLING_COST_PAISE_PER_KG)
      : null;
    const comparableProceeds = comparablePerKg ? Math.round((comparablePerKg * a.grams) / 1000) : null;
    return {
      a,
      benchmark,
      comparableProceeds,
      difference: comparableProceeds !== null ? a.proceedsPaise - comparableProceeds : null,
    };
  });

  const totalHere = rows.reduce((s, r) => s + r.a.proceedsPaise, 0);
  const totalComparable = rows.reduce((s, r) => s + (r.comparableProceeds ?? 0), 0);
  const totalGrams = rows.reduce((s, r) => s + r.a.grams, 0);
  const netRealisation = totalGrams ? Math.round((totalHere * 1000) / totalGrams) : 0;
  const comparableRealisation = totalGrams ? Math.round((totalComparable * 1000) / totalGrams) : 0;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="FARMER DESK · EARNINGS"
          title={t("netRealisation")}
          subtitle={`${t("netRealisationNote")}. The rate you accepted is the rate you are paid; the comparison column is the nearest dated mandi observation for the same quantity.`}
        />

        <Stats count={4}>
          <Stat
            label={t("netRealisation")}
            value={totalGrams ? perKg(netRealisation) : "—"}
            tone="positive"
            note={totalGrams && comparableRealisation ? `Mandi comparison ${perKg(comparableRealisation)}` : undefined}
          />
          <Stat label="Received here" value={rupees(totalHere)} />
          <Stat label="Comparable mandi total" value={rows.length ? rupees(totalComparable) : "not comparable"} />
          <Stat label={t("moneyAwaiting")} value={rupees(data.awaiting)} tone="warning" />
        </Stats>

        <Card>
          <div className="eyebrow">ALLOCATION BY ALLOCATION</div>
          <h2>Every kilogram, and what it paid</h2>

          {rows.length === 0 ? (
            <p className="micro-note">{t("noAllocations")}</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{t("produce")}</th>
                  <th>{t("quantity")}</th>
                  <th>Your rate</th>
                  <th>You receive</th>
                  <th>Mandi comparison</th>
                  <th>Difference</th>
                  <th>{t("payment")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ a, benchmark, comparableProceeds, difference }) => (
                  <tr key={a.id}>
                    <td>{a.createdAt.toISOString().slice(0, 10)}</td>
                    <td>
                      {a.listing.commodity.imageEmoji} {a.listing.commodity.name}
                    </td>
                    <td>{kg(a.grams)}</td>
                    <td>{rupees(a.listing.askPaisePerKg)}</td>
                    <td>
                      <b>{rupees(a.proceedsPaise)}</b>
                    </td>
                    <td>
                      {comparableProceeds !== null ? (
                        <>
                          {rupees(comparableProceeds)}{" "}
                          <small style={{ color: "var(--muted)" }}>
                            ({benchmark!.source.toLowerCase()} {benchmark!.observedOn.toISOString().slice(0, 10)})
                          </small>
                        </>
                      ) : (
                        "no dated observation"
                      )}
                    </td>
                    <td className={difference !== null && difference >= 0 ? "positive-text" : "warning-text"}>
                      {difference !== null ? (difference >= 0 ? "+" : "") + rupees(difference) : "—"}
                    </td>
                    <td>
                      <Status tone={a.settled ? "good" : "pending"}>{a.settled ? t("paid") : t("awaiting")}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}

          <MicroNote>
            The mandi comparison uses the most recent stored observation for that crop, which may be several days old
            and from a different market than the one you would actually have used. It is a comparison, not a
            guaranteed alternative price, and it excludes your production cost, so neither column is profit.
          </MicroNote>
        </Card>
      </Shell>
      <Footer />
    </>
  );
}

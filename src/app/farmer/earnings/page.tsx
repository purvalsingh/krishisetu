import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { farmerOverview } from "@/lib/farmer";
import { getLatestBenchmarks } from "@/lib/insights";
import { kg, perKg, rupees } from "@/lib/money";

/** What the same produce would have netted at the mandi, less the farmer's own selling cost. */
const ASSUMED_MANDI_SELLING_COST_PAISE_PER_KG = 300;

export default async function EarningsPage() {
  const session = await requireRole("FARMER");
  const data = await farmerOverview(session.userId);
  if (!data) return null;
  const benchmarks = await getLatestBenchmarks();

  const rows = data.allocations.map((a) => {
    const benchmark = benchmarks.get(a.listing.commodityId);
    const comparableNetPerKg = benchmark
      ? Math.max(0, benchmark.modalPaisePerKg - ASSUMED_MANDI_SELLING_COST_PAISE_PER_KG)
      : null;
    const comparableProceeds = comparableNetPerKg ? Math.round((comparableNetPerKg * a.grams) / 1000) : null;
    return { a, benchmark, comparableNetPerKg, comparableProceeds, difference: comparableProceeds !== null ? a.proceedsPaise - comparableProceeds : null };
  });

  const totalHere = rows.reduce((s, r) => s + r.a.proceedsPaise, 0);
  const totalComparable = rows.reduce((s, r) => s + (r.comparableProceeds ?? 0), 0);
  const measurable = rows.filter((r) => r.comparableProceeds !== null);

  // Net farmer realisation: what the farmer actually keeps per kilogram, with no
  // deductions applied between the accepted rate and the settlement, set beside
  // what the same kilogram would have netted at the mandi.
  const totalGrams = rows.reduce((s, r) => s + r.a.grams, 0);
  const netRealisationPerKg = totalGrams ? Math.round((totalHere * 1000) / totalGrams) : 0;
  const comparableRealisationPerKg = totalGrams ? Math.round((totalComparable * 1000) / totalGrams) : 0;

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="mt-1 max-w-2xl text-sm text-inksoft">
          Every kilogram allocated to a buyer, the rate you accepted for it, and what the same quantity would have
          netted you at the mandi on the nearest dated observation. The headline figure is your net realisation per
          kilogram: the rate you accepted is the rate you are paid, because no commission, listing charge or
          logistics cost is deducted from it anywhere in this system.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Net farmer realisation"
            value={totalGrams ? perKg(netRealisationPerKg) : "—"}
            tone="good"
            note={
              totalGrams && comparableRealisationPerKg
                ? `Mandi comparison ${perKg(comparableRealisationPerKg)} on the same quantity`
                : "What you keep per kilogram, with nothing deducted after you accepted the rate"
            }
          />
          <Stat label="Received here" value={rupees(totalHere)} tone="good" />
          <Stat
            label="Comparable mandi total"
            value={measurable.length ? rupees(totalComparable) : "not comparable"}
            note={`Mandi modal price less an assumed ₹${ASSUMED_MANDI_SELLING_COST_PAISE_PER_KG / 100}/kg of your own selling cost`}
          />
          <Stat
            label="Difference"
            value={measurable.length ? rupees(totalHere - totalComparable) : "—"}
            tone={totalHere - totalComparable >= 0 ? "good" : "bad"}
            note={measurable.length ? `Across ${kg(rows.reduce((s, r) => s + r.a.grams, 0))}` : undefined}
          />
          <Stat label="Awaiting payment" value={rupees(data.awaiting)} tone="warn" />
        </div>

        <Card className="mt-5" title="Allocation by allocation">
          {rows.length === 0 ? (
            <Empty>No produce has been allocated to a buyer yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabular w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-inksoft">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Produce</th>
                    <th className="py-2 pr-4 font-medium">Quantity</th>
                    <th className="py-2 pr-4 font-medium">Your rate</th>
                    <th className="py-2 pr-4 font-medium">You receive</th>
                    <th className="py-2 pr-4 font-medium">Mandi comparison</th>
                    <th className="py-2 pr-4 font-medium">Difference</th>
                    <th className="py-2 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ a, benchmark, comparableProceeds, difference }) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-4 text-inksoft">{a.createdAt.toISOString().slice(0, 10)}</td>
                      <td className="py-2 pr-4">
                        {a.listing.commodity.imageEmoji} {a.listing.commodity.name}
                      </td>
                      <td className="py-2 pr-4">{kg(a.grams)}</td>
                      <td className="py-2 pr-4">{perKg(a.listing.askPaisePerKg)}</td>
                      <td className="py-2 pr-4 font-semibold">{rupees(a.proceedsPaise)}</td>
                      <td className="py-2 pr-4 text-inksoft">
                        {comparableProceeds !== null ? (
                          <>
                            {rupees(comparableProceeds)}
                            <span className="ml-1 text-[11px]">
                              ({benchmark!.source.toLowerCase()} {benchmark!.observedOn.toISOString().slice(0, 10)})
                            </span>
                          </>
                        ) : (
                          "no dated observation"
                        )}
                      </td>
                      <td className={`py-2 pr-4 font-medium ${difference !== null && difference >= 0 ? "text-brand" : "text-danger"}`}>
                        {difference !== null ? (difference >= 0 ? "+" : "") + rupees(difference) : "—"}
                      </td>
                      <td className="py-2">
                        <Badge tone={a.settled ? "good" : "warn"}>{a.settled ? "paid" : "awaiting"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <SourceNote>
            The mandi comparison uses the most recent stored observation for that crop, which may be several days
            old and may come from a different market than the one you would actually have used. It is a comparison,
            not a guaranteed alternative price, and it excludes your production cost, so neither column is profit.
          </SourceNote>
        </Card>
      </Shell>
    </>
  );
}

import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableGrams } from "@/lib/farmer";
import { getOpportunities } from "@/lib/insights";
import { suggestFarmerBand } from "@/lib/pricing";
import { kg, perKg } from "@/lib/money";
import { setListingStatus } from "@/app/actions/listing";
import { NewListingForm } from "./form";

export default async function ListingsPage() {
  const session = await requireRole("FARMER");
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return null;

  const [commodities, listings, opportunities] = await Promise.all([
    prisma.commodity.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: { farmerId: profile.id },
      include: { commodity: true, allocations: true },
      orderBy: { createdAt: "desc" },
    }),
    getOpportunities(),
  ]);

  // The suggested band is built per commodity from the dated mandi observation
  // and the current demand pressure. It is a suggestion, and the farmer types
  // whatever number they are actually willing to accept.
  const suggestions = Object.fromEntries(
    commodities.map((c) => {
      const o = opportunities.find((x) => x.commodityId === c.id);
      const band = suggestFarmerBand({
        mandiModalPaisePerKg: o?.latestModalPaisePerKg ?? null,
        demandRatio: o?.demandSupplyRatio ?? 1,
        referencePaisePerKg: c.quickCommercePaisePerKg,
      });
      return [
        c.id,
        band && {
          low: band.low,
          high: band.high,
          comparableNet: band.comparableNet,
          cappedByReference: band.cappedByReference,
          observedOn: o?.latestObservedOn?.toISOString().slice(0, 10) ?? null,
          source: o?.benchmarkSource ?? null,
        },
      ];
    }),
  );

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">My produce</h1>
        <p className="mt-1 max-w-2xl text-sm text-inksoft">
          List what is ready, or publish an expected harvest as a prebooking. The rate you enter is the amount you
          receive per kilogram. Transport, packing and the site fee are added on top for the buyer and are never
          taken out of your amount.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          <Card title="List produce">
            <NewListingForm commodities={commodities.map((c) => ({ id: c.id, name: c.name, emoji: c.imageEmoji }))} suggestions={suggestions} />
          </Card>

          <Card title="Everything I have listed">
            {listings.length === 0 ? (
              <Empty>Nothing listed yet.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {listings.map((l) => {
                  const sold = l.allocations.reduce((s, a) => s + a.grams, 0);
                  return (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-[180px]">
                        <div className="text-sm font-medium">
                          {l.commodity.imageEmoji} {l.commodity.name}{" "}
                          <Badge tone={l.grade === "IMPERFECT" ? "warn" : "neutral"}>Grade {l.grade}</Badge>{" "}
                          {l.prebooking && <Badge tone="brand">prebooking</Badge>}
                        </div>
                        <div className="tabular mt-0.5 text-xs text-inksoft">
                          {kg(availableGrams(l))} available of {kg(l.totalGrams)} · {kg(sold)} allocated to buyers ·
                          harvested {l.harvestDate.toISOString().slice(0, 10)}
                        </div>
                        {l.notes && <p className="mt-1 text-xs text-inksoft">{l.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular text-sm font-semibold">{perKg(l.askPaisePerKg)}</span>
                        <form action={setListingStatus}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="status" value={l.status === "ACTIVE" ? "PAUSED" : "ACTIVE"} />
                          <button className="rounded-lg border border-line px-2.5 py-1.5 text-xs hover:bg-panel2">
                            {l.status === "ACTIVE" ? "Pause" : "Resume"}
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <SourceNote>
              Reserved quantity belongs to a confirmed order and cannot be sold again. Pausing a listing hides the
              remaining quantity from buyers; it does not cancel anything already reserved.
            </SourceNote>
          </Card>
        </div>
      </Shell>
    </>
  );
}

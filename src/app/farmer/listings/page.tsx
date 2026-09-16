import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, Empty, MicroNote, PageTitle, Tag } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableGrams } from "@/lib/farmer";
import { getOpportunities } from "@/lib/insights";
import { suggestFarmerBand } from "@/lib/pricing";
import { kg, rupees } from "@/lib/money";
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

  // The band is built per commodity from the dated mandi observation and the
  // current demand pressure. It is a suggestion; the farmer types what they will accept.
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

  const live = listings.filter((l) => l.status === "ACTIVE");

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="FARMER DESK · INVENTORY"
          title="List produce"
          subtitle="Set the rate you are willing to accept. The shared run adds transport, packing and the site fee on top of it for the buyer; nothing is taken out of your amount."
          action={
            <Link href="/farmer/demand" className="btn btn-secondary">
              See what is worth sending <Arrow />
            </Link>
          }
        />

        <div className="two-col listing-layout">
          <Card>
            <div className="eyebrow">NEW LISTING</div>
            <h2>What are you bringing?</h2>
            <NewListingForm
              commodities={commodities.map((c) => ({ id: c.id, name: c.name, emoji: c.imageEmoji }))}
              suggestions={suggestions}
            />
          </Card>

          <Card>
            <div className="eyebrow">LIVE LISTINGS · {live.length}</div>
            <h2>My produce</h2>

            {listings.length === 0 ? (
              <Empty icon="🌱">Nothing listed yet. List what you have ready and buyers in the pickup clusters see it.</Empty>
            ) : (
              listings.map((l) => {
                const allocated = l.allocations.reduce((s, a) => s + a.grams, 0);
                return (
                  <div key={l.id} className="listing-row">
                    <div>
                      <span className="crop-emoji small">{l.commodity.imageEmoji}</span>
                      <b>{l.commodity.name}</b> <Tag tone={l.grade === "IMPERFECT" ? "amber" : undefined}>Grade {l.grade}</Tag>
                      {l.prebooking && <Tag tone="green">prebooking</Tag>}
                    </div>
                    <span>
                      {kg(availableGrams(l))} of {kg(l.totalGrams)}
                      <br />
                      <small>
                        {kg(allocated)} allocated · harvested {l.harvestDate.toISOString().slice(0, 10)}
                      </small>
                    </span>
                    <strong>
                      {rupees(l.askPaisePerKg)}
                      <small>/kg</small>
                    </strong>
                    <form action={setListingStatus}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value={l.status === "ACTIVE" ? "PAUSED" : "ACTIVE"} />
                      <button className="text-btn">{l.status === "ACTIVE" ? "Pause" : "Resume"}</button>
                    </form>
                  </div>
                );
              })
            )}

            <MicroNote>
              Reserved quantity belongs to a confirmed order and cannot be sold again. Pausing hides the remaining
              quantity from buyers; it does not cancel anything already reserved.
            </MicroNote>
          </Card>
        </div>
      </Shell>
      <Footer />
    </>
  );
}

import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { marketOffers, nextWindow } from "@/lib/market";
import { prisma } from "@/lib/db";
import { kg, perKg, rupees } from "@/lib/money";
import { QuantityPicker } from "./picker";

export default async function MarketPage() {
  const session = await getSession();
  const offers = await marketOffers();
  const customer = session?.role === "CUSTOMER"
    ? await prisma.customerProfile.findUnique({ where: { userId: session.userId }, include: { cluster: true } })
    : null;

  const window = nextWindow();

  return (
    <>
      <Nav />
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s produce</h1>
            <p className="mt-1 text-sm text-inksoft">
              {customer ? (
                <>
                  Collection from <span className="text-ink">{customer.cluster.name}</span> on{" "}
                  {window.toISOString().slice(0, 10)}, between 6 pm and 9 pm.
                </>
              ) : (
                <>Sign in as a household buyer to choose quantities and place an order.</>
              )}
            </p>
          </div>
        </div>

        {offers.length === 0 ? (
          <Empty>No farmer has produce listed for this window yet.</Empty>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <Card key={o.commodity.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl">{o.commodity.imageEmoji}</div>
                    <h2 className="mt-1 text-base font-semibold">{o.commodity.name}</h2>
                    <p className="text-xs text-inksoft">
                      {o.farmCount} farm{o.farmCount > 1 ? "s" : ""} · {o.villages.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-lg font-semibold">{perKg(o.stack.landedPaisePerKg)}</div>
                    {o.stack.referencePaisePerKg > 0 && (
                      <div className="tabular text-xs text-inksoft line-through">{perKg(o.stack.referencePaisePerKg)}</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.grades.map((g) => (
                    <Badge key={g} tone={g === "IMPERFECT" ? "warn" : "neutral"}>
                      Grade {g}
                    </Badge>
                  ))}
                  <Badge tone="good">{kg(o.availableGrams)} available</Badge>
                </div>

                <dl className="tabular mt-3 space-y-1 border-t border-line pt-3 text-xs text-inksoft">
                  <div className="flex justify-between">
                    <dt>Farmer receives</dt>
                    <dd className="font-medium text-brand">{perKg(o.stack.farmerPaisePerKg)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Transport, packing, fee</dt>
                    <dd>{rupees(o.stack.logisticsPaise + o.stack.handlingPaise + o.stack.siteFeePaise)}/kg</dd>
                  </div>
                  {o.stack.savingVsReferencePaise > 0 && (
                    <div className="flex justify-between text-brand">
                      <dt>Cheaper than the quick-commerce rate by</dt>
                      <dd>{rupees(o.stack.savingVsReferencePaise)}/kg</dd>
                    </div>
                  )}
                </dl>

                {customer ? (
                  <div className="mt-3">
                    <QuantityPicker
                      commodityId={o.commodity.id}
                      stepGrams={o.commodity.stepGrams}
                      minGrams={o.commodity.minOrderGrams}
                      maxGrams={o.availableGrams}
                      pricePaisePerKg={o.stack.landedPaisePerKg}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-inksoft">Sign in to buy.</p>
                )}
              </Card>
            ))}
          </div>
        )}

        <SourceNote>
          The struck-through price is an assumed quick-commerce rate for the same commodity used as a comparison; it
          is not scraped live. The price you pay is built from the farmer&apos;s accepted rate plus the quoted
          transport, packing and site fee, and every line is itemised on the basket before you confirm.
        </SourceNote>
      </Shell>
    </>
  );
}

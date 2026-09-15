import Link from "next/link";
import { Nav, Shell } from "@/components/nav";
import { BillBar, Card, Empty, SourceNote } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getOrCreateBasket } from "@/lib/market";
import { priceStack } from "@/lib/pricing";
import { availableGrams } from "@/lib/farmer";
import { prisma } from "@/lib/db";
import { kg, perKg, rupees } from "@/lib/money";
import { ECONOMICS } from "@/lib/config";
import { removeLine } from "@/app/actions/basket";
import { TierChoice } from "./tier";

export default async function CartPage() {
  const session = await requireRole("CUSTOMER");
  const basket = await getOrCreateBasket(session.userId);
  if (!basket) return null;
  const { order } = basket;

  const cluster = order.cluster;
  const lots = await prisma.listing.findMany({ where: { status: "ACTIVE" } });

  const lines = order.lines.map((line) => {
    const usable = lots
      .filter((l) => l.commodityId === line.commodityId && availableGrams(l) > 0)
      .sort((a, b) => a.askPaisePerKg - b.askPaisePerKg);
    const stack = priceStack({
      grams: line.grams,
      farmerPaisePerKg: usable[0]?.askPaisePerKg ?? line.pricePaisePerKg,
      referencePaisePerKg: line.commodity.quickCommercePaisePerKg,
      perOrderHandlingPaise: 0,
    });
    return { line, stack };
  });

  const sum = (pick: (s: (typeof lines)[number]["stack"]) => number) => lines.reduce((s, l) => s + pick(l.stack), 0);
  const farmerProceeds = sum((s) => s.farmerProceedsPaise);
  const logistics = sum((s) => s.logisticsPaise);
  const handlingLines = sum((s) => s.handlingPaise);
  const siteFee = sum((s) => s.siteFeePaise);
  const goods = sum((s) => s.totalPaise);
  const referenceTotal = sum((s) => (s.referencePaisePerKg ? Math.round((s.referencePaisePerKg * s.grams) / 1000) : 0));

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Basket</h1>
        <p className="mt-1 text-sm text-inksoft">
          For the run on {order.windowDate.toISOString().slice(0, 10)} to {cluster.name}.
        </p>

        {lines.length === 0 ? (
          <div className="mt-5">
            <Empty>
              Nothing in the basket yet. <Link href="/market" className="text-brand">Browse today&apos;s produce →</Link>
            </Empty>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_minmax(0,360px)]">
            <Card title="Items">
              <ul className="divide-y divide-line">
                {lines.map(({ line, stack }) => (
                  <li key={line.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <div className="text-sm font-medium">
                        {line.commodity.imageEmoji} {line.commodity.name}
                      </div>
                      <div className="tabular text-xs text-inksoft">
                        {kg(line.grams)} at {perKg(stack.landedPaisePerKg)} · farmer receives{" "}
                        {perKg(stack.farmerPaisePerKg)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-sm font-semibold">{rupees(stack.totalPaise)}</span>
                      <form action={removeLine}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <button className="rounded-lg border border-line px-2.5 py-1.5 text-xs hover:bg-panel2">Remove</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-4">
              <Card title="What you are paying for">
                <BillBar
                  parts={[
                    { label: "Farmers", paise: farmerProceeds, color: "var(--brand)" },
                    { label: "Transport", paise: logistics, color: "#6b8cae" },
                    { label: "Packing and pickup point", paise: handlingLines + cluster.hostCommissionPaise, color: "var(--accent)" },
                    { label: "Site fee", paise: siteFee, color: "#8a7fae" },
                  ]}
                />
                <TierChoice
                  goodsPaise={goods}
                  hostCommissionPaise={cluster.hostCommissionPaise}
                  lastLegFeePaise={cluster.lastLegFeePaise}
                  clusterName={cluster.name}
                  referenceTotalPaise={referenceTotal}
                  farmerProceedsPaise={farmerProceeds}
                  minimumOrderPaise={ECONOMICS.MIN_ORDER_VALUE_PAISE}
                  freeLastLegAbovePaise={ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE}
                />
                <SourceNote>
                  Payment is a sandbox authorisation for this demonstration. No money is collected, no escrow is
                  operated, and the farmer&apos;s share is recorded per farm so it can be settled individually.
                </SourceNote>
              </Card>
            </div>
          </div>
        )}
      </Shell>
    </>
  );
}

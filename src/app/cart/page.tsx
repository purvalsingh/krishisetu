import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Arrow, Card, MicroNote, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { clusterFill, getOrCreateBasket } from "@/lib/market";
import { priceStack } from "@/lib/pricing";
import { availableGrams } from "@/lib/farmer";
import { prisma } from "@/lib/db";
import { ECONOMICS } from "@/lib/config";
import { kg, rupees } from "@/lib/money";
import { removeLine } from "@/app/actions/basket";
import { TierChoice } from "./tier";
import { ShareRun } from "@/components/share-run";

export default async function CartPage() {
  const session = await requireRole("CUSTOMER");
  const basket = await getOrCreateBasket(session.userId);
  if (!basket) return null;
  const { order } = basket;
  const cluster = order.cluster;

  const lots = await prisma.listing.findMany({ where: { status: "ACTIVE" } });
  const fill = await clusterFill(cluster.id, order.windowDate);

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
  const handling = sum((s) => s.handlingPaise);
  const siteFee = sum((s) => s.siteFeePaise);
  const goods = sum((s) => s.totalPaise);
  const referenceTotal = sum((s) => (s.referencePaisePerKg ? Math.round((s.referencePaisePerKg * s.grams) / 1000) : 0));

  const split = [
    { label: "Farmers", paise: farmerProceeds, color: "var(--green)" },
    { label: "Transport", paise: logistics, color: "#6b8cae" },
    { label: "Packing & pickup point", paise: handling + cluster.hostCommissionPaise, color: "var(--amber)" },
    { label: "Site fee", paise: siteFee, color: "#8a7fae" },
  ];
  const splitTotal = split.reduce((s, p) => s + p.paise, 0) || 1;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="HOUSEHOLD BUYER · BASKET"
          title="What you are paying for"
          subtitle={`The farmer's rate stays visible before every shared cost. For the run on ${order.windowDate.toISOString().slice(0, 10)} to ${cluster.name}.`}
          action={
            <Link href="/market" className="text-link">
              Continue shopping <Arrow />
            </Link>
          }
        />

        {lines.length === 0 ? (
          <div className="empty">
            <span>🧺</span>
            <h2>Your basket is empty</h2>
            <p>Choose produce from today&apos;s pooled run.</p>
            <Link href="/market" className="btn btn-primary">
              Browse produce
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <Card>
              <div className="eyebrow">YOUR ITEMS · {lines.length}</div>
              {lines.map(({ line, stack }) => (
                <div key={line.id} className="cart-row">
                  <span className="crop-emoji">{line.commodity.imageEmoji}</span>
                  <span>
                    <b>{line.commodity.name}</b>
                    <small>
                      {kg(line.grams)} · <span>{rupees(stack.landedPaisePerKg)}</span>/kg
                    </small>
                    <small>
                      Farmer receives <span>{rupees(stack.farmerPaisePerKg)}</span>/kg
                    </small>
                  </span>
                  <strong>{rupees(stack.totalPaise)}</strong>
                  <form action={removeLine}>
                    <input type="hidden" name="lineId" value={line.id} />
                    <button className="text-btn danger">Remove</button>
                  </form>
                </div>
              ))}
              <MicroNote>
                An item may be filled from more than one farm when no single lot covers it. Each farm&apos;s share is
                recorded separately, and the grade you chose is honoured.
              </MicroNote>
            </Card>

            <Card className="summary">
              <div className="eyebrow">ITEMISED BILL</div>
              <div className="bars">
                <div className="bar">
                  {split.map((p) => (
                    <span key={p.label} style={{ width: `${(p.paise / splitTotal) * 100}%`, background: p.color }} />
                  ))}
                </div>
                <div className="legend">
                  {split.map((p) => (
                    <span key={p.label}>
                      <i style={{ background: p.color }} />
                      {p.label} {Math.round((p.paise / splitTotal) * 100)}%
                    </span>
                  ))}
                </div>
              </div>

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

              <MicroNote>
                Payment is a sandbox authorisation for this demonstration. No money is collected, no escrow is
                operated, and each farmer&apos;s share is recorded per farm so it can be settled individually.
              </MicroNote>
            </Card>

            <ShareRun
              clusterId={cluster.id}
              clusterName={cluster.name}
              fraction={fill.fraction}
              shortfallKg={kg(fill.shortfallGrams)}
              willGo={fill.willGo}
              minimumPercent={fill.minimumFillFraction * 100}
            />
          </div>
        )}
      </Shell>
      <Footer />
    </>
  );
}

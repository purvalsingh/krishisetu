import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, Empty, MicroNote, PageTitle, Status, Tag } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketOffers, nextWindow } from "@/lib/market";
import { kg, perKg, rupees } from "@/lib/money";
import { QuantityPicker } from "./picker";

export default async function MarketPage() {
  const session = await getSession();
  const offers = await marketOffers();

  const customer =
    session?.role === "CUSTOMER"
      ? await prisma.customerProfile.findUnique({ where: { userId: session.userId }, include: { cluster: true } })
      : null;

  const basketCount = customer
    ? await prisma.orderLine.count({ where: { order: { customerId: customer.id, status: "DRAFT" } } })
    : 0;

  const window = nextWindow();

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow={customer ? `HOUSEHOLD BUYER · ${customer.cluster.name.replace(" pickup point", "").toUpperCase()}` : "OPEN CATALOGUE"}
          title="Today's produce"
          subtitle={
            customer ? (
              <>
                Collection from {customer.cluster.name} on {window.toISOString().slice(0, 10)}, between 6 pm and 9 pm.
              </>
            ) : (
              <>Sign in as a household buyer to choose quantities and place an order.</>
            )
          }
          action={
            customer ? (
              <Link href="/cart" className="basket-link">
                <BasketIcon /> Basket <b>{basketCount}</b>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Sign in to buy
              </Link>
            )
          }
        />

        {offers.length === 0 ? (
          <Empty icon="🥬">No farmer has produce listed for this window yet.</Empty>
        ) : (
          <div className="market-grid">
            {offers.map((o) => {
              const freshest = o.grades.includes("A");
              return (
                <Card key={o.commodity.id} className="product-card">
                  <div className="product-top">
                    <span className="crop-emoji">{o.commodity.imageEmoji}</span>
                    <Status tone="good">{kg(o.availableGrams)} available</Status>
                  </div>

                  <h2>{o.commodity.name}</h2>
                  <p>
                    {o.farmCount} farm{o.farmCount > 1 ? "s" : ""} · {o.villages.join(", ")}
                  </p>

                  <div className="price-line">
                    <strong>
                      {rupees(o.stack.landedPaisePerKg)}
                      <small>/kg</small>
                    </strong>
                    {o.stack.referencePaisePerKg > 0 && <del>{rupees(o.stack.referencePaisePerKg)}</del>}
                  </div>

                  <div className="grade">
                    {o.grades.map((g) => (
                      <Tag key={g}>Grade {g}</Tag>
                    ))}
                    {freshest && <Tag>Picked within {o.commodity.freshnessHours} h</Tag>}
                  </div>

                  <div className="product-breakdown">
                    <span>
                      Farmer receives /kg <span>{rupees(o.stack.farmerPaisePerKg)}</span>
                    </span>
                    <span>
                      Transport, packing, fee /kg{" "}
                      <span>
                        {rupees(o.stack.logisticsPaise + o.stack.handlingPaise + o.stack.siteFeePaise)}
                      </span>
                    </span>
                    {o.stack.savingVsReferencePaise > 0 && (
                      <b>
                        Cheaper than quick-commerce by /kg <span>{rupees(o.stack.savingVsReferencePaise)}</span>
                      </b>
                    )}
                  </div>

                  {customer ? (
                    <QuantityPicker
                      commodityId={o.commodity.id}
                      stepGrams={o.commodity.stepGrams}
                      minGrams={o.commodity.minOrderGrams}
                      maxGrams={o.availableGrams}
                      pricePaisePerKg={o.stack.landedPaisePerKg}
                    />
                  ) : (
                    <p className="micro-note">Sign in to buy.</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <MicroNote>
          The struck-through price is an assumed quick-commerce rate for the same commodity, used as a comparison; it
          is not scraped live. What you pay is built upward from the farmer&apos;s accepted rate, and every line is
          itemised on the basket before you confirm. Prices shown per {perKg(100).replace("₹1.00", "kilogram")}.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

function BasketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

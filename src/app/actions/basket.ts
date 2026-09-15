"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { availableGrams } from "@/lib/farmer";
import { getOrCreateBasket } from "@/lib/market";
import { lastLegFeeFor, priceStack } from "@/lib/pricing";
import { ECONOMICS } from "@/lib/config";

export async function addToBasket(formData: FormData) {
  const session = await requireRole("CUSTOMER");
  const commodityId = String(formData.get("commodityId"));
  const grams = Math.round(Number(formData.get("grams")));
  if (!commodityId || !Number.isFinite(grams) || grams <= 0) return;

  const basket = await getOrCreateBasket(session.userId);
  if (!basket) return;

  const commodity = await prisma.commodity.findUnique({ where: { id: commodityId } });
  if (!commodity) return;
  if (grams < commodity.minOrderGrams || grams % commodity.stepGrams !== 0) return;

  // Quote from the cheapest lot that still has stock. The actual farmer lots are
  // chosen when the run is planned, and the buyer's quoted price does not change.
  const lots = await prisma.listing.findMany({ where: { commodityId, status: "ACTIVE" } });
  const usable = lots.filter((l) => availableGrams(l) > 0).sort((a, b) => a.askPaisePerKg - b.askPaisePerKg);
  if (!usable.length) return;

  const stack = priceStack({
    grams,
    farmerPaisePerKg: usable[0].askPaisePerKg,
    referencePaisePerKg: commodity.quickCommercePaisePerKg,
    perOrderHandlingPaise: 0,
  });

  const existing = basket.order.lines.find((l) => l.commodityId === commodityId);
  if (existing) {
    await prisma.orderLine.update({
      where: { id: existing.id },
      data: { grams: existing.grams + grams, pricePaisePerKg: stack.landedPaisePerKg },
    });
  } else {
    await prisma.orderLine.create({
      data: {
        orderId: basket.order.id,
        commodityId,
        grams,
        grade: "A",
        pricePaisePerKg: stack.landedPaisePerKg,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/market");
}

export async function removeLine(formData: FormData) {
  await requireRole("CUSTOMER");
  await prisma.orderLine.delete({ where: { id: String(formData.get("lineId")) } });
  revalidatePath("/cart");
}

export async function placeOrder(formData: FormData) {
  const session = await requireRole("CUSTOMER");
  const tier = String(formData.get("tier")) === "LAST_LEG" ? "LAST_LEG" : "CLUSTER_PICKUP";

  const basket = await getOrCreateBasket(session.userId);
  if (!basket || basket.order.lines.length === 0) return;

  const cluster = basket.order.cluster;

  let farmerProceeds = 0;
  let logistics = 0;
  let handling = 0;
  let siteFee = 0;
  let total = 0;

  for (const line of basket.order.lines) {
    const lots = await prisma.listing.findMany({ where: { commodityId: line.commodityId, status: "ACTIVE" } });
    const usable = lots.filter((l) => availableGrams(l) > 0).sort((a, b) => a.askPaisePerKg - b.askPaisePerKg);
    if (!usable.length) continue;

    const stack = priceStack({
      grams: line.grams,
      farmerPaisePerKg: usable[0].askPaisePerKg,
      referencePaisePerKg: line.commodity.quickCommercePaisePerKg,
      perOrderHandlingPaise: 0,
    });
    farmerProceeds += stack.farmerProceedsPaise;
    logistics += stack.logisticsPaise;
    handling += stack.handlingPaise;
    siteFee += stack.siteFeePaise;
    total += stack.totalPaise;

    await prisma.orderLine.update({ where: { id: line.id }, data: { pricePaisePerKg: stack.landedPaisePerKg } });
  }

  // The door-delivery waiver is decided on the value of the goods, so it is
  // applied after every line has been priced.
  const perOrderHandling =
    cluster.hostCommissionPaise + (tier === "LAST_LEG" ? lastLegFeeFor(total, cluster.lastLegFeePaise) : 0);
  handling += perOrderHandling;
  total += perOrderHandling;

  // The per-order costs cannot be recovered from a basket this small, and the
  // shortfall would otherwise have to come out of someone's margin.
  if (total < ECONOMICS.MIN_ORDER_VALUE_PAISE) return;

  await prisma.order.update({
    where: { id: basket.order.id },
    data: {
      tier,
      status: "CONFIRMED",
      // Sandbox payment. No real collection happens and no escrow is operated.
      paymentStatus: "AUTHORISED",
      paymentRef: `sandbox_${basket.order.id}`,
      farmerProceedsPaise: farmerProceeds,
      logisticsPaise: logistics,
      handlingPaise: handling,
      siteFeePaise: siteFee,
      totalPaise: total,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: session.userId, action: "order.confirm", subject: basket.order.id, detail: { tier, total } },
  });

  revalidatePath("/orders");
  revalidatePath("/admin");
  redirect("/orders");
}

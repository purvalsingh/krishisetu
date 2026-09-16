/** Pulls the figures the presentation quotes, so no slide invents a number. */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { ECONOMICS } from "../src/lib/config";
import { priceStack } from "../src/lib/pricing";

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "BATCHED", "COLLECTED", "IN_TRANSIT", "READY_FOR_PICKUP", "DELIVERED"] } },
    include: { lines: true },
  });
  const batches = await prisma.batch.findMany({ where: { status: { notIn: ["CANCELLED"] } } });
  const b = batches[0];

  const farmer = orders.reduce((s, o) => s + o.farmerProceedsPaise, 0);
  const buyer = orders.reduce((s, o) => s + o.totalPaise, 0);
  const fee = orders.reduce((s, o) => s + o.siteFeePaise, 0);
  const quoted = orders.reduce((s, o) => s + o.logisticsPaise, 0);
  const actual = batches.reduce((s, x) => s + x.transportCostPaise, 0);
  const n = orders.length || 1;
  const s = Math.round(fee / n);
  const contribution = s - ECONOMICS.VARIABLE_PLATFORM_COST_PAISE_PER_ORDER;

  const example = priceStack({ grams: 1000, farmerPaisePerKg: 3400, referencePaisePerKg: 5500, perOrderHandlingPaise: 0 });

  console.log(JSON.stringify({
    orders: orders.length,
    farmerSharePct: +((farmer / buyer) * 100).toFixed(1),
    buyerTotalRupees: +(buyer / 100).toFixed(2),
    farmerTotalRupees: +(farmer / 100).toFixed(2),
    feeRupees: +(fee / 100).toFixed(2),
    quotedLogisticsRupees: +(quoted / 100).toFixed(2),
    actualTransportRupees: +(actual / 100).toFixed(2),
    feePerOrderRupees: +(s / 100).toFixed(2),
    variablePerOrderRupees: ECONOMICS.VARIABLE_PLATFORM_COST_PAISE_PER_ORDER / 100,
    contributionRupees: +(contribution / 100).toFixed(2),
    breakEvenOrders: contribution > 0 ? Math.ceil(ECONOMICS.MONTHLY_FIXED_COST_PAISE / contribution) : null,
    run: b && {
      orders: await prisma.order.count({ where: { batchId: b.id } }),
      loadKg: +(b.loadGrams / 1000).toFixed(2),
      capacityKg: +(b.capacityGrams / 1000).toFixed(0),
      fillPct: +(b.fillFraction * 100).toFixed(0),
      distanceKm: b.distanceKm,
      transportRupees: +(b.transportCostPaise / 100).toFixed(2),
      transportPerKg: +((b.transportCostPaise / 100) / (b.loadGrams / 1000)).toFixed(2),
      stops: await prisma.batchStop.count({ where: { batchId: b.id } }),
    },
    example: {
      farmerPerKg: example.farmerPaisePerKg / 100,
      landedPerKg: +(example.landedPaisePerKg / 100).toFixed(2),
      referencePerKg: example.referencePaisePerKg / 100,
      transportPerKg: +(example.logisticsPaise / 100).toFixed(2),
      handlingPerKg: +(example.handlingPaise / 100).toFixed(2),
      feePerKg: +(example.siteFeePaise / 100).toFixed(2),
      farmerSharePct: +((example.farmerProceedsPaise / example.totalPaise) * 100).toFixed(0),
    },
    policy: {
      minFillPct: ECONOMICS.MIN_FILL_FRACTION * 100,
      minOrderRupees: ECONOMICS.MIN_ORDER_VALUE_PAISE / 100,
      freeDeliveryAboveRupees: ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE / 100,
      pickupPointFee: 10,
      doorFee: 20,
    },
  }, null, 2));
  await prisma.$disconnect();
}
main();

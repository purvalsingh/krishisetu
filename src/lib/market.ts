import { prisma } from "./db";
import { availableGrams } from "./farmer";
import { priceStack } from "./pricing";

/**
 * What a buyer can actually purchase right now: one row per commodity and
 * grade, priced from the cheapest farmer lot that has stock left.
 */
export async function marketOffers() {
  const commodities = await prisma.commodity.findMany({ orderBy: { name: "asc" } });
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: { farmer: { include: { user: true } } },
  });

  return commodities
    .map((commodity) => {
      const lots = listings
        .filter((l) => l.commodityId === commodity.id && availableGrams(l) > 0)
        .sort((a, b) => a.askPaisePerKg - b.askPaisePerKg);
      if (!lots.length) return null;

      const cheapest = lots[0];
      const stock = lots.reduce((s, l) => s + availableGrams(l), 0);
      const stack = priceStack({
        grams: 1000,
        farmerPaisePerKg: cheapest.askPaisePerKg,
        referencePaisePerKg: commodity.quickCommercePaisePerKg,
        perOrderHandlingPaise: 0,
      });

      return {
        commodity,
        stack,
        availableGrams: stock,
        farmCount: new Set(lots.map((l) => l.farmerId)).size,
        grades: [...new Set(lots.map((l) => l.grade))],
        cheapestAskPaisePerKg: cheapest.askPaisePerKg,
        villages: [...new Set(lots.map((l) => l.farmer.village))].slice(0, 3),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/** The next collection window: tomorrow morning, in UTC. */
export function nextWindow(from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(6, 0, 0, 0);
  return d;
}

/** The buyer's open basket for the next window, created on first use. */
export async function getOrCreateBasket(userId: string) {
  const customer = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { cluster: true },
  });
  if (!customer) return null;

  const window = nextWindow();
  const existing = await prisma.order.findFirst({
    where: { customerId: customer.id, status: "DRAFT" },
    include: { lines: { include: { commodity: true } }, cluster: true },
  });
  if (existing) return { customer, order: existing };

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      clusterId: customer.clusterId,
      windowDate: window,
      status: "DRAFT",
    },
    include: { lines: { include: { commodity: true } }, cluster: true },
  });
  return { customer, order };
}

/**
 * How full the next run for a cluster is.
 *
 * This is the number a neighbourhood can actually act on: a run only goes when
 * the load is worth moving, so "we are 43% full, 180 kg to go" is an invitation
 * rather than a marketing line.
 */
export async function clusterFill(clusterId: string, windowDate = nextWindow()) {
  const { ECONOMICS } = await import("./config");

  const [orders, capacities] = await Promise.all([
    prisma.order.findMany({
      where: { clusterId, windowDate, status: { in: ["CONFIRMED", "BATCHED"] } },
      include: { lines: true },
    }),
    prisma.transporterProfile.findMany({ select: { capacityGrams: true } }),
  ]);

  const grams = orders.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.grams, 0), 0);
  const sorted = capacities.map((c) => c.capacityGrams).sort((a, b) => a - b);
  // The vehicle that would actually be hired is the smallest one that fits.
  const vehicleGrams = sorted.find((c) => c >= grams) ?? sorted.at(-1) ?? 0;

  const targetGrams = Math.ceil(vehicleGrams * ECONOMICS.MIN_FILL_FRACTION);
  return {
    windowDate,
    orders: orders.length,
    grams,
    vehicleGrams,
    targetGrams,
    shortfallGrams: Math.max(0, targetGrams - grams),
    fraction: vehicleGrams ? grams / vehicleGrams : 0,
    willGo: grams >= targetGrams,
    minimumFillFraction: ECONOMICS.MIN_FILL_FRACTION,
  };
}

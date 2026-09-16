import { prisma } from "./db";
import type { NotificationKind } from "@prisma/client";

/**
 * In-app notices.
 *
 * Deliberately not SMS or email: both need a provider account and consent
 * handling that this build does not have, and a notice nobody can act on is
 * worse than none. Everything written here is readable on the recipient's own
 * screens, and says what changed and what they should do about it.
 */

type Notice = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
};

export async function notify(notices: Notice[]) {
  if (!notices.length) return;
  await prisma.notification.createMany({ data: notices });
}

/** Everyone who needs to know that a run was planned for a cluster and window. */
export async function notifyRunPlanned(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      cluster: true,
      transporter: { include: { user: true } },
      stops: true,
      orders: { include: { customer: true } },
      // Allocations reach the farmer through the order lines they fill.
    },
  });
  if (!batch) return;

  const allocations = await prisma.allocation.findMany({
    where: { orderLine: { order: { batchId } } },
    include: { farmer: true, listing: { include: { commodity: true } } },
  });

  const date = batch.windowDate.toISOString().slice(0, 10);
  const notices: Notice[] = [];

  // One notice per farmer, naming their stop and what is being collected.
  const byFarmer = new Map<string, { userId: string; grams: number; crops: Set<string> }>();
  for (const a of allocations) {
    const entry = byFarmer.get(a.farmerId) ?? { userId: a.farmer.userId, grams: 0, crops: new Set<string>() };
    entry.grams += a.grams;
    entry.crops.add(a.listing.commodity.name);
    byFarmer.set(a.farmerId, entry);
  }

  for (const [farmerId, entry] of byFarmer) {
    const stop = batch.stops.find((s) => s.refId === farmerId && s.kind === "PICKUP");
    notices.push({
      userId: entry.userId,
      kind: "PICKUP_REMINDER",
      title: `Pickup on ${date}`,
      body: `${(entry.grams / 1000).toFixed(2)} kg of ${[...entry.crops].join(", ")} will be collected from your farm${
        stop ? ` as stop ${stop.seq} of ${batch.stops.length}, about ${Math.floor(stop.etaMinutes / 60)} h ${stop.etaMinutes % 60} min into the run` : ""
      }. Have it weighed and ready.`,
      link: "/farmer",
    });
  }

  if (batch.transporter) {
    const held = !["AWAITING_TRANSPORTER", "ACCEPTED"].includes(batch.status);
    notices.push({
      userId: batch.transporter.userId,
      kind: held ? "RUN_HELD" : "RUN_OFFERED",
      title: held ? `Run held for ${batch.cluster.name}` : `Run offered for ${date}`,
      body: held
        ? `${(batch.loadGrams / 1000).toFixed(1)} kg is only ${(batch.fillFraction * 100).toFixed(0)}% of your vehicle, below the minimum fill. It is not offered, because a half-empty trip does not pay for itself.`
        : `${(batch.loadGrams / 1000).toFixed(1)} kg over ${batch.distanceKm} km, ₹${(batch.transportCostPaise / 100).toFixed(2)}. Distance, load and payment are fixed before you accept.`,
      link: "/transporter",
    });
  }

  for (const order of batch.orders) {
    notices.push({
      userId: order.customer.userId,
      kind: "RUN_PLANNED",
      title: `Your order is on the ${date} run`,
      body: `Collection from ${batch.cluster.name} between 6 pm and 9 pm${
        order.tier === "LAST_LEG" ? ", then walked to your door during the same window" : ""
      }.`,
      link: "/orders",
    });
  }

  await notify(notices);
}

/** The run left the depot: buyers are told, and the allocation is now frozen. */
export async function notifyDispatched(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { cluster: true, orders: { include: { customer: true } } },
  });
  if (!batch) return;

  await notify(
    batch.orders.map((o) => ({
      userId: o.customer.userId,
      kind: "RUN_DISPATCHED" as const,
      title: "Your run has started",
      body: `The vehicle is collecting from the farms now and will reach ${batch.cluster.name} for the evening window.`,
      link: "/orders",
    })),
  );
}

/** A stop was handed over: the farmer at that stop is told their produce is on board. */
export async function notifyHandover(stopId: string) {
  const stop = await prisma.batchStop.findUnique({ where: { id: stopId }, include: { batch: true } });
  if (!stop || stop.kind !== "PICKUP" || !stop.refId) return;

  const farmer = await prisma.farmerProfile.findUnique({ where: { id: stop.refId } });
  if (!farmer) return;

  await notify([
    {
      userId: farmer.userId,
      kind: "HANDOVER_RECORDED",
      title: "Your produce was collected",
      body: `${(stop.grams / 1000).toFixed(2)} kg recorded at handover${stop.handoverNote ? `: ${stop.handoverNote}` : ""}. Payment is released when the run completes.`,
      link: "/farmer/earnings",
    },
  ]);
}

/** The run finished: buyers can collect, and farmer amounts are released. */
export async function notifyCompleted(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { cluster: true, orders: { include: { customer: true } } },
  });
  if (!batch) return;

  const allocations = await prisma.allocation.findMany({
    where: { orderLine: { order: { batchId } } },
    include: { farmer: true },
  });

  const perFarmer = new Map<string, { userId: string; paise: number }>();
  for (const a of allocations) {
    const entry = perFarmer.get(a.farmerId) ?? { userId: a.farmer.userId, paise: 0 };
    entry.paise += a.proceedsPaise;
    perFarmer.set(a.farmerId, entry);
  }

  await notify([
    ...batch.orders.map((o) => ({
      userId: o.customer.userId,
      kind: "READY_FOR_COLLECTION" as const,
      title: o.tier === "LAST_LEG" ? "Delivered to your door" : "Ready at your pickup point",
      body:
        o.tier === "LAST_LEG"
          ? `Your order was walked to your flat from ${batch.cluster.name}.`
          : `Collect from ${batch.cluster.name} between 6 pm and 9 pm today.`,
      link: "/orders",
    })),
    ...[...perFarmer.values()].map((f) => ({
      userId: f.userId,
      kind: "PAYMENT_RELEASED" as const,
      title: "Your payment is released",
      body: `₹${(f.paise / 100).toFixed(2)} for this run, at the rate you accepted. Nothing was deducted from it.`,
      link: "/farmer/earnings",
    })),
  ]);
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

import { prisma } from "./db";
import { ECONOMICS } from "./config";
import { availableGrams } from "./farmer";
import { proposeBatch, type CandidateListing, type CandidateOrder, type Vehicle } from "./pooling";

/** A full run touches many rows; the default five second window is too tight. */
const TRANSACTION_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

/**
 * Persists what the aggregation engine proposes.
 *
 * Reservation happens here and only here: the engine is pure, and this function
 * is the single place where a kilogram becomes spoken for. Everything runs in
 * one transaction so a half-planned run cannot exist.
 */
export async function planRun(opts: { clusterId: string; windowDate: Date; transporterId?: string }) {
  const { clusterId, windowDate } = opts;

  const [cluster, orders, listings, transporters] = await Promise.all([
    prisma.cluster.findUniqueOrThrow({ where: { id: clusterId } }),
    prisma.order.findMany({
      where: { clusterId, windowDate, status: "CONFIRMED", batchId: null },
      include: { lines: { include: { commodity: true } }, customer: { include: { user: true } } },
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      include: { farmer: { include: { user: true } }, allocations: true },
    }),
    prisma.transporterProfile.findMany({ include: { user: true } }),
  ]);

  const candidateOrders: CandidateOrder[] = orders.map((o) => ({
    id: o.id,
    buyerName: o.customer.user.name,
    createdAt: o.createdAt,
    // Orders already paid for are served ahead of newer ones. Placement is never sold.
    priority: o.paymentStatus === "AUTHORISED" || o.paymentStatus === "CAPTURED" ? 1 : 0,
    lines: o.lines.map((l) => ({
      id: l.id,
      commodityId: l.commodityId,
      grade: l.grade,
      grams: l.grams,
      freshnessHours: l.commodity.freshnessHours,
    })),
  }));

  const candidateListings: CandidateListing[] = listings
    .filter((l) => availableGrams(l) > 0)
    .map((l) => ({
      id: l.id,
      farmerId: l.farmerId,
      farmerName: l.farmer.user.name,
      village: l.farmer.village,
      lat: l.farmer.lat,
      lng: l.farmer.lng,
      commodityId: l.commodityId,
      grade: l.grade,
      availableGrams: availableGrams(l),
      askPaisePerKg: l.askPaisePerKg,
      harvestAt: l.harvestDate,
      recentSoldGrams: l.allocations.reduce((s, a) => s + a.grams, 0),
    }));

  const pool = opts.transporterId ? transporters.filter((t) => t.id === opts.transporterId) : transporters;
  const vehicles: Vehicle[] = pool.map((t) => ({
    id: t.id,
    transporterName: t.user.name,
    capacityGrams: t.capacityGrams,
    lat: t.baseLat,
    lng: t.baseLng,
    ratePaisePerKm: t.ratePaisePerKm,
    refrigerated: t.refrigerated,
  }));

  const proposal = proposeBatch({
    cluster: { id: cluster.id, name: cluster.name, lat: cluster.lat, lng: cluster.lng },
    windowDate,
    orders: candidateOrders,
    listings: candidateListings,
    vehicles,
  });

  if (!proposal.vehicle || proposal.allocations.length === 0) {
    return { proposal, batchId: null as string | null };
  }

  const buyerNames = new Map(orders.map((o) => [o.id, o.customer.user.name]));
  const orderLineOwner = new Map(orders.flatMap((o) => o.lines.map((l) => [l.id, o.id])));

  const batchId = await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.create({
      data: {
        clusterId,
        windowDate,
        status: proposal.feasible ? "AWAITING_TRANSPORTER" : "PROPOSED",
        transporterId: proposal.vehicle!.id,
        capacityGrams: proposal.capacityGrams,
        loadGrams: proposal.loadGrams,
        fillFraction: proposal.fillFraction,
        distanceKm: proposal.route?.distanceKm ?? 0,
        transportCostPaise: proposal.route?.transportCostPaise ?? 0,
        explanation: {
          lines: proposal.explanation,
          rejections: proposal.rejections.map((r) => ({ ...r, buyer: buyerNames.get(r.orderId) ?? r.orderId })),
          baselineDistanceKm: proposal.baselineDistanceKm,
          minimumFillFraction: ECONOMICS.MIN_FILL_FRACTION,
          feasible: proposal.feasible,
        },
      },
    });

    await tx.batchStop.createMany({
      data: (proposal.route?.stops ?? []).map((stop) => ({
        batchId: batch.id,
        seq: stop.seq,
        kind: stop.kind,
        label: stop.label,
        lat: stop.lat,
        lng: stop.lng,
        refId: stop.refId,
        grams: stop.grams,
        etaMinutes: stop.etaMinutes,
        loadAfterGrams: stop.loadAfterGrams,
      })),
    });

    await tx.allocation.createMany({
      data: proposal.allocations.map((a) => ({
        orderLineId: a.orderLineId,
        listingId: a.listingId,
        farmerId: a.farmerId,
        grams: a.grams,
        proceedsPaise: a.proceedsPaise,
      })),
    });

    // The reservation is what stops the same kilogram being sold twice. Grams are
    // summed per listing first: a run can carry hundreds of allocations, and one
    // update per allocation would run the transaction past its timeout.
    const reservedPerListing = new Map<string, number>();
    for (const a of proposal.allocations)
      reservedPerListing.set(a.listingId, (reservedPerListing.get(a.listingId) ?? 0) + a.grams);
    for (const [listingId, grams] of reservedPerListing)
      await tx.listing.update({ where: { id: listingId }, data: { reservedGrams: { increment: grams } } });

    const acceptedOrderIds = [...new Set(proposal.allocations.map((a) => orderLineOwner.get(a.orderLineId)!))];
    await tx.order.updateMany({
      where: { id: { in: acceptedOrderIds } },
      data: { batchId: batch.id, status: "BATCHED" },
    });

    await tx.auditLog.create({
      data: {
        action: "batch.plan",
        subject: batch.id,
        detail: {
          cluster: cluster.name,
          accepted: acceptedOrderIds.length,
          rejected: proposal.rejections.length,
          fill: proposal.fillFraction,
        },
      },
    });

    return batch.id;
  }, TRANSACTION_OPTIONS);

  return { proposal, batchId };
}

/**
 * Releases a batch that has not been dispatched: reservations go back, orders
 * return to confirmed, and the batch is cancelled. Accepted farmer proceeds are
 * untouched because nothing has been settled yet.
 */
export async function releaseBatch(batchId: string) {
  const batch = await prisma.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: { orders: { include: { lines: { include: { allocations: true } } } } },
  });
  if (batch.dispatchedAt) throw new Error("A dispatched run cannot be released automatically");

  const allocations = batch.orders.flatMap((o) => o.lines.flatMap((l) => l.allocations));
  const perListing = new Map<string, number>();
  for (const a of allocations) perListing.set(a.listingId, (perListing.get(a.listingId) ?? 0) + a.grams);

  await prisma.$transaction(async (tx) => {
    for (const [listingId, grams] of perListing)
      await tx.listing.update({ where: { id: listingId }, data: { reservedGrams: { decrement: grams } } });
    await tx.allocation.deleteMany({ where: { id: { in: allocations.map((a) => a.id) } } });
    await tx.order.updateMany({ where: { batchId }, data: { batchId: null, status: "CONFIRMED" } });
    await tx.batchStop.deleteMany({ where: { batchId } });
    await tx.batch.update({ where: { id: batchId }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({ data: { action: "batch.release", subject: batchId, detail: {} } });
  }, TRANSACTION_OPTIONS);
}

/** Marks the run delivered: reservations become completed quantities and farmers are settled. */
export async function completeBatch(batchId: string) {
  const batch = await prisma.batch.findUniqueOrThrow({
    where: { id: batchId },
    include: { orders: { include: { lines: { include: { allocations: true } } } } },
  });

  const allocations = batch.orders.flatMap((o) => o.lines.flatMap((l) => l.allocations));
  const perListing = new Map<string, number>();
  for (const a of allocations) perListing.set(a.listingId, (perListing.get(a.listingId) ?? 0) + a.grams);

  const doorstep = batch.orders.filter((o) => o.tier === "LAST_LEG").map((o) => o.id);
  const collected = batch.orders.filter((o) => o.tier !== "LAST_LEG").map((o) => o.id);

  await prisma.$transaction(async (tx) => {
    // Grouped by listing and by order status: a full run carries hundreds of
    // allocations, and one write per allocation exceeds the transaction timeout.
    for (const [listingId, grams] of perListing)
      await tx.listing.update({
        where: { id: listingId },
        data: { reservedGrams: { decrement: grams }, completedGrams: { increment: grams } },
      });

    await tx.allocation.updateMany({ where: { id: { in: allocations.map((a) => a.id) } }, data: { settled: true } });
    await tx.order.updateMany({
      where: { id: { in: doorstep } },
      data: { status: "DELIVERED", paymentStatus: "CAPTURED" },
    });
    await tx.order.updateMany({
      where: { id: { in: collected } },
      data: { status: "READY_FOR_PICKUP", paymentStatus: "CAPTURED" },
    });
    await tx.batch.update({ where: { id: batchId }, data: { status: "COMPLETED" } });
    await tx.auditLog.create({ data: { action: "batch.complete", subject: batchId, detail: {} } });
  }, TRANSACTION_OPTIONS);
}

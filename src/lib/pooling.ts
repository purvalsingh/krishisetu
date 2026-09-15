import { ECONOMICS, REJECTION } from "./config";
import { roadKm } from "./geo";
import { planRoute, type RoutePlan } from "./routing";

/**
 * The aggregation engine. It decides which farmer lots and which buyer orders
 * travel together, and it must be able to say why anything was left out.
 *
 * Inputs are plain data so the whole engine is testable without a database.
 */

export type CandidateListing = {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  lat: number;
  lng: number;
  commodityId: string;
  grade: "A" | "B" | "IMPERFECT";
  availableGrams: number;
  askPaisePerKg: number;
  harvestAt: Date;
  /** Completed kilograms sold by this farmer recently, used only for fair rotation. */
  recentSoldGrams: number;
};

export type CandidateOrderLine = {
  id: string;
  commodityId: string;
  grade: "A" | "B" | "IMPERFECT";
  grams: number;
  freshnessHours: number;
};

export type CandidateOrder = {
  id: string;
  buyerName: string;
  lines: CandidateOrderLine[];
  createdAt: Date;
  /** Prebooked and deadline-bound orders are served before newer walk-up orders. */
  priority: number;
};

export type Vehicle = {
  id: string;
  transporterName: string;
  capacityGrams: number;
  lat: number;
  lng: number;
  ratePaisePerKm: number;
  refrigerated: boolean;
};

export type PlannedAllocation = {
  orderId: string;
  orderLineId: string;
  listingId: string;
  farmerId: string;
  farmerName: string;
  grams: number;
  askPaisePerKg: number;
  proceedsPaise: number;
};

export type Rejection = { orderId: string; reason: string; detail?: string };

export type BatchProposal = {
  feasible: boolean;
  acceptedOrderIds: string[];
  rejections: Rejection[];
  allocations: PlannedAllocation[];
  loadGrams: number;
  capacityGrams: number;
  fillFraction: number;
  route: RoutePlan | null;
  /** Fixed-order route over the same stops, for an honest comparison. */
  baselineDistanceKm: number | null;
  vehicle: Vehicle | null;
  explanation: string[];
};

const gradeRank = { A: 3, B: 2, IMPERFECT: 1 } as const;

/** A lot satisfies a request when it is the same commodity and at least the requested grade. */
const gradeSatisfies = (lot: CandidateListing["grade"], want: CandidateOrderLine["grade"]) =>
  gradeRank[lot] >= gradeRank[want];

export function proposeBatch(opts: {
  cluster: { id: string; name: string; lat: number; lng: number };
  windowDate: Date;
  orders: CandidateOrder[];
  listings: CandidateListing[];
  vehicles: Vehicle[];
  now?: Date;
}): BatchProposal {
  const now = opts.now ?? new Date();
  const explanation: string[] = [];
  const rejections: Rejection[] = [];

  // Acceptance is capped by the largest vehicle on offer, and the run is then
  // downsized to the smallest vehicle that can actually carry what was accepted.
  // Hiring a 1.2 tonne truck for 500 kg is exactly the waste this engine exists
  // to remove.
  const sortedByCapacity = [...opts.vehicles].sort((a, b) => a.capacityGrams - b.capacityGrams);
  const largest = sortedByCapacity.at(-1) ?? null;
  if (!largest) {
    return {
      feasible: false,
      acceptedOrderIds: [],
      rejections: opts.orders.map((o) => ({ orderId: o.id, reason: "No vehicle is available for this window" })),
      allocations: [],
      loadGrams: 0,
      capacityGrams: 0,
      fillFraction: 0,
      route: null,
      baselineDistanceKm: null,
      vehicle: null,
      explanation: ["No transporter has offered capacity for this cluster and window."],
    };
  }
  let vehicle = largest;

  // Remaining stock is tracked locally so two orders can never be promised the same kilogram.
  const stock = new Map(opts.listings.map((l) => [l.id, l.availableGrams]));

  // Lots outside the service radius are never considered, whatever their price.
  const inRadius = opts.listings.filter((l) => {
    const d = roadKm(l, opts.cluster);
    if (d > ECONOMICS.SERVICE_RADIUS_KM) {
      stock.delete(l.id);
      return false;
    }
    return true;
  });

  const accepted: string[] = [];
  const allocations: PlannedAllocation[] = [];
  /** Farms already being visited. Collecting more from them is free; a new farm is a new stop. */
  const farmsOnRoute = new Set<string>();
  let load = 0;

  // Deadline-bound work first, then oldest order first. Placement is never sold.
  const queue = [...opts.orders].sort(
    (a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const order of queue) {
    const draft: PlannedAllocation[] = [];
    let ok = true;
    let reason = "";
    let detail = "";

    for (const line of order.lines) {
      const matching = inRadius.filter(
        (l) => l.commodityId === line.commodityId && gradeSatisfies(l.grade, line.grade),
      );
      if (!matching.length) {
        ok = false;
        reason = REJECTION.NO_COMPATIBLE_LOT;
        break;
      }

      const compatible = matching
        .filter((l) => (stock.get(l.id) ?? 0) > 0)
        // A farm already on the route costs nothing extra to collect from, while a
        // new farm costs a whole stop, so consolidation comes before price. After
        // that: cheapest ask, then the freshest lot, then the farmer who has sold
        // least recently, so pooling rotates fairly rather than always favouring one farm.
        .sort(
          (a, b) =>
            Number(farmsOnRoute.has(b.farmerId)) - Number(farmsOnRoute.has(a.farmerId)) ||
            a.askPaisePerKg - b.askPaisePerKg ||
            b.harvestAt.getTime() - a.harvestAt.getTime() ||
            a.recentSoldGrams - b.recentSoldGrams,
        );

      if (!compatible.length) {
        ok = false;
        reason = REJECTION.INSUFFICIENT_STOCK;
        detail = "every compatible lot is already fully reserved by earlier orders in this run";
        break;
      }

      // Freshness is a hard constraint: software cannot refrigerate a vehicle that is not.
      const fresh = compatible.filter((l) => {
        const ageHours = (now.getTime() - l.harvestAt.getTime()) / 3_600_000;
        return ageHours <= line.freshnessHours;
      });
      // Freshness is judged without assuming a refrigerated vehicle, because the
      // vehicle is only chosen after the load is known.
      const usable = fresh;
      if (!usable.length) {
        ok = false;
        reason = REJECTION.FRESHNESS;
        detail = `No lot is within ${line.freshnessHours} h of harvest for an unrefrigerated run`;
        break;
      }

      let need = line.grams;
      for (const lot of usable) {
        if (need <= 0) break;
        const have = stock.get(lot.id) ?? 0;
        if (have <= 0) continue;
        const take = Math.min(have, need);
        need -= take;
        stock.set(lot.id, have - take);
        draft.push({
          orderId: order.id,
          orderLineId: line.id,
          listingId: lot.id,
          farmerId: lot.farmerId,
          farmerName: lot.farmerName,
          grams: take,
          askPaisePerKg: lot.askPaisePerKg,
          proceedsPaise: Math.round((lot.askPaisePerKg * take) / 1000),
        });
      }

      if (need > 0) {
        ok = false;
        reason = REJECTION.INSUFFICIENT_STOCK;
        detail = `${(need / 1000).toFixed(2)} kg short across all compatible lots`;
        break;
      }
    }

    const orderGrams = draft.reduce((s, a) => s + a.grams, 0);

    // A run with too many farm stops stops being a shared trip and becomes a tour.
    const farmsAfter = new Set([...farmsOnRoute, ...draft.map((a) => a.farmerId)]);
    if (ok && farmsAfter.size > ECONOMICS.MAX_PICKUP_STOPS) {
      ok = false;
      reason = REJECTION.STOPS;
      detail = `would need ${farmsAfter.size} farm stops against a limit of ${ECONOMICS.MAX_PICKUP_STOPS}`;
    }

    if (ok && load + orderGrams > vehicle.capacityGrams) {
      ok = false;
      reason = REJECTION.CAPACITY;
      detail = `${((load + orderGrams) / 1000).toFixed(1)} kg would exceed the ${(vehicle.capacityGrams / 1000).toFixed(0)} kg vehicle`;
    }

    if (!ok) {
      // Give every reserved kilogram back before moving to the next order.
      for (const a of draft) stock.set(a.listingId, (stock.get(a.listingId) ?? 0) + a.grams);
      rejections.push({ orderId: order.id, reason, detail });
      continue;
    }

    accepted.push(order.id);
    allocations.push(...draft);
    for (const a of draft) farmsOnRoute.add(a.farmerId);
    load += orderGrams;
  }

  // Downsize to the smallest adequate vehicle; among equals take the cheapest rate.
  const adequate = sortedByCapacity.filter((v) => v.capacityGrams >= load);
  if (adequate.length) {
    const smallest = adequate[0].capacityGrams;
    vehicle = adequate
      .filter((v) => v.capacityGrams === smallest)
      .sort((a, b) => a.ratePaisePerKm - b.ratePaisePerKm)[0];
  }

  const fillFraction = load / vehicle.capacityGrams;

  // Pickups are per farm, not per allocation: one stop collects everything from that farm.
  const byFarm = new Map<string, { id: string; label: string; grams: number; lat: number; lng: number }>();
  for (const a of allocations) {
    const lot = inRadius.find((l) => l.id === a.listingId)!;
    const existing = byFarm.get(lot.farmerId);
    if (existing) existing.grams += a.grams;
    else
      byFarm.set(lot.farmerId, {
        id: lot.farmerId,
        label: `${lot.farmerName} · ${lot.village}`,
        grams: a.grams,
        lat: lot.lat,
        lng: lot.lng,
      });
  }

  const pickups = [...byFarm.values()];
  const route = pickups.length
    ? planRoute({
        base: { lat: vehicle.lat, lng: vehicle.lng },
        pickups,
        drop: { id: opts.cluster.id, label: opts.cluster.name, lat: opts.cluster.lat, lng: opts.cluster.lng },
        ratePaisePerKm: vehicle.ratePaisePerKm,
      })
    : null;

  const baseline = pickups.length
    ? planRoute({
        base: { lat: vehicle.lat, lng: vehicle.lng },
        pickups,
        drop: { id: opts.cluster.id, label: opts.cluster.name, lat: opts.cluster.lat, lng: opts.cluster.lng },
        ratePaisePerKm: vehicle.ratePaisePerKm,
        order: "given",
      }).distanceKm
    : null;

  const feasible = accepted.length > 0 && fillFraction >= ECONOMICS.MIN_FILL_FRACTION;

  explanation.push(
    `${accepted.length} of ${opts.orders.length} orders fit this run; ${pickups.length} farm pickup stops and one cluster drop.`,
  );
  explanation.push(
    `Load ${(load / 1000).toFixed(1)} kg against ${(vehicle.capacityGrams / 1000).toFixed(0)} kg capacity, a fill of ${(fillFraction * 100).toFixed(0)}%.`,
  );
  if (!feasible && accepted.length > 0) {
    explanation.push(
      `Below the ${(ECONOMICS.MIN_FILL_FRACTION * 100).toFixed(0)}% minimum fill, so this run is held rather than dispatched at a loss. Orders roll to the next window.`,
    );
  }
  if (route)
    explanation.push(
      `Planned distance ${route.distanceKm} km against a fixed-order baseline of ${baseline} km over the same stops.`,
    );
  for (const r of rejections) explanation.push(`Rejected ${r.orderId}: ${r.reason}${r.detail ? ` (${r.detail})` : ""}.`);

  return {
    feasible,
    acceptedOrderIds: accepted,
    rejections,
    allocations,
    loadGrams: load,
    capacityGrams: vehicle.capacityGrams,
    fillFraction,
    route,
    baselineDistanceKm: baseline,
    vehicle,
    explanation,
  };
}

import { ECONOMICS } from "./config";
import { roadKm, type Point } from "./geo";

export type PlannedStop = {
  seq: number;
  kind: "PICKUP" | "DROP";
  label: string;
  refId: string | null;
  lat: number;
  lng: number;
  grams: number;
  etaMinutes: number;
  loadAfterGrams: number;
};

export type RoutePlan = {
  stops: PlannedStop[];
  distanceKm: number;
  durationMinutes: number;
  peakLoadGrams: number;
  transportCostPaise: number;
};

/**
 * Nearest-neighbour pickup ordering followed by the single cluster drop.
 * This is a feasible plan, not a proven optimum, and the baseline comparison
 * in the admin view exists so the difference is visible rather than claimed.
 */
export function planRoute(opts: {
  base: Point;
  pickups: { id: string; label: string; grams: number; lat: number; lng: number }[];
  drop: { id: string; label: string; lat: number; lng: number };
  ratePaisePerKm: number;
  order?: "nearest" | "given";
}): RoutePlan {
  const { base, drop, ratePaisePerKm } = opts;
  const remaining = [...opts.pickups];
  const stops: PlannedStop[] = [];

  let cursor: Point = base;
  let distanceKm = 0;
  let minutes = 0;
  let load = 0;
  let peak = 0;

  while (remaining.length) {
    let idx = 0;
    if (opts.order !== "given") {
      let best = Number.POSITIVE_INFINITY;
      remaining.forEach((p, i) => {
        const d = roadKm(cursor, p);
        if (d < best) {
          best = d;
          idx = i;
        }
      });
    }
    const next = remaining.splice(idx, 1)[0];
    const leg = roadKm(cursor, next);
    distanceKm += leg;
    minutes += (leg / ECONOMICS.AVERAGE_SPEED_KMPH) * 60 + ECONOMICS.STOP_MINUTES;
    load += next.grams;
    peak = Math.max(peak, load);
    stops.push({
      seq: stops.length + 1,
      kind: "PICKUP",
      label: next.label,
      refId: next.id,
      lat: next.lat,
      lng: next.lng,
      grams: next.grams,
      etaMinutes: Math.round(minutes),
      loadAfterGrams: load,
    });
    cursor = next;
  }

  const finalLeg = roadKm(cursor, drop);
  distanceKm += finalLeg;
  minutes += (finalLeg / ECONOMICS.AVERAGE_SPEED_KMPH) * 60 + ECONOMICS.STOP_MINUTES;
  stops.push({
    seq: stops.length + 1,
    kind: "DROP",
    label: drop.label,
    refId: drop.id,
    lat: drop.lat,
    lng: drop.lng,
    grams: load,
    etaMinutes: Math.round(minutes),
    loadAfterGrams: 0,
  });

  return {
    stops,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.round(minutes),
    peakLoadGrams: peak,
    transportCostPaise: Math.round(distanceKm * ratePaisePerKm),
  };
}

import { ECONOMICS, REJECTION } from "./config";

/**
 * Ranking rules for surplus placement, kept free of the database so they can be
 * checked directly. The data gathering lives in surplus.ts.
 */

export type Placement = {
  clusterId: string;
  name: string;
  city: string;
  roadKm: number;
  travelHours: number;
  /** Hours of shelf life left when the load would reach the pickup point. */
  hoursToSpare: number;
  /** Forecast demand at this pickup point next window, for this commodity. */
  predictedGrams: number;
  /** Forecast demand not already covered by confirmed orders. */
  unmetGrams: number;
  /** What this destination could take from the unsold quantity. */
  absorbGrams: number;
  /** Share of the hired vehicle already filled by confirmed orders. */
  fillFraction: number;
  /** True when the run to this point already clears the minimum fill. */
  runConfirmed: boolean;
  /** Empty when the destination is offered; otherwise why it was dropped. */
  rejectedFor: string | null;
};

export type PlacementInput = {
  clusterId: string;
  name: string;
  city: string;
  roadKm: number;
  /** Hours of shelf life already used when the run would start. */
  ageHours: number;
  freshnessHours: number;
  predictedGrams: number;
  committedGrams: number;
  fillFraction: number;
  runConfirmed: boolean;
};

/**
 * The decision itself, with no database in it: which points may take the lot,
 * in what order, and how the unsold quantity divides between them.
 */
export function rankPlacements(unsoldGrams: number, inputs: PlacementInput[]): Placement[] {
  const placements: Placement[] = inputs.map((d) => {
    // Two stops are assumed: the farm gate and the pickup point.
    const travelHours = d.roadKm / ECONOMICS.AVERAGE_SPEED_KMPH + (2 * ECONOMICS.STOP_MINUTES) / 60;
    const hoursToSpare = d.freshnessHours - (d.ageHours + travelHours);
    const unmetGrams = Math.max(0, d.predictedGrams - d.committedGrams);

    let rejectedFor: string | null = null;
    if (d.roadKm > ECONOMICS.SERVICE_RADIUS_KM) rejectedFor = REJECTION.DISTANCE;
    else if (hoursToSpare <= 0) rejectedFor = REJECTION.FRESHNESS;
    else if (unmetGrams <= 0) rejectedFor = "Forecast demand here is already covered by confirmed orders";

    return {
      clusterId: d.clusterId,
      name: d.name,
      city: d.city,
      roadKm: d.roadKm,
      travelHours,
      hoursToSpare,
      predictedGrams: d.predictedGrams,
      unmetGrams,
      absorbGrams: rejectedFor ? 0 : Math.min(unmetGrams, unsoldGrams),
      fillFraction: d.fillFraction,
      runConfirmed: d.runConfirmed,
      rejectedFor,
    };
  });

  // Most absorbable quantity first; between equals prefer the run that is
  // already going, then the shorter trip.
  placements.sort(
    (a, b) =>
      b.absorbGrams - a.absorbGrams ||
      Number(b.runConfirmed) - Number(a.runConfirmed) ||
      a.roadKm - b.roadKm,
  );

  // A destination can only absorb what earlier destinations have not taken.
  let left = unsoldGrams;
  for (const p of placements) {
    p.absorbGrams = Math.min(p.absorbGrams, left);
    left -= p.absorbGrams;
  }
  return placements;
}


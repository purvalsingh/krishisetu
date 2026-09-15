import { ECONOMICS } from "./config";
import { forGrams } from "./money";

export type PriceStack = {
  grams: number;
  /** Net amount per kg the farmer accepted. */
  farmerPaisePerKg: number;
  farmerProceedsPaise: number;
  logisticsPaise: number;
  handlingPaise: number;
  siteFeePaise: number;
  totalPaise: number;
  landedPaisePerKg: number;
  /** Quick-commerce reference for the same commodity, 0 when unknown. */
  referencePaisePerKg: number;
  /** Positive when we are cheaper than the reference. */
  savingVsReferencePaise: number;
  /** True when the site fee had to be cut to stay under the reference price. */
  feeReducedToHoldPrice: boolean;
  /** True when even a zero fee cannot hold the price under the reference. */
  aboveReference: boolean;
};

/**
 * Builds the itemised buyer bill from the farmer's accepted price upward.
 * The farmer amount is an input, never a residual: no line below can reduce it.
 */
export function priceStack(opts: {
  grams: number;
  farmerPaisePerKg: number;
  referencePaisePerKg: number;
  /** Per-order share of the cluster host's commission and any last-leg fee. */
  perOrderHandlingPaise: number;
}): PriceStack {
  const { grams, farmerPaisePerKg, referencePaisePerKg, perOrderHandlingPaise } = opts;

  const farmerProceedsPaise = forGrams(farmerPaisePerKg, grams);
  const logisticsPaise = forGrams(
    ECONOMICS.QUOTED_LINE_HAUL_PAISE_PER_KG + ECONOMICS.QUOTED_CLUSTER_LEG_PAISE_PER_KG,
    grams,
  );
  const handlingPaise =
    forGrams(ECONOMICS.PACKING_PAISE_PER_KG, grams) +
    Math.round(farmerProceedsPaise * ECONOMICS.SPOILAGE_BUFFER_RATE) +
    perOrderHandlingPaise;

  let siteFeePaise = forGrams(ECONOMICS.SITE_FEE_PAISE_PER_KG, grams);
  const floor = farmerProceedsPaise + logisticsPaise + handlingPaise;

  let feeReducedToHoldPrice = false;
  let aboveReference = false;

  if (referencePaisePerKg > 0) {
    const referenceTotal = forGrams(referencePaisePerKg, grams);
    if (floor + siteFeePaise > referenceTotal) {
      // The fee absorbs the difference first, down to zero. It never goes negative,
      // and the farmer's accepted amount is never touched to hold a price.
      siteFeePaise = Math.max(0, referenceTotal - floor);
      feeReducedToHoldPrice = true;
      if (floor > referenceTotal) aboveReference = true;
    }
  }

  const totalPaise = floor + siteFeePaise;

  return {
    grams,
    farmerPaisePerKg,
    farmerProceedsPaise,
    logisticsPaise,
    handlingPaise,
    siteFeePaise,
    totalPaise,
    landedPaisePerKg: Math.round((totalPaise * 1000) / grams),
    referencePaisePerKg,
    savingVsReferencePaise:
      referencePaisePerKg > 0 ? forGrams(referencePaisePerKg, grams) - totalPaise : 0,
    feeReducedToHoldPrice,
    aboveReference,
  };
}

/**
 * Door delivery is free once the basket is large enough to carry its cost.
 * Returns what the buyer is actually charged for the last leg.
 */
export function lastLegFeeFor(goodsPaise: number, lastLegFeePaise: number) {
  return goodsPaise >= ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE ? 0 : lastLegFeePaise;
}

/**
 * Suggested farmer price band. It is a suggestion built from a dated mandi
 * observation and current demand pressure, never an imposed fair price.
 */
export function suggestFarmerBand(opts: {
  mandiModalPaisePerKg: number | null;
  /** Confirmed demand divided by listed supply for this commodity in the window. */
  demandRatio: number;
  referencePaisePerKg: number;
}) {
  const { mandiModalPaisePerKg, demandRatio, referencePaisePerKg } = opts;
  if (!mandiModalPaisePerKg) return null;

  // Selling into a mandi costs the farmer transport, commission and weighing loss.
  // The comparable net is what we must beat, not the headline mandi rate.
  const assumedMandiSellingCostPaisePerKg = 300;
  const comparableNet = Math.max(0, mandiModalPaisePerKg - assumedMandiSellingCostPaisePerKg);

  const pressure = Math.max(0.9, Math.min(1.35, demandRatio));
  const low = Math.round(comparableNet * 1.15);
  const high = Math.round(comparableNet * 1.15 * pressure * 1.12);

  // The band must still leave room under the quick-commerce reference once the
  // cost stack is added, otherwise the produce cannot be sold at all.
  const headroom =
    referencePaisePerKg > 0
      ? referencePaisePerKg -
        (ECONOMICS.QUOTED_LINE_HAUL_PAISE_PER_KG +
          ECONOMICS.QUOTED_CLUSTER_LEG_PAISE_PER_KG +
          ECONOMICS.PACKING_PAISE_PER_KG)
      : Number.POSITIVE_INFINITY;

  return {
    comparableNet,
    low: Math.min(low, headroom),
    high: Math.min(high, headroom),
    cappedByReference: high > headroom,
  };
}

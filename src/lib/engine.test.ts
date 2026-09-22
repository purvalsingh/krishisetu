/**
 * One runnable check over the two pieces of logic that decide money and
 * dispatch. Run with: npm test
 */
import assert from "node:assert/strict";
import { ECONOMICS, REJECTION } from "./config";
import { lastLegFeeFor, priceStack, suggestFarmerBand } from "./pricing";
import { proposeBatch, type CandidateListing, type CandidateOrder, type Vehicle } from "./pooling";
import { planRoute } from "./routing";
import { fitAndForecast } from "./forecast";
import { rankPlacements } from "./placement";

const now = new Date("2026-09-15T06:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

// --- pricing ---------------------------------------------------------------
{
  const s = priceStack({
    grams: 3000,
    farmerPaisePerKg: 3400,
    referencePaisePerKg: 5500,
    perOrderHandlingPaise: 1000,
  });
  assert.equal(
    s.farmerProceedsPaise + s.logisticsPaise + s.handlingPaise + s.siteFeePaise,
    s.totalPaise,
    "the bill lines must sum to the total",
  );
  assert.equal(s.farmerProceedsPaise, 10200, "farmer proceeds are the accepted rate times the weight");
  assert.ok(s.landedPaisePerKg < s.referencePaisePerKg, "landed price must sit under the reference");
  assert.ok(!s.feeReducedToHoldPrice);
}

// A farmer price so high that the reference cannot be held: the site fee must
// absorb it down to zero, and the farmer amount must be untouched.
{
  const s = priceStack({
    grams: 1000,
    farmerPaisePerKg: 5300,
    referencePaisePerKg: 5500,
    perOrderHandlingPaise: 1000,
  });
  assert.equal(s.farmerProceedsPaise, 5300, "the farmer amount is never reduced to hold a price");
  assert.equal(s.siteFeePaise, 0, "the fee floor is zero");
  assert.ok(s.aboveReference, "the order must be flagged when even a zero fee cannot hold the price");
  assert.equal(
    s.farmerProceedsPaise + s.logisticsPaise + s.handlingPaise + s.siteFeePaise,
    s.totalPaise,
  );
}

{
  const band = suggestFarmerBand({ mandiModalPaisePerKg: 2800, demandRatio: 1.2, referencePaisePerKg: 5500 });
  assert.ok(band);
  assert.ok(band.low > band.comparableNet, "a suggestion below the farmer's current net is pointless");
  assert.ok(band.high >= band.low);
}

// Door delivery is free above the threshold and charged below it.
{
  assert.equal(lastLegFeeFor(ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE, 2000), 0);
  assert.equal(lastLegFeeFor(ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE - 1, 2000), 2000);
  // The waiver must cost less than the site fee earned on a basket that size,
  // otherwise it would have to be funded from someone else's share.
  const assumedLandedPaisePerKg = 4000;
  const kilogramsAtThreshold = ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE / assumedLandedPaisePerKg;
  const feeOnThreshold = Math.round(ECONOMICS.SITE_FEE_PAISE_PER_KG * kilogramsAtThreshold);
  assert.ok(feeOnThreshold > 2000, "the free-delivery threshold must be funded by the fee it earns");
}

// --- pooling ---------------------------------------------------------------
const cluster = { id: "cl1", name: "Nerul", lat: 19.033, lng: 73.0197 };

const lot = (over: Partial<CandidateListing> & { id: string }): CandidateListing => ({
  farmerId: "f" + over.id,
  farmerName: "Farmer " + over.id,
  village: "Panvel",
  lat: 18.9894,
  lng: 73.1175,
  commodityId: "tomato",
  grade: "A",
  availableGrams: 100_000,
  askPaisePerKg: 3400,
  harvestAt: hoursAgo(6),
  recentSoldGrams: 0,
  ...over,
});

const order = (id: string, grams: number, over: Partial<CandidateOrder> = {}): CandidateOrder => ({
  id,
  buyerName: "Buyer " + id,
  lines: [{ id: id + "-l1", commodityId: "tomato", grade: "A", grams, freshnessHours: 30 }],
  createdAt: now,
  priority: 0,
  ...over,
});

const tempo: Vehicle = {
  id: "v1",
  transporterName: "Imran",
  capacityGrams: 1_000_000,
  lat: 18.9894,
  lng: 73.1175,
  ratePaisePerKm: 2400,
  refrigerated: false,
};

// A single requirement larger than one lot must split across farms and stay traceable.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 150_000)],
    listings: [lot({ id: "a", availableGrams: 100_000, askPaisePerKg: 3300 }), lot({ id: "b", availableGrams: 80_000, askPaisePerKg: 3600 })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 1);
  assert.equal(p.allocations.length, 2, "the order should draw from two lots");
  assert.equal(p.allocations.reduce((s, a) => s + a.grams, 0), 150_000);
  assert.equal(p.allocations[0].listingId, "a", "the cheaper ask is drawn down first");
  assert.equal(p.route!.stops.filter((s) => s.kind === "PICKUP").length, 2);
  assert.equal(p.route!.stops.at(-1)!.kind, "DROP");
}

// Stock can never be promised twice.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 60_000), order("o2", 60_000)],
    listings: [lot({ id: "a", availableGrams: 100_000 })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 1, "only one of the two orders can be filled");
  assert.ok(
    p.rejections[0].reason.includes("Available quantity"),
    "a lot that exists but is fully reserved is a stock shortage, not a missing lot",
  );
  assert.equal(p.allocations.reduce((s, a) => s + a.grams, 0), 60_000);
}

// Produce older than the freshness limit is not loaded onto an unrefrigerated run.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 10_000)],
    listings: [lot({ id: "a", harvestAt: hoursAgo(72) })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 0);
  assert.ok(p.rejections[0].reason.includes("freshness"));
}

// Capacity is checked before an order is accepted, not after.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 700_000), order("o2", 700_000)],
    listings: [lot({ id: "a", availableGrams: 2_000_000 })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 1);
  assert.ok(p.rejections[0].reason.includes("capacity"));
  assert.ok(p.loadGrams <= tempo.capacityGrams);
}

// An under-filled run is held rather than dispatched at a loss.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 100_000)],
    listings: [lot({ id: "a" })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 1);
  assert.equal(p.feasible, false, "10% fill is below the minimum");
  assert.ok(p.fillFraction < ECONOMICS.MIN_FILL_FRACTION);
}

// The run is downsized to the smallest vehicle that can carry the accepted load.
{
  const small: Vehicle = { ...tempo, id: "small", capacityGrams: 750_000, ratePaisePerKm: 2400 };
  const big: Vehicle = { ...tempo, id: "big", capacityGrams: 1_200_000, ratePaisePerKm: 4200 };
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 600_000)],
    listings: [lot({ id: "a", availableGrams: 2_000_000 })],
    vehicles: [big, small],
    now,
  });
  assert.equal(p.vehicle!.id, "small", "a 600 kg load must not hire a 1.2 tonne truck");
  assert.ok(p.fillFraction > 0.7, "downsizing is what lets a real neighbourhood clear the fill threshold");
}

// Farms outside the service radius are never considered.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 10_000)],
    listings: [lot({ id: "far", lat: 21.15, lng: 79.09 })],
    vehicles: [tempo],
    now,
  });
  assert.equal(p.acceptedOrderIds.length, 0);
}

// Collecting more from a farm already on the route is preferred over adding a stop,
// even when a different farm asks slightly less.
{
  const p = proposeBatch({
    cluster,
    windowDate: now,
    orders: [order("o1", 50_000), order("o2", 50_000)],
    listings: [
      lot({ id: "onroute", availableGrams: 200_000, askPaisePerKg: 3500 }),
      lot({ id: "cheaper", availableGrams: 200_000, askPaisePerKg: 3400, lat: 18.7, lng: 73.3 }),
    ],
    vehicles: [tempo],
    now,
  });
  // The first order takes the cheaper farm; the second should stay on that same farm
  // rather than opening a second stop for a marginally different price.
  assert.equal(new Set(p.allocations.map((a) => a.farmerId)).size, 1, "the run should keep to one farm stop");
  assert.equal(p.route!.stops.filter((s) => s.kind === "PICKUP").length, 1);
}

// --- routing ---------------------------------------------------------------
{
  const r = planRoute({
    base: { lat: 18.9894, lng: 73.1175 },
    pickups: [
      { id: "p1", label: "far", grams: 10_000, lat: 18.64, lng: 72.87 },
      { id: "p2", label: "near", grams: 10_000, lat: 18.99, lng: 73.12 },
    ],
    drop: { id: "d", label: "Nerul", lat: 19.033, lng: 73.0197 },
    ratePaisePerKm: 2400,
  });
  assert.equal(r.stops[0].label, "near", "nearest pickup is visited first");
  assert.equal(r.stops.at(-1)!.loadAfterGrams, 0, "the vehicle is empty after the drop");
  assert.equal(r.peakLoadGrams, 20_000);
  assert.ok(r.transportCostPaise > 0);
}

// --- forecasting -----------------------------------------------------------
{
  // Too little history must not produce a confident-looking forecast.
  const short = fitAndForecast([1, 2, 3, 4, 5], 4, 52);
  assert.equal(short.usable, false);
}
{
  // A clean seasonal series with noise: the chosen method must be reported and
  // the band must contain the point prediction.
  const series = Array.from({ length: 120 }, (_, i) => 100 + 20 * Math.sin((2 * Math.PI * i) / 52) + (i % 5));
  const f = fitAndForecast(series, 4, 52);
  assert.equal(f.usable, true);
  assert.equal(f.predictions.length, 4);
  assert.ok(["ridge", "seasonal-naive"].includes(f.chosen));
  assert.ok(f.lo[0] <= f.predictions[0] && f.predictions[0] <= f.hi[0]);
  assert.ok(Number.isFinite(f.modelMape) && Number.isFinite(f.baselineMape));
}

console.log("All engine checks passed.");

// --- surplus placement -----------------------------------------------------
{
  const base = {
    city: "Mumbai",
    ageHours: 6,
    freshnessHours: 36,
    committedGrams: 0,
    fillFraction: 0.5,
    runConfirmed: false,
  };
  const ranked = rankPlacements(10_000, [
    // Nearest, but its forecast is already covered by confirmed orders.
    { ...base, clusterId: "covered", name: "Covered", roadKm: 10, predictedGrams: 4_000, committedGrams: 4_000 },
    // Inside the radius but too far for this commodity's freshness limit.
    { ...base, clusterId: "stale", name: "Stale", roadKm: 118, predictedGrams: 9_000, ageHours: 33 },
    { ...base, clusterId: "far", name: "Far", roadKm: 200, predictedGrams: 9_000 },
    { ...base, clusterId: "big", name: "Big", roadKm: 40, predictedGrams: 7_000, runConfirmed: true },
    { ...base, clusterId: "small", name: "Small", roadKm: 20, predictedGrams: 6_000 },
  ]);
  const by = Object.fromEntries(ranked.map((p) => [p.clusterId, p]));

  assert.equal(by.far.rejectedFor, REJECTION.DISTANCE);
  assert.equal(by.stale.rejectedFor, REJECTION.FRESHNESS);
  assert.ok(by.covered.rejectedFor && by.covered.absorbGrams === 0);

  // Largest uncovered demand is offered first, and the rest gets what is left.
  assert.equal(ranked[0].clusterId, "big");
  assert.equal(by.big.absorbGrams, 7_000);
  assert.equal(by.small.absorbGrams, 3_000);

  // The same kilogram is never promised twice.
  assert.equal(
    ranked.reduce((t, p) => t + p.absorbGrams, 0),
    10_000,
  );
}

console.log("surplus placement checks passed");

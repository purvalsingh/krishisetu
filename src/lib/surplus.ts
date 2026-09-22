import { prisma } from "./db";
import { roadKm } from "./geo";
import { rankPlacements, type Placement } from "./placement";
import { nextWindow, clusterFill } from "./market";
import { getOpportunities } from "./insights";

/**
 * Answers the second question a farmer asks after "what is in demand": the lot
 * is already cut and part of it did not sell — where should the rest go?
 *
 * This ranks the pickup points that can still absorb the quantity in the next
 * window. It is a placement suggestion, not a sale: nothing is reserved here,
 * and a destination is only offered when the produce can physically reach it
 * inside its freshness limit.
 */

export type SurplusPlan = {
  listingId: string;
  commodityName: string;
  unsoldGrams: number;
  harvestDate: Date;
  windowDate: Date;
  placements: Placement[];
  /** Quantity the offered destinations can take between them. */
  placeableGrams: number;
};

export async function surplusPlacements(listingId: string): Promise<SurplusPlan | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { farmer: true, commodity: true },
  });
  if (!listing) return null;

  const unsoldGrams = Math.max(
    0,
    listing.totalGrams - listing.reservedGrams - listing.completedGrams,
  );
  const windowDate = nextWindow();

  const [clusters, opportunities, lines] = await Promise.all([
    prisma.cluster.findMany({ where: { active: true } }),
    getOpportunities(),
    prisma.orderLine.findMany({
      where: {
        commodityId: listing.commodityId,
        order: { windowDate, status: { in: ["CONFIRMED", "BATCHED"] } },
      },
      include: { order: { select: { clusterId: true } } },
    }),
  ]);

  const opportunity = opportunities.find((o) => o.commodityId === listing.commodityId);
  const predictedByCluster = new Map(
    (opportunity?.topClusters ?? []).map((c) => [c.clusterId, c.predictedGrams]),
  );

  // Confirmed orders are counted per cluster so a point that has already bought
  // this commodity is not offered the same kilograms twice.
  const committedByCluster = new Map<string, number>();
  for (const l of lines) {
    const k = l.order.clusterId;
    committedByCluster.set(k, (committedByCluster.get(k) ?? 0) + l.grams);
  }
  const farm = { lat: listing.farmer.lat, lng: listing.farmer.lng };
  const ageHoursAtWindow = Math.max(
    0,
    (windowDate.getTime() - listing.harvestDate.getTime()) / 3_600_000,
  );

  const fills = await Promise.all(clusters.map((c) => clusterFill(c.id, windowDate)));

  const placements = rankPlacements(
    unsoldGrams,
    clusters.map((cluster, i) => ({
      clusterId: cluster.id,
      name: cluster.name,
      city: cluster.city,
      roadKm: roadKm(farm, { lat: cluster.lat, lng: cluster.lng }),
      ageHours: ageHoursAtWindow,
      freshnessHours: listing.commodity.freshnessHours,
      predictedGrams: predictedByCluster.get(cluster.id) ?? 0,
      committedGrams: committedByCluster.get(cluster.id) ?? 0,
      fillFraction: fills[i].fraction,
      runConfirmed: fills[i].willGo,
    })),
  );
  const placeableGrams = placements.reduce((t, p) => t + p.absorbGrams, 0);

  return {
    listingId: listing.id,
    commodityName: listing.commodity.name,
    unsoldGrams,
    harvestDate: listing.harvestDate,
    windowDate,
    placements,
    placeableGrams,
  };
}

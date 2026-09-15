import { prisma } from "./db";

/** Everything the farmer home screen needs, in one round trip per concern. */
export async function farmerOverview(userId: string) {
  const profile = await prisma.farmerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) return null;

  const [listings, allocations, upcoming] = await Promise.all([
    prisma.listing.findMany({
      where: { farmerId: profile.id },
      include: { commodity: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.allocation.findMany({
      where: { farmerId: profile.id },
      include: {
        listing: { include: { commodity: true } },
        orderLine: { include: { order: { include: { cluster: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.batch.findMany({
      where: { status: { in: ["PROPOSED", "AWAITING_TRANSPORTER", "ACCEPTED", "DISPATCHED"] } },
      include: { cluster: true, stops: { orderBy: { seq: "asc" } }, transporter: { include: { user: true } } },
      orderBy: { windowDate: "asc" },
    }),
  ]);

  const mine = upcoming.filter((b) => b.stops.some((s) => s.refId === profile.id && s.kind === "PICKUP"));

  const awaiting = allocations.filter((a) => !a.settled).reduce((s, a) => s + a.proceedsPaise, 0);
  const settled = allocations.filter((a) => a.settled).reduce((s, a) => s + a.proceedsPaise, 0);
  const soldGrams = allocations.reduce((s, a) => s + a.grams, 0);

  return { profile, listings, allocations, runs: mine, awaiting, settled, soldGrams };
}

/** Available quantity is the total less what is reserved and what has already gone. */
export const availableGrams = (l: { totalGrams: number; reservedGrams: number; completedGrams: number }) =>
  Math.max(0, l.totalGrams - l.reservedGrams - l.completedGrams);

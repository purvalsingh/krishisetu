import { cache } from "react";
import { prisma } from "./db";
import { fitAndForecast, opportunityScore, type Fit } from "./forecast";

/**
 * Turns the stored history into the short, ordered list a farmer actually
 * needs: which crop is worth sending next week, to which neighbourhood, and
 * how confident the estimate is.
 *
 * Every figure carries its method and its sample size. When the fitted model
 * fails to beat the naive baseline on the holdout, the baseline is what gets
 * shown and the screen says so.
 */

export type Opportunity = {
  commodityId: string;
  name: string;
  emoji: string;
  /** Predicted fulfilled quantity next week across all clusters. */
  predictedGrams: number;
  loGrams: number;
  hiGrams: number;
  demandChangePct: number;
  priceChangePct: number;
  /** Predicted demand divided by quantity currently listed. Above 1 means unmet demand. */
  demandSupplyRatio: number;
  listedGrams: number;
  score: number;
  latestModalPaisePerKg: number | null;
  latestObservedOn: Date | null;
  benchmarkSource: string | null;
  benchmarkAgeDays: number | null;
  demandFit: Pick<Fit, "chosen" | "modelMape" | "baselineMape" | "sampleSize" | "usable">;
  /** Last 16 observed weeks, then the four predicted weeks with their band. */
  recentSeries: number[];
  forecastSeries: { mid: number; lo: number; hi: number }[];
  topClusters: { clusterId: string; name: string; predictedGrams: number }[];
};

const pctChange = (from: number, to: number) => (from > 0 ? ((to - from) / from) * 100 : 0);
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export const getOpportunities = cache(async (): Promise<Opportunity[]> => {
  const [commodities, clusters, history, benchmarks, listings] = await Promise.all([
    prisma.commodity.findMany({ orderBy: { name: "asc" } }),
    prisma.cluster.findMany(),
    prisma.demandHistory.findMany({ orderBy: { weekStart: "asc" } }),
    prisma.benchmarkObservation.findMany({ orderBy: { observedOn: "asc" } }),
    prisma.listing.groupBy({
      by: ["commodityId"],
      where: { status: "ACTIVE" },
      _sum: { totalGrams: true, reservedGrams: true, completedGrams: true },
    }),
  ]);

  const clusterName = new Map(clusters.map((c) => [c.id, c.name]));
  const listedByCommodity = new Map(
    listings.map((l) => [
      l.commodityId,
      (l._sum.totalGrams ?? 0) - (l._sum.reservedGrams ?? 0) - (l._sum.completedGrams ?? 0),
    ]),
  );

  const out: Opportunity[] = [];

  for (const commodity of commodities) {
    const rows = history.filter((h) => h.commodityId === commodity.id);
    if (!rows.length) continue;

    // Total weekly demand across clusters, oldest first.
    const byWeek = new Map<number, number>();
    for (const r of rows) byWeek.set(r.weekStart.getTime(), (byWeek.get(r.weekStart.getTime()) ?? 0) + r.grams);
    const weeks = [...byWeek.entries()].sort((a, b) => a[0] - b[0]);
    const series = weeks.map(([, g]) => g);

    const demandFit = fitAndForecast(series, 4, 52);

    const priceRows = benchmarks.filter((b) => b.commodityId === commodity.id);
    const priceSeries = priceRows.map((b) => b.modalPaisePerKg);
    const priceFit = fitAndForecast(priceSeries, 4, 52);

    const recentDemand = mean(series.slice(-4));
    const futureDemand = mean(demandFit.predictions);
    const recentPrice = mean(priceSeries.slice(-4));
    const futurePrice = mean(priceFit.predictions);

    const listedGrams = Math.max(0, listedByCommodity.get(commodity.id) ?? 0);
    const predictedGrams = Math.round(demandFit.predictions[0] ?? recentDemand);
    const ratio = listedGrams > 0 ? predictedGrams / listedGrams : predictedGrams > 0 ? 2 : 0;

    // Per-cluster split, so the farmer is told where the demand is, not just that it exists.
    const topClusters = clusters
      .map((c) => {
        const cRows = rows.filter((r) => r.clusterId === c.id).map((r) => r.grams);
        const cFit = fitAndForecast(cRows, 1, 52);
        return {
          clusterId: c.id,
          name: clusterName.get(c.id) ?? c.id,
          predictedGrams: Math.round(cFit.predictions[0] ?? mean(cRows.slice(-4))),
        };
      })
      .sort((a, b) => b.predictedGrams - a.predictedGrams);

    const latest = priceRows.at(-1) ?? null;

    out.push({
      commodityId: commodity.id,
      name: commodity.name,
      emoji: commodity.imageEmoji,
      predictedGrams,
      loGrams: Math.round(demandFit.lo[0] ?? 0),
      hiGrams: Math.round(demandFit.hi[0] ?? 0),
      demandChangePct: pctChange(recentDemand, futureDemand),
      priceChangePct: pctChange(recentPrice, futurePrice),
      demandSupplyRatio: ratio,
      listedGrams,
      score: opportunityScore({
        demandChangePct: pctChange(recentDemand, futureDemand),
        priceChangePct: pctChange(recentPrice, futurePrice),
        demandSupplyRatio: ratio,
      }),
      latestModalPaisePerKg: latest?.modalPaisePerKg ?? null,
      latestObservedOn: latest?.observedOn ?? null,
      benchmarkSource: latest?.source ?? null,
      benchmarkAgeDays: latest ? Math.floor((Date.now() - latest.observedOn.getTime()) / 86_400_000) : null,
      demandFit: {
        chosen: demandFit.chosen,
        modelMape: demandFit.modelMape,
        baselineMape: demandFit.baselineMape,
        sampleSize: demandFit.sampleSize,
        usable: demandFit.usable,
      },
      topClusters,
      recentSeries: series.slice(-16),
      forecastSeries: demandFit.predictions.map((mid, i) => ({
        mid: Math.round(mid),
        lo: Math.round(demandFit.lo[i]),
        hi: Math.round(demandFit.hi[i]),
      })),
    });
  }

  return out.sort((a, b) => b.score - a.score);
});

/** The freshest price observation per commodity, whatever its source. */
export const getLatestBenchmarks = cache(async () => {
  const rows = await prisma.benchmarkObservation.findMany({ orderBy: { observedOn: "desc" } });
  const map = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!map.has(r.commodityId)) map.set(r.commodityId, r);
  return map;
});

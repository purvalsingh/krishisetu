/** Ad-hoc check of what the demand model actually predicts against recent weeks. */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fitAndForecast } from "../src/lib/forecast";

async function main() {
  const commodities = await prisma.commodity.findMany({ orderBy: { name: "asc" } });
  const history = await prisma.demandHistory.findMany({ orderBy: { weekStart: "asc" } });

  for (const c of commodities.slice(0, 4)) {
    const rows = history.filter((h) => h.commodityId === c.id);
    const byWeek = new Map<number, number>();
    for (const r of rows) byWeek.set(r.weekStart.getTime(), (byWeek.get(r.weekStart.getTime()) ?? 0) + r.grams);
    const series = [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g);
    const f = fitAndForecast(series, 4, 52);
    const kg = (v: number) => (v / 1000).toFixed(0);
    console.log(
      c.name.padEnd(14),
      "last6:", series.slice(-6).map(kg).join(" "),
      "| pred:", f.predictions.map(kg).join(" "),
      "| band:", kg(f.lo[0]), "-", kg(f.hi[0]),
      "|", f.chosen, "mape", f.modelMape.toFixed(1), "vs", f.baselineMape.toFixed(1),
    );
  }
  await prisma.$disconnect();
}

main();

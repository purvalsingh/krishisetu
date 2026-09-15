import { Nav, Shell } from "@/components/nav";
import { Badge, Card, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { perKg } from "@/lib/money";
import { ingestAction } from "@/app/actions/ops";

export default async function DataPage() {
  await requireRole("ADMIN");

  const [bySource, commodities, lastIngest] = await Promise.all([
    prisma.benchmarkObservation.groupBy({ by: ["source"], _count: { _all: true }, _max: { observedOn: true } }),
    prisma.commodity.findMany({ orderBy: { name: "asc" } }),
    prisma.auditLog.findFirst({ where: { action: "benchmark.ingest" }, orderBy: { createdAt: "desc" } }),
  ]);

  const latest = await prisma.benchmarkObservation.findMany({
    where: { source: "LIVE" },
    orderBy: { observedOn: "desc" },
    take: 400,
  });
  const latestByCommodity = new Map<string, (typeof latest)[number]>();
  for (const r of latest) if (!latestByCommodity.has(r.commodityId)) latestByCommodity.set(r.commodityId, r);

  const result = lastIngest?.detail as { written?: number; matched?: number; total?: number; error?: string | null } | undefined;

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Data sources</h1>
        <p className="mt-1 max-w-3xl text-sm text-inksoft">
          Every price shown anywhere on the site carries a source label and a date. Live observations come from the
          Government of India open data portal; synthetic rows exist so the forecasting code has a history to fit
          while the pilot has none.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bySource.map((s) => (
            <Stat
              key={s.source}
              label={`${s.source.toLowerCase()} observations`}
              value={s._count._all.toLocaleString("en-IN")}
              note={s._max.observedOn ? `Newest ${s._max.observedOn.toISOString().slice(0, 10)}` : undefined}
              tone={s.source === "LIVE" ? "good" : "default"}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          <Card title="Refresh live mandi prices" subtitle="Agmarknet daily prices via data.gov.in">
            <form action={ingestAction}>
              <button className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                Fetch today&apos;s prices
              </button>
            </form>
            {lastIngest && (
              <div className="mt-3 rounded-lg border border-line bg-panel2 p-3 text-xs">
                <div className="font-medium">Last refresh {lastIngest.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</div>
                <p className="mt-1 text-inksoft">
                  {result?.error
                    ? `Failed: ${result.error}`
                    : `${result?.written ?? 0} observations written from ${result?.total ?? 0} published rows; ${result?.matched ?? 0} matched a commodity we list.`}
                </p>
              </div>
            )}
            <SourceNote>
              The published dataset is one snapshot per day with no history, so a price series is only built by
              refreshing repeatedly over time. Until that history exists, the forecast screens fit synthetic series
              and say so.
            </SourceNote>
          </Card>

          <Card title="Latest live observation per commodity">
            <div className="overflow-x-auto">
              <table className="tabular w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-inksoft">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Commodity</th>
                    <th className="py-2 pr-4 font-medium">Agmarknet name</th>
                    <th className="py-2 pr-4 font-medium">Market</th>
                    <th className="py-2 pr-4 font-medium">Observed</th>
                    <th className="py-2 pr-4 font-medium">Modal</th>
                    <th className="py-2 font-medium">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {commodities.map((c) => {
                    const row = latestByCommodity.get(c.id);
                    const ageDays = row ? Math.floor((Date.now() - row.observedOn.getTime()) / 86_400_000) : null;
                    return (
                      <tr key={c.id}>
                        <td className="py-2 pr-4">
                          {c.imageEmoji} {c.name}
                        </td>
                        <td className="py-2 pr-4 text-xs text-inksoft">{c.agmarknetName}</td>
                        <td className="py-2 pr-4 text-inksoft">{row?.market ?? "—"}</td>
                        <td className="py-2 pr-4">
                          {row ? (
                            <Badge tone={ageDays! > 3 ? "warn" : "good"}>
                              {row.observedOn.toISOString().slice(0, 10)}
                              {ageDays! > 3 ? ` · ${ageDays} days old` : ""}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">no live row</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-4">{row ? perKg(row.modalPaisePerKg) : "—"}</td>
                        <td className="py-2 text-inksoft">{row?.state ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <SourceNote>
              A commodity with no live row is one the published snapshot did not carry today for the configured
              state. Those screens fall back to the stored synthetic series and are labelled accordingly rather than
              silently showing an old number as current.
            </SourceNote>
          </Card>
        </div>
      </Shell>
    </>
  );
}

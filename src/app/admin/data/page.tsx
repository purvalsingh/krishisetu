import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle, Stat, Stats, TableWrap, Tag } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rupees } from "@/lib/money";
import { ingestAction } from "@/app/actions/ops";

export default async function DataPage() {
  await requireRole("ADMIN");

  const [bySource, commodities, lastIngest] = await Promise.all([
    prisma.benchmarkObservation.groupBy({ by: ["source"], _count: { _all: true }, _max: { observedOn: true } }),
    prisma.commodity.findMany({ orderBy: { name: "asc" } }),
    prisma.auditLog.findFirst({ where: { action: "benchmark.ingest" }, orderBy: { createdAt: "desc" } }),
  ]);

  const live = await prisma.benchmarkObservation.findMany({
    where: { source: "LIVE" },
    orderBy: { observedOn: "desc" },
    take: 400,
  });
  const latestByCommodity = new Map<string, (typeof live)[number]>();
  for (const r of live) if (!latestByCommodity.has(r.commodityId)) latestByCommodity.set(r.commodityId, r);

  const result = lastIngest?.detail as
    | { written?: number; matched?: number; total?: number; error?: string | null }
    | undefined;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="OPERATOR DESK · DATA SOURCES"
          title="Where every price came from"
          subtitle="Each price on the site carries a source label and a date. Live observations come from the Government of India open data portal; synthetic rows exist so the forecasting code has a history to fit while the pilot has none."
        />

        <Stats count={bySource.length >= 2 ? 2 : 2}>
          {bySource.map((s) => (
            <Stat
              key={s.source}
              label={`${s.source.toLowerCase()} observations`}
              value={s._count._all.toLocaleString("en-IN")}
              note={s._max.observedOn ? `Newest ${s._max.observedOn.toISOString().slice(0, 10)}` : undefined}
              tone={s.source === "LIVE" ? "positive" : undefined}
            />
          ))}
        </Stats>

        <div className="two-col">
          <Card>
            <div className="eyebrow">LIVE REFRESH</div>
            <h2>Agmarknet daily prices via data.gov.in</h2>

            {lastIngest && (
              <div className="refresh-result">
                <span>
                  <b>Last refresh {lastIngest.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</b>
                  <small>
                    {result?.error
                      ? result.error
                      : `${result?.written ?? 0} observations written from ${result?.total ?? 0} published rows; ${result?.matched ?? 0} matched a commodity we list.`}
                  </small>
                </span>
                {result?.error ? <Tag tone="amber">failed</Tag> : <Tag tone="green">ok</Tag>}
              </div>
            )}

            <form action={ingestAction}>
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Fetch today&apos;s prices
              </button>
            </form>

            <MicroNote>
              The published dataset is one snapshot per day with no history, so a price series only exists if this runs
              daily and accumulates observations. A daily cron does exactly that. Until that history exists, the
              forecast screens fit synthetic series and say so on the page.
            </MicroNote>
          </Card>

          <Card>
            <div className="eyebrow">COVERAGE</div>
            <h2>Latest live observation per commodity</h2>

            <TableWrap>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Agmarknet name</th>
                  <th>Market</th>
                  <th>Observed</th>
                  <th>Modal</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((c) => {
                  const row = latestByCommodity.get(c.id);
                  const ageDays = row ? Math.floor((Date.now() - row.observedOn.getTime()) / 86_400_000) : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        {c.imageEmoji} {c.name}
                      </td>
                      <td>{c.agmarknetName}</td>
                      <td>{row?.market ?? "—"}</td>
                      <td>
                        {row ? (
                          <Tag tone={ageDays! > 3 ? "old" : "green"}>
                            {row.observedOn.toISOString().slice(0, 10)}
                            {ageDays! > 3 ? ` · ${ageDays} days old` : ""}
                          </Tag>
                        ) : (
                          <Tag>no live row</Tag>
                        )}
                      </td>
                      <td>{row ? rupees(row.modalPaisePerKg) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>

            <MicroNote>
              A commodity with no live row is one the published snapshot did not carry today for the configured state.
              Those screens fall back to the stored synthetic series and are labelled accordingly, rather than silently
              showing an old number as current.
            </MicroNote>
          </Card>
        </div>
      </Shell>
      <Footer />
    </>
  );
}

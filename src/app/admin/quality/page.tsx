import { Nav, Shell } from "@/components/nav";
import { Badge, Card, Empty, SourceNote, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rupees } from "@/lib/money";
import { ResolveForm } from "./form";

export default async function QualityPage() {
  await requireRole("ADMIN");

  const reports = await prisma.qualityReport.findMany({
    include: {
      reporter: true,
      order: {
        include: {
          cluster: true,
          lines: { include: { commodity: true, allocations: { include: { farmer: { include: { user: true } } } } } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const open = reports.filter((r) => r.status === "OPEN");
  const refunded = reports.reduce((s, r) => s + r.buyerRefundPaise, 0);
  const farmerAdjusted = reports.reduce((s, r) => s + r.farmerAdjustmentPaise, 0);

  return (
    <>
      <Nav />
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Quality and shortages</h1>
        <p className="mt-1 max-w-3xl text-sm text-inksoft">
          A photograph and a handover record are evidence, not a verdict. Every complaint is resolved by a person and
          the outcome is written down here. A deduction from a farmer&apos;s accepted proceeds is only recorded when
          the farmer has agreed to it; otherwise the refund is carried by the platform.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Open complaints" value={String(open.length)} tone={open.length ? "warn" : "good"} />
          <Stat label="Refunded to buyers" value={rupees(refunded)} />
          <Stat
            label="Deducted from farmers"
            value={rupees(farmerAdjusted)}
            note="Only with the farmer's recorded agreement"
            tone={farmerAdjusted > 0 ? "warn" : "good"}
          />
        </div>

        <div className="mt-5 space-y-4">
          {reports.length === 0 && <Empty>No quality complaint has been raised.</Empty>}

          {reports.map((r) => {
            const farms = [
              ...new Set(r.order.lines.flatMap((l) => l.allocations.map((a) => `${a.farmer.user.name}, ${a.farmer.village}`))),
            ];
            return (
              <Card
                key={r.id}
                title={`${r.reason.replaceAll("_", " ").toLowerCase()} · ${r.reporter.name}`}
                subtitle={`${r.order.cluster.name} · ${r.order.windowDate.toISOString().slice(0, 10)} · order total ${rupees(r.order.totalPaise)}`}
                action={
                  <Badge tone={r.status === "OPEN" ? "warn" : r.status === "RESOLVED" ? "good" : "neutral"}>
                    {r.status.toLowerCase()}
                  </Badge>
                }
              >
                <p className="text-sm">{r.description}</p>
                <p className="mt-2 text-xs text-inksoft">
                  Items: {r.order.lines.map((l) => `${l.commodity.name} ${(l.grams / 1000).toFixed(2)} kg`).join(" · ")}
                  {farms.length ? ` · supplied by ${farms.join("; ")}` : ""}
                </p>

                {r.status === "OPEN" ? (
                  <div className="mt-3">
                    <ResolveForm reportId={r.id} />
                  </div>
                ) : (
                  <dl className="tabular mt-3 space-y-1 border-t border-line pt-3 text-sm">
                    <div className="flex justify-between text-inksoft">
                      <dt>Refunded to the buyer</dt>
                      <dd>{rupees(r.buyerRefundPaise)}</dd>
                    </div>
                    <div className="flex justify-between text-inksoft">
                      <dt>Deducted from the farmer</dt>
                      <dd>
                        {rupees(r.farmerAdjustmentPaise)}
                        {r.farmerAgreed ? " (agreed)" : " (no deduction without agreement)"}
                      </dd>
                    </div>
                    {r.resolutionNote && <p className="pt-1 text-xs text-inksoft">{r.resolutionNote}</p>}
                  </dl>
                )}
              </Card>
            );
          })}
        </div>

        <SourceNote>
          Refunds recorded here are demonstration records. No money moves, because payment collection is a sandbox
          authorisation in this build.
        </SourceNote>
      </Shell>
    </>
  );
}

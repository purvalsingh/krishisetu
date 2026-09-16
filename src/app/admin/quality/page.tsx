import { Footer, Nav, Shell } from "@/components/nav";
import { Card, Empty, MicroNote, PageTitle, SectionHead, Stat, Stats, Status } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { kg, rupees } from "@/lib/money";
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
        <PageTitle
          eyebrow="OPERATOR DESK · QUALITY"
          title="Quality and shortages"
          subtitle="A photograph and a handover record are evidence, not a verdict. Every complaint is resolved by a person and the outcome is written down here. A deduction from a farmer's accepted proceeds is only recorded when the farmer has agreed to it; otherwise the refund is carried by the platform."
        />

        <Stats count={3}>
          <Stat label="Open complaints" value={String(open.length)} tone={open.length ? "warning" : "positive"} />
          <Stat label="Refunded to buyers" value={rupees(refunded)} />
          <Stat
            label="Deducted from farmers"
            value={rupees(farmerAdjusted)}
            note="Only with the farmer's recorded agreement"
            tone={farmerAdjusted > 0 ? "warning" : "positive"}
          />
        </Stats>

        {reports.length === 0 && <Empty icon="🧾">No quality complaint has been raised.</Empty>}

        {reports.map((r) => {
          const farms = [
            ...new Set(r.order.lines.flatMap((l) => l.allocations.map((a) => `${a.farmer.user.name}, ${a.farmer.village}`))),
          ];
          return (
            <Card key={r.id}>
              <SectionHead
                eyebrow={`${r.order.cluster.name.replace(" pickup point", "").toUpperCase()} · ${r.order.windowDate.toISOString().slice(0, 10)}`}
                title={`${r.reason.replaceAll("_", " ").toLowerCase()} · ${r.reporter.name}`}
                action={
                  <Status tone={r.status === "OPEN" ? "warning" : r.status === "RESOLVED" ? "good" : "pending"}>
                    {r.status.toLowerCase()}
                  </Status>
                }
              />

              <div className="complaint-text">{r.description}</div>

              <div className="affected">
                <b>Order total {rupees(r.order.totalPaise)}</b>
                <span>{r.order.lines.map((l) => `${l.commodity.name} ${kg(l.grams)}`).join(" · ")}</span>
                {farms.length > 0 && <span>Supplied by {farms.join("; ")}</span>}
              </div>

              {r.status === "OPEN" ? (
                <ResolveForm reportId={r.id} />
              ) : (
                <div className="variance" style={{ marginTop: 16 }}>
                  <span>
                    Refunded to the buyer <b>{rupees(r.buyerRefundPaise)}</b>
                  </span>
                  <span>
                    Deducted from the farmer{" "}
                    <b>
                      {rupees(r.farmerAdjustmentPaise)}
                      {r.farmerAgreed ? " (agreed)" : " (no deduction without agreement)"}
                    </b>
                  </span>
                  {r.resolutionNote && <p className="method">{r.resolutionNote}</p>}
                </div>
              )}
            </Card>
          );
        })}

        <MicroNote>
          Refunds recorded here are demonstration records. No money moves, because payment collection is a sandbox
          authorisation in this build.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

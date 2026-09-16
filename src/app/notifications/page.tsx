import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, Empty, MicroNote, PageTitle, Tag } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { markAllRead } from "@/app/actions/notifications";

const TITLES: Record<string, string> = {
  RUN_PLANNED: "Run planned",
  PICKUP_REMINDER: "Pickup",
  RUN_OFFERED: "Run offered",
  RUN_DISPATCHED: "On the way",
  HANDOVER_RECORDED: "Handover",
  READY_FOR_COLLECTION: "Ready",
  PAYMENT_RELEASED: "Payment",
  RUN_HELD: "Held",
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notices = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = notices.filter((n) => !n.readAt).length;

  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="NOTICES"
          title="What changed on your runs"
          subtitle="Pickup reminders, handover records, collection windows and payment releases. Nothing here is sent by SMS or email in this build; a notice is a record you read on your own screens."
          action={
            unread > 0 ? (
              <form action={markAllRead}>
                <button className="btn btn-secondary">Mark all read</button>
              </form>
            ) : undefined
          }
        />

        {notices.length === 0 ? (
          <Empty icon="🔔">Nothing yet. Notices appear when a run is planned, dispatched, handed over or completed.</Empty>
        ) : (
          notices.map((n) => (
            <Card key={n.id}>
              <div className="section-head">
                <div>
                  <div className="eyebrow">
                    {TITLES[n.kind] ?? n.kind} · {n.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  </div>
                  <h2>{n.title}</h2>
                </div>
                {!n.readAt && <Tag tone="green">new</Tag>}
              </div>
              <p className="method">{n.body}</p>
              {n.link && (
                <Link href={n.link} className="text-link" style={{ marginTop: 12, display: "inline-flex" }}>
                  Open
                </Link>
              )}
            </Card>
          ))
        )}

        <MicroNote>
          A notice records what happened, not what was promised. A pickup reminder is not a guarantee that the vehicle
          arrives on time, and an arrival estimate is computed from assumed road speed rather than live traffic.
        </MicroNote>
      </Shell>
      <Footer />
    </>
  );
}

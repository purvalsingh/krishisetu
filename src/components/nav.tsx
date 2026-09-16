import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOCALES, translator } from "@/lib/i18n";
import { signOutAction } from "@/app/actions/auth";
import { setLanguage } from "@/app/actions/language";
import { ThemeToggle } from "./theme-toggle";
import { unreadCount } from "@/lib/notify";

const LINKS = {
  FARMER: [
    ["/farmer", "navDashboard"],
    ["/farmer/listings", "navProduce"],
    ["/farmer/demand", "navDemand"],
    ["/farmer/earnings", "navEarnings"],
  ],
  CUSTOMER: [
    ["/market", "Shop"],
    ["/cart", "Basket"],
    ["/orders", "My orders"],
  ],
  TRANSPORTER: [["/transporter", "Runs"]],
  ADMIN: [
    ["/admin", "Operations"],
    ["/admin/quality", "Quality"],
    ["/admin/economics", "Economics"],
    ["/admin/data", "Data sources"],
  ],
} as const;

const PUBLIC_LINKS = [
  ["/market", "Shop"],
  ["/positioning", "How we differ"],
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export async function Nav() {
  const session = await getSession();
  const links = session ? LINKS[session.role] : PUBLIC_LINKS;

  // The language choice is offered where it matters most: the farmer's screens.
  const user =
    session?.role === "FARMER"
      ? await prisma.user.findUnique({ where: { id: session.userId }, select: { language: true } })
      : null;
  const t = translator(user?.language ?? "en");
  const unread = session ? await unreadCount(session.userId) : 0;

  return (
    <header className="topbar">
      <Link href={session ? homeFor(session.role) : "/"} className="brand">
        <span className="brand-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9a9 9 0 0 1 7 3c0 7-4 13-9 13Z" />
            <path d="M11 20c0-4 2-8 6-11" />
          </svg>
        </span>
        KrishiSetu
      </Link>

      <nav className="main-nav">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {session?.role === "FARMER" ? t(label as "navDashboard") : label}
          </Link>
        ))}
      </nav>

      <div className="top-actions">
        {user && (
          <form action={setLanguage} className="language">
            {Object.entries(LOCALES).map(([code, label]) => (
              <button key={code} name="language" value={code} className={user.language === code ? "active" : ""}>
                {label}
              </button>
            ))}
          </form>
        )}

        {session && (
          <Link href="/notifications" className="icon-btn" aria-label={`Notices${unread ? `, ${unread} unread` : ""}`} style={{ position: "relative" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && <span className="unread">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        )}

        <ThemeToggle />

        {session ? (
          <form action={signOutAction} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="text-btn" title={session.name}>
              {session.role === "FARMER" ? t("signOut") : "Sign out"}
            </button>
            <span className="avatar" title={`${session.name} · ${session.role.toLowerCase()}`}>
              {initials(session.name)}
            </span>
          </form>
        ) : (
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <main className="page-wrap">{children}</main>;
}

export function Footer() {
  return (
    <footer className="footer">
      <span>KrishiSetu · Navi Mumbai pooled delivery</span>
      <span>All prices carry their source and date</span>
    </footer>
  );
}

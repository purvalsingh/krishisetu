import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOCALES, translator } from "@/lib/i18n";
import { signOutAction } from "@/app/actions/auth";
import { setLanguage } from "@/app/actions/language";

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
  TRANSPORTER: [
    ["/transporter", "Runs"],
  ],
  ADMIN: [
    ["/admin", "Operations"],
    ["/admin/quality", "Quality"],
    ["/admin/economics", "Economics"],
    ["/admin/data", "Data sources"],
  ],
} as const;

export async function Nav() {
  const session = await getSession();
  const links = session ? LINKS[session.role] : [];
  // Language choice is offered where it matters most: the farmer's own screens.
  const user =
    session?.role === "FARMER"
      ? await prisma.user.findUnique({ where: { id: session.userId }, select: { language: true } })
      : null;
  // Farmer navigation is translated; the other roles stay in English for now.
  const t = translator(user?.language ?? "en");

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href={session ? homeFor(session.role) : "/"} className="text-sm font-semibold tracking-tight">
          <span className="text-brand">Krishi</span>Setu
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-inksoft">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {session?.role === "FARMER" ? t(label as "navDashboard") : label}
            </Link>
          ))}
        </nav>
        {user && <LanguagePicker current={user.language} />}
        {session ? (
          <form action={signOutAction} className="flex items-center gap-3">
            <span className="text-xs text-inksoft">
              {session.name} · {session.role.toLowerCase()}
            </span>
            <button className="rounded-lg border border-line px-2.5 py-1.5 text-xs hover:bg-panel2">
              {session.role === "FARMER" ? t("signOut") : "Sign out"}
            </button>
          </form>
        ) : (
          <Link href="/login" className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-panel2">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

/** A plain form so the choice works without client-side JavaScript. */
function LanguagePicker({ current }: { current: string }) {
  return (
    <form action={setLanguage} className="flex items-center gap-1">
      {Object.entries(LOCALES).map(([code, label]) => (
        <button
          key={code}
          name="language"
          value={code}
          className={`rounded-lg px-2 py-1 text-xs transition ${
            current === code ? "bg-brandsoft text-brand" : "text-inksoft hover:bg-panel2"
          }`}
        >
          {label}
        </button>
      ))}
    </form>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>;
}

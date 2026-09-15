import { redirect } from "next/navigation";
import { Nav, Shell } from "@/components/nav";
import { getSession, homeFor } from "@/lib/auth";
import { LoginForm } from "./form";

const DEMO_ACCOUNTS = [
  { phone: "9800000101", name: "Sanjay Patil", role: "Farmer", note: "Khalapur, Raigad · listings and pooled runs" },
  { phone: "9800000301", name: "Anjali Deshpande", role: "Household buyer", note: "Nerul Sector 6 pickup point" },
  { phone: "9800000306", name: "Hotel Anand Bhavan", role: "Bulk buyer", note: "Vashi · large standing requirement" },
  { phone: "9800000201", name: "Imran Shaikh", role: "Transporter", note: "Tata Ace, 750 kg, Panvel base" },
  { phone: "9800000001", name: "Platform operator", role: "Administrator", note: "Run planning and economics" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const { as } = await searchParams;

  return (
    <>
      <Nav />
      <Shell>
        <div className="mx-auto grid max-w-4xl gap-6 py-8 md:grid-cols-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-inksoft">
              One account per person. The role attached to the account decides what the site shows: produce and
              proceeds for a farmer, a basket for a buyer, runs for a transporter, planning for the operator.
            </p>
            <div className="mt-5">
              <LoginForm defaultPhone={as ?? ""} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Demonstration accounts</h2>
            <p className="mt-1 text-xs text-inksoft">
              Every account below uses the password <code className="rounded bg-panel2 px-1">demo1234</code>. These
              are synthetic records created by the seed script.
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.phone}>
                  <a
                    href={`/login?as=${a.phone}`}
                    className="block rounded-lg border border-line px-3 py-2 transition hover:border-brand"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-[11px] text-brand">{a.role}</span>
                    </div>
                    <div className="tabular text-[11px] text-inksoft">
                      {a.phone} · {a.note}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </>
  );
}

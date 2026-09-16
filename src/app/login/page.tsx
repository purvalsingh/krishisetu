import { redirect } from "next/navigation";
import { Footer, Nav, Shell } from "@/components/nav";
import { getSession, homeFor } from "@/lib/auth";
import { LoginForm } from "./form";

const DEMO_ACCOUNTS = [
  { phone: "9800000101", name: "Sanjay Patil", role: "Farmer", note: "Raigad Bhaji Utpadak FPO" },
  { phone: "9800000301", name: "Anjali Deshpande", role: "Household buyer", note: "Nerul Sector 6 pickup point" },
  { phone: "9800000306", name: "Hotel Anand Bhavan", role: "Bulk buyer", note: "Vashi · standing requirement" },
  { phone: "9800000201", name: "Imran Shaikh", role: "Transporter", note: "Tata Ace · MH43 AB 1234" },
  { phone: "9800000001", name: "Platform operator", role: "Operator", note: "Run planning desk" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const { as } = await searchParams;

  const accounts = DEMO_ACCOUNTS.map((a) => ({
    ...a,
    initials: a.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join(""),
  }));

  return (
    <>
      <Nav />
      <Shell>
        <div className="login-layout">
          <div>
            <div className="eyebrow">DEMONSTRATION ACCESS</div>
            <h1>Choose the desk you want to enter.</h1>
            <p className="subtitle">
              Four roles, one shared transaction. The role attached to the account decides what the site shows:
              produce and proceeds for a farmer, a basket for a buyer, runs for a transporter, planning for the
              operator.
            </p>
            <LoginForm accounts={accounts} defaultPhone={as ?? accounts[0].phone} />
          </div>

          <section className="card account-list">
            <div className="eyebrow">DEMO ACCOUNTS</div>
            {accounts.map((a) => (
              <a key={a.phone} href={`/login?as=${a.phone}`} className={`account-row ${as === a.phone ? "selected" : ""}`.trim()}>
                <span className="account-initial">{a.initials}</span>
                <span>
                  <b>{a.name}</b>
                  <small>
                    <span>{a.phone}</span> · <span>{a.note}</span>
                  </small>
                </span>
                <span className="tag">{a.role}</span>
              </a>
            ))}
            <p className="micro-note">
              Every demonstration account uses password <b>demo1234</b>. These are synthetic records created by the
              seed script; no real person is represented.
            </p>
          </section>
        </div>
      </Shell>
      <Footer />
    </>
  );
}

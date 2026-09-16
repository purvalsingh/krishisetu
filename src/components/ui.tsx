import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Primitives for the KrishiSetu design system.
 *
 * Every visual decision lives in globals.css. These components exist only to
 * stop the class vocabulary being retyped on twenty pages.
 */

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Stats({ count, children }: { count: 2 | 3 | 4; children: ReactNode }) {
  const word = { 2: "two", 3: "three", 4: "four" }[count];
  return <div className={`stats ${word}`}>{children}</div>;
}

export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "positive" | "warning";
}) {
  return (
    <div className={`stat ${tone ?? ""}`.trim()}>
      <div className="eyebrow">{label}</div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function Tag({ children, tone }: { children: ReactNode; tone?: "green" | "amber" | "old" }) {
  return <span className={`tag ${tone ?? ""}`.trim()}>{children}</span>;
}

export function Status({ children, tone }: { children: ReactNode; tone: "good" | "pending" | "warning" }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

/** Pill row. The first pill renders green and the second amber by design. */
export function Pills({ children }: { children: ReactNode }) {
  return <div className="pills">{children}</div>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}

export function Empty({ icon = "🌾", children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <p>{children}</p>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-link">
      {children} <Arrow />
    </Link>
  );
}

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/** Small print that names where a number came from. Used wherever provenance matters. */
export function MicroNote({ children }: { children: ReactNode }) {
  return <p className="micro-note">{children}</p>;
}

/**
 * Observed history followed by the predicted band, drawn from real values.
 * The shaded region is the holdout-residual band, not a confidence interval
 * derived from a distributional assumption.
 */
export function Spark({
  history,
  forecast,
}: {
  history: number[];
  forecast: { mid: number; lo: number; hi: number }[];
}) {
  const all = [...history, ...forecast.flatMap((f) => [f.lo, f.hi])];
  if (all.length < 3) return null;

  const W = 100;
  const H = 40;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const n = history.length + forecast.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * H;

  const observed = history.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const join = history.length - 1;
  const predicted = [history.at(-1)!, ...forecast.map((f) => f.mid)]
    .map((v, i) => `${x(join + i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");
  const band =
    forecast.map((f, i) => `${x(join + 1 + i).toFixed(2)},${y(f.hi).toFixed(2)}`).join(" ") +
    " " +
    forecast
      .map((_, i) => {
        const f = forecast[forecast.length - 1 - i];
        return `${x(join + forecast.length - i).toFixed(2)},${y(f.lo).toFixed(2)}`;
      })
      .join(" ");

  return (
    <div className="spark">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Observed demand followed by the predicted range">
        <polygon points={band} fill="var(--green-light)" opacity="0.28" />
        <polyline points={observed} fill="none" stroke="var(--muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <polyline
          points={predicted}
          fill="none"
          stroke="var(--green)"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

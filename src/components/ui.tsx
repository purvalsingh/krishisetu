import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-panel ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-inksoft">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note, tone = "default" }: { label: string; value: ReactNode; note?: ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneClass = {
    default: "text-ink",
    good: "text-brand",
    warn: "text-accent",
    bad: "text-danger",
  }[tone];
  return (
    <div className="rounded-lg border border-line bg-panel2 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-inksoft">{label}</div>
      <div className={`tabular mt-1 text-lg font-semibold ${toneClass}`}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] leading-snug text-inksoft">{note}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "brand" }) {
  const cls = {
    neutral: "border-line bg-panel2 text-inksoft",
    good: "border-transparent bg-brandsoft text-brand",
    brand: "border-transparent bg-brandsoft text-brand",
    warn: "border-transparent bg-accentsoft text-accent",
    bad: "border-transparent bg-dangersoft text-danger",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const cls = {
    primary: "bg-brand text-white hover:opacity-90",
    ghost: "border border-line bg-panel hover:bg-panel2",
    danger: "bg-danger text-white hover:opacity-90",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${cls} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "ghost" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  const cls = variant === "primary" ? "bg-brand text-white hover:opacity-90" : "border border-line bg-panel hover:bg-panel2";
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${cls}`}>
      {children}
    </Link>
  );
}

/** A labelled disclosure of where a number came from. Used wherever data provenance matters. */
export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[11px] leading-snug text-inksoft">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-inksoft">{children}</p>;
}

/** Horizontal stacked bar showing where each rupee of the buyer's bill goes. */
export function BillBar({ parts }: { parts: { label: string; paise: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.paise, 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full border border-line">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.paise / total) * 100}%`, background: p.color }} title={p.label} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-inksoft">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.label} {Math.round((p.paise / total) * 100)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Observed history followed by a predicted band, drawn as one small chart.
 * The shaded region is the holdout-residual band, not a confidence interval
 * from a distributional assumption.
 */
export function Spark({
  history,
  forecast,
  width = 260,
  height = 56,
}: {
  history: number[];
  forecast: { mid: number; lo: number; hi: number }[];
  width?: number;
  height?: number;
}) {
  const all = [...history, ...forecast.flatMap((f) => [f.lo, f.hi])];
  if (all.length < 2) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const n = history.length + forecast.length;
  const x = (i: number) => (i / (n - 1)) * (width - 2) + 1;
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);

  const histPath = history.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const joinIndex = history.length - 1;
  const midPath = [history.at(-1)!, ...forecast.map((f) => f.mid)]
    .map((v, i) => `${i ? "L" : "M"}${x(joinIndex + i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const bandPath =
    `M${x(joinIndex).toFixed(1)},${y(history.at(-1)!).toFixed(1)} ` +
    forecast.map((f, i) => `L${x(joinIndex + 1 + i).toFixed(1)},${y(f.hi).toFixed(1)}`).join(" ") +
    " " +
    forecast
      .map((f, i) => `L${x(joinIndex + forecast.length - i).toFixed(1)},${y(forecast[forecast.length - 1 - i].lo).toFixed(1)}`)
      .join(" ") +
    " Z";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Observed demand followed by the predicted range">
      <path d={bandPath} fill="var(--brand)" opacity="0.16" />
      <path d={histPath} fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" />
      <path d={midPath} fill="none" stroke="var(--brand)" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

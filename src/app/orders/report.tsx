"use client";

import { useActionState, useState } from "react";
import { reportQualityIssue } from "@/app/actions/quality";

const REASONS = [
  ["SHORT_WEIGHT", "Weight was short"],
  ["QUALITY_BELOW_GRADE", "Quality below the grade I bought"],
  ["DAMAGED", "Produce was damaged or spoiled"],
  ["MISSING_ITEM", "An item was missing"],
  ["OTHER", "Something else"],
] as const;

export function ReportIssue({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportQualityIssue, undefined);

  if (state?.ok)
    return (
      <p className="micro-note">
        Reported. The operator will look at it and record what was agreed. Any refund, and any adjustment to a
        farmer&apos;s amount, is written down with the reason.
      </p>
    );

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="text-btn">
        Report a problem with this order
      </button>
    );

  return (
    <form action={action} className="report-form">
      <input type="hidden" name="orderId" value={orderId} />
      <select name="reason">
        {REASONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea name="description" placeholder="What was wrong, and how much of it" />
      {state?.error && <p className="warning-text">{state.error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { reportQualityIssue } from "@/app/actions/quality";
import { Button } from "@/components/ui";

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
      <p className="mt-3 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs text-inksoft">
        Reported. The operator will look at it and record what was agreed. Any refund and any adjustment to the
        farmer&apos;s amount are written down with the reason.
      </p>
    );

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-3 text-xs font-medium text-brand hover:underline">
        Report a problem with this order
      </button>
    );

  return (
    <form action={action} className="mt-3 space-y-2 rounded-lg border border-line bg-panel2 p-3">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="reason"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {REASONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        name="description"
        rows={2}
        placeholder="What was wrong, and how much of it"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <Button disabled={pending}>{pending ? "Sending…" : "Send report"}</Button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-panel">
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { resolveQualityReport } from "@/app/actions/quality";
import { Button } from "@/components/ui";

export function ResolveForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(resolveQualityReport, undefined);
  const [farmerAgreed, setFarmerAgreed] = useState(false);
  const field = "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form action={action} className="space-y-3 border-t border-line pt-3">
      <input type="hidden" name="reportId" value={reportId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Refund to the buyer (₹)</span>
          <input name="buyerRefundRupees" type="number" step="1" min="0" defaultValue="0" className={field} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Deduct from the farmer (₹)</span>
          <input
            name="farmerAdjustmentRupees"
            type="number"
            step="1"
            min="0"
            defaultValue="0"
            disabled={!farmerAgreed}
            className={field}
          />
        </label>
      </div>

      <label className="flex items-start gap-2 text-xs text-inksoft">
        <input
          name="farmerAgreed"
          type="checkbox"
          value="true"
          checked={farmerAgreed}
          onChange={(e) => setFarmerAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line"
        />
        The farmer has been shown the evidence and has agreed to this deduction. Without this, the refund is carried
        by the platform and the farmer&apos;s accepted amount stands.
      </label>

      <label className="block">
        <span className="text-xs font-medium text-inksoft">What was agreed, and with whom</span>
        <textarea name="resolutionNote" rows={2} className={field} placeholder="Weighed short by 1.2 kg at the point; buyer refunded, farmer not charged" />
      </label>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <Button disabled={pending}>{pending ? "Recording…" : "Record the outcome"}</Button>
        <button
          name="dismiss"
          value="true"
          disabled={pending}
          className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-panel2"
        >
          Dismiss with a reason
        </button>
      </div>
    </form>
  );
}

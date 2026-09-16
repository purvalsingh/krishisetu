"use client";

import { useActionState, useState } from "react";
import { resolveQualityReport } from "@/app/actions/quality";

export function ResolveForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(resolveQualityReport, undefined);
  const [farmerAgreed, setFarmerAgreed] = useState(false);

  return (
    <form action={action} className="resolution">
      <input type="hidden" name="reportId" value={reportId} />

      <label>
        Refund to the buyer (₹)
        <input name="buyerRefundRupees" type="number" step="1" min="0" defaultValue="0" />
      </label>

      <label>
        Deduct from the farmer (₹)
        <input name="farmerAdjustmentRupees" type="number" step="1" min="0" defaultValue="0" disabled={!farmerAgreed} />
      </label>

      <label className="check">
        <input
          name="farmerAgreed"
          type="checkbox"
          value="true"
          checked={farmerAgreed}
          onChange={(e) => setFarmerAgreed(e.target.checked)}
        />
        The farmer has been shown the evidence and has agreed to this deduction. Without this, the refund is carried by
        the platform and the farmer&apos;s accepted amount stands.
      </label>

      <textarea name="resolutionNote" placeholder="Weighed short by 1.2 kg at the point; buyer refunded, farmer not charged" />

      {state?.error && <p className="warning-text">{state.error}</p>}

      <label style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Recording…" : "Record the outcome"}
        </button>
        <button name="dismiss" value="true" disabled={pending} className="btn btn-secondary">
          Dismiss with a reason
        </button>
      </label>
    </form>
  );
}

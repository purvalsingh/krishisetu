"use client";

import { useActionState, useState } from "react";
import { createListing } from "@/app/actions/listing";
import { Button } from "@/components/ui";

type Suggestion = {
  low: number;
  high: number;
  comparableNet: number;
  cappedByReference: boolean;
  observedOn: string | null;
  source: string | null;
} | null;

export function NewListingForm({
  commodities,
  suggestions,
}: {
  commodities: { id: string; name: string; emoji: string }[];
  suggestions: Record<string, Suggestion>;
}) {
  const [state, action, pending] = useActionState(createListing, undefined);
  const [commodityId, setCommodityId] = useState(commodities[0]?.id ?? "");
  const suggestion = suggestions[commodityId];

  const field = "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-inksoft">Crop</span>
        <select name="commodityId" value={commodityId} onChange={(e) => setCommodityId(e.target.value)} className={field}>
          {commodities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </label>

      {suggestion && (
        <div className="rounded-lg border border-line bg-panel2 px-3 py-2.5 text-xs">
          <div className="font-medium text-ink">
            Suggested range ₹{(suggestion.low / 100).toFixed(0)} to ₹{(suggestion.high / 100).toFixed(0)} per kg
          </div>
          <p className="tabular mt-1 leading-snug text-inksoft">
            Selling the same crop at the mandi would leave you about ₹{(suggestion.comparableNet / 100).toFixed(0)}/kg
            after your own transport and commission
            {suggestion.observedOn ? `, based on the ${suggestion.source?.toLowerCase()} observation of ${suggestion.observedOn}` : ""}.
            {suggestion.cappedByReference
              ? " The upper end is capped so the delivered price can stay below the quick-commerce rate."
              : ""}
          </p>
          <p className="mt-1 leading-snug text-inksoft">This is a suggestion. Enter the amount you are willing to accept.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Quantity (kg)</span>
          <input name="kilograms" type="number" step="0.5" min="1" defaultValue="50" className={field} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Your rate (₹/kg)</span>
          <input
            name="rupeesPerKg"
            type="number"
            step="0.5"
            min="1"
            defaultValue={suggestion ? Math.round(suggestion.low / 100) : 30}
            className={field}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Grade</span>
          <select name="grade" className={field} defaultValue="A">
            <option value="A">A — clean, sorted</option>
            <option value="B">B — mixed sizes</option>
            <option value="IMPERFECT">Imperfect — edible, cosmetic marks</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-inksoft">Harvest date</span>
          <input name="harvestDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={field} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-inksoft">
        <input name="prebooking" type="checkbox" value="true" className="h-4 w-4 rounded border-line" />
        This is an expected harvest, not stock in hand
      </label>

      <label className="block">
        <span className="text-xs font-medium text-inksoft">Notes for the buyer (optional)</span>
        <textarea name="notes" rows={2} className={field} placeholder="Picked this morning, no cold storage" />
      </label>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="text-xs text-brand">Listed. Buyers in the pickup clusters can see it now.</p>}

      <Button disabled={pending} className="w-full">
        {pending ? "Listing…" : "List this produce"}
      </Button>
    </form>
  );
}

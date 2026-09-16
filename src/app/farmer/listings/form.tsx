"use client";

import { useActionState, useState } from "react";
import { createListing } from "@/app/actions/listing";
import { Arrow } from "@/components/ui";

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

  return (
    <form action={action}>
      <div className="form-grid">
        <label>
          Crop
          <select name="commodityId" value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </label>

        {suggestion && (
          <div className="suggestion">
            <b>
              Suggested range ₹{(suggestion.low / 100).toFixed(0)} to ₹{(suggestion.high / 100).toFixed(0)} per kg
            </b>
            <span>
              Selling the same crop at the mandi would leave you about ₹{(suggestion.comparableNet / 100).toFixed(0)}/kg
              after your own transport and commission
              {suggestion.observedOn ? `, from the ${suggestion.source?.toLowerCase()} observation of ${suggestion.observedOn}` : ""}.
              {suggestion.cappedByReference ? " The upper end is capped so the delivered price stays under the quick-commerce rate." : ""}
            </span>
            <small>This is a suggestion. Enter the amount you are willing to accept.</small>
          </div>
        )}

        <label>
          Quantity in kg
          <input name="kilograms" type="number" step="0.5" min="1" defaultValue="50" />
        </label>

        <label>
          Your rate in ₹/kg
          <input name="rupeesPerKg" type="number" step="0.5" min="1" defaultValue={suggestion ? Math.round(suggestion.low / 100) : 30} />
        </label>

        <label>
          Grade
          <select name="grade" defaultValue="A">
            <option value="A">A — clean, sorted</option>
            <option value="B">B — mixed sizes</option>
            <option value="IMPERFECT">Imperfect — edible, cosmetic marks</option>
          </select>
        </label>

        <label>
          Harvest date
          <input name="harvestDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>

        <label className="check">
          <input name="prebooking" type="checkbox" value="true" />
          This is an expected harvest, not stock in hand
        </label>

        <label>
          Notes
          <textarea name="notes" rows={2} placeholder="Picked this morning, no cold storage" />
        </label>
      </div>

      {state?.error && <p className="warning-text">{state.error}</p>}
      {state?.ok && <p className="positive-text">Listed. Buyers in the pickup clusters can see it now.</p>}

      <button className="btn btn-primary" disabled={pending} style={{ marginTop: 18 }}>
        {pending ? "Saving…" : "Save listing"} <Arrow />
      </button>
    </form>
  );
}

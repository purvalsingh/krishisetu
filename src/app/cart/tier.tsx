"use client";

import { useState } from "react";
import { placeOrder } from "@/app/actions/basket";
import { Button } from "@/components/ui";

const rupees = (p: number) => "₹" + (p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Collection from the neighbourhood point is the default because it is what
 * makes a six kilogram basket deliverable without a loss. In-society delivery
 * is offered as a priced extra rather than hidden in the item prices.
 */
export function TierChoice({
  goodsPaise,
  hostCommissionPaise,
  lastLegFeePaise,
  clusterName,
  referenceTotalPaise,
  farmerProceedsPaise,
  minimumOrderPaise,
  freeLastLegAbovePaise,
}: {
  goodsPaise: number;
  hostCommissionPaise: number;
  lastLegFeePaise: number;
  clusterName: string;
  referenceTotalPaise: number;
  farmerProceedsPaise: number;
  minimumOrderPaise: number;
  freeLastLegAbovePaise: number;
}) {
  const [tier, setTier] = useState<"CLUSTER_PICKUP" | "LAST_LEG">("CLUSTER_PICKUP");
  // Door delivery is free once the basket is big enough to pay for it out of the site fee.
  const lastLegDue = goodsPaise >= freeLastLegAbovePaise ? 0 : lastLegFeePaise;
  const shortOfFree = Math.max(0, freeLastLegAbovePaise - goodsPaise);
  const extra = hostCommissionPaise + (tier === "LAST_LEG" ? lastLegDue : 0);
  const total = goodsPaise + extra;
  const saving = referenceTotalPaise - total;

  return (
    <form action={placeOrder} className="mt-4 space-y-3">
      <input type="hidden" name="tier" value={tier} />

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-inksoft">How would you like to receive it?</legend>
        {(
          [
            {
              value: "CLUSTER_PICKUP" as const,
              title: `Collect from ${clusterName}`,
              note: "Between 6 pm and 9 pm on the run day",
              fee: hostCommissionPaise,
            },
            {
              value: "LAST_LEG" as const,
              title: "Delivered to my door",
              note:
                lastLegDue === 0
                  ? "Free on this basket — walked to your flat from the pickup point during the window"
                  : `Walked to your flat from the pickup point. Free once the basket reaches ${rupees(freeLastLegAbovePaise)}; ${rupees(shortOfFree)} to go.`,
              fee: hostCommissionPaise + lastLegDue,
            },
          ]
        ).map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
              tier === opt.value ? "border-brand bg-brandsoft" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="tierChoice"
              checked={tier === opt.value}
              onChange={() => setTier(opt.value)}
              className="mt-0.5"
            />
            <span className="flex-1">
              <span className="block text-sm font-medium">{opt.title}</span>
              <span className="block text-xs text-inksoft">{opt.note}</span>
            </span>
            <span className="tabular text-sm">{rupees(opt.fee)}</span>
          </label>
        ))}
      </fieldset>

      <dl className="tabular space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-inksoft">
          <dt>Produce, transport and fee</dt>
          <dd>{rupees(goodsPaise)}</dd>
        </div>
        <div className="flex justify-between text-inksoft">
          <dt>{tier === "LAST_LEG" ? "Pickup point and door delivery" : "Pickup point"}</dt>
          <dd>{rupees(extra)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Total</dt>
          <dd>{rupees(total)}</dd>
        </div>
        <div className="flex justify-between text-xs text-brand">
          <dt>Of which the farmers receive</dt>
          <dd>{rupees(farmerProceedsPaise)}</dd>
        </div>
        {referenceTotalPaise > 0 && (
          <div className={`flex justify-between text-xs ${saving >= 0 ? "text-brand" : "text-danger"}`}>
            <dt>Against the quick-commerce reference</dt>
            <dd>
              {saving >= 0 ? "−" : "+"}
              {rupees(Math.abs(saving))}
            </dd>
          </div>
        )}
      </dl>

      {total < minimumOrderPaise ? (
        <p className="rounded-lg border border-line bg-panel2 px-3 py-2.5 text-xs leading-snug text-inksoft">
          Add {rupees(minimumOrderPaise - total)} more to reach the {rupees(minimumOrderPaise)} minimum. Packing and
          the pickup-point commission are charged once per order, so a smaller basket would cost more to fulfil than
          it is worth, and that gap would have to come out of someone&apos;s share.
        </p>
      ) : null}

      <Button className="w-full" disabled={total < minimumOrderPaise}>
        Confirm order
      </Button>
    </form>
  );
}

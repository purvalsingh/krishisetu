"use client";

import { useState } from "react";
import { placeOrder } from "@/app/actions/basket";
import { Arrow } from "@/components/ui";

const rupees = (p: number) => "₹" + (p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Collection from the neighbourhood point is the default because it is what
 * makes a six kilogram basket deliverable without a loss. Door delivery is free
 * once the basket is large enough to pay for it out of the site fee.
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

  const lastLegDue = goodsPaise >= freeLastLegAbovePaise ? 0 : lastLegFeePaise;
  const shortOfFree = Math.max(0, freeLastLegAbovePaise - goodsPaise);
  const extra = hostCommissionPaise + (tier === "LAST_LEG" ? lastLegDue : 0);
  const total = goodsPaise + extra;
  const saving = referenceTotalPaise - total;
  const belowMinimum = total < minimumOrderPaise;

  const options = [
    {
      value: "CLUSTER_PICKUP" as const,
      title: `Collect from ${clusterName}`,
      note: "Between 6 pm and 9 pm on run day",
      fee: hostCommissionPaise,
    },
    {
      value: "LAST_LEG" as const,
      title: "Delivered to my door",
      note:
        lastLegDue === 0
          ? "Free on this basket — walked to your flat from the pickup point"
          : `Free once basket reaches ${rupees(freeLastLegAbovePaise)}; ${rupees(shortOfFree)} to go.`,
      fee: hostCommissionPaise + lastLegDue,
    },
  ];

  return (
    <form action={placeOrder}>
      <input type="hidden" name="tier" value={tier} />

      <div className="delivery-options">
        {options.map((opt) => (
          <label key={opt.value} className={tier === opt.value ? "chosen" : ""}>
            <input type="radio" name="tierChoice" checked={tier === opt.value} onChange={() => setTier(opt.value)} />
            <span>
              <b>{opt.title}</b>
              <small>{opt.note}</small>
            </span>
            <strong>{rupees(opt.fee)}</strong>
          </label>
        ))}
      </div>

      <div className="totals">
        <span>
          Produce, transport and fee <b>{rupees(goodsPaise)}</b>
        </span>
        <span>
          {tier === "LAST_LEG" ? "Pickup point and door delivery" : "Pickup point"} <b>{rupees(extra)}</b>
        </span>
        <strong>
          Total <b>{rupees(total)}</b>
        </strong>
        <em>
          Of which the farmers receive <span>{rupees(farmerProceedsPaise)}</span>
        </em>
        {referenceTotalPaise > 0 && (
          <em style={saving < 0 ? { color: "var(--amber)" } : undefined}>
            Against the quick-commerce reference{" "}
            <span>
              {saving >= 0 ? "−" : "+"}
              {rupees(Math.abs(saving))}
            </span>
          </em>
        )}
      </div>

      {belowMinimum && (
        <p className="warning-box">
          Add {rupees(minimumOrderPaise - total)} more to reach the {rupees(minimumOrderPaise)} minimum. Packing and
          the pickup-point commission are charged once per order, so a smaller basket costs more to fulfil than it is
          worth, and that gap would have to come out of someone&apos;s share.
        </p>
      )}

      <button className="btn btn-primary" disabled={belowMinimum} style={{ width: "100%" }}>
        Confirm order <Arrow />
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { addToBasket } from "@/app/actions/basket";

/**
 * Exact-quantity buying: any multiple of the commodity's own weighing
 * increment, so a 700 g purchase is possible where the increment is 100 g.
 */
export function QuantityPicker({
  commodityId,
  stepGrams,
  minGrams,
  maxGrams,
  pricePaisePerKg,
}: {
  commodityId: string;
  stepGrams: number;
  minGrams: number;
  maxGrams: number;
  pricePaisePerKg: number;
}) {
  const [grams, setGrams] = useState(Math.max(minGrams, stepGrams * 2));
  const ceiling = maxGrams - (maxGrams % stepGrams);
  const clamp = (g: number) => Math.max(minGrams, Math.min(ceiling, g));
  const amount = Math.round((pricePaisePerKg * grams) / 1000);

  return (
    <form action={addToBasket} className="buy-row">
      <input type="hidden" name="commodityId" value={commodityId} />
      <input type="hidden" name="grams" value={grams} />

      <div className="stepper">
        <button type="button" onClick={() => setGrams((g) => clamp(g - stepGrams))} aria-label="Reduce quantity">
          −
        </button>
        <span>{grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 ? 2 : 0)} kg` : `${grams} g`}</span>
        <button type="button" onClick={() => setGrams((g) => clamp(g + stepGrams))} aria-label="Increase quantity">
          +
        </button>
      </div>

      <button className="btn btn-primary add-btn">
        Add · <span>₹{(amount / 100).toFixed(2)}</span>
      </button>
    </form>
  );
}

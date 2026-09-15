"use client";

import { useState } from "react";
import { addToBasket } from "@/app/actions/basket";
import { Button } from "@/components/ui";

/**
 * Exact-quantity buying. The buyer picks any multiple of the commodity's
 * weighing increment rather than a fixed pack, so a 700 g purchase is possible
 * where the increment is 100 g.
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
  const clamp = (g: number) => Math.max(minGrams, Math.min(maxGrams - (maxGrams % stepGrams), g));
  const amount = Math.round((pricePaisePerKg * grams) / 1000);

  return (
    <form action={addToBasket} className="flex items-center gap-2">
      <input type="hidden" name="commodityId" value={commodityId} />
      <input type="hidden" name="grams" value={grams} />
      <div className="flex items-center rounded-lg border border-line">
        <button
          type="button"
          onClick={() => setGrams((g) => clamp(g - stepGrams))}
          className="px-2.5 py-1.5 text-sm hover:bg-panel2"
          aria-label="Reduce quantity"
        >
          −
        </button>
        <span className="tabular w-[72px] text-center text-sm">
          {grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 ? 2 : 0)} kg` : `${grams} g`}
        </span>
        <button
          type="button"
          onClick={() => setGrams((g) => clamp(g + stepGrams))}
          className="px-2.5 py-1.5 text-sm hover:bg-panel2"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <Button className="flex-1">Add · ₹{(amount / 100).toFixed(0)}</Button>
    </form>
  );
}

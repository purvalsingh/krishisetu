/** Money is integer paise and weight is integer grams everywhere below the UI. */

export const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole-rupee form for dense screens. */
export const rupeesShort = (paise: number) =>
  "₹" + Math.round(paise / 100).toLocaleString("en-IN");

export const kg = (grams: number) => (grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2) + " kg";

export const perKg = (paisePerKg: number) => rupees(paisePerKg) + "/kg";

/** paise for a quantity priced per kg, rounded to the nearest paisa. */
export const forGrams = (paisePerKg: number, grams: number) => Math.round((paisePerKg * grams) / 1000);

/** Quintal (100 kg) prices from Agmarknet converted to paise per kg. */
export const quintalRupeesToPaisePerKg = (rupeesPerQuintal: number) =>
  Math.round((rupeesPerQuintal * 100) / 100);

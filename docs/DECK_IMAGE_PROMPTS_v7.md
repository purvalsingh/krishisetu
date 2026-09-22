# Gemini image prompts — two new panels for the SIH deck

Both additions are live in the running prototype, so every figure below is a real
output of the code, not deck copy:

- **Prediction by place** — `src/lib/insights.ts` fits demand per pickup point,
  not just per crop, and the farmer screen shows the ranked list.
- **Where the remaining stock should go** — `src/lib/placement.ts` /
  `src/lib/surplus.ts` rank the pickup points that can still absorb an unsold
  lot, and split the quantity between them without promising the same kilogram
  twice.

House style for both prompts: flat vector infographic, soft pastel rounded
cards on white, thin coloured outlines, friendly Indian farmer and delivery
illustrations, no photorealism, no drop shadows, 16:9, generous inner padding,
crisp readable sans-serif labels. Same look as the existing panels in the deck.

---

## Panel 1 — replaces the "What is Actually Different?" panel on slide 2

Keep the existing four cards, add two. Six cards in a 3 × 2 grid.

> Flat vector infographic panel titled "What is Actually Different?" with a small
> megaphone icon beside the title. Six numbered cards in a 3-column, 2-row grid on
> a white rounded panel, soft pastel palette, thin coloured outlines, friendly
> Indian illustration style, no photorealism, 16:9.
>
> Card 1, green, badge "1", heading "Farmer gets the net rate", illustration of a
> smiling Indian farmer holding a phone showing rupees, small circular stamp
> reading "100% Farmer Rate", caption "No commission, listing charge or logistics
> cost is deducted from anywhere."
>
> Card 2, blue, badge "2", heading "Orders are pooled by destination", illustration
> of a delivery truck with three map pins above it, caption "Only lots going to the
> same neighbourhood share a vehicle."
>
> Card 3, orange, badge "3", heading "Nothing moves unsold", illustration of a
> loaded tempo with a crossed-out empty crate, caption "The tempo is loaded against
> confirmed orders, so there is no stock to write off."
>
> Card 4, red, badge "4", heading "Better price, healthier food", illustration of a
> vegetable basket with a heart and a small "FRESH & LOCAL" tag, caption "Shorter
> chain, fresher produce, more value for everyone."
>
> Card 5, purple, badge "5", heading "Demand is predicted by place", illustration of
> a map of a city with three located pickup pins of different sizes and a small
> rising forecast line, caption "Bottle gourd next week: Nerul 246 kg, Kharghar 207
> kg, Vashi 186 kg — the crop and the neighbourhood, not just the crop."
>
> Card 6, teal, badge "6", heading "Unsold stock is re-placed", illustration of a
> crate of tomatoes with three arrows fanning out to three small pickup-point
> buildings, caption "151 kg left over, split 86 kg Vashi, 63 kg Kharghar, 3 kg
> Nerul — inside the freshness limit."

---

## Panel 2 — optional, a new strip for slide 3 under the six-step pipeline

Only if slide 3 still has vertical room. It shows the mechanism rather than the claim.

> Flat vector infographic strip titled "Where the rest of the lot should go", left
> to right, four stages joined by thin arrows, white rounded panel, pastel palette,
> friendly Indian illustration style, 16:9, wide and short.
>
> Stage 1, "Unsold quantity", illustration of a crate of tomatoes with a small clock
> badge, label "151 kg, harvested 18 hours ago".
>
> Stage 2, "Can it get there in time?", illustration of a road with a small truck and
> a wilting-leaf icon crossed out, label "Freshness limit 36 h · travel and handling
> deducted".
>
> Stage 3, "Is the demand already covered?", illustration of a pickup point building
> with a checklist, label "Forecast at that point minus confirmed orders".
>
> Stage 4, "Split, never double-promised", illustration of three pickup-point
> buildings receiving crates of different sizes, label "Vashi 86 kg · Kharghar 63 kg
> · Nerul 3 kg".
>
> Small footnote line under the strip: "A placement suggestion, not a sale. Nothing
> is reserved until a buyer confirms."

---

## Honest limits to keep on the slide

The demand history behind the per-place forecast is synthetic until the pilot
produces real fulfilled orders, and the deck already says so. The placement
figures are real outputs of the ranking code over that synthetic history — the
method is real, the accuracy about real households is not yet measured. Do not
let a regenerated panel drop that caveat.

# PPT 7 — full deck generation brief for Gemini

Generate **six illustrated body panels**, one per slide. Each panel is dropped into
the official SIH 2026 template, which already supplies the slide title, the SIH logo,
the blue footer band, the slide number and the team oval.

**Do not draw any of those.** No "SMART INDIA HACKATHON 2026" wordmark, no SIH logo,
no blue footer bar, no slide numbers, no page titles such as "PROPOSED SOLUTION".
Those live in the template and a drawn copy would collide with the real one.

Save the six files as `slide1.png` … `slide6.png`.

---

## Global style — applies to all six panels

- Flat vector infographic. Soft pastel fills, thin coloured outlines, rounded corners
  on every card. No photorealism, no gradients, no drop shadows, no 3D.
- White or very light background. Generous inner padding; nothing touching an edge.
- Friendly Indian illustration style: farmers in kurta and turban, tempo trucks,
  vegetable crates, kirana shopfronts, Navi Mumbai society buildings.
- Crisp readable sans-serif labels. **Every number and every word below must appear
  exactly as written** — these are read off a running system and a judge may check them.
- Colour language, used consistently across all six panels:
  green = farmer and anything good for the farmer; blue/slate = transport and buyer;
  amber = cost, warning or caveat; plum = platform; grey = something not offered.
- Aspect: wide landscape, roughly 2.4 : 1 (a body strip, not a full slide).
- Rupee amounts always written with the ₹ symbol and two decimals where shown.

---

## slide1.png — title page, left column only

A **narrow vertical panel** (roughly 3 : 4), to sit on the left of the title slide.
Do not fill the whole slide; the right half stays empty for the template artwork.

Content, top to bottom:

- Large heading: **KrishiSetu**
- Six label–value lines, label in grey, value in bold dark ink:
  - Problem Statement ID – **SIH26033**
  - Problem Statement Title – **Farmer-first agricultural trading platform with pooled delivery**
  - Theme – **Agriculture, FoodTech & Rural Development**
  - PS Category – **Software**
  - Team ID – **SIH26-SW059**
  - Team Name – **Logic_Lords — Ramrao Adik Institute of Technology**
- A green italic line: *"The farmer names their price. Everything after that is shared
  transport and a bill you can read."*
- A small grey line: "Working prototype live at krishisetu-weld.vercel.app"
- A small decorative illustration at the bottom: a farmer handing a crate of vegetables
  to a tempo driver, understated, not competing with the text.

---

## slide2.png — proposed solution

Subtitle line across the top of the panel: **"The farmer's rate is an input to the price,
never the leftover"**

Two columns.

**Left column, top — a horizontal stacked bar** titled
"ONE KILOGRAM OF TOMATO, BUILT UPWARD". Four segments, widths proportional to value:

| segment | value | colour |
|---|---|---|
| Farmer | ₹34.00 | green |
| Transport | ₹4.70 | slate |
| Packing, handling | ₹3.96 | amber |
| Site fee | ₹3.00 | plum |

Below the bar, a legend with a coloured dot per segment and its amount, then one
prominent line: **₹45.66** in large type, "buyer pays" in small grey, and in amber
"vs ₹55.00 quick-commerce reference".

**Left column, bottom** — heading "ONE 5 KG BUYER ORDER, FILLED FROM TWO NAMED FARMS",
then two cards, each with a circular avatar showing the farmer's initial:

- **Sanjay Patil** — Khalapur, Raigad — **3.0 kg** — **₹102.00**
- **Meena Bhoir** — Panvel Rural, Raigad — **2.0 kg** — **₹68.00**

**Right column, top — "What is Actually Different?"**, six numbered cards in a 3 × 2 grid:

1. *Farmer gets the net rate* — smiling farmer holding a phone showing rupees, small
   stamp "100% Farmer Rate" — "No commission, listing charge or logistics cost is
   deducted from anywhere."
2. *Orders are pooled by destination* — a tempo with three map pins above it — "Only
   lots going to the same neighbourhood share a vehicle."
3. *Nothing moves unsold* — loaded tempo beside a crossed-out empty crate — "The tempo
   is loaded against confirmed orders, so there is no stock to write off."
4. *Better price, healthier food* — vegetable basket with a heart and a "FRESH & LOCAL"
   tag — "Shorter chain, fresher produce, more value for everyone."
5. *Demand is predicted by place* — a city map with three pickup pins of different sizes
   and a small rising forecast line — "Bottle gourd next week: Nerul 246 kg, Kharghar
   207 kg, Vashi 186 kg — the crop and the neighbourhood, not just the crop."
6. *Unsold stock is re-placed* — a crate of tomatoes with three arrows fanning out to
   three shopfronts — "151 kg left over, split 86 kg Vashi, 63 kg Kharghar, 3 kg Nerul
   — inside the freshness limit."

**Right column, bottom — "How the buyer receives it"**, three lettered cards:

- **A · Cluster pickup point** — "Kirana or society office holds the batch, 6–9 pm
  window" — **₹10** — green
- **B · Last 300 metres** — "Hand cart inside the same society, free above a ₹500
  basket" — **₹20** — amber
- **C · Express, on demand** — "Not offered — it cannot pay for itself at a 6 kg
  basket" — **—** — grey, visibly dimmed with a small crossed-out scooter

Footnote in small grey italic at the bottom of the panel:
"Worked with the same pricing function the live site uses. ₹55/kg is an assumed
quick-commerce reference, not a live scrape."

---

## slide3.png — technical approach

Subtitle: **"D-COA — Decision & Coordination Optimisation Algorithm"**, with a smaller
grey line under it: "Our working name for the decision layer. It is a product name for
our own engine, not a claim of a new published algorithm."

**Top strip — six stages left to right, joined by thin green arrows**, each a rounded
card with a small icon. The last card is filled solid green with white text:

1. Confirmed orders (clipboard with tick)
2. Compatibility (two puzzle pieces)
3. Lot allocation (map with pins)
4. Capacity & freshness (crate with a snowflake and a scale)
5. Route plan (winding road with pins)
6. **Explained batch** (delivery truck with a document) — solid green

**Lower left — "Eight considerations, every time a run is planned"**, eight small cards
in two columns, each with a coloured dot, its label, and its kind on the right:

| consideration | kind | dot |
|---|---|---|
| Product compatibility | hard | green |
| Pickup & delivery geography | hard | green |
| Quantity vs vehicle capacity | hard | green |
| Delivery time windows | hard | green |
| Perishability & freshness | hard | green |
| Estimated transport cost | ranking | amber |
| Order priority | ranking | amber |
| Cancellations & new orders | replan | slate |

**Lower right — two stacked cards.**

"BUILT AND RUNNING", five bullets with small tech icons:
- Next.js 16 + TypeScript, server components
- PostgreSQL via Prisma, integer paise and grams
- Pooling, routing and forecasting in one codebase
- Live mandi prices from data.gov.in, daily cron
- Deployed on Vercel with Neon Postgres

"RULES THE CODE ENFORCES", three bullets:
- A run under 70% fill is held, not dispatched
- Reservations are atomic: no kilogram sells twice
- A forecast shows only if it beats a naive baseline

**A narrow strip along the bottom — "Where the rest of the lot should go"**, four
stages joined by thin arrows:

1. *Unsold quantity* — crate of tomatoes with a clock badge — "151 kg, harvested 18 hours ago"
2. *Can it get there in time?* — road with a small truck, a wilting-leaf icon crossed out
   — "Freshness limit 36 h · travel and handling deducted"
3. *Is the demand already covered?* — pickup point with a checklist — "Forecast at that
   point minus confirmed orders"
4. *Split, never double-promised* — three shopfronts receiving crates of different sizes
   — "Vashi 86 kg · Kharghar 63 kg · Nerul 3 kg"

Footnote in small grey italic:
"Routing returns a feasible nearest-neighbour plan compared against a fixed-order
baseline over the same stops. We do not claim a global optimum."

---

## slide4.png — feasibility and viability

Subtitle: **"Return loads, fill thresholds, and what can go wrong"**

**Left card — "RETURN LOADS — WHY THE EMPTY HALF OF A TRIP MATTERS".**
A green circle labelled **"Raigad farms"** on the left, a dark circle labelled
**"Navi Mumbai cluster"** on the right, and between them two horizontal arrows:
the upper one solid green reading **"loaded 747.7 kg →"**, the lower one pale grey
reading **"← returns empty today"**, drawn with a small empty tempo.

Paragraph under the diagram, small type:
"A transporter who brings vegetables into the city drives home with an empty vehicle,
and that wasted half is already priced into what he charges us. A return load is any
cargo he can carry on the way back — seed, fertiliser, packaging, an FPO's supplies —
matched to the corridor and time window he has already committed to. He accepts or
declines it himself, and the quoted payment must still cover the real detour: empty
space does not automatically mean a cheaper trip."

Under that, four statistics in a row, each with a small icon, the figure large in green
and the label small in grey:

- **123** orders pooled
- **747.7 kg** on a 750 kg tempo
- **5** stops: 4 farms, 1 drop
- **₹5.37** transport per kg

with a grey italic line: "One real run, planned by the live system".

**Right column — "RISK, AND WHAT IS BUILT AGAINST IT"**, four cards, each with an
amber exclamation badge and a small illustration:

1. **Too few orders in one locality** — "The run is held below 70% fill and rolls to the
   next window. A public invite page shows neighbours the exact shortfall."
2. **Produce spoils in transit** — "Freshness is a hard constraint per commodity; an
   over-age lot is never loaded on an unrefrigerated run."
3. **Quality disputes** — "Declared grade, per-stop handover records, and a resolution
   that can only deduct from a farmer with recorded agreement."
4. **Farmer cannot use an app** — "Marathi, Hindi and English on the farmer screens; one
   decision card answers what to send and what it pays."

Footnote in small grey italic:
"Return-load matching is designed and specified; it is deliberately after the core
proof, and is not claimed as shipped."

---

## slide5.png — impact and benefits

Subtitle: **"Better for the farmer, cheaper for the buyer, and still self-funding"**

**Left — a horizontal bar chart** titled "Farmer's share of what the buyer pays (%)",
three bars with their values printed at the end of each bar:

- "Fragmented mandi chain (widely cited estimate)" — **30.0%** — pale grey-green
- "KrishiSetu, all 126 demo orders" — **64.2%** — green
- "KrishiSetu, worked tomato example" — **74.0%** — green

No gridlines, no value axis. A small farmer illustration beside the chart.

Under the chart, small grey italic:
"The fragmented-chain figure is a widely reported range for Indian vegetables, shown as
an estimate. The two KrishiSetu bars are computed from orders in the running system."

**Right card — "WHERE THE PLATFORM'S OWN MONEY COMES FROM"**, five rows, each with a
small icon, label on the left and amount right-aligned:

| row | amount |
|---|---|
| Disclosed buyer-side fee per order | **₹19.89** |
| Payment gateway, messaging, support | **− ₹5.60** |
| **Contribution per completed order** | **₹14.29** (green, emphasised) |
| Assumed monthly fixed cost | **₹60,000** |
| **Orders per month to break even** | **4,199** (green, emphasised) |

Under the card, small type:
"No farmer listing fee. No commission on settlement. When a price must be held under the
quick-commerce reference, the site fee is cut to zero first — the farmer's accepted
amount is never touched."

**Bottom strip — four cards, one per party**, each with a circular initial badge and a
small illustration:

- **Farmer** (green) — "₹34.00/kg accepted and paid in full, beside a dated mandi comparison"
- **Buyer** (slate) — "₹45.66/kg against a ₹55 reference, every bill line itemised"
- **Transporter** (amber) — "₹4,016 for one full run, agreed before acceptance"
- **Platform** (plum) — "₹14.29 per order, entirely from a disclosed buyer-side fee"

Footnote in small grey italic:
"Figures are computed over synthetic demonstration orders, so they size the model rather
than measure a business. No production cost is recorded, so no column here is farming profit."

---

## slide6.png — research and references

Subtitle: **"Sources, and what they do and do not prove"**

Eight cards in a 2 × 4 grid. Each card: a numbered badge 01–08, a small illustration, a
bold name, a grey description, a green link line, and a small right-aligned tag.

1. **Government of India open data portal** · tag DATA (green) — "Daily mandi prices,
   resource 9ef84268 — the live price feed in the app" —
   `data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi`
2. **eNAM — trading and FPO pages** · tag INCUMBENT — "Existing national electronic trade
   and FPO onboarding" — `enam.gov.in/web/trading-details`
3. **Ninjacart and Ninja Mandi** · tag INCUMBENT — "B2B vegetable supply chain and mandi
   operations" — `ninjacart.com/ninja-mandi`
4. **agribazaar** · tag INCUMBENT — "Marketplace, logistics and warehousing claims" —
   `agribazaar.com/quick-links/steps`
5. **Samunnati** · tag INCUMBENT — "FPO financing and market linkage" —
   `samunnati.com/innovations`
6. **Google OR-Tools, VRP with time windows** · tag METHOD (green) — "Reference
   formulation for capacitated routing with windows" —
   `developers.google.com/optimization/routing/vrptw`
7. **PIB release on agricultural marketing** · tag POLICY — "Government position on
   market reform" — `pib.gov.in — PRID 2222802`
8. **SIH 2026 idea submission format** · tag FORMAT — "The template this deck follows" —
   `sih.gov.in/letters/2026`

Footnote in small grey italic, across the bottom:
"What this does not prove: demand history and the fitted price series in the prototype
are synthetic and labelled so on screen. An unmentioned capability on a competitor's
public page is not evidence they lack it, and we claim no measured superiority without a
comparable pilot."

---

## Checklist before you hand the images back

- Six files, `slide1.png` … `slide6.png`.
- No SIH branding, no blue footer, no slide title, no team oval drawn into any image.
- Every rupee figure, kilogram figure and percentage spelled exactly as above.
- Every footnote present — the caveats are the reason the deck is credible.
- Text legible at slide size; no cut-off words at a card edge.

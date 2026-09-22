# One-shot prompt for a front-end design AI

Paste everything below the line into the design tool. It is written to be self-contained: the tool
does not need to see the codebase. Every number in it is a real value from the working application,
so the mockups come out with true content instead of placeholder text.

Each screen is labelled with the route it corresponds to in the existing build, so the returned
designs can be mapped straight back onto real pages.

---

## The product in one sentence

**KrishiSetu** is a vegetable marketplace where the farmer sets the price they keep, the orders
going to the same neighbourhood share one truck, and the buyer sees every rupee of the bill.

## The niche, stated narrowly

Not "agritech". Not a super-app. One thing: **pooled farm-to-neighbourhood vegetable delivery in
Navi Mumbai**. A small farmer cannot fill a tempo alone, so hiring one eats their margin. We put
several farmers' produce into one vehicle when it is all going to the same locality, drop it at one
neighbourhood pickup point, and let the households there collect it. That is the entire idea. Every
screen should feel like it exists to serve that one mechanic.

## Who uses it

Four roles, four separate experiences, one shared transaction:

1. **Farmer** — a small grower in Raigad district. Often reads Marathi more comfortably than
   English. Wants to know two things: what is worth sending next week, and what will I actually be
   paid.
2. **Household buyer** — a family in a Navi Mumbai society. Buys about 6 kg of vegetables a week.
   Wants it cheaper than Blinkit and wants to know it is fresh.
3. **Transporter** — owns one tempo. Wants a full load, a known distance and a known payment before
   he accepts.
4. **Operator** — plans the runs. Wants to know which orders fit, which did not, and whether the
   business is losing money.

## Tone and visual direction

Calm, agricultural, credible. This is a money tool for people whose margins are thin, not a
consumer shopping app. Think of a well-made ledger rather than a food delivery app.

- **Palette:** deep leaf green as the single accent (`#2f6b3a` light / `#7dbd6b` dark), warm earth
  amber as a secondary accent for warnings and fees (`#b7791f` / `#e0b062`), a soft off-white paper
  background in light mode (`#f6f7f3`) and a dark olive-charcoal in dark mode (`#11140f`). Deep
  red only for genuine problems.
- **Both light and dark themes**, defined as CSS variables so they swap cleanly.
- **Typography:** one humanist sans-serif for everything. Must render Devanagari well, so include a
  Devanagari fallback. All numbers use tabular figures so columns of rupees line up.
- **Layout:** max content width around 1100px, generous whitespace, cards with a 1px border and a
  12px radius, no drop shadows, no gradients, no glassmorphism.
- **Density:** information-dense but never cramped. Small uppercase labels above large numbers.
- **Mobile first for the farmer and buyer screens**, comfortable desktop for the operator screens.
- **No stock photography of smiling farmers.** Use a single emoji per vegetable and simple
  geometric diagrams. The credibility comes from the numbers being visible, not from imagery.

## The rules the design must express visually

These are the product's whole argument. If a screen hides one of them, the design has failed.

- The farmer's rate is shown **as the first line of the bill, not the last**. It is never presented
  as a leftover after other costs.
- Every price carries **its date and its source label** (LIVE, SYNTHETIC) next to it.
- Every prediction shows **its error against a simple baseline** and its sample size.
- A run that is too empty to be worth dispatching is shown as **held, with the reason**, not hidden.
- The buyer's bill is **always itemised** into four parts: farmer, transport, packing and handling,
  site fee.

---

# Screens to design

## 1. Landing page — route `/`

Hero: the line **"The farmer names their price. Everything after that is shared transport and a bill
you can read."** Small label above it: `SIH26033 · TEAM LOGIC_LORDS · RAIT`. One paragraph of
explanation. Two buttons: *Browse today's produce* (primary), *Sign in to a demonstration account*.

Four stat tiles in a row: `FARMER KEEPS ₹34.00/kg` · `BUYER PAYS ₹45.66/kg` ·
`QUICK-COMMERCE REFERENCE ₹55.00/kg` · `MINIMUM VEHICLE FILL 70%`.

Below, two cards side by side:
- **"Where one kilogram of tomato goes"** — a horizontal stacked bar split Farmer 74% / Transport
  10% / Packing and handling 9% / Site fee 7%, with a legend, then a small itemised list adding up
  to ₹45.66.
- **"Why the delivery leg does not lose money"** — four numbered points: pooled line haul, cluster
  pickup by default, nothing moves unsold, an under-filled run does not go.

Then a row of four role entry cards (Farmer, Household buyer, Transporter, Operator), each with two
lines of description and a "Sign in →" link.

## 2. Sign-in — route `/login`

Two columns. Left: a mobile-number field, a password field, a sign-in button. Right: a list of
demonstration accounts as clickable rows, each showing a name, a role tag, and a phone number with
a one-line note. Small print: every demonstration account uses the password `demo1234`.

## 3. Farmer dashboard — route `/farmer` — **the most important screen**

Header: `नमस्कार, Sanjay Patil` with `Khalapur, Raigad · Raigad Bhaji Utpadak FPO` beneath.
A language switcher in the top bar showing `English | मराठी | हिन्दी`. Primary button: *List produce*.

Four stat tiles: `MONEY AWAITING PAYMENT ₹0.00` · `ALREADY RECEIVED ₹1,257.67` ·
`SOLD THROUGH THE PLATFORM 60.75 kg` · `LISTINGS LIVE NOW 3` (with "670.17 kg still available").

**The decision card — the visual centrepiece.** Title *"What is worth sending next week"*. A large
vegetable emoji, the crop name (Bottle Gourd), one sentence: "Predicted demand next week is 639.82 kg
across the three pickup points, against 322.82 kg listed by all farmers today. The strongest
neighbourhood is Nerul Sector 6." Three pill badges: `Demand −0.8%`, `Price +20.0%`,
`1.98× listed supply`. To the right, a tile: `LATEST MANDI REFERENCE ₹15.51/kg` with tiny grey text
`SYNTHETIC · 2026-09-07 · 8 days old`. Footnote under the card, in small grey text, stating the
prediction method, the model error and the baseline error.

Two cards below: **My produce** (list of crops with grade badge, available and reserved quantities,
rate on the right) and **Transport arranged for my produce** (the vehicle, the date, "stop 2 of 5",
the quantity being collected).

Bottom: a table of recent allocations — Produce, Quantity, Rate, Going to, Amount, Payment status
badge.

Also design the **Marathi version of this same screen**, so the layout can be checked with longer
Devanagari labels: `येणे बाकी रक्कम`, `मिळालेली रक्कम`, `माल नोंदवा`,
`पुढच्या आठवड्यात काय पाठवणे फायद्याचे`.

## 4. Farmer — list produce — route `/farmer/listings`

Left: a form. Crop dropdown, then a highlighted suggestion box reading "Suggested range ₹16 to ₹21
per kg" with the explanation "Selling the same crop at the mandi would leave you about ₹12/kg after
your own transport and commission" and the line "This is a suggestion. Enter the amount you are
willing to accept." Then quantity in kg, your rate in ₹/kg, grade dropdown (A / B / Imperfect),
harvest date, a checkbox for "This is an expected harvest, not stock in hand", and a notes field.

Right: the farmer's existing listings, each with crop, grade badge, available of total, quantity
already allocated, harvest date, rate, and a Pause button.

## 5. Farmer — what to grow and sell — route `/farmer/demand`

A vertical list of ranked crop cards. Each row: rank number, emoji, crop name, four pill badges
(demand change, price change, ratio to listed supply, and a badge saying either `fitted model` or
`naive baseline`), a sentence of explanation, **a small sparkline chart showing 26 weeks observed as
a solid line and 4 weeks predicted as a dashed line inside a shaded uncertainty band**, and a small
"Where the demand is" list of three neighbourhoods with quantities. Under every card, a grey
footnote comparing model error to baseline error.

## 6. Farmer — earnings — route `/farmer/earnings`

Headline tile: `NET FARMER REALISATION ₹20.71/kg` with the note "Mandi comparison ₹12.51/kg on the
same quantity". Three more tiles: received here, comparable mandi total, awaiting payment.

Then a wide table: Date, Produce, Quantity, Your rate, You receive, Mandi comparison (with the
source and date in small text), Difference (green when positive), Payment badge.

## 7. Buyer — shop — route `/market`

Header: "Today's produce", subtitle "Collection from Nerul Sector 6 pickup point on 2026-09-16,
between 6 pm and 9 pm."

A responsive grid of produce cards. Each card: vegetable emoji, crop name, "2 farms · Pen, Neral",
the price `₹25.13/kg` large with the quick-commerce reference `₹44.00/kg` struck through beside it,
grade badges and an "available" badge, then a small breakdown — "Farmer receives ₹14.26/kg",
"Transport, packing, fee ₹10.87/kg", "Cheaper than the quick-commerce rate by ₹18.87/kg" in green.
At the bottom, a quantity stepper (− 500 g +) and an "Add · ₹13" button.

## 8. Buyer — basket — route `/cart`

Left: the item list with quantity, per-kg price, "farmer receives" line and a Remove button.

Right: a sticky summary card titled "What you are paying for" containing the stacked bar (Farmers
58% / Transport 16% / Packing and pickup point 16% / Site fee 10%), then two large selectable
delivery options as radio cards:
- *Collect from Nerul Sector 6 pickup point* — "Between 6 pm and 9 pm on the run day" — **₹10.00**
- *Delivered to my door* — "Free once the basket reaches ₹500.00; ₹398.50 to go." — **₹30.00**

Then the totals: produce transport and fee, pickup point, **Total ₹191.87**, and two green lines:
"Of which the farmers receive ₹110.50" and "Against the quick-commerce reference −₹144.13". A full
width *Confirm order* button, and a disabled state showing "Add ₹38.50 more to reach the ₹150.00
minimum".

## 9. Buyer — my orders — route `/orders`

Cards per order with a status badge (confirmed / batched / in transit / ready for pickup /
delivered). Inside: the item lines, then the four-line itemised bill and total, then a grey line
"Fulfilled from 2 farms: Sanjay Patil, Khalapur; Ramesh Gawde, Karjat." and the run details. A
subtle text link "Report a problem with this order" which expands into a small form with a reason
dropdown and a description box.

## 10. Transporter — runs — route `/transporter`

Header with the driver's name and `Tata Ace, open body · MH43 AB 1234 · 750 kg capacity · ₹24.00/km`.
Three tiles: runs offered, runs in hand, earned.

**Offered run card:** cluster name, then `2026-09-16 · 4 farm pickups, one drop · 747.70 kg ·
167.3 km · 123 buyer orders`, a large `₹4,016.02` and a primary *Accept this run* button. Design a
second variant of this card showing an amber `held below minimum fill` badge in place of the button.

## 11. Transporter — run sheet — route `/transporter/runs/[id]`

Four tiles: load with "100% of your vehicle", distance, you receive, buyer orders. A primary
*Start this run* button with a warning note that the allocation freezes after dispatch.

Then a numbered vertical stop list. Each stop: a circled sequence number, the farm name and village,
a `pickup` or `drop` badge, and a line reading `207.20 kg · arrives about 1 h 6 min in · load after
207.20 kg · map`. On the right of each stop, either a "Record handover" inline form or a green
`recorded 05:49` badge. Design both states.

## 12. Operator — run planning — route `/admin`

Three tiles across the top: orders waiting, quantity waiting, next window.

Then one card per cluster. Each card: cluster name, host name, waiting orders, quantity, and
**"Fill against 750 kg vehicle — 86%" with a horizontal progress bar**, green above 70% and amber
below. A one-line verdict beneath the bar: either "Above the minimum fill. This run pays for
itself." or "Below the 70% threshold. Planning it will show the shortfall and hold the run."
A vehicle dropdown and a *Plan this run* button. **Design both the green and the amber state.**

Below, a wide table of planned runs: Cluster, Window, Orders, Load, Fill, Stops, Distance,
Transport, Status badge, Release action.

## 13. Operator — run detail — route `/admin/batches/[id]`

Four tiles: fill, planned distance (with "Fixed-order baseline 208.3 km" as a sub-note), transport
cost (with "Quoted to buyers ₹3,927.63"), site fee collected.

Two cards: **"Why this run looks like this"** — a bulleted list of plain-English engine statements,
followed by a boxed "Left out of this run" section listing rejected buyers and reasons — and
**"Route"** — the numbered stop list again.

Then **"Money in this run"**: four tiles (buyers pay, farmers receive with "64% of the buyer bill",
transporter receives, site fee less variance) and a table mapping each buyer line to the farm that
supplied it and the amount that farmer receives.

## 14. Operator — economics — route `/admin/economics`

Two cards side by side. **Break-even** as a small definition list: site fee per order ₹19.89,
variable cost per order ₹5.60, contribution ₹14.29, monthly fixed cost ₹60,000.00, orders per month
to break even 4,199. **Quoted against actual**: logistics quoted, transport actually paid, variance
carried by the platform. Design the warning state too: a red-bordered box reading "The fee retained
per order does not cover the variable cost per order. More orders would increase the loss."

Below, a plain card titled "What these figures are not" with four honest caveats.

## 15. Operator — quality and shortages — route `/admin/quality`

Three tiles: open complaints, refunded to buyers, deducted from farmers ("Only with the farmer's
recorded agreement").

Complaint cards: reason and buyer name as the title, order details as the subtitle, status badge,
the complaint text, the affected items and supplying farms, then a resolution form with a buyer
refund field, a farmer deduction field that is **disabled until a checkbox is ticked** confirming the
farmer agreed, a note field, and two buttons: *Record the outcome* and *Dismiss with a reason*.

## 16. Operator — data sources — route `/admin/data`

Source count tiles (live observations, synthetic observations) with newest dates. A refresh card
with a *Fetch today's prices* button and a last-refresh result box. A wide table: commodity,
Agmarknet name, market, observed date as a badge that turns amber when more than three days old,
modal price, state.

---

## What not to do

- No hero photograph, no illustration of a farmer holding vegetables, no gradient mesh backgrounds.
- No hiding numbers behind "view details". The numbers are the product.
- No carousels, no animated counters, no confetti on order confirmation.
- No fake trust badges, no invented partner logos, no "10,000+ farmers" counters.
- Do not restyle the rupee amounts into thousands-abbreviations. `₹4,016.02` stays `₹4,016.02`.
- Keep every screen usable at 375px wide.

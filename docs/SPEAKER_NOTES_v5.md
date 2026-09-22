# KrishiSetu — speaker notes for the v5 deck

For `output/KrishiSetu_SIH2026_v5.pptx` and its PDF. The same notes are embedded in the PowerPoint
file itself (presenter view), so this document is the printable copy and the answer sheet for the
questions the panel is most likely to ask.

Every figure quoted below is read out of the running application by `web/scripts/deckfacts.ts`.
Anything that is an estimate is labelled as an estimate on the slide itself — say so out loud too,
because volunteering a limit is stronger than being caught on one.

---

## What changed from v4, and why

The previous deck reused the same icon sheet and the same card grid on every slide, so all six read
as one repeated template. In v5 each slide has a different centrepiece and no slide repeats another's
structure:

| Slide | Centrepiece | Visual form |
|---|---|---|
| 1 Title | The mechanic in three steps | Dark slide, typographic, one horizontal strip |
| 2 Proposed solution | The rupee, split | Stacked bar + named farmer rows + tier ladder |
| 3 Technical approach | D-COA | Left-to-right pipeline + constraint chips |
| 4 Feasibility | Return loads | Two-node diagram with outbound and return legs |
| 5 Impact | Farmer's share, compared | Native bar chart + arithmetic block |
| 6 References | Sources with a caveat | Dark slide, two-column source cards |

The one repeated element is deliberate: a small filled circle carrying a numeral or letter. That is
the motif, and it is the only thing that should feel familiar from slide to slide.

---

## Slide 1 · Title

Open on the problem in a single sentence: **a small farmer cannot fill a tempo alone**, so hiring one
eats the margin, which is why the farmer keeps only a modest share of what the buyer finally pays.

KrishiSetu pools the produce of several farmers who are all sending to the same neighbourhood, moves
it once, and drops it at one pickup point that a hundred households already live around.

Close the slide by saying this is a **working application, not a mockup**: it is deployed, seeded and
usable, and every number in the deck is read out of it.

---

## Slide 2 · Proposed solution

**The bar is the whole argument.** We do not start from a retail price and work down to whatever is
left for the farmer. We start from the rate the farmer accepted and add the real shared costs on top:

| Line | ₹ per kg |
|---|---|
| Farmer's accepted rate | 34.00 |
| Transport | 4.70 |
| Packing and handling | 3.96 |
| Site fee | 3.00 |
| **Buyer pays** | **45.66** (against a ₹55.00 quick-commerce reference) |

**On the named farms.** Sanjay Patil and Meena Bhoir appear by name because a pooled consignment must
never hide whose produce it is. One 5 kg buyer order is filled 3 kg from one farm and 2 kg from
another; each farm's kilograms and rupees stay its own row in the database, visible to the buyer on
the order and to the farmer in earnings.

**On the delivery ladder** — this answers "how do you deliver to individual homes without losing
money":

- **Tier A, cluster pickup point, ₹10.** A kirana shop or society office holds the batch in a stated
  6–9 pm window and the buyer collects. This is the default.
- **Tier B, the last 300 metres, ₹20.** A hand cart or e-rickshaw walks the remaining drops inside one
  society during the same window. **Free once the basket reaches ₹500**, because the site fee on a
  basket that size comfortably exceeds the cost of walking it.
- **Tier C, express on demand — deliberately not offered.** A weekly household basket is about six
  kilograms, so a dedicated rider drop would eat a tenth of the order value. This is the tier that
  structurally cannot pay for itself, and we say so rather than promising it.

There is also a **₹150 minimum order**, because packing and the pickup-point commission are charged
once per order and a smaller basket cannot carry them.

---

## Slide 3 · Technical approach

**D-COA stands for Decision & Coordination Optimisation Algorithm.** Say the full form out loud, then
immediately qualify it: it is our working name for the decision layer in our own codebase, not a
claim that we invented or published a new algorithm.

Walk the pipeline left to right — confirmed orders, compatibility, lot allocation, capacity and
freshness, route plan, explained batch — then explain the eight considerations:

- **Five are hard feasibility conditions**: product compatibility, pickup and delivery geography,
  quantity against vehicle capacity, delivery time windows, perishability and freshness. If any one
  fails, the order simply cannot be on that run.
- **Two only rank among options that are already feasible**: estimated transport cost and order
  priority. Priority follows a declared policy; placement is never sold.
- **One forces a replan**: cancellations and new orders invalidate a stale proposal before dispatch.

The point for a judge: when an order is left out, the engine names which rule rejected it, in plain
English, on the operator's screen. Nothing is a black-box score.

If asked about routing: we return a feasible nearest-neighbour plan and compare it against a
fixed-order baseline over the same stops. We do not claim a global optimum.

---

## Slide 4 · Feasibility and viability

**Return loads, explained properly** — this is the question the slide exists to answer:

Today a transporter brings vegetables into the city and drives home with an **empty vehicle**. He is
already charging us for that empty half, because he has to. A **return load** (also called a backhaul)
is any cargo he can carry on the journey home — seed, fertiliser, crates, an FPO's supplies. Because
we already know his corridor, his time window and his spare capacity from the run we just planned, we
can offer him compatible work on the way back. That lowers the cost per kilogram of the outbound
vegetable trip without anyone subsidising it.

Two honest caveats, both on the slide: **empty space does not automatically mean a cheaper or suitable
trip** — the detour, the freshness rules and the handling needs still have to pass — and **the driver
accepts or declines the work himself**, with the quoted payment covering the actual effort.
Return-load matching is designed and specified, deliberately scheduled after the core proof, and is
**not claimed as shipped**.

**The fill threshold.** One real run planned by the live system: 123 orders, 747.7 kg on a 750 kg
tempo, 100% fill, five stops (four farms and one drop), and transport at **₹5.37 per kilogram**. Below
70% fill the run is **held**, not dispatched, and the orders roll to the next window with a reason.

**Risks** are on the right with what is actually built against each: the fill threshold and the public
invite page for thin demand; freshness as a hard per-commodity constraint; declared grade plus
per-stop handover records plus a resolution that can only deduct from a farmer **with recorded
agreement**; and Marathi, Hindi and English on the farmer screens for digital literacy.

---

## Slide 5 · Impact and benefits

Three claims, in this order.

**1. The farmer keeps far more of the buyer's rupee.** 64.2% across all 126 orders in the system, and
74% on the worked tomato example, against the quarter-to-a-third widely reported for fragmented
vegetable trade. That third figure is labelled an estimate on the chart — we are not passing it off as
our measurement.

**2. The buyer still pays less.** ₹45.66/kg against a ₹55 reference. Nobody is being asked to pay a
premium out of sympathy, which is exactly why this can scale beyond goodwill.

**3. It funds itself, and this is the question every panel asks.**

| | |
|---|---|
| Disclosed buyer-side fee per order | ₹19.89 |
| Payment gateway, messaging, support | − ₹5.60 |
| **Contribution per completed order** | **₹14.29** |
| Assumed monthly fixed cost | ₹60,000 |
| **Orders per month to break even** | **4,199** |

That is roughly four clusters running twice a week. **Be honest about the limit**: a single-cluster
pilot covers its fulfilment cost but not that fixed cost, and our own operator screen reports the
shortfall rather than hiding it.

What we will not do is close that gap from the farmer's side. **There is no farmer listing fee and no
commission on settlement.** When a price has to be held under the quick-commerce reference, the site
fee is cut to zero first; the farmer's accepted amount is never touched. If even a zero fee cannot
hold the price, the commodity is dropped from the catalogue rather than the farmer being paid less.

If asked "how are you better than competitors on economics": we are not claiming a measured victory
over anyone — we have no comparable pilot. What we claim is structural. Our margin comes from **one
disclosed line on the buyer's bill**, so improving the farmer's share does not reduce our revenue,
and the operator screen publishes the break-even and the transport variance so the shortfall cannot
be quietly pushed onto a farmer.

---

## Slide 6 · References

Keep it short. Three things worth saying:

1. The first source is **live in the product**, not merely cited: the daily mandi price feed from the
   Government of India open data portal refreshes on a cron, and every price on our screens carries
   its source label and its date.
2. The four incumbents are the ones we studied for gaps. Our positioning page states, for each gap,
   both what we built and **where it stops**.
3. The routing reference is a formulation we follow, not a library we claim to have beaten.

Then read the closing caveat aloud: the demand history and fitted price series in the prototype are
**synthetic and labelled so on screen**, an unmentioned capability on a competitor's public page is not
evidence they lack it, and we claim no measured superiority without a comparable pilot.

---

## Likely questions, and the short answers

**"Is this actually built?"** Yes — deployed, with four roles, a pooling engine, route planning,
forecasting gated on beating a baseline, live mandi prices, quality disputes and notifications. Offer
to open it.

**"What is D-COA?"** Decision & Coordination Optimisation Algorithm. Our engine's name, not a
published algorithm.

**"What are return loads?"** Cargo carried on the journey home so the vehicle is not empty half the
time. Designed, specified, not yet shipped.

**"Why not deliver to every home?"** At a six kilogram weekly basket a dedicated drop costs a tenth of
the order value. Collection at a neighbourhood point is the default; door delivery is free above ₹500
and charged below it.

**"How do you make money without taking it from farmers?"** One disclosed buyer-side fee, ₹19.89 per
order, ₹14.29 after variable costs. Break-even at about 4,199 orders a month.

**"What is the weakest part?"** The demand history is synthetic, so the forecast's accuracy against
real households is unproven, and one cluster does not cover fixed cost. Both are stated on the slides.

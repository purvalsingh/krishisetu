# Delivery unit economics — how the model avoids a loss

Status: proposal, 15 September 2026. All rupee figures below are **stated assumptions**, not measured pilot data. Every number is expressed so that it can be replaced with a measured value later; the formulae, not the illustrative amounts, are the deliverable.

## 1. The problem stated precisely

Three constraints must hold at the same time:

1. Farmer net per kg must exceed the farmer's current comparable net per kg (mandi price less the farmer's own selling costs).
2. Buyer landed price per kg must not exceed the quick-commerce reference price (Blinkit / Zepto / Swiggy Instamart) for the same commodity and grade.
3. Fulfilment revenue must cover fulfilment cost, and platform fee revenue must eventually cover fixed cost.

The gap that makes this possible is the spread between farmer net and retail shelf price. In fragmented Indian vegetable trade the farmer typically retains roughly a quarter to a third of the final retail rupee. The rest is consumed by repeated handling, multiple margins and spoilage. We are not inventing money; we are removing handling stages and pre-selling the load so that less of that spread is consumed.

## 2. Why individual home delivery loses money, and what replaces it

A weekly household vegetable spend of under ₹1,000 means a typical basket of roughly 6 kg at roughly ₹250–350. A dedicated rider drop costs ₹30–50 once wages, vehicle and idle time are counted. That is 10–18% of basket value on the delivery leg alone, before produce cost. Quick commerce sustains it only through very high drop density around a dark store and through order frequency we will not have.

The replacement is a **three-tier fulfilment ladder**, and the default tier is deliberately not home delivery:

| Tier | What it is | Assumed cost per order | When offered |
|---|---|---|---|
| A — Cluster pickup point | A host (kirana shop, society office, self-help group member) receives the batch and holds it for a stated 3-hour window. Buyer collects. | ₹10–12 (host commission) | Default. Requires a minimum confirmed order count for that point. |
| B — Scheduled last-300-metre delivery | From the same pickup point, a hand cart or e-rickshaw walks the remaining drops inside one society during the same window. | ₹18–22 | Free above a ₹500 basket, charged at ₹20 below it. |
| C — Express / on-demand | Not offered. | — | Never. This is the tier that structurally cannot pay for itself at our basket size. |

Two order-size rules make tiers A and B pay for themselves, because both the packing commission and the pickup-point commission are charged per order rather than per kilogram:

- **Minimum order ₹150.** Below this, the per-order costs exceed what the order can carry, and the gap would have to come out of someone's share. The order is not accepted; the buyer is asked to add to it or wait for the next window.
- **Free door delivery above ₹500.** At an assumed ₹40/kg landed price a ₹500 basket is about 12.5 kg, which earns roughly ₹37 of site fee against a delivery cost of about ₹20. The waiver is funded by that fee and never by the farmer's accepted amount. It also pushes baskets larger, which lowers the cost per kilogram of the whole run, so the threshold pays for itself twice.

Tier A is what makes the arithmetic work. It converts an expensive many-to-many last mile into one truck stop plus a self-service window. Tier B is then cheap because the rider never leaves one compound.

## 3. The per-kilogram cost stack

Illustrative, using tomato and clearly invented inputs. Comparable farmer net today assumed ₹25/kg (mandi ₹28 less ₹3/kg of the farmer's own transport, commission, loading and weighing loss). Quick-commerce reference assumed ₹55/kg.

| Line | ₹/kg | Basis of the assumption |
|---|---|---|
| Farmer accepted proceeds | 34.00 | Farmer sets or accepts this before dispatch. Never reduced by the platform. |
| Farm collection and line haul | 3.20 | One 1-tonne tempo, two farm pickups, ~120 km round trip, ~₹3,200 per run, divided by 1,000 kg. |
| Grading, crates, packing labour | 2.60 | Per-kg handling at the collection point. |
| Micro-hub handling plus host commission | 2.00 | Tier A host share plus unloading. |
| Last leg into the cluster | 1.50 | Point-to-point within the city. |
| Spoilage and shortfall buffer | 1.80 | ~4%. Lower than open-market handling because the load is pre-sold and travels once. |
| Platform fee (buyer-facing, disclosed) | 3.00 | The only platform revenue line. |
| **Buyer landed price** | **48.10** | Compared with an assumed ₹55 quick-commerce reference. |

Result under these assumptions: farmer net rises from ₹25 to ₹34 per kg, a 36% improvement, while the buyer pays roughly 13% below the quick-commerce reference. Nothing in that outcome depends on the platform taking a cut of the farmer's money.

The four levers that create the room, in order of size:

1. **Full-truck line haul.** At full load, farm-to-city transport is only around ₹3 per kg. The cost that kills small farmers is hiring a vehicle for 200 kg, not the distance. Pooling farmers who share one destination cluster is what turns ₹16/kg of transport into ₹3.20/kg.
2. **Pre-sold inventory.** The vehicle moves only against confirmed orders, so there is no unsold stock and no dark-store shrink. This is a structural advantage over quick commerce on perishables rather than a claim of better operations.
3. **Removed handling stages.** Farm to collection point to cluster, instead of farm to mandi to wholesaler to retailer.
4. **Self-collection default.** Tier A avoids the per-drop rider cost entirely for most orders.

## 4. The go / no-go density condition

Pooling only works with enough demand in one place. Define, per cluster and per run day:

- `Q` = confirmed kilograms for that cluster
- `C` = vehicle capacity in kilograms
- `F` = minimum fill fraction required for the run to be economical

**Run rule:** dispatch only if `Q >= F * C`. Proposed starting value `F = 0.70` on a 1,000 kg tempo, so 700 kg confirmed. At an average 6 kg basket that is roughly 115 confirmed orders in one cluster on one run day. Below the threshold the system must not quietly dispatch at a loss; it rolls the orders to the next window, merges two adjacent clusters if the detour and freshness checks pass, or cancels with an explanation before the farmer harvests.

This threshold is the single most important operational number in the whole model, and it is the one most likely to be wrong on first contact with reality. It must be measured in the pilot and re-derived, not assumed.

## 5. Fixed-cost break-even

Fulfilment is covered line by line above; that is variable cost and it is self-funding by construction. The fixed cost is not.

With `M` = monthly fixed cost, `s` = retained platform fee per completed order, `v` = variable platform cost per completed order (payment gateway, messaging, support handling), break-even volume is `ceil(M / (s - v))`, and only when `s > v`.

Illustrative: a ₹3/kg fee on a 6 kg basket gives `s` ≈ ₹18. Payment gateway at about 2% of a ₹289 basket plus messaging and support gives `v` ≈ ₹5.60. Contribution per order ≈ ₹12.40. At an assumed `M` of ₹60,000 per month, break-even is roughly 4,840 completed orders per month, which is about 10 clusters running twice a week at the density threshold above.

**Honest conclusion: a single-cluster pilot will cover its fulfilment cost but will not cover fixed cost.** That shortfall must be stated openly and must never be closed by reducing the farmer's accepted proceeds. The available levers are: raise the disclosed buyer fee while still remaining below the reference price, take a share of the Tier B delivery line, add a small optional household subscription in place of the per-order fee, or reduce fixed cost until volume arrives.

## 6. Guardrails that keep the farmer first

- Farmer-accepted proceeds are set before dispatch and are never reduced by platform fees, promotions or discounting. Only an evidence-backed quantity or quality adjustment, agreed by both parties, can change them.
- All platform revenue is a disclosed buyer-facing line item. There is no farmer listing fee and no commission deducted from settlement.
- Discounts, if any, are funded from the platform fee only, and the fee has a floor of zero, not a negative floor.
- If the buyer price for a commodity cannot be held below the reference price while still paying the farmer more than their comparable net, that commodity is dropped from the catalogue rather than solved by paying the farmer less.
- The farmer's dashboard shows the dated mandi comparison beside the offer, so the improvement is verifiable by the farmer rather than asserted by us.

## 7. What must be measured before any of this is claimed as true

Comparable farmer net per kilogram, buyer landed price against a same-day reference price, actual vehicle fill, actual cost per run, actual spoilage, pickup-point collection rate, no-show rate, and the true minimum fill fraction. Until those exist, every number in this document is an assumption used to size the design.

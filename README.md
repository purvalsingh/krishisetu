# KrishiSetu — Logic_Lords

**SIH26033 · Team SIH26-SW059 · RAIT (Ramrao Adik Institute of Technology)**  
Consolidated product description and implementation memory, updated 13 September 2026.

Latest presentation, in the official SIH format: [template PPTX](output/KrishiSetu_SIH2026_Template_v5.pptx) and [template PDF](output/KrishiSetu_SIH2026_Template_v5.pdf) — this is the submission copy. The same content in our own layout is [v5 PPTX](output/KrishiSetu_SIH2026_v5.pptx) and [v5 PDF](output/KrishiSetu_SIH2026_v5.pdf). Speaker notes are embedded in both files and written out in [docs/SPEAKER_NOTES_v5.md](docs/SPEAKER_NOTES_v5.md). The standalone deck is generated from `.deck/build.js` and the template version from `.deck/build_sih.py` and every figure on it is read out of the running application by `web/scripts/deckfacts.ts`; regenerate rather than hand-editing slides. The [custom icon sheet and generation notes](assets/presentation/README.md) document the visual assets. Earlier decks remain as prior versions. For presentation preparation, read the [slide-by-slide speaker guide](docs/SLIDE_EXPLANATION.md).

KrishiSetu is the working name for our proposed farmer-first agricultural trading website. It is a student project name, not an assertion of government ownership or affiliation. This repository currently contains planning, team inputs and presentation material; the application described below is not yet implemented. This document brings the supplied ideas together so that future development can begin from one coherent specification. Read this README for the complete product intent, `CONTEXT.md` for the short handoff, and `docs/PROJECT_PLAN.md` for the earlier contracts and six-part breakdown. Where older descriptions conflict, the farmer-accepted-proceeds billing model and the pre-dispatch replanning rules below take precedence.

## Purpose and the decision we want to improve

The problem is the gap between what farmers retain and what buyers ultimately pay after fragmented selling, repeated handling and transport. Our aim is to improve the farmer's net sale proceeds while giving buyers a competitive, understandable delivered price and paying transporters and necessary service providers openly. Removing a trader's name from a website does not remove the useful work that person performs. Collection, grading, packing, trust, payment reconciliation and dispute handling still need owners and compensation.

The central product question is therefore: **which farmer lots and buyer orders should travel together, under which constraints, at what shared cost, and with what amount retained by each farmer?** Discovery and direct trading bring participants together. The aggregation engine creates a feasible shipment, routing makes that shipment deliverable, and the earnings view explains whether the proposed transaction actually benefits the farmer. A farmer should be able to understand a recommendation, reject it, counteroffer, or wait for a better batch.

The initial setting is one pilot locality with nearby farms or FPO collection points and a buyer cluster. Use INR and weight-based produce. The team examples suggest a Maharashtra context, but the precise farms, service radius, crops and vehicle assumptions must be recorded at the first build checkpoint. Nationwide coverage is not a prerequisite for proving the idea.

## People, permissions and assisted participation

**Farmers and FPO members** own their listings, quantities, grade declarations and accepted selling terms. FPOs can combine member lots while a member ledger preserves the farmer associated with every allocation and settlement. A pooled consignment must never obscure who owns which produce or who is owed what. Farmers can list ready stock and expected harvests, inspect buyer requests, accept or counter offers, review transport and see payment status.

**Retail buyers** search produce, compare declared quality and landed price, choose exact supported quantities and delivery windows, place orders and track fulfilment. **Bulk buyers** such as retailers, restaurants or procurement groups post commodity, grade, quantity and deadline requirements; receive multiple farmer offers; negotiate; and book a confirmed agreement. Business buyers may seek resale profit, while households seek value and convenience. The platform cannot promise either outcome independently of their costs.

**Transporters** publish vehicle capacity, available time and service area, see compatible loads, quote or accept delivery work, collect produce, record handovers, deliver and receive the agreed compensation. **Assisted operators** help farmers without smartphones or confidence using the site. They act with recorded farmer consent rather than silently becoming the seller. Their permissions and any fee are explicit, and price acceptance and sensitive changes remain attributable to the farmer. **Administrators** review evidence and resolve exceptions with an audit trail; they do not rewrite accepted terms invisibly.

## Farmer home screen and inclusive verification

The farmer dashboard should answer the handwritten question, “what is important for him to know?” At a glance it shows the latest available market reference and its date, listed crops and remaining quantities, active orders, payment amounts and statuses, season-and-area demand, transport arrangements, relevant buyer information and the count of interested buyers for a crop. An interested-buyer count measures activity, not guaranteed sales. The primary decision card brings together a suitable buyer or current offer, local price reference, transport quote and expected net proceeds. Use short labels, familiar symbols, clear currency and quantity units, and accessible text alongside icons. Local-language presentation and assisted entry should reduce reading effort without hiding contractual details.

The team proposes farmer identity evidence, a Kisan identity document, PM-Kisan eKYC and land-record linkage such as Maharashtra's 7/12 extract. Preserve these as **optional future verification avenues whose access, permission, suitability and integration are unverified**. Do not claim that a government API is available, that any linkage has been implemented, or that reviewed documents certify the platform's users on behalf of government. The prototype can distinguish self-declared information, evidence submitted and evidence manually reviewed. It should collect only necessary evidence, restrict access and record review decisions. Land ownership must not be a universal condition for participating: tenants, sharecroppers and other cultivators need an alternative review path. Consent-based FPO or operator assistance is part of that inclusive path, not a claim of official identity verification.

## Supply, fair offers and flexible quantities

A listing records commodity and variety where relevant, declared grade, available quantity, farmer asking price, pickup location, harvest window and pickup availability. Photos and handling notes help establish what was offered. Inventory separates available, reserved, collected and completed quantities; accepting a concurrent order cannot oversell the same lot. Exact-quantity buying supports requests such as 7 kg rather than forcing a 10 kg pack, within the commodity's declared weighing increment, handling limits and minimum viable order policy.

A fair-price suggestion uses the available dated market comparison, requested quantity, current offers, local demand signals and optional private farmer-entered costs. Present an explainable suggested range and rank feasible offers by expected net proceeds rather than headline price alone. It must expose its basis and remain a suggestion. The farmer chooses their acceptable net amount; an algorithm does not establish a universal fair price or override that choice. Buyer requests, farmer offers, counteroffers, expiry and final acceptance can be structured records, avoiding the need for a separate chat service. Negotiated grade, amount, quantity and fulfilment terms are saved with the order.

The farmer-friendly order-splitting idea allows one requirement to draw from several compatible lots. A 100 kg tomato request might be filled by 60 kg from one farmer and 40 kg from another. Buyers must know that fulfilment spans lots and consent to applicable grade or source differences. Conversely, multiple nearby buyers wanting compatible produce can combine their orders into one shared run. Both operations preserve lot traceability and per-farmer proceeds.

## Prebooking, demand and avoiding waste

Harvest-based prebooking lets farmers publish expected availability before harvest and lets buyers reserve quantities subject to clear confirmation and cancellation terms. Keep indicative interest, accepted bookings, paid commitments and fulfilled sales separate. Preorders help a farmer see potential offtake before harvesting; they do not guarantee crop yield or eliminate buyer cancellation. Larger buyer requirements can inform future planting discussions, but a demand board should not present itself as agronomic advice or guaranteed procurement.

Area-wise demand alerts combine genuine buyer requests, searches and booking activity with current supply. A message such as “more onion requests than listed supply in this locality this week” should state its period and basis. Searches are weaker evidence than accepted or fulfilled orders and must not be counted as sales. Start with transparent counts and rolling summaries. Forecast commodity-and-area fulfilled quantities only when transaction history exists, compare a candidate model with a simple historical baseline on a chronological holdout, and show uncertainty and sample size. Prophet is an optional evaluated model, not a mandatory decorative AI component. Mandi prices alone cannot serve as consumer demand labels; synthetic orders demonstrate the interface, not forecasting accuracy.

The seasonal handwritten examples are retained as **unverified local planning hints**: March–June mentions mangoes, watermelon, muskmelon, jamun and jackfruit; July–September mentions custard apple, pomegranate and chikoo; November–February mentions strawberries, orange/mosambi, grapes and guava. These are not a validated harvest calendar or demonstrated demand pattern. Locality, variety and actual supply history must determine any production-facing advice. Crossed-out words are not treated as new requirements. A clipped “less than 50%” sentence in another photograph has no complete proposition or source, so no statistic is inferred from it.

“Buy Imperfect, Save Produce” creates an honestly described channel for edible produce with cosmetic imperfections or a different accepted grade. Buyers opt into the grade and price; the farmer agrees to the offer. Existing grade filters and buyer preferences can support this without a separate marketplace. Never describe unsafe or spoiled food as an alternative grade. Exact quantities and a route that respects freshness may reduce avoidable waste, but measured waste reduction requires a real baseline.

## Aggregation: eight considerations with an explanation

The team calls the proposed decision layer **D-COA ENGINE (Decision & Coordination Optimization Algorithm)**. This is a working product/engine name, not a claim of a new validated or published algorithm. Its diagram takes orders, constraints and live events through matching, grouping, route planning, cost allocation, feasibility checking and dynamic updates, producing grouped orders, combined farmer lots, vehicle assignments, routes and costs. The aggregation module evaluates candidate orders and lots before passing a proposed shipment to routing. It must explain accepted and rejected combinations rather than grouping only by proximity or first arrival. Its eight considerations, drawn from `order aggregation.pdf`, are **product compatibility, pickup/delivery geography, quantity and vehicle capacity, delivery time windows, perishability/freshness, estimated transport cost, order priority, and changes such as cancellations or new orders**. Several are hard feasibility conditions; cost and priority guide selection among feasible candidates, while changes trigger reevaluation.

Product compatibility checks agreed commodity/grade and relevant handling restrictions. Geography considers both collection and delivery, with a configurable pilot service area. Capacity checks the load at every leg, not just the final total. Pickup and delivery windows must allow travel and handling time. Freshness constrains elapsed time and handling suitability; software cannot create refrigeration that the vehicle lacks. Estimated transport cost must support the accepted quote and transparent sharing. Priority reflects declared deadlines and booking commitments through an explicit policy, not hidden paid placement. Changes must invalidate stale proposals and reconcile inventory and commitments.

A batch explanation can say: compatible commodity, total load within capacity, pickup area acceptable, deadlines and freshness achievable, and shared transport cheaper than separate feasible runs under the same assumptions. If an additional order misses a deadline, the rejection must say so. The uploaded example uses 820 kg against 1,000 kg capacity; retain it as an illustrative constraint explanation, separate from the 30 kg minimum demonstration. Do not copy its implied savings without computing an actual comparison.

Hard constraints use deterministic rules and the routing solver. Prediction or ranking can be added when useful evidence supports it. Neither the word “AI” nor an arbitrary score substitutes for feasibility. A nearby order can still be incompatible, and a technically feasible batch can still be uneconomical. Leave such orders pending with an explanation, offer a later window, regroup or request a revised quote rather than promising an impossible delivery.

## Routes, transport and controlled replanning

Routing consumes the proposed lot allocations, vehicle availability, capacities, stop windows and a travel-time matrix. Each relevant pickup precedes delivery of its goods. A bounded OR-Tools solve returns a feasible best-found route or an explicit infeasibility result; do not claim a mathematically global optimum. The map displays stop order, expected arrival, load and cost with a comparable feasible fixed-order baseline. Tracking begins with recorded order and handover statuses; continuous live GPS is not required to prove the demonstration.

Before dispatch, a new order, cancellation, stock correction or vehicle change can trigger versioned re-aggregation and routing of affected pending work. Preserve already committed deadlines and accepted farmer proceeds. Reconcile reservations atomically, recompute the buyer bill, and require renewed acceptance for material changes to accepted terms. After dispatch, freeze ordinary allocation changes: an operator handles cancellation, shortage or route disruption with explicit records and agreement. This resolves the tension between the new dynamic-planning idea and the earlier plan's dispatch freeze. Dynamic does not mean quietly rewriting a journey already under way.

Return-load matching is a later reuse of vehicle and route data. A transporter can declare a return corridor, time window and spare capacity; the platform offers compatible loads subject to detour, freshness, handling and quote checks. Empty return space does not automatically imply a suitable or cheaper trip. A driver must accept the work, and the quoted payment must account for actual effort.

## Quality, payment and exception handling

The listing grade, pickup weight, handover photo or other necessary evidence, timestamp and acceptance/rejection reason establish an auditable transaction record. FPO member allocation links that evidence back to each farmer. Record shortages, delays, cancellations, disputes, refunds and any agreed quality adjustment instead of treating every order as automatically delivered. Physical grading and dispute resolution still require people; a photograph is evidence rather than a guarantee.

Keep order state and payment state separate. A typical order moves from draft and confirmation through reservation, batching, scheduling, collection and delivery. A route failure releases or safely retains reservations according to a visible policy and returns the proposal for resolution. Retried payment callbacks and reservation requests must be idempotent. Settlement amounts follow accepted terms and documented adjustments. Production payment collection, payouts, provider capabilities and operating requirements require validation at implementation; use sandbox payments and mock notifications for the demo. Do not imply that the website already operates escrow.

## Farmer proceeds and a small operating fee

There is no basic farmer listing fee. The farmer sees and accepts their proceeds before commitment. The buyer receives an itemized bill: **accepted farmer proceeds + quoted transport + packing/handling or assisted service + website service fee + applicable taxes**. Preserve that accepted farmer amount unless the parties agree to an evidence-backed quantity or quality adjustment. If the farmer separately bears an agreed production, packaging or selling cost, show it explicitly in the economics view; do not quietly reintroduce the original plan's default farmer deductions.

A small disclosed buyer-facing fee on completed orders can contribute to running the website. Transporters, FPO handlers and assisted operators quote their compensation transparently; the plan seeks modest viable returns without guaranteeing their profit. Buyer value comes from delivered price and convenience. Payment processing is covered either by the website fee or by a separate disclosed charge, never counted twice. Processing may apply to the entire collected amount, so the fee is gross revenue before processing, refunds, hosting, storage, maps, messaging, support and maintenance. Avoid paid ranking that weakens farmer interests.

For monthly fixed cost M, retained average service-fee revenue s per completed order, and variable platform cost v per completed order, break-even volume is ceil(M / (s − v)) only if s exceeds v. If it does not, more orders do not solve the fixed-cost problem. Change service scope, costs or openly quoted fees; never hide the shortfall in farmer settlements. “No extra resources” means reuse the planned stack and avoid new fleets, hardware and paid AI subscriptions, not that development, human operations or hosting are free.

The existing synthetic example uses three 10 kg orders, 18 kg from Farmer A and 12 kg from Farmer B. Farmer proceeds are ₹960 at ₹32/kg, split ₹576 and ₹384; transport is ₹150, handling ₹60 and gross website fee ₹30, totaling ₹1,200 before any additional applicable charges. A hypothetical mandi reference of ₹28/kg less assumed selling costs of ₹3/kg gives ₹750 comparable net receipts and an illustrative ₹210 difference. These are invented demonstration inputs, not live prices or proven savings. Production costs are absent, so neither amount is farming profit. The ₹30 website revenue may still yield a negative operating contribution.

## Competitors and evidence boundaries

The saved competition brief reviewed eNAM, agribazaar, Ninjacart/Ninja Mandi and Samunnati with primary-source links. Their public capabilities already include forms of trade, aggregation, logistics, FPO support or related services. Marketplace, quality records, demand forecasting and routing are not automatically unique. The new aggregation PDF also mentions Mai Kisaan and broader agribazaar technology claims; these are supplied research leads, not newly independently verified findings in this consolidation. Krishivan remains an ambiguous team-mentioned name. An unmentioned capability on a competitor page is not evidence that it is absent.

The presentation now includes an explicit four-competitor comparison, pairing their established strengths with our proposed farmer controls and benefits. It does not treat undisclosed competitor capabilities as absent or claim measured superiority. Our proposed distinction is an explainable combined decision: form the shipment across several constraints, replan pending work when conditions change, preserve farmer-accepted proceeds and show the shared cost. Demonstrating that this combination works locally is credible; claiming superiority over every competitor without comparable pilot evidence is not. The team transcript's APMC journey helps explain existing intermediaries, but exact market timings, universal commissions and the statement that APMC sets MSP for the listed fruits must not become product facts. The existing brief records the MSP correction and its source. A dated mandi observation is a comparison, not a guaranteed floor price.

## How the website will be built

Use one modular Next.js/TypeScript web application, PostgreSQL with PostGIS where geographic querying is useful, and a small Python/FastAPI compute service for routing and later demand analysis. Keep domain logic inside six modules instead of deploying six separate microservices. Prefer existing database constraints, deterministic matching and simple statistics before adding infrastructure. Agmarknet data, travel times, payment and notifications use replaceable adapters with reproducible fixtures. Razorpay and Twilio/MSG91 are proposed providers, not confirmed accounts or integrations. Verify access, terms, coverage, dependency versions and costs when implementing.

Shared contracts use stable IDs, integer paise, integer grams, explicit unit conversions, UTC storage and Asia/Kolkata display. Core records include actors and memberships, lots, reservations, requests and offers, orders, allocation/batch versions, vehicles and stops, handover evidence, payment/settlement state, benchmark observations and demand estimates. Each benchmark exposes commodity, grade/variety where available, market, date, source, units and live/cached/fixture state. A missing or stale comparison stays visibly missing or stale. Every recommendation should be traceable to its input version and assumptions.

The six people can work independently after agreeing contracts and fixtures. **Owner 1: platform and integration** owns authentication, role checks, database migrations, shared contracts and app wiring. **Owner 2: farmer/FPO supply** owns onboarding evidence, listings, member ledger, stock and atomic reservations. **Owner 3: buyer commerce** owns discovery, exact quantities, bulk requests, negotiation, prebooking, orders, payments and notices. **Owner 4: aggregation** owns candidate compatibility, lot allocation, cost-sharing proposals, batch explanations and pre-dispatch replanning. **Owner 5: logistics** owns vehicles, route feasibility, maps, transport quotes and handover status, with later return-load matching. **Owner 6: economics and demand** owns dated mandi comparisons, net-proceeds reports, demand summaries, alerts and evaluated forecasting. Each owner also delivers the screens and focused checks for their module; shared files remain centrally integrated.

The intended source layout is `apps/web/src/modules/{platform,supply,commerce,aggregation,logistics,insights}`, `services/compute/{routing,forecasting}` and shared contracts, database and fixtures under `packages/`. This is a proposed structure, not a claim that those directories contain a working application. Aggregation can consume fixture orders while commerce is unfinished; routing can consume fixture batches; insights can consume fixture allocations and costs. The inventory owner alone changes stock, and modules call each other's service interface rather than writing directly to another domain's tables.

## Build checkpoints and proof

**Checkpoint 1 — contracts:** choose the pilot assumptions, crop units and grade policy; define the six interfaces and immutable sample IDs; settle acceptance and cancellation rules. Stop when each owner knows their exact inputs, outputs and acceptance check. **Checkpoint 2 — scaffold:** establish the shell, database, authentication and compute boundary with fixture-backed screens. Stop when the modules run against shared samples. **Checkpoint 3 — vertical slices:** complete one scoped path per owner, including reservation correctness, duplicate-callback handling, compatibility rejection and explained economics. Record unresolved dependencies before integrating.

**Checkpoint 4 — integration:** connect three buyer orders to two farmer lots, reservations, one aggregate batch, one vehicle run, payment/status records and the farmer comparison. Test incompatible windows, missing vehicle, stock contention, stale benchmark and a cancellation before dispatch. Demonstrate a rejected candidate and a revised plan without hidden changes to accepted proceeds. **Checkpoint 5 — demo and documentation:** reproduce the flow from a clean seed, record verification commands, update the context and stop when the acceptance conditions hold. Optional return-load matching and a trained forecast come after the core proof rather than delaying it.

The minimum demonstration has three nearby consumer orders and one collection-and-delivery run with **two farm pickup stops and three deliveries**. “One pickup” in the original prompt is interpreted as one consolidated run, not a physically impossible single stop at two farms. Compare solver output to a feasible baseline under identical inputs and report distance, load use, transport cost/kg and delivery-window satisfaction. Reconcile every rupee and gram. If savings are zero, show zero. A real pilot must additionally measure comparable farmer net/kg, buyer landed price, transport/service compensation, website contribution, cancellations and waste; synthetic data alone proves none of these real-world impacts.

## Presentation direction and persistent memory

The user's prior CivicFlow presentation is the visual reference: diagrams, arrows, familiar symbols and short labels should carry the explanation at a glance. Keep the SIH six-slide structure and team identity, with a visual progression from fragmented trade to farmer control, compatible batching, feasible route, transparent money and measured impact. Detailed narrative belongs in this README and speaker notes rather than walls of text on the slides. Symbols require an understandable label where their meaning is ambiguous. The reference supplies a visual direction, not agricultural evidence; no CivicFlow domain features or performance metrics are imported into this agricultural proposal.

This document stores the team's ideas in the repository so future sessions can resume from files rather than relying on conversation memory. It distinguishes original suggestions, agreed design decisions, demo assumptions and unverified integrations. Future implementation requests should read `CONTEXT.md`, this README and the contract sections of `docs/PROJECT_PLAN.md`, then execute the next scoped checkpoint. Update these files when a decision changes; do not represent a planned capability as shipped.

## Source manifest

`Suggestions ` (the filename includes a trailing space) supplied eight proposals: fair-price suggestion, group buying, harvest prebooking, imperfect produce, multi-farmer splitting, demand alerts, negotiation and exact quantities. `Group's Ideas` supplied the marketplace/intelligence/logistics structure, assisted operators, verification, market journey, competitor leads and return journeys. `order aggregation.pdf` supplied the eight considerations, explainable acceptance/rejection and dynamic re-aggregation; its rendered diagrams should be used alongside its extracted text, not treated as competitor proof.

`WhatsApp Image 2026-09-12 at 12.54.38 AM.jpeg` supplied retail, bulk-buyer and transporter journeys. `WhatsApp Image 2026-09-12 at 1.44.38 AM.jpeg` supplied area demand, farmer priority and buyer/offer/price/transport/net recommendations. `WhatsApp Image 2026-09-13 at 10.42.04 AM.jpeg` repeats that recommendation page. `WhatsApp Image 2026-09-13 at 10.42.32 AM.jpeg` supplies the seasonal examples and partially visible repeated journey notes. `WhatsApp Image 2026-09-13 at 10.43.24 AM.jpeg` supplies the farmer dashboard and interested-buyer count; its clipped statistic is deliberately unresolved. `WhatsApp Image 2026-09-13 at 10.43.41 AM.jpeg` supplies proposed identity, PM-Kisan eKYC and 7/12 evidence ideas.

`docs/PROJECT_PLAN.md` supplies the original six-owner plan, interfaces, units and verification checkpoints. `output/KrishiSetu_Competition_and_Feature_Brief.md` supplies the prior sourced competitor review, twelve capabilities, corrected market claims and revised operating-fee policy. `CONTEXT.md` is the compact handoff. The initial SIH description and subsequent user messages supply the problem statement, Logic_Lords/RAIT/SIH26-SW059 identity, farmer-first priority, low-resource objective and diagram-led presentation requirement. `/home/purvals/Documents/SIH25031-CivicPlatform/civicflow.pdf` is the requested visual reference; `docs/templates/SIH2026-IDEA-Presentation-Format.pptx` is the saved SIH template. None of these planning sources establishes that an application, official integration or profitable operation already exists.

## Implementation status (15 September 2026)

The application described above is now implemented at [`web/`](web/README.md) and runs end to end
against a local PostgreSQL. What exists:

- Four roles with separate screens and permissions: farmer, household and bulk buyer, transporter,
  operator. Password-based sign-in with a signed session cookie; seeded demonstration accounts.
- Listings with grade, prebooking, exact-quantity increments and atomic reservation, so the same
  kilogram cannot be promised twice.
- The aggregation engine (`web/src/lib/pooling.ts`): compatibility, freshness, capacity on every
  leg, service radius, a farm-stop limit, cheapest-ask allocation with farm consolidation and fair
  rotation, and an explanation of every rejected order. Runs below the minimum fill fraction are
  held rather than dispatched.
- Route planning with a nearest-neighbour pickup order compared against a fixed-order baseline over
  the same stops, and vehicle downsizing to the smallest adequate vehicle.
- Pricing built upward from the farmer's accepted rate, with the site fee absorbing any squeeze
  against the quick-commerce reference down to a floor of zero.
- Demand and price forecasting that only shows a fitted model when it beats a naive baseline on a
  chronological holdout, with the sample size and both error figures displayed.
- Live mandi prices from the Government of India open data portal, stored with source and date, plus
  a daily cron that accumulates the price history the forecast needs.
- An operator economics screen that reports break-even and the quoted-against-actual transport
  variance rather than hiding either.

The team's competitor review named seven weaknesses in Ninjacart, DeHaat, AgriBazaar, WayCool and
Arya.ag. Each one is answered in the application, and the limits of each answer are stated on the
site's own `/positioning` page rather than only in this document:

| Identified gap | What the application does | Where it stops |
|---|---|---|
| Digital intermediaries | No reseller exists in the data model; a buyer order is filled by named farmer lots and each farm's money is its own row | Grading, packing, hosting and dispute handling are still paid work, shown as line items |
| High logistics cost | Same-neighbourhood pooling, downsizing to the smallest adequate vehicle, a minimum fill below which the run is held, cluster collection by default and free door delivery only above a basket threshold | Travel time is estimated, not live; quoted against actual transport is reported rather than assumed |
| Limited consumer access | Households and bulk buyers share one catalogue and one run, with exact-quantity purchase in the commodity's own increment | Thin neighbourhoods are held rather than served at a loss |
| Quality disputes | Declared grade, per-stop handover records, a buyer complaint flow and a recorded operator resolution | A farmer's proceeds are only reduced with recorded agreement; grading still needs people |
| Digital literacy and language | Farmer screens in Marathi, Hindi or English, stored on the account | Contractual figures stay numeric; assisted operators are designed but not built |
| Price transparency | The accepted rate is an input to the buyer's price and is never deducted from; net realisation per kilogram is shown beside the mandi comparison | The mandi comparison may be days old and from another market, and says so |
| Forecasts that never become orders | A fitted model is shown only when it beats a naive baseline on a chronological holdout, with both errors and the sample size printed | The demand history is synthetic and labelled as such |

Two further capabilities were added after the first build:

- **Run notifications.** In-app notices to the people a run affects: a pickup reminder naming the farmer's stop
  number and quantity, a run offer or held-run notice to the transporter, a dispatch notice and a collection-window
  notice to buyers, and a payment-released notice to each farmer. Nothing is sent by SMS or email, because that needs
  a provider account and consent handling this build does not have; a notice is a record the recipient reads on their
  own screens.
- **Neighbourhood sharing.** A public invitation page per cluster showing exactly how far the next run is from the
  minimum fill, with a share button on the buyer's basket and orders screens. Asking a neighbour to add a basket is
  the honest version of a referral: the page states the shortfall rather than marketing at them.

The interface follows an approved visual design: Plus Jakarta Sans with a Devanagari companion, a leaf-green and
earth-amber palette on paper-white or olive-charcoal, light and dark themes, tabular figures throughout, and no
photography. The design tokens live in `web/src/app/globals.css` and should be changed there rather than per page.

What is still not implemented: real payment collection or escrow, any government identity or land
record integration, return-load matching, and negotiation as a separate structured flow. Demand
history and the price series used for fitting are synthetic and labelled as such in the database and
on screen.

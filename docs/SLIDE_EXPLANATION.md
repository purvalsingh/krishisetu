# KrishiSetu — slide explanation and speaker guide

For Logic_Lords · SIH26-SW059 · RAIT  
Companion to **KrishiSetu_Visual_SIH2026_v4**, the six-slide SIH presentation.

This guide explains the pictures, the reasoning behind them and what to say aloud. The quoted passages form a roughly 6–8 minute presentation, depending on speaking speed. The explanations below them are preparation material for the team and judge questions. Use “we propose” and “we will demonstrate” until the application actually works.

## Slide 1 — Introduction: what problem are we solving?

### What to say

> “We are Logic_Lords from RAIT, presenting KrishiSetu for problem statement SIH26033. Our focus is the amount a farmer actually takes home from a sale. A high selling price is not enough if transport, handling and other deductions consume the difference.
>
> KrishiSetu brings farmers, FPOs, household buyers and bulk buyers together, then helps them form an affordable shared delivery. The farmer sees the expected proceeds before accepting. Our central question is: can this order reach the buyer while preserving an amount the farmer agrees to?”

### What this means

The cover establishes the team, problem statement and project identity. KrishiSetu is our working project name; the government-style name does not mean the government owns or endorses the product. The unusual MedTech / BioTech / HealthTech theme is the label supplied with the problem statement.

The problem has two connected sides: a farmer can receive too little while a buyer still pays a high delivered price. Fragmented small orders, repeated handling and separate trips can contribute to that gap. The website cannot simply remove everyone between the farm and the household. Someone still needs to collect, weigh, pack, transport and resolve problems. Our proposal makes those services and their charges visible, while combining compatible work to improve delivery economics.

The phrase “farmer-first” has a specific meaning: the farmer retains price choice, sees the proposed net receipt, can reject or negotiate an offer, and can trace their share of a pooled sale.

**Transition:** “Here is how two small farmers and nearby buyers can use one shared delivery.”

## Slide 2 — Proposed solution: how a transaction works

### What to say

> “Read this diagram from left to right. Two farmers list their produce with quantity, grade, harvest window and pickup location. Nearby buyers place compatible orders. KrishiSetu combines the required farmer lots into one batch and assigns one vehicle run.
>
> There are still two farm pickups, but the produce travels through a coordinated collection-and-delivery plan. Each farmer keeps a separate record of what they supplied and what they will receive.
>
> The four symbols below show supporting features: harvest prebooking, negotiated offers, a market for honestly described imperfect produce, and assisted access for farmers who need help using the website. Together, these give small farmers more ways to reach buyers without requiring us to purchase a fleet or build new physical infrastructure.”

### How to explain the visual

**The two farmer icons** represent independent sellers or FPO members. Their stock remains individually owned and recorded even after pooling. The platform reserves quantities when orders are accepted so the same produce cannot be sold twice.

**The crate** represents an allocation, not necessarily a new warehouse. It records which quantities from which lots will satisfy which buyer orders. There are two useful combinations: one large order can draw from several farmers, and several small buyer orders can share a trip.

**The truck** represents one planned run with multiple stops. A batch still needs available capacity, suitable handling, feasible deadlines and an agreed transport quote. “One run” does not mean one physical pickup at two different farms.

**The buyer icon** includes households and bulk purchasers such as restaurants or retailers. Buyers see supported exact quantities, agreed quality, delivery terms and the complete bill before commitment.

### What the four supporting features do

Prebooking gives the farmer visibility into potential demand before harvest, but an expression of interest is different from an accepted booking. Negotiation lets farmers accept or counter structured offers. Imperfect-produce matching finds willing buyers for edible produce with disclosed cosmetic or grade differences; it must never disguise spoilage. Assisted access lets an operator enter information with the farmer’s consent, with the farmer’s decisions recorded.

**Transition:** “The difficult part is deciding which orders can safely and economically travel together.”

## Slide 3 — Technical approach: the D-COA decision engine

### What to say

> “D-COA is our working name for the decision and coordination engine. It considers eight things: crop compatibility, location, capacity, time, freshness, cost, priority and changes to the orders.
>
> In this example, A, B and C form an 820-kilogram load within a 1,000-kilogram vehicle. Order D is kept separate because its deadline would be missed. Spare space alone does not make an order suitable.
>
> If an order changes before dispatch, the engine can regroup the affected work, recalculate the route and update the quote. It must explain why it accepted or rejected a combination. We use established tools such as PostGIS and OR-Tools, while our application connects their results to farmer-approved proceeds and shared delivery costs.”

### The eight checks in plain language

| Check | What the system asks |
|---|---|
| Crop | Are the lots and orders compatible in commodity, agreed grade and handling needs? |
| Nearby | Do the pickup and delivery locations make sense within the service area? |
| Capacity | Does every leg of the route stay within the vehicle’s available capacity? |
| Time | Can collection, travel, handling and delivery fit the promised windows? |
| Freshness | Can the produce arrive within its declared freshness and handling limits? |
| Cost | Does the quoted trip remain affordable under the accepted transaction terms? |
| Priority | How should feasible orders be ranked using declared deadlines and commitments? |
| Changes | Has a cancellation, stock correction or new order made the previous plan stale? |

Grouping and routing work together. Grouping proposes a compatible set of lots and orders; routing tests whether a vehicle can actually visit their stops in an acceptable sequence. A route that fits on a map may still fail the deadline or cost checks. The system should hold, regroup or request revised terms when that happens.

The replanning loop applies before dispatch. A change that materially affects an accepted quote needs renewed agreement. Once the vehicle is dispatched, ordinary automatic allocation changes stop; operators handle exceptions explicitly.

Next.js supplies the website, PostgreSQL stores the records, PostGIS supports geographic queries, and a Python service runs OR-Tools. “Shared contracts” means the six development modules agree on the same order, lot, batch and route formats. D-COA is a proposed engine name, not evidence that we invented a new mathematical algorithm. The 820 kg illustration is separate from the 30 kg financial example on slide 5.

**Transition:** “We also need the system to remain affordable and useful when real-world problems occur.”

## Slide 4 — Feasibility and viability: what makes the plan practical?

### What to say

> “The initial system uses a phone browser, assisted entry and one modular application. We start with recorded demand signals and harvest bookings. Compatible return loads are a later extension using the same transport data.
>
> The lower half shows three realistic problems. An unverified claim requires review and handover evidence. A cancelled order requires safe stock release and regrouping. If costs exceed the accepted quote, we seek a revised agreement or wait for a viable batch.
>
> The core flow does not require paid AI. However, verification, transport, support and hosting still cost money. Our goal is to reuse existing resources and make those costs visible.”

### Why these choices matter

A browser-based application avoids requiring every participant to install a separate app. Assisted entry helps farmers who lack a suitable device or confidence using the interface, but it still requires a person and recorded consent. “One app” means a shared application with separate farmer, buyer, transporter and operator permissions.

Demand signals initially mean counts of genuine requests, accepted bookings and fulfilled orders. Searches are useful indications but are not sales. We should not claim forecasting accuracy before collecting and evaluating real local transaction history. Mandi price history is a price reference, not a substitute for household demand history.

Return loads may use spare capacity on a vehicle’s return journey. This is optional because the timing, detour, produce handling and driver compensation must all work. An empty truck is not automatically a suitable cheap truck.

The three risk responses show that software supports accountable decisions rather than guaranteeing perfect execution. Evidence review cannot eliminate fraud; photographs cannot replace all physical grading. Cancellation handling must preserve correct inventory and accepted commitments. A cost shortfall must never silently reduce a farmer’s agreed receipt.

**Transition:** “The next slide makes that cost transparency visible in rupees.”

## Slide 5 — Impact and benefits: where does the money go?

### What to say

> “This is an illustrative 30-kilogram batch, not measured market performance. Three buyers each order ten kilograms. Farmer A supplies eighteen kilograms and Farmer B supplies twelve.
>
> Buyers pay a total of ₹1,200. Of that, ₹960 goes to the farmers, ₹150 pays transport, ₹60 pays packing and ₹30 is the website fee. The farmer receipt is ₹32 per kilogram.
>
> For comparison, we assume a mandi price of ₹28 with ₹3 of selling costs, giving ₹25 per kilogram. Under these assumptions, farmers retain ₹7 more per kilogram. A real pilot must replace these assumptions with comparable actual transactions. The website fee contributes to operations; it is revenue before expenses, not guaranteed profit.”

### Understand the calculation

| Item | Calculation | Result |
|---|---|---:|
| Batch quantity | 3 buyers × 10 kg | 30 kg |
| Farmer A receipt | 18 kg × ₹32 | ₹576 |
| Farmer B receipt | 12 kg × ₹32 | ₹384 |
| Combined farmer receipt | ₹576 + ₹384 | ₹960 |
| Buyer bill | ₹960 + ₹150 + ₹60 + ₹30 | ₹1,200 |
| Average buyer price | ₹1,200 ÷ 30 kg | ₹40/kg |
| Assumed mandi net receipt | ₹28 − ₹3 | ₹25/kg |
| Illustrative farmer difference | 30 kg × (₹32 − ₹25) | ₹210 |

The comparison concerns sale proceeds. Production costs such as seeds, labour and cultivation are absent, so ₹32/kg is not farming profit. The example also does not establish consumer savings: that would require a comparable delivered retail price, which is not supplied here.

The ₹150 and ₹60 are payments for services, not provider profits. Transporters and handlers must account for their own costs. Similarly, the ₹30 website fee must cover its share of processing, hosting, notifications, refunds and support. There is no basic farmer listing fee in the proposed model. Fees and any applicable additional charges must be disclosed before acceptance.

The key design rule is that all parties can trace the bill. If a viable trip cannot preserve the accepted terms, the system must obtain a new agreement or hold the batch.

**Transition:** “That combined focus on farmer control and delivery economics is how we position ourselves against existing platforms.”

## Slide 6 — Research, references and our competitive edge

### What to say

> “We have studied existing platforms rather than assuming this market is empty. eNAM already supports FPO aggregation and mandi trade. agribazaar supports digital trading and delivery terms. Ninjacart combines commerce, fulfilment and finance. Samunnati works across aggregation, market linkage and advisory.
>
> Our proposed edge is the connected farmer workflow shown in green: each farmer approves their proceeds, sees the shared delivery cost, understands batch rejection, and retains a traceable member-level payout record.
>
> We intend to prove that these controls work together in one small locality. Our success measure is higher comparable farmer net receipts with feasible delivery and transparent charges. We will demonstrate that result rather than claim we already outperform established national platforms.”

### How to read the comparison

The left column states established competitor strengths. The middle column shows the part of our proposed design we want judges to evaluate. The right column translates that design into a farmer benefit. These are positioning comparisons, not a checklist proving that the other companies lack our features.

Against eNAM’s established aggregation role, explain our emphasis on an individual farmer approving their receipt and tracing their share. Against agribazaar’s trading workflow, explain the explicit shared-trip calculation and itemized bill. Alongside Ninjacart’s fulfilment capabilities, explain our visible eight-check batch decision and reason for rejection. Alongside Samunnati’s aggregation and market-linkage work, explain the lot-to-member payout ledger.

None of those individual features is automatically unique. The proposed distinction is their integration into one decision: **can these orders travel together under conditions the farmer accepts, and can we explain the allocation, route and money?**

If asked why we are “leagues ahead,” use a concrete answer: “We are targeting a more explicit farmer decision in our pilot: accepted proceeds linked to a feasible shared trip. We have not established overall superiority. We will compare farmer net/kg, delivery cost/kg, deadline fulfilment and platform contribution using the same assumptions.” This is stronger than claiming an unmeasured advantage that a judge can easily challenge.

The slide links the platform names to their source pages. Full reference links are in the presentation notes and [competition brief](../output/KrishiSetu_Competition_and_Feature_Brief.md). AGMARKNET supports dated market comparisons; OR-Tools supports the route-planning method. Neither source proves our proposed impact.

**Closing line:** “KrishiSetu makes the farmer’s accepted earnings part of the delivery decision, from the first offer to the final settlement.”

## Six-person rehearsal split

One person can explain each slide: introduction, transaction flow, decision engine, feasibility, economics and competition. The technical speaker should know why a batch is rejected; the economics speaker should reconcile every rupee; the competition speaker should distinguish proposed benefits from measured results. Everyone should know the two-farmer, three-buyer example and avoid describing a planned feature as already implemented.

# SIH26033 — overview and six-part project design

Current specification: `README.md` (13 September 2026) consolidates all team uploads and resolves later decisions. It takes precedence over this earlier plan for features, identity verification, billing and controlled dynamic replanning. Keep this file for the initial interface map and checkpoints.

Planning artifact, saved 2026-09-11. Application implementation is a future task. The supplied problem statement is the planning input; claims about competitors, portal scores, and external data availability have not been independently verified.

Update, 2026-09-12: working name KrishiSetu; team Logic_Lords, SIH26-SW059, RAIT. The newer `output/KrishiSetu_Competition_and_Feature_Brief.md` incorporates team transcript/handwriting, primary-source competitor research, 12 farmer-first capabilities and the buyer-facing service-fee model. Use that update for feature priorities and billing: preserve farmer-accepted proceeds and itemize delivery/handling/site charges. It supersedes the initial default farmer-deduction illustration below. Existing competitors already include aggregation/logistics; differentiation must be demonstrated rather than asserted.

## Overview

Connect farmers and FPOs with retail and bulk buyers, combine compatible orders and small produce lots into economical vehicle runs, and show whether the resulting transaction improves farmer net receipts. Prioritize a convincing local demonstration over a nationwide marketplace.

Proposed default: one pilot locality, INR, weight-based produce, farmer/FPO/buyer/operator roles, responsive web app, sandbox payments, and reproducible demo data. Geography and provider accounts can be selected when implementation begins.

Use a modular application plus one Python compute service. Six microservices would add deployment and integration work without improving this demo. A UI-only prototype would be quicker but would not prove routing or aggregation economics.

## Proposed project tree

This is a future structure; only planning documents currently exist.

```text
Farmers/
├── CONTEXT.md
├── docs/
│   ├── PROJECT_PLAN.md
│   └── contracts/                   # Part 1: API schemas and ownership
├── apps/web/
│   ├── app/                        # Thin Next.js routes; Part 1 integrates
│   └── src/modules/
│       ├── platform/               # 1: identity, roles, common UI
│       ├── supply/                 # 2: farmers, FPOs, listings, inventory
│       ├── commerce/               # 3: buyers, orders, payments, notices
│       ├── aggregation/            # 4: batches and lot allocation
│       ├── logistics/              # 5: fleet, route map, delivery state
│       └── insights/               # 6: benchmarks, earnings, forecasts
├── services/compute/
│   ├── routing/                    # Part 5: OR-Tools solver
│   └── forecasting/                # Part 6: demand baselines/models
├── packages/
│   ├── contracts/                  # Part 1: schemas and generated types
│   ├── database/                   # Part 1: migration integration
│   └── fixtures/                   # Shared deterministic demo inputs
└── tests/
    ├── contracts/
    └── e2e/                        # Minimum demo and failure paths
```

## Six independent workstreams

| Part | Owns and delivers | Inputs → outputs | Independent acceptance check |
|---|---|---|---|
| **1. Platform and integration** | App shell, authentication, role authorization, DB setup, shared schemas, fixture harness, compute-service wiring, final integration | Role/session configuration → authenticated actor and validated contracts | Farmer cannot edit another seller's listing; each module can run against fixtures |
| **2. Farmer/FPO supply** | Seller profiles, FPO membership, produce quantity/grade/harvest windows, listing availability and reservations | Seller actor and listing input → available lots and reservation result | Two sellers publish lots; competing reservations cannot oversell stock |
| **3. Buyer commerce** | Retail and bulk discovery, cart, delivery windows, orders, payment adapter, buyer notifications | Available lots and buyer intent → confirmed order requests | Three orders persist; repeated payment callbacks cannot create duplicate orders |
| **4. Aggregation** | Locality/time-window grouping, compatible lot matching, minimum viable batch policy, allocation and cost-sharing policy | Orders, lot snapshots and policy → proposed batch with allocations | Three compatible orders draw from two farmers without exceeding stock; incompatible windows remain separate |
| **5. Logistics** | Fleet capacity/availability, travel-time adapter, pickup-before-delivery routing, cost estimates, route map and delivery status | Batch, vehicles and travel matrix → feasible route or explicit infeasibility | Two pickups precede their related deliveries; capacity/time windows hold; compare with a feasible fixed-order baseline |
| **6. Economics and demand insights** | Mandi data adapter, normalized benchmarks, farmer net comparison, commodity/area demand view | Benchmark observations, order history, allocations and route cost → earnings breakdown and demand estimate | Cost totals reconcile; stale/missing benchmarks are visible; synthetic forecasts are labeled |

Each part includes its own UI, service logic, fixtures, and focused tests. Ownership by feature prevents every contributor from editing the same frontend/backend files. Part 1 owns shared wiring; other owners submit contract changes before changing shared types.

## Shared contracts: establish once before parallel work

Store versioned JSON/OpenAPI schemas and matching fixtures in the shared packages. These are proposed logical operations, independent of final HTTP route names.

| Contract | Owner | Required fields / behavior |
|---|---|---|
| Actor | 1 | user ID, role, seller/FPO memberships; authorization checked server-side |
| ListAvailableLots | 2 | lot ID, seller ID, commodity, grade, available grams, paise/kg, pickup coordinates, harvest and pickup windows |
| ReserveLots / ReleaseReservation | 2 | idempotency key, lot quantities, expiry; atomic all-or-nothing stock reservation |
| OrderRequest | 3 | order ID, buyer ID, commodity/grade lines, grams, delivery coordinates/window, status |
| BatchProposal | 4 | batch ID, order IDs, allocations linking order lines to lots, reservation ID, collection/delivery windows |
| PlanRoute | 5 | batch, stops, vehicle capacities, availability, travel matrix → route stops, ETA, distance, itemized cost, feasibility status |
| MandiBenchmark | 6 | commodity, grade if available, market, observation date, source, paise/kg, fetched timestamp, live/cached/fixture status |
| EconomicsReport | 6 | per-farmer gross receipts, allocated deductions, net receipts, comparable mandi net, difference and assumptions |
| DemandEstimate | 6 | commodity, area, forecast period, expected grams, method, sample count, real/synthetic status and uncertainty where supported |

Conventions: stable IDs; integer paise and integer grams; explicit paise/kg conversion and rounding; UTC timestamps with Asia/Kolkata display; latitude/longitude in WGS84. Treat each domain's tables as private: call its service operations rather than writing across modules.

Order flow: draft → confirmed → reserved → batched → scheduled → collected → delivered. Payment state is separate. Failed scheduling releases reservations or returns the batch for replanning; no delivery promise is shown for infeasible routes. Freeze allocations after dispatch; post-dispatch exceptions require operator resolution. Persist state changes and use idempotency keys for retryable operations.

## Independence and integration

After the shared contract checkpoint, all six owners can work from the same fixtures. Parts 4–6 do not wait for finished marketplace screens: aggregation consumes fixture orders/lots, routing consumes fixture batches, insights consumes fixture orders and costs. Part 3 uses mocked supply responses until Part 2 is ready.

Runtime data flow:

```text
2. Supply ───┐
             ├──→ 4. Aggregation ──→ 5. Logistics ──→ 6. Economics
3. Orders ───┘            │                              ↑
     └────────────────────┴────────→ 6. Demand/benchmarks ┘
1. Platform supplies identity, contracts, storage and integration to all.
```

Routing can reject an aggregation proposal. The aggregator must then split/reassign or leave it pending; geographic proximity alone does not prove feasibility or savings. Optimize feasible delivery cost within a bounded solver time; report best-found results without claiming a global optimum.

## Minimum demonstration

1. Seed two farmers, compatible produce lots, three buyers in one locality, one suitable vehicle, and a dated benchmark fixture.
2. Place three consumer orders with overlapping delivery windows.
3. Aggregate them into one batch and reserve quantities across the two farmers.
4. Produce one vehicle run with **two pickup stops** and three deliveries. Interpret “one pickup” as one consolidated collection run, since two farm locations require two stops.
5. Display stop sequence, ETA, capacity, distance and cost against a feasible unoptimized baseline using the same inputs. Do not invent savings if the baseline is already as good.
6. Show each farmer's net receipts, deductions and difference from the mandi comparison. Show the consumer total separately.
7. Show a demand insight labeled as a demonstration if derived from synthetic orders.

Farmer direct net = produce revenue payable to farmer − farmer-borne logistics allocation − platform/payment charges borne by farmer − recorded packaging/loss costs.

Comparable mandi net = matched benchmark price × comparable sold quantity − explicitly stated mandi-side costs. Unknown costs remain visible assumptions; do not present a modal mandi quote as a guaranteed farmgate price or call net receipts profit. Allocate delivery cost by weight for the demo and disclose who pays it, with rounding reconciled to the route total.

## Demand and external integrations

Forecast demand from fulfilled-order quantities by commodity and area. Begin with a simple historical baseline; evaluate a Prophet candidate only when usable history exists, against a chronological holdout and baseline. Mandi price series alone cannot establish consumer demand. Synthetic data proves the workflow, not prediction accuracy.

Keep Agmarknet ingestion behind an adapter with source/date/unit normalization and a reproducible cached fixture. Verify access, licensing, schema and locality coverage when implementing. Similarly use sandbox Razorpay and mock Twilio/MSG91 initially. Live payments, real notifications and deployment require the corresponding configuration and requested scope.

Grade recording, acceptance/rejection reasons, cancellation/refund states and spoilage assumptions support the demo. Physical quality verification and real transport operations remain operational dependencies.

## Scoped execution checkpoints

1. **Contracts:** settle pilot assumptions, schemas, module ownership and deterministic demo fixtures. Stop when six owners can identify their exact inputs/outputs.
2. **Scaffold:** establish app, database, compute service, auth and mock adapters. Stop when the shell and fixture-backed module entry points run.
3. **Vertical slices:** implement one scoped slice per part using its acceptance check. Stop each slice after focused verification; record unresolved integration needs.
4. **Integration:** connect orders → reservations → batches → routing → economics. Check overselling, duplicate callbacks, incompatible windows, no vehicle, and stale benchmark handling.
5. **Demo/docs:** run the full three-order flow, document setup and limitations, update CONTEXT.md. Stop when the demo is reproducible and acceptance checks pass.

Future request: “Read CONTEXT.md and docs/PROJECT_PLAN.md. Build SIH26033 using the six-part design, starting with contracts and scaffold. Use scoped checkpoints and record verification.” This resumes from saved workspace context; a different workspace needs these files copied or attached.

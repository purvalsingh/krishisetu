# KrishiSetu project context

Read README.md for the consolidated product specification (13 September 2026), docs/UNIT_ECONOMICS.md for the delivery money model (15 September 2026), and web/README.md for the running application.

The application now exists at web/. Next.js 16 + TypeScript + PostgreSQL via Prisma 7, four roles (farmer, transporter, customer, admin), pooling engine, route planner, demand and price forecasting with a baseline gate, live Agmarknet ingest, sandbox payments, in-app run notifications and a public neighbourhood-sharing page. Live at https://krishisetu-weld.vercel.app (Vercel project krishisetu, Neon Postgres). Local Postgres runs in Docker on port 55432. Demonstration password demo1234.

Project: SIH26033. Team Logic_Lords, SIH26-SW059, RAIT (Ramrao Adik Institute of Technology). KrishiSetu is a working name without government affiliation.

Core: farmer-approved net proceeds, compatible lot/order pooling, feasible collection/delivery and transparent costs. D-COA is the team's working engine name. Check crop, geography, capacity, time, freshness, cost, priority and changes. Replan before dispatch; freeze dispatched allocations except controlled operator exceptions.

Features: farmer/FPO member ledger, consent-based assisted access, reviewed roles, exact quantities, bulk counteroffers, harvest prebooking, imperfect-produce channel, mandi comparison, demand alerts, farmer dashboard, payment status and handover evidence. Backhaul and evaluated forecasting follow the core. Government identity/eKYC/7/12 integration is proposed and unverified; land ownership is not mandatory eligibility.

Stack: modular Next.js/TypeScript, PostgreSQL/PostGIS, Python/FastAPI and OR-Tools. Six owners: platform, supply, commerce, aggregation, logistics, insights. Shared contracts/fixtures enable independent slices. Integer paise/grams, UTC storage, Asia/Kolkata display, atomic reservations and idempotent payments.

Billing: buyer pays farmer-accepted proceeds plus quoted logistics/handling, site fee and applicable taxes. No basic listing fee. Gross site fees are not guaranteed profit. Label synthetic/cached/live data.

Demo: three orders, two farms, one run with two pickups and three deliveries; reconcile money/stock and explain rejection/replanning.

README indexes all uploads and overrides conflicts. docs/PROJECT_PLAN.md retains earlier interfaces; output/KrishiSetu_Competition_and_Feature_Brief.md retains sourced research. Presentation uses the official six-slide SIH template with CivicFlow-inspired diagrams and custom icons. Execute contracts → scaffold → scoped slices → integration → verified demo.

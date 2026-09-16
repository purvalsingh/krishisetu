# KrishiSetu — web application

Farmer-first vegetable marketplace with pooled logistics. Next.js 16, TypeScript, PostgreSQL via Prisma 7.

The product intent lives in [`../README.md`](../README.md); the money model lives in
[`../docs/UNIT_ECONOMICS.md`](../docs/UNIT_ECONOMICS.md). This file covers running the code.

## What is implemented

Four roles, each with their own screens and their own view of the same transaction:

| Role | Screens | What they can do |
|---|---|---|
| Farmer | `/farmer`, `/farmer/listings`, `/farmer/demand`, `/farmer/earnings` | List ready stock or a prebooked harvest, set the net rate they accept, see predicted demand per crop and per neighbourhood, see which farm stop collects from them, and compare every allocation against a dated mandi observation. |
| Household and bulk buyer | `/market`, `/cart`, `/orders` | Buy exact quantities, read the itemised bill, choose collection or door delivery, and see which farms filled the order. |
| Transporter | `/transporter`, `/transporter/runs/[id]` | Accept a full run with distance, load and payment known in advance, work the stop list, record handovers, complete the run. |
| Operator | `/admin`, `/admin/batches/[id]`, `/admin/economics`, `/admin/quality`, `/admin/data` | Plan runs, read why each order was accepted or rejected, release an undispatched run, watch break-even, and refresh live mandi prices. |

Shared across roles: `/notifications` for in-app run notices, and `/join/[cluster]` — a public page showing how far
the next run is from the minimum fill, meant to be forwarded to neighbours.

The decision layer is `src/lib/pooling.ts`. It takes confirmed orders, available lots and offered
vehicles, and returns a shipment plus an explanation of everything it left out. It is pure data in,
data out, so it is testable without a database; `src/lib/planner.ts` is the only place that writes
reservations.

## Running it locally

```bash
docker run -d --name krishisetu-pg -e POSTGRES_PASSWORD=krishisetu -e POSTGRES_USER=krishisetu -e POSTGRES_DB=krishisetu -p 55432:5432 postgres:16-alpine
cp .env.example .env   # then fill DATABASE_URL and SESSION_SECRET
npm install
npm run db:push
npm run db:seed
npm run dev
```

Every seeded account uses the password `demo1234`. Sign in as `9800000101` (farmer),
`9800000301` (household buyer), `9800000306` (bulk buyer), `9800000201` (transporter) or
`9800000001` (operator).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run db:seed` | Reset and reseed the demonstration data |
| `npm run db:ingest` | Fetch today's mandi prices from data.gov.in |
| `npm test` | Run the engine checks (pricing, pooling, routing, forecasting) |
| `npm run build` | Production build |

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Signing key for the session cookie; use a long random value in production |
| `DATA_GOV_IN_API_KEY` | data.gov.in key for live mandi prices. Register a free personal key; the widely shared sample key is rate-limited. |
| `AGMARKNET_STATE` | State filter for the price fetch, default `Maharashtra` |
| `CRON_SECRET` | Bearer token guarding `/api/cron/ingest` |

## Data honesty rules the code enforces

These are not documentation promises; they are implemented and covered by `npm test`.

- The farmer's accepted rate is an input to the price. No code path reduces it. When a price cannot
  be held under the quick-commerce reference, the site fee is cut to zero first and the order is
  flagged; the farmer's amount is never touched.
- Every price observation is stored with its source (`LIVE`, `SYNTHETIC`, `CACHED`, `FIXTURE`) and
  its date, and both are shown wherever the number is displayed.
- A fitted forecast is only used when it beats a four-week median baseline on a chronological
  holdout. Otherwise the baseline is shown and labelled. Too little history produces no forecast.
- A run below the minimum fill fraction is held, not dispatched. The orders roll to the next window
  with a reason.
- Reservations are made in one transaction, so the same kilogram cannot be sold twice.
- Payments are sandbox authorisations. No money is collected and no escrow is operated.

## Deployment

The project deploys to Vercel as a standard Next.js app. It needs `DATABASE_URL` pointing at a
hosted PostgreSQL, the other variables above, and `npm run db:push && npm run db:seed` run once
against that database. `vercel.json` registers a daily cron that refreshes mandi prices, which is
what eventually replaces the synthetic price history with a real one.

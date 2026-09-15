import { prisma } from "./db";

/**
 * Live daily mandi prices from the Government of India open data portal
 * (resource 9ef84268-d588-465a-a308-a864a43d0070, "Current Daily Price of
 * Various Commodities from Various Markets"). Prices there are rupees per
 * quintal; everything inside this application is paise per kilogram.
 *
 * This is a read-only public dataset. It is a dated price comparison, not a
 * guaranteed floor price, and it is stored with its source label so a stale
 * observation can never be displayed as if it were today's.
 */

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";

type Record = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number | string;
  max_price: number | string;
  modal_price: number | string;
};

// One quintal is 100 kg, so rupees per quintal divided by 100 gives rupees per
// kg, and multiplying by 100 gives paise per kg. The two cancel, which is easy
// to misread as a missing conversion, so it is written out here.
const quintalToPaisePerKg = (rupeesPerQuintal: number) =>
  Math.round((rupeesPerQuintal / 100) * 100);

function parseArrivalDate(ddmmyyyy: string): Date {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The portal rate-limits per API key, and the widely shared sample key is
 * usually exhausted. A 429 is retried with backoff and then reported as a rate
 * limit rather than as a generic failure, because the fix is a different key,
 * not a different request.
 */
export async function fetchAgmarknet(state: string, limit = 500): Promise<Record[]> {
  const key = process.env.DATA_GOV_IN_API_KEY;
  if (!key) throw new Error("DATA_GOV_IN_API_KEY is not set");
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE}`);
  url.searchParams.set("api-key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("filters[state]", state);

  const backoffMs = [0, 2_000, 6_000];
  let lastStatus = 0;

  for (const wait of backoffMs) {
    if (wait) await sleep(wait);
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (res.ok) {
      const body = (await res.json()) as { records?: Record[] };
      return body.records ?? [];
    }
    lastStatus = res.status;
    if (res.status !== 429) break;
  }

  if (lastStatus === 429)
    throw new Error(
      "data.gov.in rate limit reached for this API key. Register a free key at data.gov.in and set DATA_GOV_IN_API_KEY.",
    );
  throw new Error(`data.gov.in returned ${lastStatus}`);
}

/**
 * Pulls today's published prices and stores one observation per commodity and
 * market. Returns how many rows were written so the admin screen can show
 * whether the last refresh actually succeeded.
 */
export async function ingestAgmarknet(state = process.env.AGMARKNET_STATE ?? "Maharashtra") {
  const commodities = await prisma.commodity.findMany();
  const byName = new Map(commodities.map((c) => [c.agmarknetName.toLowerCase(), c]));

  let records: Record[];
  try {
    records = await fetchAgmarknet(state);
  } catch (err) {
    return { ok: false, written: 0, matched: 0, total: 0, error: String(err) };
  }

  let written = 0;
  let matched = 0;

  for (const r of records) {
    const commodity = byName.get(String(r.commodity).trim().toLowerCase());
    if (!commodity) continue;
    matched++;
    const observedOn = parseArrivalDate(r.arrival_date);
    if (Number.isNaN(observedOn.getTime())) continue;

    await prisma.benchmarkObservation.upsert({
      where: {
        commodityId_market_observedOn_source: {
          commodityId: commodity.id,
          market: String(r.market).trim(),
          observedOn,
          source: "LIVE",
        },
      },
      create: {
        commodityId: commodity.id,
        market: String(r.market).trim(),
        district: String(r.district).trim(),
        state: String(r.state).trim(),
        observedOn,
        minPaisePerKg: quintalToPaisePerKg(Number(r.min_price)),
        maxPaisePerKg: quintalToPaisePerKg(Number(r.max_price)),
        modalPaisePerKg: quintalToPaisePerKg(Number(r.modal_price)),
        source: "LIVE",
      },
      update: {
        minPaisePerKg: quintalToPaisePerKg(Number(r.min_price)),
        maxPaisePerKg: quintalToPaisePerKg(Number(r.max_price)),
        modalPaisePerKg: quintalToPaisePerKg(Number(r.modal_price)),
        fetchedAt: new Date(),
      },
    });
    written++;
  }

  return { ok: true, written, matched, total: records.length, error: null as string | null };
}

/** Latest observation for a commodity, with its age so staleness is visible. */
export async function latestBenchmark(commodityId: string) {
  const row = await prisma.benchmarkObservation.findFirst({
    where: { commodityId },
    orderBy: [{ observedOn: "desc" }, { fetchedAt: "desc" }],
  });
  if (!row) return null;
  const ageDays = Math.floor((Date.now() - row.observedOn.getTime()) / 86_400_000);
  return { ...row, ageDays, stale: ageDays > 3 };
}

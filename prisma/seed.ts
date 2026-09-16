/**
 * Reproducible demonstration data.
 *
 * Everything written here is synthetic and is labelled SYNTHETIC in the
 * database. Live mandi prices are fetched separately by the Agmarknet ingest
 * and are labelled LIVE. The two are never mixed in a single display.
 *
 * Run with: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
loadEnv();

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Grade } from "@prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

/** Deterministic pseudo-random generator so every reseed produces the same demo. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(26033);

const DEMO_PASSWORD = "demo1234";

/** Navi Mumbai neighbourhood pickup points. Coordinates are approximate. */
const CLUSTERS = [
  { name: "Nerul Sector 6 pickup point", city: "Navi Mumbai", lat: 19.0330, lng: 73.0197, hostName: "Shree Provision Stores" },
  { name: "Kharghar Sector 12 pickup point", city: "Navi Mumbai", lat: 19.0473, lng: 73.0699, hostName: "Sai Kirana" },
  { name: "Vashi Sector 17 pickup point", city: "Navi Mumbai", lat: 19.0760, lng: 72.9986, hostName: "Aadhar Super Shop" },
];

/**
 * Commodity reference prices are assumed quick-commerce rates in paise per kg,
 * used only for the buyer-facing comparison. They are not scraped.
 */
const COMMODITIES = [
  { name: "Tomato", agmarknetName: "Tomato", quick: 5500, freshnessHours: 30, emoji: "🍅", step: 250 },
  { name: "Onion", agmarknetName: "Onion", quick: 4200, freshnessHours: 96, emoji: "🧅", step: 500 },
  { name: "Potato", agmarknetName: "Potato", quick: 3800, freshnessHours: 120, emoji: "🥔", step: 500 },
  { name: "Cauliflower", agmarknetName: "Cauliflower", quick: 6000, freshnessHours: 36, emoji: "🥦", step: 250 },
  { name: "Cabbage", agmarknetName: "Cabbage", quick: 4000, freshnessHours: 48, emoji: "🥬", step: 250 },
  { name: "Brinjal", agmarknetName: "Brinjal", quick: 5200, freshnessHours: 36, emoji: "🍆", step: 250 },
  { name: "Okra", agmarknetName: "Bhindi(Ladies Finger)", quick: 6800, freshnessHours: 30, emoji: "🌿", step: 250 },
  { name: "Green Chilli", agmarknetName: "Green Chilli", quick: 8000, freshnessHours: 36, emoji: "🌶️", step: 100 },
  { name: "Spinach", agmarknetName: "Spinach", quick: 4500, freshnessHours: 24, emoji: "🥬", step: 250 },
  { name: "Coriander", agmarknetName: "Coriander(Leaves)", quick: 6000, freshnessHours: 24, emoji: "🌿", step: 100 },
  { name: "Bottle Gourd", agmarknetName: "Bottle gourd", quick: 4400, freshnessHours: 48, emoji: "🥒", step: 250 },
  { name: "Cucumber", agmarknetName: "Cucumbar(Kheera)", quick: 4800, freshnessHours: 48, emoji: "🥒", step: 250 },
];

/** Farms within the pilot service radius of Navi Mumbai. */
const FARMERS = [
  { name: "Sanjay Patil", phone: "9800000101", village: "Khalapur", district: "Raigad", lat: 18.8069, lng: 73.2803, fpo: "Raigad Bhaji Utpadak FPO" },
  { name: "Meena Bhoir", phone: "9800000102", village: "Panvel Rural", district: "Raigad", lat: 18.9894, lng: 73.1175, fpo: "Raigad Bhaji Utpadak FPO" },
  { name: "Ramesh Gawde", phone: "9800000103", village: "Karjat", district: "Raigad", lat: 18.9107, lng: 73.3232, fpo: null },
  { name: "Sunita Mhatre", phone: "9800000104", village: "Uran", district: "Raigad", lat: 18.8790, lng: 72.9380, fpo: null },
  { name: "Dattatray Shinde", phone: "9800000105", village: "Pen", district: "Raigad", lat: 18.7370, lng: 73.0960, fpo: "Pen Krishi Sangh" },
  { name: "Kavita Jadhav", phone: "9800000106", village: "Neral", district: "Raigad", lat: 19.0230, lng: 73.3230, fpo: "Pen Krishi Sangh" },
  { name: "Ganesh Kadam", phone: "9800000107", village: "Alibaug", district: "Raigad", lat: 18.6414, lng: 72.8722, fpo: null },
  { name: "Lata Pawar", phone: "9800000108", village: "Vangani", district: "Thane", lat: 19.1240, lng: 73.2680, fpo: null },
];

const TRANSPORTERS = [
  { name: "Imran Shaikh", phone: "9800000201", reg: "MH43 AB 1234", type: "Tata Ace, open body", capacityGrams: 750_000, lat: 18.9894, lng: 73.1175, rate: 2400, refrigerated: false },
  { name: "Prakash Sawant", phone: "9800000202", reg: "MH46 CD 5678", type: "Mahindra Bolero pickup", capacityGrams: 1_000_000, lat: 18.9107, lng: 73.3232, rate: 2700, refrigerated: false },
  { name: "Cold Chain Logistics", phone: "9800000203", reg: "MH04 EF 9012", type: "Refrigerated tempo", capacityGrams: 1_200_000, lat: 19.0330, lng: 73.0197, rate: 4200, refrigerated: true },
];

const CUSTOMERS = [
  { name: "Anjali Deshpande", phone: "9800000301", cluster: 0, flat: "A-704, Seawoods Estate" },
  { name: "Rohit Menon", phone: "9800000302", cluster: 0, flat: "B-101, Palm Beach Residency" },
  { name: "Farida Qureshi", phone: "9800000303", cluster: 0, flat: "C-1202, Sagar Darshan" },
  { name: "Vikram Rane", phone: "9800000304", cluster: 1, flat: "D-505, Spaghetti Complex" },
  { name: "Priya Nair", phone: "9800000305", cluster: 1, flat: "E-302, Bhoomi Heights" },
  { name: "Hotel Anand Bhavan", phone: "9800000306", cluster: 2, flat: "Sector 17 market road" },
];

/** Monday of the ISO week containing the given date, in UTC. */
function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

async function main() {
  console.log("Clearing existing demonstration data");
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.qualityReport.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.batchStop.deleteMany(),
    prisma.allocation.deleteMany(),
    prisma.orderLine.deleteMany(),
    prisma.order.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.demandForecast.deleteMany(),
    prisma.demandHistory.deleteMany(),
    prisma.benchmarkObservation.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.transporterProfile.deleteMany(),
    prisma.farmerProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.commodity.deleteMany(),
    prisma.cluster.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const clusters = [];
  for (const c of CLUSTERS) {
    clusters.push(
      await prisma.cluster.create({
        data: { name: c.name, city: c.city, lat: c.lat, lng: c.lng, hostName: c.hostName },
      }),
    );
  }

  const commodities = [];
  for (const c of COMMODITIES) {
    commodities.push(
      await prisma.commodity.create({
        data: {
          name: c.name,
          agmarknetName: c.agmarknetName,
          quickCommercePaisePerKg: c.quick,
          freshnessHours: c.freshnessHours,
          imageEmoji: c.emoji,
          stepGrams: c.step,
          minOrderGrams: c.step * 2,
        },
      }),
    );
  }

  await prisma.user.create({
    data: { phone: "9800000001", name: "Platform operator", passwordHash, role: "ADMIN" },
  });

  const farmerProfiles = [];
  for (const f of FARMERS) {
    const user = await prisma.user.create({
      data: {
        phone: f.phone,
        name: f.name,
        passwordHash,
        role: "FARMER",
        language: "mr",
        farmer: {
          create: {
            village: f.village,
            district: f.district,
            lat: f.lat,
            lng: f.lng,
            fpoName: f.fpo,
            verified: true,
            evidenceNote: "Self-declared for the demonstration. No government record has been checked.",
          },
        },
      },
      include: { farmer: true },
    });
    farmerProfiles.push(user.farmer!);
  }

  for (const t of TRANSPORTERS) {
    await prisma.user.create({
      data: {
        phone: t.phone,
        name: t.name,
        passwordHash,
        role: "TRANSPORTER",
        transporter: {
          create: {
            vehicleReg: t.reg,
            vehicleType: t.type,
            capacityGrams: t.capacityGrams,
            baseLat: t.lat,
            baseLng: t.lng,
            ratePaisePerKm: t.rate,
            refrigerated: t.refrigerated,
          },
        },
      },
    });
  }

  const customerProfiles = [];
  for (const c of CUSTOMERS) {
    const user = await prisma.user.create({
      data: {
        phone: c.phone,
        name: c.name,
        passwordHash,
        role: "CUSTOMER",
        customer: { create: { clusterId: clusters[c.cluster].id, flatNote: c.flat } },
      },
      include: { customer: true },
    });
    customerProfiles.push(user.customer!);
  }

  // ---- Synthetic weekly demand history, two years, per commodity per cluster ----
  console.log("Writing synthetic demand history");
  const weeks = 104;
  const thisWeek = weekStart(new Date());
  const historyRows: { commodityId: string; clusterId: string; weekStart: Date; grams: number }[] = [];

  for (const commodity of commodities) {
    // Each commodity gets its own seasonal shape and household base consumption.
    const base = 40_000 + Math.floor(rand() * 60_000);
    const seasonalPhase = rand() * Math.PI * 2;
    const seasonalAmp = 0.18 + rand() * 0.35;
    const trend = 0.0012 + rand() * 0.004;

    for (const cluster of clusters) {
      const clusterScale = 0.7 + rand() * 0.8;
      for (let w = weeks; w >= 1; w--) {
        const d = new Date(thisWeek);
        d.setUTCDate(d.getUTCDate() - w * 7);
        const seasonal = 1 + seasonalAmp * Math.sin((2 * Math.PI * (weeks - w)) / 52 + seasonalPhase);
        const growth = 1 + trend * (weeks - w);
        const noise = 0.88 + rand() * 0.24;
        historyRows.push({
          commodityId: commodity.id,
          clusterId: cluster.id,
          weekStart: d,
          grams: Math.max(0, Math.round(base * clusterScale * seasonal * growth * noise)),
        });
      }
    }
  }
  await prisma.demandHistory.createMany({ data: historyRows });

  // ---- Synthetic mandi price history so price trends have something to fit ----
  console.log("Writing synthetic mandi price history");
  const benchmarkRows = [];
  for (const commodity of commodities) {
    const spec = COMMODITIES.find((c) => c.name === commodity.name)!;
    // Farmer-side mandi levels sit far below the retail reference.
    const level = Math.round(spec.quick * (0.42 + rand() * 0.12));
    const amp = 0.2 + rand() * 0.3;
    const phase = rand() * Math.PI * 2;
    for (let w = 104; w >= 1; w--) {
      const d = new Date(thisWeek);
      d.setUTCDate(d.getUTCDate() - w * 7);
      const seasonal = 1 + amp * Math.sin((2 * Math.PI * (104 - w)) / 52 + phase);
      const noise = 0.9 + rand() * 0.2;
      const modal = Math.max(500, Math.round(level * seasonal * noise));
      benchmarkRows.push({
        commodityId: commodity.id,
        market: "Navi Mumbai (Vashi APMC)",
        district: "Thane",
        state: "Maharashtra",
        observedOn: d,
        minPaisePerKg: Math.round(modal * 0.88),
        maxPaisePerKg: Math.round(modal * 1.14),
        modalPaisePerKg: modal,
        source: "SYNTHETIC" as const,
      });
    }
  }
  await prisma.benchmarkObservation.createMany({ data: benchmarkRows, skipDuplicates: true });

  // ---- Active listings ----
  console.log("Writing farmer listings");
  const now = new Date();
  const listings = [];
  // Every commodity gets at least two farms offering it, so the demonstration
  // never fails for the uninteresting reason that nobody listed a crop.
  for (const [index, commodity] of commodities.entries()) {
    for (let k = 0; k < 2; k++) {
      const farmer = farmerProfiles[(index * 2 + k) % farmerProfiles.length];
      const recent = benchmarkRows
        .filter((b) => b.commodityId === commodity.id)
        .sort((a, b) => b.observedOn.getTime() - a.observedOn.getTime())[0];
      // The farmer asks above their comparable mandi net. This is their choice;
      // it is seeded here only so the demonstration has realistic asking prices.
      const ask = Math.round((recent.modalPaisePerKg - 300) * (1.08 + rand() * 0.18));
      const grade: Grade = k === 1 && rand() < 0.4 ? "IMPERFECT" : k === 1 ? "B" : "A";

      listings.push(
        await prisma.listing.create({
          data: {
            farmerId: farmer.id,
            commodityId: commodity.id,
            grade,
            totalGrams: 150_000 + Math.floor(rand() * 250_000),
            askPaisePerKg: Math.max(800, ask),
            harvestDate: new Date(now.getTime() - Math.floor(rand() * 14) * 3_600_000),
            status: "ACTIVE",
            notes:
              grade === "IMPERFECT"
                ? "Edible produce with cosmetic marks. Grade and price are declared before purchase."
                : null,
          },
        }),
      );
    }
  }

  // ---- Confirmed orders for the next run window ----
  console.log("Writing confirmed buyer orders for the next window");
  const window = new Date(now);
  window.setUTCDate(window.getUTCDate() + 1);
  window.setUTCHours(6, 0, 0, 0);

  // Deliberately concentrated on the first cluster so the pooling demonstration
  // has several orders sharing one destination.
  const demoOrders = [
    { customer: 0, tier: "CLUSTER_PICKUP" as const, items: [["Tomato", 3000], ["Onion", 2000], ["Coriander", 200]] },
    { customer: 1, tier: "LAST_LEG" as const, items: [["Tomato", 2000], ["Potato", 3000], ["Spinach", 500]] },
    { customer: 2, tier: "CLUSTER_PICKUP" as const, items: [["Cauliflower", 1500], ["Okra", 1000], ["Tomato", 1000]] },
    { customer: 3, tier: "CLUSTER_PICKUP" as const, items: [["Onion", 5000], ["Potato", 5000]] },
    { customer: 4, tier: "CLUSTER_PICKUP" as const, items: [["Brinjal", 1000], ["Green Chilli", 300], ["Cucumber", 1500]] },
    { customer: 5, tier: "CLUSTER_PICKUP" as const, items: [["Tomato", 25000], ["Onion", 30000], ["Potato", 20000]] },
  ];

  const { priceStack } = await import("../src/lib/pricing");

  for (const spec of demoOrders) {
    const customer = customerProfiles[spec.customer];
    const cluster = clusters.find((c) => c.id === customer.clusterId)!;
    const perOrderHandling =
      cluster.hostCommissionPaise + (spec.tier === "LAST_LEG" ? cluster.lastLegFeePaise : 0);

    const lines = [];
    let farmerProceeds = 0;
    let logistics = 0;
    let handling = 0;
    let siteFee = 0;
    let total = 0;

    for (const [commodityName, grams] of spec.items as [string, number][]) {
      const commodity = commodities.find((c) => c.name === commodityName)!;
      const cheapest = listings
        .filter((l) => l.commodityId === commodity.id && l.status === "ACTIVE")
        .sort((a, b) => a.askPaisePerKg - b.askPaisePerKg)[0];
      if (!cheapest) continue;

      const stack = priceStack({
        grams,
        farmerPaisePerKg: cheapest.askPaisePerKg,
        referencePaisePerKg: commodity.quickCommercePaisePerKg,
        // The per-order handling is charged once on the order, not on every line.
        perOrderHandlingPaise: 0,
      });

      lines.push({ commodityId: commodity.id, grams, grade: "A" as Grade, pricePaisePerKg: stack.landedPaisePerKg });
      farmerProceeds += stack.farmerProceedsPaise;
      logistics += stack.logisticsPaise;
      handling += stack.handlingPaise;
      siteFee += stack.siteFeePaise;
      total += stack.totalPaise;
    }

    handling += perOrderHandling;
    total += perOrderHandling;

    await prisma.order.create({
      data: {
        customerId: customer.id,
        clusterId: cluster.id,
        windowDate: window,
        tier: spec.tier,
        status: "CONFIRMED",
        paymentStatus: "AUTHORISED",
        paymentRef: `demo_${customer.id}_${window.toISOString().slice(0, 10)}`,
        farmerProceedsPaise: farmerProceeds,
        logisticsPaise: logistics,
        handlingPaise: handling,
        siteFeePaise: siteFee,
        totalPaise: total,
        lines: { create: lines },
      },
    });
  }

  // A realistic run needs roughly a hundred households in one neighbourhood.
  // Without them the fill threshold can never be met, and the demonstration
  // would only ever show a held run. These extra buyers exist so the full
  // dispatch path can be exercised.
  console.log("Writing a neighbourhood's worth of household orders for the first cluster");
  const basketCommodities = commodities.filter((c) =>
    ["Tomato", "Onion", "Potato", "Brinjal", "Cauliflower", "Cabbage", "Okra", "Cucumber", "Bottle Gourd", "Spinach"].includes(c.name),
  );

  for (let h = 1; h <= 120; h++) {
    const user = await prisma.user.create({
      data: {
        phone: `9800005${String(h).padStart(3, "0")}`,
        name: `Household ${h}, Nerul`,
        passwordHash,
        role: "CUSTOMER",
        customer: { create: { clusterId: clusters[0].id, flatNote: `Flat ${h}, Seawoods` } },
      },
      include: { customer: true },
    });

    const cluster = clusters[0];
    const tier = rand() < 0.22 ? ("LAST_LEG" as const) : ("CLUSTER_PICKUP" as const);
    const perOrderHandling = cluster.hostCommissionPaise + (tier === "LAST_LEG" ? cluster.lastLegFeePaise : 0);

    const chosen = [...basketCommodities].sort(() => rand() - 0.5).slice(0, 3 + Math.floor(rand() * 3));
    const lines = [];
    let farmerProceeds = 0;
    let logistics = 0;
    let handling = 0;
    let siteFee = 0;
    let total = 0;

    for (const commodity of chosen) {
      const grams = commodity.stepGrams * (2 + Math.floor(rand() * 7));
      const cheapest = listings
        .filter((l) => l.commodityId === commodity.id && l.status === "ACTIVE")
        .sort((a, b) => a.askPaisePerKg - b.askPaisePerKg)[0];
      if (!cheapest) continue;

      const stack = priceStack({
        grams,
        farmerPaisePerKg: cheapest.askPaisePerKg,
        referencePaisePerKg: commodity.quickCommercePaisePerKg,
        perOrderHandlingPaise: 0,
      });
      lines.push({ commodityId: commodity.id, grams, grade: "A" as Grade, pricePaisePerKg: stack.landedPaisePerKg });
      farmerProceeds += stack.farmerProceedsPaise;
      logistics += stack.logisticsPaise;
      handling += stack.handlingPaise;
      siteFee += stack.siteFeePaise;
      total += stack.totalPaise;
    }
    if (!lines.length) continue;

    handling += perOrderHandling;
    total += perOrderHandling;

    await prisma.order.create({
      data: {
        customerId: user.customer!.id,
        clusterId: cluster.id,
        windowDate: window,
        tier,
        status: "CONFIRMED",
        paymentStatus: "AUTHORISED",
        paymentRef: `demo_bulk_${user.customer!.id}`,
        farmerProceedsPaise: farmerProceeds,
        logisticsPaise: logistics,
        handlingPaise: handling,
        siteFeePaise: siteFee,
        totalPaise: total,
        lines: { create: lines },
      },
    });
  }

  console.log(
    `Seeded ${clusters.length} clusters, ${commodities.length} commodities, ${FARMERS.length} farmers, ` +
      `${TRANSPORTERS.length} transporters, ${CUSTOMERS.length} buyers, ${listings.length} listings, ` +
      `${historyRows.length} demand weeks and ${benchmarkRows.length} price observations.`,
  );
  console.log(`Every demonstration account uses the password ${DEMO_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

/** Pulls today's published mandi prices into the benchmark table. */
// Imported for its side effect, and first, so DATABASE_URL exists before the
// Prisma client module is evaluated.
import "dotenv/config";

import { ingestAgmarknet } from "../src/lib/agmarknet";
import { prisma } from "../src/lib/db";

ingestAgmarknet()
  .then((r) => {
    console.log(r);
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

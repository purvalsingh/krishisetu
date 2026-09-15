import { NextResponse } from "next/server";
import { ingestAgmarknet } from "@/lib/agmarknet";
import { prisma } from "@/lib/db";

/**
 * Scheduled price refresh. The published dataset is one snapshot per day with
 * no history, so a usable price series only exists if this runs daily and
 * accumulates observations.
 *
 * Protected by CRON_SECRET. Vercel Cron sends it in the Authorization header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (secret && provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const result = await ingestAgmarknet();
  await prisma.auditLog.create({ data: { action: "benchmark.ingest", subject: "agmarknet-cron", detail: result } });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

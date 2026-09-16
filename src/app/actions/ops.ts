"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { completeBatch, planRun, releaseBatch } from "@/lib/planner";
import { ingestAgmarknet } from "@/lib/agmarknet";
import { notifyCompleted, notifyDispatched, notifyHandover, notifyRunPlanned } from "@/lib/notify";

export async function planRunAction(formData: FormData) {
  await requireRole("ADMIN");
  const clusterId = String(formData.get("clusterId"));
  const windowDate = new Date(String(formData.get("windowDate")));
  const transporterId = String(formData.get("transporterId") || "") || undefined;

  const { batchId } = await planRun({ clusterId, windowDate, transporterId });
  if (batchId) await notifyRunPlanned(batchId);

  revalidatePath("/admin");
  revalidatePath("/transporter");
  revalidatePath("/farmer");
  revalidatePath("/orders");
}

export async function releaseBatchAction(formData: FormData) {
  await requireRole("ADMIN");
  await releaseBatch(String(formData.get("batchId")));
  revalidatePath("/admin");
  revalidatePath("/transporter");
}

export async function ingestAction() {
  await requireRole("ADMIN");
  const result = await ingestAgmarknet();
  await prisma.auditLog.create({ data: { action: "benchmark.ingest", subject: "agmarknet", detail: result } });
  revalidatePath("/admin/data");
  revalidatePath("/farmer");
}

export async function acceptRunAction(formData: FormData) {
  const session = await requireRole("TRANSPORTER");
  const batchId = String(formData.get("batchId"));
  const profile = await prisma.transporterProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return;

  // Only the transporter the run was planned against can accept it.
  await prisma.batch.updateMany({
    where: { id: batchId, transporterId: profile.id, status: "AWAITING_TRANSPORTER" },
    data: { status: "ACCEPTED" },
  });
  revalidatePath("/transporter");
}

export async function dispatchRunAction(formData: FormData) {
  const session = await requireRole("TRANSPORTER");
  const batchId = String(formData.get("batchId"));
  const profile = await prisma.transporterProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return;

  // After dispatch the allocation is frozen. Later changes need an operator.
  await prisma.batch.updateMany({
    where: { id: batchId, transporterId: profile.id, status: "ACCEPTED" },
    data: { status: "DISPATCHED", dispatchedAt: new Date() },
  });
  await prisma.order.updateMany({ where: { batchId }, data: { status: "IN_TRANSIT" } });
  await notifyDispatched(batchId);

  revalidatePath("/transporter");
  revalidatePath("/orders");
  revalidatePath(`/transporter/runs/${batchId}`);
}

export async function recordHandoverAction(formData: FormData) {
  await requireRole("TRANSPORTER");
  const stopId = String(formData.get("stopId"));
  const note = String(formData.get("note") ?? "").slice(0, 200);
  const stop = await prisma.batchStop.update({
    where: { id: stopId },
    data: { handoverAt: new Date(), handoverNote: note || "Collected, weight agreed at the stop" },
  });
  if (stop.kind === "PICKUP") {
    await prisma.order.updateMany({ where: { batchId: stop.batchId, status: "IN_TRANSIT" }, data: { status: "COLLECTED" } });
    await notifyHandover(stop.id);
  }
  revalidatePath(`/transporter/runs/${stop.batchId}`);
}

export async function completeRunAction(formData: FormData) {
  await requireRole("TRANSPORTER");
  const batchId = String(formData.get("batchId"));
  await completeBatch(batchId);
  await notifyCompleted(batchId);

  revalidatePath("/transporter");
  revalidatePath(`/transporter/runs/${batchId}`);
  revalidatePath("/orders");
  revalidatePath("/farmer");
}

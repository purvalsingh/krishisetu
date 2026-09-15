"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const Report = z.object({
  orderId: z.string().min(1),
  reason: z.enum(["SHORT_WEIGHT", "QUALITY_BELOW_GRADE", "DAMAGED", "MISSING_ITEM", "OTHER"]),
  description: z.string().min(5, "Describe what was wrong").max(500),
});

/** A buyer reports a problem with a delivered order. */
export async function reportQualityIssue(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const session = await requireRole("CUSTOMER");
  const parsed = Report.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const customer = await prisma.customerProfile.findUnique({ where: { userId: session.userId } });
  if (!customer) return { error: "No buyer profile is attached to this account" };

  // Only the buyer's own completed order can be reported on.
  const order = await prisma.order.findFirst({
    where: {
      id: parsed.data.orderId,
      customerId: customer.id,
      status: { in: ["READY_FOR_PICKUP", "DELIVERED", "COLLECTED"] },
    },
  });
  if (!order) return { error: "That order cannot be reported on" };

  await prisma.qualityReport.create({
    data: {
      orderId: order.id,
      reporterId: session.userId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    },
  });

  revalidatePath("/orders");
  revalidatePath("/admin/quality");
  return { ok: true };
}

const Resolution = z.object({
  reportId: z.string().min(1),
  buyerRefundRupees: z.coerce.number().min(0).default(0),
  farmerAdjustmentRupees: z.coerce.number().min(0).default(0),
  farmerAgreed: z.coerce.boolean().optional(),
  resolutionNote: z.string().min(5).max(500),
  dismiss: z.string().optional(),
});

/**
 * The operator records the agreed outcome. A deduction from the farmer is only
 * written when the farmer has agreed to it; otherwise the refund is carried by
 * the platform and the farmer's accepted proceeds stand.
 */
export async function resolveQualityReport(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const session = await requireRole("ADMIN");
  const parsed = Resolution.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const farmerAgreed = Boolean(d.farmerAgreed);
  const farmerAdjustmentPaise = farmerAgreed ? Math.round(d.farmerAdjustmentRupees * 100) : 0;
  if (d.farmerAdjustmentRupees > 0 && !farmerAgreed)
    return { error: "A deduction from the farmer needs the farmer's recorded agreement" };

  await prisma.qualityReport.update({
    where: { id: d.reportId },
    data: {
      status: d.dismiss ? "DISMISSED" : "RESOLVED",
      buyerRefundPaise: Math.round(d.buyerRefundRupees * 100),
      farmerAdjustmentPaise,
      farmerAgreed,
      resolutionNote: d.resolutionNote,
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: d.dismiss ? "quality.dismiss" : "quality.resolve",
      subject: d.reportId,
      detail: { buyerRefundRupees: d.buyerRefundRupees, farmerAdjustmentPaise, farmerAgreed, note: d.resolutionNote },
    },
  });

  revalidatePath("/admin/quality");
  revalidatePath("/orders");
  return { ok: true };
}

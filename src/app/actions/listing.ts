"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const Schema = z.object({
  commodityId: z.string().min(1, "Choose a crop"),
  grade: z.enum(["A", "B", "IMPERFECT"]),
  kilograms: z.coerce.number().positive("Enter the quantity in kilograms"),
  rupeesPerKg: z.coerce.number().positive("Enter the rate you will accept"),
  harvestDate: z.string().min(1, "Enter the harvest date"),
  prebooking: z.coerce.boolean().optional(),
  notes: z.string().max(400).optional(),
});

export async function createListing(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const session = await requireRole("FARMER");
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const profile = await prisma.farmerProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return { error: "No farmer profile is attached to this account" };

  const d = parsed.data;
  await prisma.listing.create({
    data: {
      farmerId: profile.id,
      commodityId: d.commodityId,
      grade: d.grade,
      totalGrams: Math.round(d.kilograms * 1000),
      askPaisePerKg: Math.round(d.rupeesPerKg * 100),
      harvestDate: new Date(d.harvestDate),
      prebooking: Boolean(d.prebooking),
      notes: d.notes || null,
      status: "ACTIVE",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "listing.create",
      subject: d.commodityId,
      detail: { kilograms: d.kilograms, rupeesPerKg: d.rupeesPerKg, grade: d.grade },
    },
  });

  revalidatePath("/farmer/listings");
  revalidatePath("/farmer");
  revalidatePath("/market");
  return { ok: true };
}

export async function setListingStatus(formData: FormData) {
  const session = await requireRole("FARMER");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "ACTIVE" | "PAUSED";
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return;

  // A farmer can only change their own listing, and never one already reserved away.
  await prisma.listing.updateMany({ where: { id, farmerId: profile.id }, data: { status } });
  revalidatePath("/farmer/listings");
}

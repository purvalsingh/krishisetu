"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLocale } from "@/lib/i18n";

/** The chosen language is stored on the account, so it survives sign-out. */
export async function setLanguage(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const language = String(formData.get("language") ?? "");
  if (!isLocale(language)) return;

  await prisma.user.update({ where: { id: session.userId }, data: { language } });
  revalidatePath("/farmer");
  revalidatePath("/farmer/listings");
  revalidatePath("/farmer/demand");
  revalidatePath("/farmer/earnings");
}

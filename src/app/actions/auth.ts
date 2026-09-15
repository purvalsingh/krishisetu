"use server";

import { redirect } from "next/navigation";
import { destroySession, homeFor, signIn } from "@/lib/auth";

export async function signInAction(_prev: { error?: string } | undefined, formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!phone || !password) return { error: "Enter your mobile number and password" };

  const result = await signIn(phone, password);
  if (!result.ok) return { error: result.error };
  redirect(homeFor(result.role));
}

export async function signOutAction() {
  await destroySession();
  redirect("/login");
}

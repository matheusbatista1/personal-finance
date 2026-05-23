"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isSupportedLocale } from "@/i18n/request";

export async function setLocale(value: string): Promise<{ ok: boolean }> {
  if (!isSupportedLocale(value)) return { ok: false };
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

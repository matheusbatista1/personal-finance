"use server";

import { cookies } from "next/headers";

export async function dismissSplash(): Promise<void> {
  const store = await cookies();
  store.set("finlux_splash", "", { path: "/", maxAge: 0 });
}

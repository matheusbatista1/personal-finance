import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side guard. Returns the authenticated user or redirects to /login.
 * Use at the top of every protected Server Component and Server Action.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

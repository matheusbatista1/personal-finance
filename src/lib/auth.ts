import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side guard. Returns the authenticated user or redirects to `/`
 * (which renders the login form when unauthenticated, or the MFA challenge
 * when the user is at AAL1 but has a verified second factor). Use at the
 * top of every protected Server Component and Server Action.
 */
export async function requireUser(): Promise<User> {
  const { user, mfaPending } = await getAuthState();
  if (!user || mfaPending) {
    redirect("/");
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

/**
 * Returns the auth state including whether a second-factor challenge is still
 * pending. Use this when the caller needs to distinguish a fully-authenticated
 * user (AAL2 or no MFA enrolled) from one that just provided the password.
 *
 * Strategy:
 *   - AAL2 sessions short-circuit (the JWT proves the user passed MFA).
 *   - AAL1 sessions call `listFactors()` explicitly because
 *     `getAuthenticatorAssuranceLevel().nextLevel` is derived from
 *     `session.user.factors`, which is stale on a freshly-issued
 *     post-password session.
 */
export async function getAuthState(): Promise<{
  user: User | null;
  mfaPending: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, mfaPending: false };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return { user, mfaPending: false };

  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) return { user, mfaPending: false };

  const hasVerifiedFactor = factorsData?.totp?.some((f) => f.status === "verified") ?? false;
  return { user, mfaPending: hasVerifiedFactor };
}

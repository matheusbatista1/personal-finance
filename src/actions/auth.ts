"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/application/validation/auth";
import { env } from "@/lib/env";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type SignUpResult =
  | { ok: true; signedIn: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function signInWithEmail(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  // No redirect here — the client triggers a hard navigation so the splash
  // plays on the freshly-mounted page.
  return { ok: true };
}

export async function signUpWithEmail(input: SignUpInput): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName || undefined,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    // Avoid leaking Supabase-specific messages that could enumerate accounts
    // ("User already registered", etc.).
    return { ok: false, error: "Não foi possível criar a conta. Tente novamente." };
  }

  // With email confirmation disabled (local dev), the user is signed in immediately.
  // In production with confirmations enabled, data.session is null and the user
  // must click the link in their email before logging in.
  const signedIn = data.session !== null;
  if (signedIn) {
    revalidatePath("/", "layout");
    // Client does a hard nav so the splash plays.
  }

  return { ok: true, signedIn };
}

/**
 * Completes the MFA challenge for the currently authenticated user. Expects
 * the user to already be signed in at AAL1 with a verified TOTP factor; on
 * success, the session is upgraded to AAL2.
 */
export async function verifyMfa(input: { code: string }): Promise<ActionResult> {
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Use o código de 6 dígitos do seu autenticador." };
  }

  const supabase = await createClient();

  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) {
    return { ok: false, error: "Não foi possível verificar o segundo fator." };
  }

  const totp = factors.totp.find((f) => f.status === "verified");
  if (!totp) {
    return { ok: false, error: "Nenhum autenticador verificado encontrado." };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: totp.id,
  });
  if (challengeError || !challenge) {
    return { ok: false, error: "Não foi possível iniciar a verificação." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) {
    return { ok: false, error: "Código inválido. Tente novamente." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sets a new password for the currently-authenticated session. Used by the
 * reset-password page, which the user lands on via the magic link in the
 * password-recovery email (the link signs the user in just long enough for
 * this action to succeed). Returns ok on success; the client signs the user
 * out and redirects them to `/` to log in with the fresh password.
 */
export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Link expirado. Solicite uma nova recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: "Não foi possível atualizar a senha." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "E-mail inválido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { ok: false, error: "Não foi possível enviar o e-mail." };
  }

  return { ok: true };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import type { CreateWalletOutput } from "@/application/validation/wallet";

const walletPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bankId: z.string().uuid().optional().or(z.literal("")),
  accountType: z.enum(["PF", "PJ"]),
  balanceCents: z.number().int().nonnegative(),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createWallet(input: CreateWalletOutput): Promise<ActionResult> {
  const parsed = walletPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("wallets").insert({
    user_id: user.id,
    name: parsed.data.name,
    bank_id: parsed.data.bankId || null,
    account_type: parsed.data.accountType,
    balance_cents: parsed.data.balanceCents,
    is_default: false,
  });

  if (error) {
    return { ok: false, error: "Não foi possível criar a conta." };
  }

  revalidatePath("/carteira");
  revalidatePath("/dashboard");
  return { ok: true };
}

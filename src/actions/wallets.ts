"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import type { CreateWalletOutput, UpdateWalletOutput } from "@/application/validation/wallet";

const walletPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bankId: z.string().uuid().optional().or(z.literal("")),
  accountType: z.enum(["PF", "PJ"]),
  balanceCents: z.number().int().nonnegative(),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function revalidateAfter() {
  revalidatePath("/carteira");
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
}

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

  revalidateAfter();
  return { ok: true };
}

export async function updateWallet(id: string, input: UpdateWalletOutput): Promise<ActionResult> {
  const parsed = walletPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("wallets")
    .update({
      name: parsed.data.name,
      bank_id: parsed.data.bankId || null,
      account_type: parsed.data.accountType,
      balance_cents: parsed.data.balanceCents,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar a conta." };
  }

  revalidateAfter();
  return { ok: true };
}

export async function deleteWallet(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("wallets").delete().eq("id", id);
  if (error) {
    // Mensagem genérica cobre RLS (wallet padrão) e FK restrict (cartões/transações vinculados).
    return {
      ok: false,
      error:
        "Não foi possível excluir. Verifique se não há cartões ou transações vinculados, e se essa não é a conta padrão.",
    };
  }

  revalidateAfter();
  return { ok: true };
}

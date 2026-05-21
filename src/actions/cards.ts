"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import type { CreateCardOutput, UpdateCardOutput } from "@/application/validation/card";

const cardPayloadSchema = z.object({
  name: z.string().trim().min(2).max(60),
  walletId: z.string().uuid(),
  creditLimitCents: z.number().int().nonnegative(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function revalidateAfter(cardId?: string) {
  revalidatePath("/carteira");
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
  if (cardId) revalidatePath(`/fatura/${cardId}`);
}

export async function createCard(input: CreateCardOutput): Promise<ActionResult> {
  const parsed = cardPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("cards").insert({
    user_id: user.id,
    wallet_id: parsed.data.walletId,
    name: parsed.data.name,
    credit_limit_cents: parsed.data.creditLimitCents,
    color: parsed.data.color,
    closing_day: parsed.data.closingDay,
    due_day: parsed.data.dueDay,
  });

  if (error) {
    return { ok: false, error: "Não foi possível criar o cartão." };
  }

  revalidateAfter();
  return { ok: true };
}

export async function updateCard(id: string, input: UpdateCardOutput): Promise<ActionResult> {
  const parsed = cardPayloadSchema.safeParse(input);
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
    .from("cards")
    .update({
      wallet_id: parsed.data.walletId,
      name: parsed.data.name,
      credit_limit_cents: parsed.data.creditLimitCents,
      color: parsed.data.color,
      closing_day: parsed.data.closingDay,
      due_day: parsed.data.dueDay,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar o cartão." };
  }

  revalidateAfter(id);
  return { ok: true };
}

export async function deleteCard(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir o cartão. Verifique se há transações vinculadas.",
    };
  }

  revalidateAfter();
  return { ok: true };
}

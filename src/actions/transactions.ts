"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/supabase/server";
import { requireUser } from "@/lib/auth";
import { calculateSplit, InvalidSplitError } from "@/application/services/splitCalculator";
import type { CreateTransactionOutput } from "@/application/validation/transaction";

const transactionPayloadSchema = z.object({
  type: z.enum(["expense", "income"]),
  amountCents: z.number().int().nonnegative(),
  description: z.string().max(160).optional().or(z.literal("")),
  occurredAt: z.string().min(1),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("wallet"), id: z.string().uuid() }),
    z.object({ kind: z.literal("card"), id: z.string().uuid() }),
  ]),
  userIncludedInSplit: z.boolean(),
  participants: z.array(
    z.object({
      contactId: z.string().uuid(),
      customAmountCents: z.number().int().nonnegative().nullable(),
    }),
  ),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createTransaction(input: CreateTransactionOutput): Promise<ActionResult> {
  const parsed = transactionPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  if (data.amountCents === 0) {
    return { ok: false, error: "Informe um valor maior que zero." };
  }

  let split;
  try {
    split = calculateSplit({
      amountCents: data.amountCents,
      participants: data.participants,
      userIncludedInSplit: data.userIncludedInSplit,
    });
  } catch (error) {
    if (error instanceof InvalidSplitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  const user = await requireUser();
  const supabase = await createClient();

  const transactionRow = {
    user_id: user.id,
    wallet_id: data.source.kind === "wallet" ? data.source.id : null,
    card_id: data.source.kind === "card" ? data.source.id : null,
    category_id: data.categoryId || null,
    amount_cents: data.amountCents,
    description: data.description || "",
    occurred_at: data.occurredAt,
    type: data.type,
    split_mode: split.mode,
    user_included_in_split: data.userIncludedInSplit,
    user_share_cents: split.userShareCents,
  };

  const { data: insertedTransaction, error: insertError } = await supabase
    .from("transactions")
    .insert(transactionRow)
    .select("id")
    .single();

  if (insertError || !insertedTransaction) {
    return { ok: false, error: "Não foi possível salvar a transação." };
  }

  if (split.splits.length > 0) {
    const splitRows = split.splits.map((s) => ({
      user_id: user.id,
      transaction_id: insertedTransaction.id,
      contact_id: s.contactId,
      amount_cents: s.amountCents,
    }));

    const { error: splitsError } = await supabase.from("transaction_splits").insert(splitRows);
    if (splitsError) {
      await supabase.from("transactions").delete().eq("id", insertedTransaction.id);
      return { ok: false, error: "Não foi possível salvar o rateio." };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/carteira");
  redirect("/dashboard");
}

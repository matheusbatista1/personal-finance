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
  operation: z.enum(["card", "loan", "pix"]).optional().or(z.literal("")),
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

interface PreparedTransaction {
  payload: {
    user_id: string;
    wallet_id: string | null;
    card_id: string | null;
    category_id: string | null;
    amount_cents: number;
    description: string;
    occurred_at: string;
    type: "expense" | "income";
    operation: "card" | "loan" | "pix" | null;
    split_mode: "none" | "equal" | "custom";
    user_included_in_split: boolean;
    user_share_cents: number;
  };
  splits: Array<{ user_id: string; contact_id: string; amount_cents: number }>;
}

async function prepareTransaction(
  input: CreateTransactionOutput,
): Promise<{ ok: true; data: PreparedTransaction } | { ok: false; result: ActionResult }> {
  const parsed = transactionPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        error: "Dados inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }
  const data = parsed.data;

  if (data.amountCents === 0) {
    return { ok: false, result: { ok: false, error: "Informe um valor maior que zero." } };
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
      return { ok: false, result: { ok: false, error: error.message } };
    }
    throw error;
  }

  const user = await requireUser();

  return {
    ok: true,
    data: {
      payload: {
        user_id: user.id,
        wallet_id: data.source.kind === "wallet" ? data.source.id : null,
        card_id: data.source.kind === "card" ? data.source.id : null,
        category_id: data.categoryId || null,
        amount_cents: data.amountCents,
        description: data.description || "",
        occurred_at: data.occurredAt,
        type: data.type,
        operation: data.operation || null,
        split_mode: split.mode,
        user_included_in_split: data.userIncludedInSplit,
        user_share_cents: split.userShareCents,
      },
      splits: split.splits.map((s) => ({
        user_id: user.id,
        contact_id: s.contactId,
        amount_cents: s.amountCents,
      })),
    },
  };
}

function revalidateAfterMutation(cardId: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/carteira");
  if (cardId) revalidatePath(`/fatura/${cardId}`);
}

export async function createTransaction(input: CreateTransactionOutput): Promise<ActionResult> {
  const prepared = await prepareTransaction(input);
  if (!prepared.ok) return prepared.result;

  const supabase = await createClient();
  const { data: inserted, error: insertError } = await supabase
    .from("transactions")
    .insert(prepared.data.payload)
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { ok: false, error: "Não foi possível salvar a transação." };
  }

  if (prepared.data.splits.length > 0) {
    const rows = prepared.data.splits.map((s) => ({ ...s, transaction_id: inserted.id }));
    const { error: splitsError } = await supabase.from("transaction_splits").insert(rows);
    if (splitsError) {
      await supabase.from("transactions").delete().eq("id", inserted.id);
      return { ok: false, error: "Não foi possível salvar o rateio." };
    }
  }

  revalidateAfterMutation(prepared.data.payload.card_id);
  redirect("/dashboard");
}

export async function updateTransaction(
  id: string,
  input: CreateTransactionOutput,
): Promise<ActionResult> {
  const prepared = await prepareTransaction(input);
  if (!prepared.ok) return prepared.result;

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("transactions")
    .update(prepared.data.payload)
    .eq("id", id);

  if (updateError) {
    return { ok: false, error: "Não foi possível atualizar a transação." };
  }

  const { error: deleteSplitsError } = await supabase
    .from("transaction_splits")
    .delete()
    .eq("transaction_id", id);
  if (deleteSplitsError) {
    return { ok: false, error: "Não foi possível atualizar o rateio." };
  }

  if (prepared.data.splits.length > 0) {
    const rows = prepared.data.splits.map((s) => ({ ...s, transaction_id: id }));
    const { error: splitsError } = await supabase.from("transaction_splits").insert(rows);
    if (splitsError) {
      return { ok: false, error: "Não foi possível salvar o rateio." };
    }
  }

  revalidateAfterMutation(prepared.data.payload.card_id);
  redirect("/dashboard");
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("transactions")
    .select("card_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "Não foi possível excluir a transação." };
  }

  revalidateAfterMutation((existing?.card_id as string | null) ?? null);
  redirect("/dashboard");
}

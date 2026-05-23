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
  installmentTotal: z.number().int().min(1).max(36),
  userIncludedInSplit: z.boolean(),
  participants: z.array(
    z.object({
      contactId: z.string().uuid(),
      customAmountCents: z.number().int().nonnegative().nullable(),
    }),
  ),
  recurringMonthly: z.boolean().optional().default(false),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

type TransactionPayload = {
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
  installment_number: number;
  installment_total: number;
  installment_group_id: string | null;
  recurrence: "none" | "monthly";
  recurrence_group_id: string | null;
};

interface PreparedInstallment {
  payload: TransactionPayload;
  splits: Array<{
    user_id: string;
    contact_id: string;
    amount_cents: number;
    is_custom: boolean;
  }>;
}

interface PreparedTransaction {
  installments: PreparedInstallment[];
  primaryCardId: string | null;
}

/** Split `total` into `n` integer chunks summing back to `total`. Leftover cents land on chunk 0. */
function distributeCents(total: number, n: number): number[] {
  if (n <= 1) return [total];
  const base = Math.floor(total / n);
  const leftover = total - base * n;
  const out = Array(n).fill(base);
  out[0] += leftover;
  return out;
}

function shiftMonth(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const targetMonth0 = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth0 / 12);
  const wrappedMonth0 = ((targetMonth0 % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, wrappedMonth0 + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return `${targetYear}-${String(wrappedMonth0 + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
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

  // Parcelamento só faz sentido em cartão; pra wallet força 1 parcela.
  const installmentTotal = data.source.kind === "card" ? data.installmentTotal : 1;

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

  const amountSlices = distributeCents(data.amountCents, installmentTotal);
  const userShareSlices = distributeCents(split.userShareCents, installmentTotal);
  const customByContact = new Map<string, boolean>();
  for (const p of data.participants) {
    customByContact.set(p.contactId, p.customAmountCents != null && p.customAmountCents > 0);
  }
  const splitSlices = split.splits.map((s) => ({
    contactId: s.contactId,
    slices: distributeCents(s.amountCents, installmentTotal),
    isCustom: customByContact.get(s.contactId) ?? false,
  }));

  const installments: PreparedInstallment[] = [];
  const installmentGroupId = installmentTotal > 1 ? crypto.randomUUID() : null;
  // Only the first installment carries the recurrence flag — repeating a parceled
  // purchase would multiply N entries per month, which never matches user intent.
  const recurrence: "none" | "monthly" =
    data.recurringMonthly && installmentTotal === 1 ? "monthly" : "none";
  const recurrenceGroupId = recurrence === "monthly" ? crypto.randomUUID() : null;

  for (let i = 0; i < installmentTotal; i++) {
    const payload: TransactionPayload = {
      user_id: user.id,
      wallet_id: data.source.kind === "wallet" ? data.source.id : null,
      card_id: data.source.kind === "card" ? data.source.id : null,
      category_id: data.categoryId || null,
      amount_cents: amountSlices[i] ?? 0,
      description: data.description || "",
      occurred_at: shiftMonth(data.occurredAt, i),
      type: data.type,
      operation: data.operation || null,
      split_mode: split.mode,
      user_included_in_split: data.userIncludedInSplit,
      user_share_cents: userShareSlices[i] ?? 0,
      installment_number: i + 1,
      installment_total: installmentTotal,
      installment_group_id: installmentGroupId,
      recurrence: i === 0 ? recurrence : "none",
      recurrence_group_id: i === 0 ? recurrenceGroupId : null,
    };

    const splits = splitSlices
      .map((s) => ({
        user_id: user.id,
        contact_id: s.contactId,
        amount_cents: s.slices[i] ?? 0,
        is_custom: s.isCustom,
      }))
      .filter((row) => row.amount_cents > 0 || installmentTotal === 1);

    installments.push({ payload, splits });
  }

  return {
    ok: true,
    data: {
      installments,
      primaryCardId: data.source.kind === "card" ? data.source.id : null,
    },
  };
}

function revalidateAfterMutation(cardId: string | null) {
  revalidatePath("/");
  revalidatePath("/carteira");
  revalidatePath("/transacoes");
  if (cardId) revalidatePath(`/fatura/${cardId}`);
}

export async function createTransaction(input: CreateTransactionOutput): Promise<ActionResult> {
  const prepared = await prepareTransaction(input);
  if (!prepared.ok) return prepared.result;

  const supabase = await createClient();
  const insertedIds: string[] = [];

  for (const installment of prepared.data.installments) {
    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(installment.payload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      if (insertedIds.length > 0) {
        await supabase.from("transactions").delete().in("id", insertedIds);
      }
      return { ok: false, error: "Não foi possível salvar a transação." };
    }

    insertedIds.push(inserted.id);

    if (installment.splits.length > 0) {
      const rows = installment.splits.map((s) => ({ ...s, transaction_id: inserted.id }));
      const { error: splitsError } = await supabase.from("transaction_splits").insert(rows);
      if (splitsError) {
        await supabase.from("transactions").delete().in("id", insertedIds);
        return { ok: false, error: "Não foi possível salvar o rateio." };
      }
    }
  }

  revalidateAfterMutation(prepared.data.primaryCardId);
  redirect("/");
}

export async function updateTransaction(
  id: string,
  input: CreateTransactionOutput,
): Promise<ActionResult> {
  // Edição não muda número de parcelas — força installmentTotal=1 pra editar somente esta linha.
  const prepared = await prepareTransaction({ ...input, installmentTotal: 1 });
  if (!prepared.ok) return prepared.result;

  const installment = prepared.data.installments[0];
  if (!installment) return { ok: false, error: "Falha ao preparar edição." };

  const supabase = await createClient();

  // Preserva installment/recurrence originais — só atualiza demais campos.
  const {
    installment_number: _ignored1,
    installment_total: _ignored2,
    installment_group_id: _ignored3,
    recurrence: _ignored4,
    recurrence_group_id: _ignored5,
    ...mutablePayload
  } = installment.payload;

  const { error: updateError } = await supabase
    .from("transactions")
    .update(mutablePayload)
    .eq("id", id);

  if (updateError) {
    return { ok: false, error: "Não foi possível atualizar a transação." };
  }

  // Preserve "Arthur já pagou" status across edits: capture existing settled_at
  // per contact before deleting, then restore on re-insert.
  const { data: oldSplits } = await supabase
    .from("transaction_splits")
    .select("contact_id, settled_at")
    .eq("transaction_id", id);
  const settledByContact = new Map<string, string | null>(
    (oldSplits ?? []).map((s) => [s.contact_id as string, (s.settled_at as string | null) ?? null]),
  );

  const { error: deleteSplitsError } = await supabase
    .from("transaction_splits")
    .delete()
    .eq("transaction_id", id);
  if (deleteSplitsError) {
    return { ok: false, error: "Não foi possível atualizar o rateio." };
  }

  if (installment.splits.length > 0) {
    const rows = installment.splits.map((s) => ({
      ...s,
      transaction_id: id,
      settled_at: settledByContact.get(s.contact_id) ?? null,
    }));
    const { error: splitsError } = await supabase.from("transaction_splits").insert(rows);
    if (splitsError) {
      return { ok: false, error: "Não foi possível salvar o rateio." };
    }
  }

  revalidateAfterMutation(prepared.data.primaryCardId);
  redirect("/");
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
  redirect("/");
}

export async function deleteInstallmentGroup(transactionId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("transactions")
    .select("card_id, installment_group_id")
    .eq("id", transactionId)
    .maybeSingle();

  const groupId = (existing?.installment_group_id as string | null) ?? null;
  if (!groupId) {
    // Single transaction (no group) — just delete this one.
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
    if (error) return { ok: false, error: "Não foi possível excluir." };
  } else {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("installment_group_id", groupId);
    if (error) return { ok: false, error: "Não foi possível excluir o parcelamento." };
  }

  revalidateAfterMutation((existing?.card_id as string | null) ?? null);
  redirect("/");
}

export async function toggleSplitSettlement(splitId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("transaction_splits")
    .select("settled_at, transaction_id, transactions(card_id)")
    .eq("id", splitId)
    .maybeSingle();

  const settled_at = current?.settled_at ? null : new Date().toISOString();

  const { error } = await supabase
    .from("transaction_splits")
    .update({ settled_at })
    .eq("id", splitId);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar o status do rateio." };
  }

  const joined = current?.transactions as unknown as
    | { card_id: string | null }
    | { card_id: string | null }[]
    | null;
  const cardId = Array.isArray(joined) ? (joined[0]?.card_id ?? null) : (joined?.card_id ?? null);
  revalidateAfterMutation(cardId);
  return { ok: true };
}

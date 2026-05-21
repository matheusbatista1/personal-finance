import type { SupabaseClient } from "@supabase/supabase-js";

interface RecurringTemplateRow {
  id: string;
  recurrence_group_id: string;
  wallet_id: string | null;
  card_id: string | null;
  category_id: string | null;
  amount_cents: number | string;
  description: string;
  type: "expense" | "income";
  operation: "card" | "loan" | "pix" | null;
  split_mode: "none" | "equal" | "custom";
  user_included_in_split: boolean;
  user_share_cents: number | string;
  occurred_at: string;
  recurrence: "none" | "monthly";
}

interface SplitRow {
  contact_id: string;
  amount_cents: number | string;
  is_custom: boolean;
  settled_at: string | null;
}

/** Returns the first day (UTC) of the (year, month) at midnight ISO. */
function startOfMonthIso(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
}

function endOfMonthIso(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toISOString();
}

/** Shifts a YYYY-MM-DD by N months, clamping to last valid day. */
function shiftMonth(isoDate: string, months: number): string {
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month0 = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const targetYear = year + Math.floor(month0 / 12);
  const wrapped = ((month0 % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, wrapped + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(
    Date.UTC(targetYear, wrapped, safeDay, date.getUTCHours(), date.getUTCMinutes(), 0),
  ).toISOString();
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * For every active monthly-recurring transaction whose group has no instance in
 * `(year, month)`, clone it forward (each missing month between the latest
 * existing instance and the target). Splits are duplicated with settled_at=null.
 * Idempotent — safe to call on every page render.
 */
export async function materializeRecurring(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
): Promise<void> {
  const targetMonthStart = startOfMonthIso(year, month);
  const targetMonthEnd = endOfMonthIso(year, month);

  // Find groups that have at least one row with recurrence='monthly' and the
  // group itself has NO instance in the target month yet.
  const { data: candidates } = await supabase
    .from("transactions")
    .select(
      "id, recurrence_group_id, wallet_id, card_id, category_id, amount_cents, description, type, operation, split_mode, user_included_in_split, user_share_cents, occurred_at, recurrence",
    )
    .eq("user_id", userId)
    .eq("recurrence", "monthly")
    .not("recurrence_group_id", "is", null);

  const templates = (candidates ?? []) as unknown as RecurringTemplateRow[];
  if (templates.length === 0) return;

  for (const template of templates) {
    if (!template.recurrence_group_id) continue;

    // Skip if there's already an instance for this group within the target month.
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("recurrence_group_id", template.recurrence_group_id)
      .gte("occurred_at", targetMonthStart)
      .lt("occurred_at", targetMonthEnd)
      .limit(1);

    if ((existing ?? []).length > 0) continue;

    // Don't materialize backwards — only into months >= template's own month.
    const templateDate = new Date(template.occurred_at);
    const templateMonthStart = startOfMonthIso(
      templateDate.getUTCFullYear(),
      templateDate.getUTCMonth() + 1,
    );
    if (targetMonthStart <= templateMonthStart) continue;

    // Compute how many months between template and target so we can also fill gaps
    // (in case the user skipped opening some months in between).
    const monthDiff =
      (year - templateDate.getUTCFullYear()) * 12 + (month - 1 - templateDate.getUTCMonth());
    if (monthDiff <= 0) continue;

    // Load splits once.
    const { data: splitsData } = await supabase
      .from("transaction_splits")
      .select("contact_id, amount_cents, is_custom, settled_at")
      .eq("transaction_id", template.id);
    const splits = (splitsData ?? []) as unknown as SplitRow[];

    for (let i = 1; i <= monthDiff; i++) {
      const newOccurredAt = shiftMonth(template.occurred_at, i);

      // Check if instance already exists for this exact month (gap-fill safety).
      const yyyy = new Date(newOccurredAt).getUTCFullYear();
      const mm = new Date(newOccurredAt).getUTCMonth() + 1;
      const { data: alreadyThere } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("recurrence_group_id", template.recurrence_group_id)
        .gte("occurred_at", startOfMonthIso(yyyy, mm))
        .lt("occurred_at", endOfMonthIso(yyyy, mm))
        .limit(1);
      if ((alreadyThere ?? []).length > 0) continue;

      const { data: inserted, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          wallet_id: template.wallet_id,
          card_id: template.card_id,
          category_id: template.category_id,
          amount_cents: toNumber(template.amount_cents),
          description: template.description,
          occurred_at: newOccurredAt,
          type: template.type,
          operation: template.operation,
          split_mode: template.split_mode,
          user_included_in_split: template.user_included_in_split,
          user_share_cents: toNumber(template.user_share_cents),
          installment_number: 1,
          installment_total: 1,
          installment_group_id: null,
          // Clones are NOT templates themselves — only the original carries the flag.
          recurrence: "none",
          recurrence_group_id: template.recurrence_group_id,
        })
        .select("id")
        .single();

      if (insertError || !inserted) continue;

      if (splits.length > 0) {
        const rows = splits.map((s) => ({
          user_id: userId,
          transaction_id: inserted.id,
          contact_id: s.contact_id,
          amount_cents: toNumber(s.amount_cents),
          is_custom: s.is_custom,
          settled_at: null,
        }));
        await supabase.from("transaction_splits").insert(rows);
      }
    }
  }
}

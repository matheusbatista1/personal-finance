import type { SupabaseClient } from "@supabase/supabase-js";

interface WalletTxRow {
  wallet_id: string | null;
  type: "expense" | "income";
  amount_cents: number | string;
}

/**
 * Computes the effective net flow per wallet from all wallet-bound transactions.
 * Income adds, expense subtracts. Returns a Map keyed by wallet id; missing keys
 * mean "no transactions yet → net flow is zero".
 *
 * Callers add this to the wallet's stored `balance_cents` (the user-entered
 * initial balance) to get the running balance.
 */
export async function fetchWalletNetFlows(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("wallet_id, type, amount_cents")
    .not("wallet_id", "is", null);

  if (error || !data) {
    return new Map();
  }

  const rows = data as unknown as WalletTxRow[];
  const flows = new Map<string, number>();
  for (const row of rows) {
    if (!row.wallet_id) continue;
    const amount =
      typeof row.amount_cents === "number" ? row.amount_cents : Number(row.amount_cents);
    const delta = row.type === "income" ? amount : -amount;
    flows.set(row.wallet_id, (flows.get(row.wallet_id) ?? 0) + delta);
  }
  return flows;
}

export function effectiveBalance(initialCents: number, netFlow: number | undefined): number {
  return initialCents + (netFlow ?? 0);
}

interface CardTxRow {
  card_id: string | null;
  type: "expense" | "income";
  amount_cents: number | string;
}

/**
 * Card used-limit per card: expense charges add to used, income (refund) subtracts.
 * Available = creditLimit - usedLimit. Keys missing mean zero usage.
 */
export async function fetchCardUsedLimits(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("card_id, type, amount_cents")
    .not("card_id", "is", null);

  if (error || !data) return new Map();

  const rows = data as unknown as CardTxRow[];
  const used = new Map<string, number>();
  for (const row of rows) {
    if (!row.card_id) continue;
    const amount =
      typeof row.amount_cents === "number" ? row.amount_cents : Number(row.amount_cents);
    const delta = row.type === "expense" ? amount : -amount;
    used.set(row.card_id, (used.get(row.card_id) ?? 0) + delta);
  }
  return used;
}

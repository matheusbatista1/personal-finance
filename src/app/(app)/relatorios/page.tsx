import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { computeBillingWindow, formatReferenceLong } from "@/application/services/invoice";
import { currentCompetence, formatBRL, formatCompetence, parseCompetence } from "@/lib/format";
import { SpendingByCategory, type CategorySlice } from "@/components/reports/SpendingByCategory";
import { MonthlyTrend, type TrendPoint } from "@/components/reports/MonthlyTrend";
import {
  PerContactBreakdown,
  type ContactBreakdownRow,
} from "@/components/reports/PerContactBreakdown";
import { ExportControls } from "@/components/reports/ExportControls";

export const metadata = {
  title: "Relatórios — FinLux",
};

interface PageProps {
  searchParams: Promise<{ m?: string }>;
}

interface TxRow {
  id: string;
  type: "expense" | "income";
  amount_cents: number | string;
  user_share_cents: number | string;
  category_id: string | null;
  occurred_at: string;
  categories: { name: string; icon_name: string | null } | null;
}

interface SplitJoinRow {
  amount_cents: number | string;
  is_custom: boolean;
  contact_id: string;
  contacts: { name: string } | null;
  transactions: { occurred_at: string } | null;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function shortMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

function resolveCompetence(input?: string) {
  if (!input) return parseCompetence(currentCompetence());
  try {
    return parseCompetence(input);
  } catch {
    return parseCompetence(currentCompetence());
  }
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  await requireUser();
  const params = await searchParams;
  const { year, month } = resolveCompetence(params.m);
  const competence = `${year}-${String(month).padStart(2, "0")}`;
  const window = computeBillingWindow(year, month);

  const trendStart = shiftMonth(year, month, -5);
  const trendStartWindow = computeBillingWindow(trendStart.year, trendStart.month);

  const supabase = await createClient();

  const [monthTxRes, trendTxRes, splitsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, type, amount_cents, user_share_cents, category_id, occurred_at, categories(name, icon_name)",
      )
      .gte("occurred_at", window.startIso)
      .lt("occurred_at", window.endIso),
    supabase
      .from("transactions")
      .select("type, amount_cents, occurred_at")
      .gte("occurred_at", trendStartWindow.startIso)
      .lt("occurred_at", window.endIso),
    supabase
      .from("transaction_splits")
      .select(
        "amount_cents, is_custom, contact_id, contacts(name), transactions!inner(occurred_at)",
      )
      .gte("transactions.occurred_at", window.startIso)
      .lt("transactions.occurred_at", window.endIso),
  ]);

  const monthTransactions = (monthTxRes.data ?? []) as unknown as TxRow[];
  const splits = (splitsRes.data ?? []) as unknown as SplitJoinRow[];

  const expenses = monthTransactions.filter((t) => t.type === "expense");
  const expenseTotal = expenses.reduce((sum, t) => sum + toNumber(t.amount_cents), 0);

  const categoryMap = new Map<string, CategorySlice>();
  for (const tx of expenses) {
    const key = tx.category_id ?? "__none";
    const name = tx.categories?.name ?? "Sem categoria";
    const iconName = tx.categories?.icon_name ?? null;
    const existing = categoryMap.get(key);
    const amount = toNumber(tx.amount_cents);
    const share = toNumber(tx.user_share_cents);
    if (existing) {
      existing.amountCents += amount;
      existing.shareCents += share;
    } else {
      categoryMap.set(key, {
        categoryId: tx.category_id,
        name,
        iconName,
        amountCents: amount,
        shareCents: share,
      });
    }
  }
  const categorySlices = [...categoryMap.values()].sort((a, b) => b.amountCents - a.amountCents);

  const trendRows = (trendTxRes.data ?? []) as {
    type: "expense" | "income";
    amount_cents: number | string;
    occurred_at: string;
  }[];

  const trendBuckets = new Map<string, TrendPoint>();
  for (let i = 0; i < 6; i++) {
    const bucket = shiftMonth(trendStart.year, trendStart.month, i);
    const key = `${bucket.year}-${String(bucket.month).padStart(2, "0")}`;
    trendBuckets.set(key, {
      label: shortMonthLabel(bucket.year, bucket.month),
      competence: key,
      expenseCents: 0,
      incomeCents: 0,
    });
  }
  for (const row of trendRows) {
    const occurred = new Date(row.occurred_at);
    const key = `${occurred.getFullYear()}-${String(occurred.getMonth() + 1).padStart(2, "0")}`;
    const bucket = trendBuckets.get(key);
    if (!bucket) continue;
    const value = toNumber(row.amount_cents);
    if (row.type === "expense") bucket.expenseCents += value;
    else bucket.incomeCents += value;
  }
  const trendPoints = [...trendBuckets.values()];

  const contactMap = new Map<string, ContactBreakdownRow>();
  for (const split of splits) {
    const amount = toNumber(split.amount_cents);
    const existing = contactMap.get(split.contact_id);
    if (existing) {
      if (split.is_custom) existing.customCents += amount;
      else existing.equalCents += amount;
      existing.totalCents += amount;
    } else {
      contactMap.set(split.contact_id, {
        contactId: split.contact_id,
        name: split.contacts?.name ?? "Sem nome",
        equalCents: split.is_custom ? 0 : amount,
        customCents: split.is_custom ? amount : 0,
        totalCents: amount,
      });
    }
  }
  const contactRows = [...contactMap.values()].sort((a, b) => b.totalCents - a.totalCents);

  const userShareTotal = expenses.reduce((sum, t) => sum + toNumber(t.user_share_cents), 0);
  const incomeTotal = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + toNumber(t.amount_cents), 0);

  return (
    <>
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
            Insights
          </span>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            Relatórios
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">
            {formatReferenceLong(year, month)} · panorama do mês e tendência.
          </p>
        </div>
        <div className="gap-sm flex flex-wrap items-center">
          <ExportControls
            competence={competence}
            expenseTotalCents={expenseTotal}
            incomeTotalCents={incomeTotal}
            userShareTotalCents={userShareTotal}
            categorySlices={categorySlices}
            trendPoints={trendPoints}
            contactRows={contactRows}
          />
          <MonthSelector
            competence={competence}
            label={formatCompetence(year, month)}
            pathname="/relatorios"
          />
        </div>
      </header>

      <div className="space-y-lg">
        <section className="gap-md grid grid-cols-1 sm:grid-cols-3">
          <SummaryCard
            label="Gasto total"
            value={formatBRL(expenseTotal)}
            accent="error"
            hint={`Sua parte: ${formatBRL(userShareTotal)}`}
          />
          <SummaryCard label="Receitas" value={formatBRL(incomeTotal)} accent="tertiary" />
          <SummaryCard
            label="Saldo do mês"
            value={formatBRL(incomeTotal - expenseTotal)}
            accent={incomeTotal - expenseTotal >= 0 ? "tertiary" : "error"}
          />
        </section>

        <SpendingByCategory slices={categorySlices} totalCents={expenseTotal} />
        <MonthlyTrend points={trendPoints} />
        <PerContactBreakdown rows={contactRows} />
      </div>
    </>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  accent: "primary" | "tertiary" | "error";
  hint?: string;
}

function SummaryCard({ label, value, accent, hint }: SummaryCardProps) {
  const accentClass =
    accent === "tertiary" ? "text-tertiary" : accent === "error" ? "text-error" : "text-primary";
  return (
    <article className="glass-panel p-md rounded-xl">
      <p className="text-label-sm text-on-surface-variant mb-xs font-mono tracking-wider uppercase">
        {label}
      </p>
      <p className={`text-headline-md font-sans font-semibold ${accentClass}`}>{value}</p>
      {hint ? (
        <p className="text-label-sm text-on-surface-variant mt-xs font-mono">{hint}</p>
      ) : null}
    </article>
  );
}

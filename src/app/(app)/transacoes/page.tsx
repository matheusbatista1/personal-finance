import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { MonthSelector } from "@/components/layout/MonthSelector";
import {
  TransactionFilters,
  type OperationFilter,
  type TransactionFilter,
} from "@/components/transactions/TransactionFilters";
import {
  TransactionsList,
  type TransactionListRow,
} from "@/components/transactions/TransactionsList";
import { computeBillingWindow, formatReferenceLong } from "@/application/services/invoice";
import { currentCompetence, formatCompetence, parseCompetence } from "@/lib/format";

export const metadata = {
  title: "Transações — FinLux",
};

interface PageProps {
  searchParams: Promise<{
    m?: string;
    type?: string;
    op?: string;
    wallet?: string;
    card?: string;
    cat?: string;
    from?: string;
    to?: string;
  }>;
}

interface TransactionRow {
  id: string;
  type: "expense" | "income";
  description: string;
  amount_cents: number | string;
  user_share_cents: number | string;
  occurred_at: string;
  split_mode: "none" | "equal" | "custom";
  operation: "card" | "pix" | "loan" | null;
  wallet_id: string | null;
  card_id: string | null;
  category_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  categories: { name: string; icon_name: string | null } | null;
  wallets: { name: string } | null;
  cards: { name: string } | null;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function resolveCompetence(input?: string) {
  if (!input) return parseCompetence(currentCompetence());
  try {
    return parseCompetence(input);
  } catch {
    return parseCompetence(currentCompetence());
  }
}

function normalizeType(value?: string): TransactionFilter {
  if (value === "expense" || value === "income") return value;
  return "all";
}

function normalizeOperation(value?: string): OperationFilter {
  if (value === "card" || value === "pix" || value === "loan") return value;
  return "all";
}

function normalizeId(value?: string): string {
  return value && value !== "all" ? value : "";
}

function normalizeDate(value?: string): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export default async function TransacoesPage({ searchParams }: PageProps) {
  await requireUser();
  const params = await searchParams;
  const { year, month } = resolveCompetence(params.m);
  const typeFilter = normalizeType(params.type);
  const operationFilter = normalizeOperation(params.op);
  const walletFilter = normalizeId(params.wallet);
  const cardFilter = normalizeId(params.card);
  const categoryFilter = normalizeId(params.cat);
  const dateFrom = normalizeDate(params.from);
  const dateTo = normalizeDate(params.to);
  const competence = `${year}-${String(month).padStart(2, "0")}`;
  const window = computeBillingWindow(year, month);

  const supabase = await createClient();

  const [walletsRes, cardsRes, categoriesRes] = await Promise.all([
    supabase.from("wallets").select("id, name").order("name"),
    supabase.from("cards").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const walletOptions = (walletsRes.data ?? []).map((w) => ({ id: w.id, name: w.name }));
  const cardOptions = (cardsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }));
  const categoryOptions = (categoriesRes.data ?? []).map((c) => ({ id: c.id, name: c.name }));

  const lowerBoundIso = dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : window.startIso;
  const upperBoundIso = dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : window.endIso;

  let query = supabase
    .from("transactions")
    .select(
      "id, type, description, amount_cents, user_share_cents, occurred_at, split_mode, operation, wallet_id, card_id, category_id, installment_number, installment_total, categories(name, icon_name), wallets(name), cards(name)",
    )
    .gte("occurred_at", lowerBoundIso)
    .lt("occurred_at", upperBoundIso)
    .order("occurred_at", { ascending: false });

  if (typeFilter !== "all") query = query.eq("type", typeFilter);
  if (operationFilter !== "all") query = query.eq("operation", operationFilter);
  if (walletFilter) query = query.eq("wallet_id", walletFilter);
  if (cardFilter) query = query.eq("card_id", cardFilter);
  if (categoryFilter) query = query.eq("category_id", categoryFilter);

  const { data } = await query;
  const transactions = ((data ?? []) as unknown as TransactionRow[]) ?? [];

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + toNumber(t.amount_cents), 0);
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + toNumber(t.amount_cents), 0);
  const userShareTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + toNumber(t.user_share_cents), 0);

  const rows: TransactionListRow[] = transactions.map((tx) => {
    const sourceKind: "wallet" | "card" = tx.card_id ? "card" : "wallet";
    const sourceLabel =
      sourceKind === "card" ? (tx.cards?.name ?? "Cartão") : (tx.wallets?.name ?? "Conta");
    return {
      id: tx.id,
      type: tx.type,
      description: tx.description || "Sem descrição",
      occurredAt: new Date(tx.occurred_at),
      categoryLabel: tx.categories?.name ?? "Sem categoria",
      iconName: tx.categories?.icon_name ?? "Receipt",
      amountCents: toNumber(tx.amount_cents),
      userShareCents: toNumber(tx.user_share_cents),
      hasSplit: tx.split_mode !== "none",
      sourceKind,
      sourceLabel,
      operation: tx.operation,
      installmentNumber: tx.installment_number ?? 1,
      installmentTotal: tx.installment_total ?? 1,
    };
  });

  return (
    <>
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
            Histórico
          </span>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            Transações
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">
            {formatReferenceLong(year, month)} · {transactions.length}{" "}
            {transactions.length === 1 ? "lançamento" : "lançamentos"}
          </p>
        </div>
        <MonthSelector
          competence={competence}
          label={formatCompetence(year, month)}
          pathname="/transacoes"
        />
      </header>

      <div className="space-y-lg">
        <section className="gap-md grid grid-cols-1 sm:grid-cols-3">
          <SummaryCard
            label="Gasto total"
            valueCents={expenseTotal}
            accent="error"
            hint={`Sua parte: ${formatBRLcompact(userShareTotal)}`}
          />
          <SummaryCard label="Receitas" valueCents={incomeTotal} accent="tertiary" />
          <SummaryCard
            label="Saldo do mês"
            valueCents={incomeTotal - expenseTotal}
            accent={incomeTotal - expenseTotal >= 0 ? "tertiary" : "error"}
          />
        </section>

        <TransactionFilters
          competence={competence}
          activeType={typeFilter}
          activeOperation={operationFilter}
          activeWalletId={walletFilter}
          activeCardId={cardFilter}
          activeCategoryId={categoryFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          wallets={walletOptions}
          cards={cardOptions}
          categories={categoryOptions}
        />

        <TransactionsList rows={rows} />
      </div>
    </>
  );
}

function SummaryCard({
  label,
  valueCents,
  accent,
  hint,
}: {
  label: string;
  valueCents: number;
  accent: "primary" | "tertiary" | "error";
  hint?: string;
}) {
  const accentClass =
    accent === "tertiary" ? "text-tertiary" : accent === "error" ? "text-error" : "text-primary";
  return (
    <article className="glass-panel p-md rounded-xl">
      <p className="text-label-sm text-on-surface-variant mb-xs font-mono tracking-wider uppercase">
        {label}
      </p>
      <p className={`text-headline-md font-sans font-semibold ${accentClass}`}>
        {formatBRLcompact(valueCents)}
      </p>
      {hint ? (
        <p className="text-label-sm text-on-surface-variant mt-xs font-mono">{hint}</p>
      ) : null}
    </article>
  );
}

function formatBRLcompact(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

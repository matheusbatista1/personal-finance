import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { InvoiceHeader } from "@/components/invoices/InvoiceHeader";
import { MonthTabs } from "@/components/invoices/MonthTabs";
import {
  InvoiceTransactionsList,
  type InvoiceTransactionRow,
} from "@/components/invoices/InvoiceTransactionsList";
import {
  computeBillingWindow,
  computeClosingDate,
  computeDueDate,
  daysUntilDue,
  formatReferenceLong,
} from "@/application/services/invoice";
import { currentCompetence, parseCompetence } from "@/lib/format";

export const metadata = {
  title: "Fatura — FinLux",
};

interface InvoicePageProps {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ m?: string }>;
}

interface CardRow {
  id: string;
  name: string;
  color: string;
  credit_limit_cents: number | string;
  closing_day: number;
  due_day: number;
}

interface TransactionRow {
  id: string;
  description: string;
  amount_cents: number | string;
  user_share_cents: number | string;
  occurred_at: string;
  split_mode: "none" | "equal" | "custom";
  installment_number: number;
  installment_total: number;
  categories: { name: string; icon_name: string | null } | null;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function resolveReference(input?: string) {
  if (!input) {
    const { year, month } = parseCompetence(currentCompetence());
    return { year, month };
  }
  try {
    return parseCompetence(input);
  } catch {
    const { year, month } = parseCompetence(currentCompetence());
    return { year, month };
  }
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  await requireUser();
  const { cardId } = await params;
  const { m } = await searchParams;
  const { year, month } = resolveReference(m);
  const current = parseCompetence(currentCompetence());

  const supabase = await createClient();

  const { data: cardData } = await supabase
    .from("cards")
    .select("id, name, color, credit_limit_cents, closing_day, due_day")
    .eq("id", cardId)
    .maybeSingle();

  const card = cardData as CardRow | null;
  if (!card) notFound();

  const window = computeBillingWindow(year, month);
  const dueDate = computeDueDate(year, month, card.due_day);
  const closingDate = computeClosingDate(year, month, card.closing_day);
  const remainingDays = daysUntilDue(dueDate);

  const { data: txData } = await supabase
    .from("transactions")
    .select(
      "id, description, amount_cents, user_share_cents, occurred_at, split_mode, installment_number, installment_total, categories(name, icon_name)",
    )
    .eq("card_id", cardId)
    .eq("type", "expense")
    .gte("occurred_at", window.startIso)
    .lt("occurred_at", window.endIso)
    .order("occurred_at", { ascending: false });

  const transactions = ((txData ?? []) as unknown as TransactionRow[]) ?? [];

  const invoiceBalanceCents = transactions.reduce((sum, tx) => sum + toNumber(tx.amount_cents), 0);

  const rows: InvoiceTransactionRow[] = transactions.map((tx) => ({
    id: tx.id,
    description: tx.description || "Sem descrição",
    occurredAt: new Date(tx.occurred_at),
    categoryLabel: tx.categories?.name ?? "Sem categoria",
    iconName: tx.categories?.icon_name ?? "Receipt",
    amountCents: toNumber(tx.amount_cents),
    userShareCents: toNumber(tx.user_share_cents),
    hasSplit: tx.split_mode !== "none",
    installmentNumber: tx.installment_number,
    installmentTotal: tx.installment_total,
  }));

  return (
    <>
      <header className="mb-lg">
        <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
          Fatura · {formatReferenceLong(year, month)}
        </span>
        <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
          {card.name}
        </h1>
        <p className="text-body-md text-on-surface-variant mt-sm font-sans">
          Transações lançadas neste cartão dentro do mês de referência.
        </p>
      </header>

      <div className="space-y-lg">
        <InvoiceHeader
          cardName={card.name}
          cardColor={card.color}
          invoiceBalanceCents={invoiceBalanceCents}
          creditLimitCents={toNumber(card.credit_limit_cents)}
          dueDate={dueDate}
          closingDate={closingDate}
          daysUntilDue={remainingDays}
        />

        <section className="space-y-md">
          <MonthTabs
            cardId={cardId}
            activeYear={year}
            activeMonth={month}
            currentYear={current.year}
            currentMonth={current.month}
          />
          <InvoiceTransactionsList rows={rows} />
        </section>
      </div>
    </>
  );
}

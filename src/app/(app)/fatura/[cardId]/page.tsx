import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { InvoiceHeader } from "@/components/invoices/InvoiceHeader";
import { MonthTabs } from "@/components/invoices/MonthTabs";
import {
  InvoiceTransactionsList,
  type InvoiceTransactionRow,
} from "@/components/invoices/InvoiceTransactionsList";
import { EditCardDialog } from "@/components/wallets/EditCardDialog";
import type { WalletOption } from "@/components/wallets/AddCardDialog";
import type { CreateCardInput } from "@/application/validation/card";
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
  wallet_id: string;
}

interface TransactionRow {
  id: string;
  type: "expense" | "income";
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

  const [{ data: cardData }, { data: walletsData }, { data: allCardsData }] = await Promise.all([
    supabase
      .from("cards")
      .select("id, name, color, credit_limit_cents, closing_day, due_day, wallet_id")
      .eq("id", cardId)
      .maybeSingle(),
    supabase
      .from("wallets")
      .select("id, name, is_default")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, name")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  const card = cardData as CardRow | null;
  if (!card) notFound();

  const allCards = (allCardsData ?? []) as Array<{ id: string; name: string }>;
  const currentIdx = allCards.findIndex((c) => c.id === cardId);
  const prevCard = currentIdx > 0 ? (allCards[currentIdx - 1] ?? null) : null;
  const nextCard =
    currentIdx >= 0 && currentIdx < allCards.length - 1 ? (allCards[currentIdx + 1] ?? null) : null;
  const competenceQuery = m ? `?m=${m}` : "";

  const walletOptions: WalletOption[] = (
    (walletsData ?? []) as Array<{ id: string; name: string; is_default: boolean }>
  ).map((w) => ({ id: w.id, name: w.name, isDefault: w.is_default }));

  const cardInitialValues: CreateCardInput = {
    name: card.name,
    walletId: card.wallet_id,
    creditLimitCents: (toNumber(card.credit_limit_cents) / 100).toFixed(2).replace(".", ","),
    color: card.color,
    closingDay: String(card.closing_day),
    dueDay: String(card.due_day),
  };

  const window = computeBillingWindow(year, month);
  const dueDate = computeDueDate(year, month, card.due_day);
  const closingDate = computeClosingDate(year, month, card.closing_day);
  const remainingDays = daysUntilDue(dueDate);

  const { data: txData } = await supabase
    .from("transactions")
    .select(
      "id, type, description, amount_cents, user_share_cents, occurred_at, split_mode, installment_number, installment_total, categories(name, icon_name)",
    )
    .eq("card_id", cardId)
    .gte("occurred_at", window.startIso)
    .lt("occurred_at", window.endIso)
    .order("occurred_at", { ascending: false });

  const transactions = ((txData ?? []) as unknown as TransactionRow[]) ?? [];

  const invoiceBalanceCents = transactions.reduce((sum, tx) => {
    const amount = toNumber(tx.amount_cents);
    return sum + (tx.type === "income" ? -amount : amount);
  }, 0);

  const rows: InvoiceTransactionRow[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
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
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div className="gap-sm flex items-start">
          {prevCard ? (
            <Link
              href={`/fatura/${prevCard.id}${competenceQuery}`}
              aria-label={`Cartão anterior: ${prevCard.name}`}
              title={prevCard.name}
              className="text-on-surface-variant hover:text-primary hover:bg-primary-container/20 border-outline-variant/20 mt-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors"
            >
              <ChevronLeft size={20} aria-hidden />
            </Link>
          ) : (
            <span className="border-outline-variant/10 text-outline-variant/30 mt-1 flex h-10 w-10 items-center justify-center rounded-full border">
              <ChevronLeft size={20} aria-hidden />
            </span>
          )}
          <div>
            <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
              Fatura · {formatReferenceLong(year, month)}
            </span>
            <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
              {card.name}
            </h1>
            <p className="text-body-md text-on-surface-variant mt-sm font-sans">
              {currentIdx + 1} de {allCards.length} · transações deste cartão no mês.
            </p>
          </div>
          {nextCard ? (
            <Link
              href={`/fatura/${nextCard.id}${competenceQuery}`}
              aria-label={`Próximo cartão: ${nextCard.name}`}
              title={nextCard.name}
              className="text-on-surface-variant hover:text-primary hover:bg-primary-container/20 border-outline-variant/20 mt-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors"
            >
              <ChevronRight size={20} aria-hidden />
            </Link>
          ) : (
            <span className="border-outline-variant/10 text-outline-variant/30 mt-1 flex h-10 w-10 items-center justify-center rounded-full border">
              <ChevronRight size={20} aria-hidden />
            </span>
          )}
        </div>
        <EditCardDialog
          cardId={card.id}
          wallets={walletOptions}
          initialValues={cardInitialValues}
        />
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

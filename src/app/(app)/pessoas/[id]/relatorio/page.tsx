import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { formatBRL, currentCompetence, parseCompetence } from "@/lib/format";
import { PrintReportButton } from "@/components/reports/PrintReportButton";

export const metadata = {
  title: "Relatório por pessoa — FinLux",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}

interface SplitJoinRow {
  amount_cents: number | string;
  settled_at: string | null;
  transactions: {
    id: string;
    description: string;
    occurred_at: string;
    installment_number: number | null;
    installment_total: number | null;
    type: "expense" | "income";
  } | null;
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

function monthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDayMonth(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

export default async function PersonReportPage({ params, searchParams }: PageProps) {
  await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const { year, month } = resolveCompetence(sp.m);

  const supabase = await createClient();

  const [contactRes, splitsRes] = await Promise.all([
    supabase.from("contacts").select("id, name, email, color").eq("id", id).maybeSingle(),
    supabase
      .from("transaction_splits")
      .select(
        "amount_cents, settled_at, transactions!inner(id, description, occurred_at, installment_number, installment_total, type)",
      )
      .eq("contact_id", id),
  ]);

  const contact = contactRes.data;
  if (!contact) notFound();

  const splits = (splitsRes.data ?? []) as unknown as SplitJoinRow[];

  // Group by month/year of the transaction occurred_at; only keep current month and forward.
  const startTime = new Date(Date.UTC(year, month - 1, 1)).getTime();

  const byMonth = new Map<
    string,
    {
      year: number;
      month: number;
      label: string;
      totalCents: number;
      pendingCents: number;
      transactions: {
        id: string;
        date: string;
        description: string;
        amountCents: number;
        installmentLabel: string | null;
        settled: boolean;
      }[];
    }
  >();

  for (const split of splits) {
    const tx = split.transactions;
    if (!tx) continue;
    const occurred = new Date(tx.occurred_at);
    if (occurred.getTime() < startTime) continue;
    const ty = occurred.getFullYear();
    const tm = occurred.getMonth() + 1;
    const key = `${ty}-${String(tm).padStart(2, "0")}`;
    const amount = toNumber(split.amount_cents);
    const settled = Boolean(split.settled_at);
    const bucket = byMonth.get(key) ?? {
      year: ty,
      month: tm,
      label: monthLabel(ty, tm),
      totalCents: 0,
      pendingCents: 0,
      transactions: [],
    };
    bucket.totalCents += amount;
    if (!settled) bucket.pendingCents += amount;
    bucket.transactions.push({
      id: tx.id,
      date: formatDayMonth(tx.occurred_at),
      description: tx.description || "Sem descrição",
      amountCents: amount,
      installmentLabel:
        (tx.installment_total ?? 1) > 1 ? `${tx.installment_number}/${tx.installment_total}` : null,
      settled,
    });
    byMonth.set(key, bucket);
  }

  const sortedMonths = [...byMonth.values()].sort((a, b) => a.year - b.year || a.month - b.month);

  const grandTotal = sortedMonths.reduce((sum, m) => sum + m.totalCents, 0);
  const grandPending = sortedMonths.reduce((sum, m) => sum + m.pendingCents, 0);

  return (
    <>
      <header className="mb-lg gap-md flex items-center justify-between">
        <div>
          <Link
            href="/pessoas"
            className="text-label-sm text-primary gap-xs no-print mb-2 flex cursor-pointer items-center font-mono uppercase"
          >
            <ArrowLeft size={14} aria-hidden />
            Voltar
          </Link>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            {contact.name}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">
            Relatório a partir de {monthLabel(year, month)} (mês atual + parcelas futuras).
          </p>
        </div>
        <PrintReportButton />
      </header>

      <div className="space-y-lg">
        <section className="gap-md grid grid-cols-1 sm:grid-cols-2">
          <div className="glass-panel p-md rounded-xl">
            <p className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
              Total previsto
            </p>
            <p className="text-headline-md text-primary font-sans font-semibold">
              {formatBRL(grandTotal)}
            </p>
          </div>
          <div className="glass-panel p-md rounded-xl">
            <p className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
              Pendente
            </p>
            <p className="text-headline-md text-error font-sans font-semibold">
              {formatBRL(grandPending)}
            </p>
          </div>
        </section>

        {sortedMonths.length === 0 ? (
          <section className="glass-panel p-md md:p-lg rounded-2xl">
            <p className="text-body-md text-on-surface-variant font-sans">
              Nenhuma transação a partir de {monthLabel(year, month)}.
            </p>
          </section>
        ) : null}

        {sortedMonths.map((bucket) => (
          <section
            key={`${bucket.year}-${bucket.month}`}
            className="glass-panel p-md md:p-lg rounded-2xl"
          >
            <header className="mb-md flex items-center justify-between">
              <h3 className="text-headline-md text-on-surface font-sans font-semibold">
                {bucket.label}
              </h3>
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant font-mono">
                  Total {formatBRL(bucket.totalCents)}
                </p>
                <p className="text-label-sm text-error font-mono">
                  Pendente {formatBRL(bucket.pendingCents)}
                </p>
              </div>
            </header>

            <ul className="space-y-base">
              {bucket.transactions.map((tx) => (
                <li
                  key={`${tx.id}-${bucket.year}-${bucket.month}`}
                  className="border-outline-variant/10 pb-base flex items-center justify-between border-b last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-body-md text-on-surface font-sans">
                      {tx.description}
                      {tx.installmentLabel ? (
                        <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                          {tx.installmentLabel}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-label-sm text-on-surface-variant font-mono">
                      {tx.date} · {tx.settled ? "Pago" : "Pendente"}
                    </p>
                  </div>
                  <span
                    className={`text-label-md font-mono ${tx.settled ? "text-on-surface-variant line-through" : "text-on-surface"}`}
                  >
                    {formatBRL(tx.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

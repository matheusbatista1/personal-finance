import { CreditCard, TriangleAlert, Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InvoiceHeaderProps {
  cardName: string;
  cardColor: string;
  invoiceBalanceCents: number;
  creditLimitCents: number;
  dueDate: Date;
  closingDate: Date;
  daysUntilDue: number;
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function InvoiceHeader({
  cardName,
  cardColor,
  invoiceBalanceCents,
  creditLimitCents,
  dueDate,
  closingDate,
  daysUntilDue,
}: InvoiceHeaderProps) {
  const availableCents = Math.max(0, creditLimitCents - invoiceBalanceCents);
  const utilizationPct =
    creditLimitCents > 0
      ? Math.min(100, Math.round((invoiceBalanceCents / creditLimitCents) * 100))
      : 0;

  const overdue = daysUntilDue < 0;
  const dueLabel = overdue
    ? `Vencida há ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? "dia" : "dias"}`
    : daysUntilDue === 0
      ? "Vence hoje"
      : `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? "dia" : "dias"} (${formatDay(dueDate)})`;

  return (
    <section className="glass-panel group p-md md:p-xl relative overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110"
        style={{
          background: `color-mix(in srgb, ${cardColor} 25%, transparent)`,
        }}
      />
      <div className="gap-xl relative z-10 grid grid-cols-1 md:grid-cols-2">
        <div>
          <div className="mb-lg gap-sm flex items-center">
            <div
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `color-mix(in srgb, ${cardColor} 25%, transparent)`,
                color: cardColor,
              }}
            >
              <CreditCard size={20} aria-hidden />
            </div>
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">{cardName}</h2>
          </div>

          <div className="space-y-sm mb-lg">
            <p className="text-label-sm text-on-surface-variant font-mono tracking-wider uppercase">
              Fatura atual
            </p>
            <p className="text-display-lg text-on-surface font-sans font-bold tracking-tight">
              {formatBRL(invoiceBalanceCents)}
            </p>
            <div className="mt-xs gap-sm flex items-center">
              {overdue ? (
                <TriangleAlert size={14} className="text-error" aria-hidden />
              ) : daysUntilDue <= 5 ? (
                <TriangleAlert size={14} className="text-tertiary" aria-hidden />
              ) : (
                <Sparkles size={14} className="text-primary" aria-hidden />
              )}
              <p
                className={cn(
                  "text-label-sm font-mono",
                  overdue
                    ? "text-error"
                    : daysUntilDue <= 5
                      ? "text-tertiary"
                      : "text-on-surface-variant",
                )}
              >
                {dueLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Em breve"
            className="primary-gradient-btn px-lg py-sm text-label-md rounded-full font-sans font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Pagar fatura
          </button>
        </div>

        <div className="space-y-md flex flex-col justify-end">
          <div className="mb-xs flex items-end justify-between">
            <div>
              <p className="text-label-sm text-on-surface-variant font-mono">Crédito disponível</p>
              <p className="text-headline-md text-primary font-sans font-semibold">
                {formatBRL(availableCents)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-label-sm text-on-surface-variant font-mono">Limite total</p>
              <p className="text-body-lg text-on-surface font-sans font-medium">
                {formatBRL(creditLimitCents)}
              </p>
            </div>
          </div>
          <div
            className="bg-surface-container-high h-2 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={utilizationPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Utilização do limite"
          >
            <div
              className="bg-primary-gradient h-full rounded-full"
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-label-sm text-on-surface-variant font-mono">
              Fechamento {formatDay(closingDate)}
            </p>
            <p className="text-label-sm text-on-surface-variant text-right font-mono">
              {utilizationPct}% usado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

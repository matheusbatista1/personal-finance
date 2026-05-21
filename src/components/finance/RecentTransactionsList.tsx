import Link from "next/link";
import type { RecentTransactionRow } from "@/application/dto/MonthlyDashboardDTO";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RecentTransactionsListProps {
  rows: RecentTransactionRow[];
}

const badgeTone: Record<RecentTransactionRow["badge"]["tone"], string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  muted: "text-on-surface-variant",
};

const participantColor: Record<string, string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
};

export function RecentTransactionsList({ rows }: RecentTransactionsListProps) {
  return (
    <section className="gap-md flex flex-col">
      <h3 className="px-xs text-headline-md text-on-surface font-sans font-semibold">
        Transações Recentes
      </h3>
      <div className="glass-panel flex flex-col overflow-hidden rounded-xl">
        {rows.map((row, idx) => (
          <Link
            key={row.id}
            href={`/gastos/${row.id}/editar`}
            className={cn(
              "group p-sm hover:bg-surface-variant/30 md:p-md focus-visible:ring-primary/50 flex cursor-pointer items-center justify-between transition-colors focus-visible:ring-2 focus-visible:outline-none",
              idx < rows.length - 1 && "border-outline-variant/10 border-b",
            )}
          >
            <div className="gap-sm md:gap-md flex items-center">
              <div className="bg-surface-container-high text-on-surface-variant group-hover:text-primary flex h-12 w-12 items-center justify-center rounded-full transition-colors">
                <TransactionIcon name={row.iconName} />
              </div>
              <div>
                <div className="text-body-md text-on-surface font-sans font-medium">
                  {row.description}
                </div>
                <div className="text-label-sm text-on-surface-variant font-mono">
                  {row.categoryLabel} • {row.whenLabel}
                </div>
              </div>
            </div>
            <div className="gap-sm flex items-center">
              {row.participants.length > 0 ? (
                <div className="mr-sm hidden -space-x-2 md:flex">
                  {row.participants.map((p, i) => (
                    <span
                      key={`${row.id}-${p.initial}-${i}`}
                      className={cn(
                        "border-surface bg-surface-bright flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] font-bold",
                        participantColor[p.colorRole] ?? "text-on-surface",
                      )}
                    >
                      {p.initial}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="text-right">
                <div
                  className={cn(
                    "text-body-md font-sans font-semibold",
                    row.type === "income" ? "text-tertiary" : "text-on-surface",
                  )}
                >
                  {row.type === "income" ? "+" : ""}
                  {formatBRL(row.amountCents)}
                </div>
                <div className={cn("text-label-sm font-mono", badgeTone[row.badge.tone])}>
                  {row.badge.text}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/transacoes"
        className="px-sm py-xs text-label-md text-primary hover:bg-primary/10 hover:text-on-primary-container cursor-pointer self-center rounded-full font-mono transition-colors"
      >
        Ver todas as transações
      </Link>
    </section>
  );
}

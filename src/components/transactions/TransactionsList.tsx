import Link from "next/link";
import { Receipt, Wallet, CreditCard } from "lucide-react";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { formatBRL } from "@/lib/format";
import { formatDayMonth } from "@/application/services/invoice";
import { cn } from "@/lib/utils";

export interface TransactionListRow {
  id: string;
  type: "expense" | "income";
  description: string;
  occurredAt: Date;
  categoryLabel: string;
  iconName: string;
  amountCents: number;
  userShareCents: number;
  hasSplit: boolean;
  sourceKind: "wallet" | "card";
  sourceLabel: string;
  operation: "card" | "pix" | "loan" | null;
  installmentNumber: number;
  installmentTotal: number;
}

interface Props {
  rows: TransactionListRow[];
}

const OPERATION_LABEL: Record<NonNullable<TransactionListRow["operation"]>, string> = {
  card: "Cartão",
  pix: "Pix",
  loan: "Empréstimo",
};

export function TransactionsList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="glass-panel p-lg gap-sm flex flex-col items-center justify-center rounded-2xl text-center">
        <div className="bg-primary-container/20 text-primary mb-xs flex h-14 w-14 items-center justify-center rounded-2xl">
          <Receipt size={22} aria-hidden />
        </div>
        <p className="text-body-lg text-on-surface font-sans font-semibold">
          Nenhuma transação encontrada
        </p>
        <p className="text-body-md text-on-surface-variant max-w-[28rem] font-sans">
          Use o botão <span className="text-primary font-semibold">+</span> no topo pra registrar um
          novo lançamento, ou ajuste os filtros acima.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-xs">
      {rows.map((row) => {
        const SourceIcon = row.sourceKind === "card" ? CreditCard : Wallet;
        return (
          <li key={row.id}>
            <Link
              href={`/gastos/${row.id}/editar`}
              className="glass-panel group p-md gap-md hover:bg-surface-variant/20 focus-visible:ring-primary/50 flex cursor-pointer items-center justify-between rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="gap-md flex items-center">
                <div className="bg-surface-container text-on-surface-variant group-hover:text-primary group-hover:bg-primary-container/10 flex h-12 w-12 items-center justify-center rounded-full transition-colors">
                  <TransactionIcon name={row.iconName} />
                </div>
                <div>
                  <h3 className="text-body-md text-on-surface font-sans font-medium">
                    {row.description}
                    {row.installmentTotal > 1 ? (
                      <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                        {row.installmentNumber}/{row.installmentTotal}
                      </span>
                    ) : null}
                  </h3>
                  <div className="mt-xs gap-sm flex flex-wrap items-center">
                    <p className="text-label-sm text-on-surface-variant font-mono">
                      {formatDayMonth(row.occurredAt)} • {row.categoryLabel}
                    </p>
                    <span className="text-label-sm text-on-surface-variant gap-xs flex items-center font-mono">
                      <SourceIcon size={12} aria-hidden />
                      {row.sourceLabel}
                    </span>
                    {row.operation ? (
                      <span className="bg-surface-container-high text-tertiary rounded-full px-2 py-0.5 font-mono text-[10px]">
                        {OPERATION_LABEL[row.operation]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-body-lg font-sans font-semibold",
                    row.type === "income" ? "text-tertiary" : "text-on-surface",
                  )}
                >
                  {row.type === "income" ? "+" : "-"}
                  {formatBRL(row.amountCents)}
                </p>
                {row.hasSplit && row.type === "expense" ? (
                  <p className="text-label-sm text-primary font-mono">
                    Sua parte: {formatBRL(row.userShareCents)}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

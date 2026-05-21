import Link from "next/link";
import { Receipt } from "lucide-react";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { formatBRL } from "@/lib/format";
import { formatDayMonth } from "@/application/services/invoice";

export interface InvoiceTransactionRow {
  id: string;
  description: string;
  occurredAt: Date;
  categoryLabel: string;
  iconName: string;
  amountCents: number;
  userShareCents: number;
  hasSplit: boolean;
  installmentNumber: number;
  installmentTotal: number;
}

interface Props {
  rows: InvoiceTransactionRow[];
}

export function InvoiceTransactionsList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="glass-panel p-lg gap-sm flex flex-col items-center justify-center rounded-2xl text-center">
        <div className="bg-primary-container/20 text-primary mb-xs flex h-14 w-14 items-center justify-center rounded-2xl">
          <Receipt size={22} aria-hidden />
        </div>
        <p className="text-body-lg text-on-surface font-sans font-semibold">
          Sem transações neste mês
        </p>
        <p className="text-body-md text-on-surface-variant max-w-[28rem] font-sans">
          Quando você lançar um gasto neste cartão, ele aparece aqui na fatura do mês.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-xs">
      {rows.map((row) => (
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
                </h3>
                <div className="mt-xs gap-sm flex items-center">
                  <p className="text-label-sm text-on-surface-variant font-mono">
                    {formatDayMonth(row.occurredAt)} • {row.categoryLabel}
                  </p>
                  {row.installmentTotal > 1 ? (
                    <span className="bg-surface-container-high text-tertiary rounded-full px-2 py-0.5 font-mono text-[10px]">
                      Parcela {row.installmentNumber}/{row.installmentTotal}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-body-lg text-on-surface font-sans font-semibold">
                {formatBRL(row.amountCents)}
              </p>
              {row.hasSplit ? (
                <p className="text-label-sm text-primary font-mono">
                  Sua parte: {formatBRL(row.userShareCents)}
                </p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

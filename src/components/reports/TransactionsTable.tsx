import { formatBRL } from "@/lib/format";

export interface ReportTransactionRow {
  id: string;
  date: string;
  description: string;
  category: string;
  sourceLabel: string;
  type: "expense" | "income";
  amountCents: number;
  userShareCents: number;
  installmentLabel: string | null;
}

interface Props {
  rows: ReportTransactionRow[];
}

export function TransactionsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <section className="glass-panel p-md md:p-lg rounded-2xl">
        <header className="mb-md">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">
            Todas as transações
          </h3>
        </header>
        <p className="text-body-md text-on-surface-variant font-sans">
          Nenhuma transação neste período.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-panel p-md md:p-lg rounded-2xl">
      <header className="mb-md">
        <h3 className="text-headline-md text-on-surface font-sans font-semibold">
          Todas as transações
        </h3>
        <p className="text-label-sm text-on-surface-variant font-mono">
          {rows.length} {rows.length === 1 ? "lançamento" : "lançamentos"} · ordem cronológica.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem]">
          <thead>
            <tr className="text-label-sm text-on-surface-variant font-mono uppercase">
              <th className="py-sm pr-md text-left">Data</th>
              <th className="py-sm pr-md text-left">Descrição</th>
              <th className="py-sm pr-md text-left">Categoria</th>
              <th className="py-sm pr-md text-left">Origem</th>
              <th className="py-sm pr-md text-right">Valor</th>
              <th className="py-sm text-right">Sua parte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-outline-variant/10 border-t">
                <td className="py-sm pr-md font-mono">{row.date}</td>
                <td className="py-sm pr-md">
                  <span className="text-body-md text-on-surface font-sans">{row.description}</span>
                  {row.installmentLabel ? (
                    <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                      {row.installmentLabel}
                    </span>
                  ) : null}
                </td>
                <td className="py-sm pr-md font-sans">{row.category}</td>
                <td className="py-sm pr-md font-mono text-sm">{row.sourceLabel}</td>
                <td
                  className={`py-sm pr-md text-right font-mono ${row.type === "income" ? "text-tertiary" : "text-on-surface"}`}
                >
                  {row.type === "income" ? "+" : "-"}
                  {formatBRL(row.amountCents)}
                </td>
                <td className="py-sm text-right font-mono">
                  {row.type === "expense" ? formatBRL(row.userShareCents) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

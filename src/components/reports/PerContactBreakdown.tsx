import { formatBRL } from "@/lib/format";

export interface ContactBreakdownRow {
  contactId: string;
  name: string;
  equalCents: number;
  customCents: number;
  totalCents: number;
}

interface Props {
  rows: ContactBreakdownRow[];
}

export function PerContactBreakdown({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <section className="glass-panel p-md md:p-lg rounded-2xl">
        <header className="mb-md">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">Por pessoa</h3>
          <p className="text-label-sm text-on-surface-variant font-mono">
            Quem deve quanto neste mês.
          </p>
        </header>
        <p className="text-body-md text-on-surface-variant font-sans">
          Nenhum rateio registrado neste período.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-panel p-md md:p-lg rounded-2xl">
      <header className="mb-md">
        <h3 className="text-headline-md text-on-surface font-sans font-semibold">Por pessoa</h3>
        <p className="text-label-sm text-on-surface-variant font-mono">
          Decomposição entre rateio equal e valores diretos.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem]">
          <thead>
            <tr className="text-label-sm text-on-surface-variant font-mono uppercase">
              <th className="py-sm pr-md text-left">Pessoa</th>
              <th className="py-sm pr-md text-right">Dividido</th>
              <th className="py-sm pr-md text-right">Direto</th>
              <th className="py-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.contactId} className="border-outline-variant/10 border-t">
                <td className="py-sm pr-md">
                  <span className="text-body-md text-on-surface font-sans font-medium">
                    {row.name}
                  </span>
                </td>
                <td className="py-sm pr-md text-right font-mono">{formatBRL(row.equalCents)}</td>
                <td className="py-sm pr-md text-right font-mono">{formatBRL(row.customCents)}</td>
                <td className="py-sm text-right">
                  <span className="text-primary font-mono font-semibold">
                    {formatBRL(row.totalCents)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

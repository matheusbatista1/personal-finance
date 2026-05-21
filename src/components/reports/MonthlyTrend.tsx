import { formatBRL } from "@/lib/format";

export interface TrendPoint {
  label: string;
  competence: string;
  expenseCents: number;
  incomeCents: number;
}

interface Props {
  points: TrendPoint[];
}

export function MonthlyTrend({ points }: Props) {
  const maxCents = points.reduce((max, p) => Math.max(max, p.expenseCents, p.incomeCents), 0);
  const safeMax = maxCents === 0 ? 1 : maxCents;

  return (
    <section className="glass-panel p-md md:p-lg rounded-2xl">
      <header className="mb-md flex items-end justify-between">
        <div>
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">
            Tendência mensal
          </h3>
          <p className="text-label-sm text-on-surface-variant font-mono">
            Últimos 6 meses · despesas vs. receitas.
          </p>
        </div>
        <div className="gap-sm flex">
          <Legend swatch="bg-error" label="Despesas" />
          <Legend swatch="bg-tertiary" label="Receitas" />
        </div>
      </header>

      <div className="gap-sm flex h-56 items-end">
        {points.map((p) => {
          const expensePct = (p.expenseCents / safeMax) * 100;
          const incomePct = (p.incomeCents / safeMax) * 100;
          return (
            <div
              key={p.competence}
              className="gap-xs flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="gap-xs flex h-full w-full items-end justify-center">
                <div
                  className="bg-error/70 hover:bg-error w-3 rounded-t transition-all"
                  style={{ height: `${expensePct}%` }}
                  title={`Despesas: ${formatBRL(p.expenseCents)}`}
                  aria-label={`Despesas em ${p.label}: ${formatBRL(p.expenseCents)}`}
                />
                <div
                  className="bg-tertiary/70 hover:bg-tertiary w-3 rounded-t transition-all"
                  style={{ height: `${incomePct}%` }}
                  title={`Receitas: ${formatBRL(p.incomeCents)}`}
                  aria-label={`Receitas em ${p.label}: ${formatBRL(p.incomeCents)}`}
                />
              </div>
              <span className="text-label-sm text-on-surface-variant font-mono">{p.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="gap-xs flex items-center">
      <span aria-hidden className={`inline-block h-2 w-3 rounded ${swatch}`} />
      <span className="text-label-sm text-on-surface-variant font-mono">{label}</span>
    </div>
  );
}

import { ArrowDownLeft, Landmark } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface BalanceCardsProps {
  available: {
    cents: number;
    deltaPct: number;
  };
  receivable: {
    cents: number;
    progress: number;
  };
}

export function BalanceCards({ available, receivable }: BalanceCardsProps) {
  const progressPct = Math.round(Math.min(Math.max(receivable.progress, 0), 1) * 100);

  return (
    <div className="gap-md grid grid-cols-1 md:grid-cols-2">
      <article className="glass-panel group p-md hover:shadow-primary/10 relative flex h-48 flex-col justify-between overflow-hidden rounded-xl transition-all duration-300 hover:shadow-2xl">
        <div className="bg-secondary-container/20 group-hover:bg-primary-container/30 absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl transition-colors duration-500" />
        <div className="z-10 flex items-center justify-between">
          <span className="gap-xs text-label-md text-on-surface-variant flex items-center font-mono">
            <Landmark size={18} aria-hidden />
            Saldo Disponível
          </span>
        </div>
        <div className="z-10">
          <div className="text-headline-lg text-on-surface font-sans font-bold">
            {formatBRL(available.cents)}
          </div>
          <div className="mt-xs text-label-sm text-secondary font-mono">
            {available.deltaPct >= 0 ? "+" : ""}
            {available.deltaPct.toFixed(1)}% vs mês anterior
          </div>
        </div>
      </article>

      <article className="glass-panel group p-md hover:shadow-primary/10 relative flex h-48 flex-col justify-between overflow-hidden rounded-xl transition-all duration-300 hover:shadow-2xl">
        <div className="bg-tertiary-container/20 group-hover:bg-tertiary/20 absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-3xl transition-colors duration-500" />
        <div className="z-10 flex items-center justify-between">
          <span className="gap-xs text-label-md text-on-surface-variant flex items-center font-mono">
            <ArrowDownLeft size={18} aria-hidden />
            Total a Receber
          </span>
        </div>
        <div className="z-10">
          <div className="text-headline-lg text-on-surface font-sans font-bold">
            {formatBRL(receivable.cents)}
          </div>
          <div
            className="mt-sm bg-surface-container-high h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Progresso a receber"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-primary-gradient h-1 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

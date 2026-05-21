import { formatBRL } from "@/lib/format";

interface MonthlyHeroCardProps {
  totalCents: number;
}

export function MonthlyHeroCard({ totalCents }: MonthlyHeroCardProps) {
  return (
    <section className="glass-panel group p-lg relative flex flex-col items-center overflow-hidden rounded-xl text-center">
      <div className="bg-primary/5 absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="mb-xs text-label-md text-on-surface-variant relative z-10 font-mono tracking-widest uppercase">
        Gasto Total do Mês (EU)
      </span>
      <div className="text-gradient text-display-lg relative z-10 font-sans font-bold">
        {formatBRL(totalCents)}
      </div>
    </section>
  );
}

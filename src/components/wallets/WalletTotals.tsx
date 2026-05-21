import { Landmark, CreditCard } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface WalletTotalsProps {
  consolidatedCents: number;
  totalCreditLimitCents: number;
}

export function WalletTotals({ consolidatedCents, totalCreditLimitCents }: WalletTotalsProps) {
  return (
    <div className="gap-md grid grid-cols-1 md:grid-cols-2">
      <TotalCard
        label="Total Consolidado"
        value={consolidatedCents}
        Icon={Landmark}
        accentClass="text-emerald-400"
      />
      <TotalCard
        label="Limite Total Cartões"
        value={totalCreditLimitCents}
        Icon={CreditCard}
        accentClass="text-primary"
      />
    </div>
  );
}

function TotalCard({
  label,
  value,
  Icon,
  accentClass,
}: {
  label: string;
  value: number;
  Icon: typeof Landmark;
  accentClass: string;
}) {
  return (
    <article className="glass-panel p-md gap-sm flex items-center rounded-xl">
      <div className="bg-surface-container-high flex h-12 w-12 items-center justify-center rounded-xl">
        <Icon size={20} aria-hidden className={accentClass} />
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant font-mono tracking-wider uppercase">
          {label}
        </p>
        <p className="text-headline-md text-on-surface font-sans font-semibold">
          {formatBRL(value)}
        </p>
      </div>
    </article>
  );
}

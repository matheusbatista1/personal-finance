import type { ContactBreakdownRow } from "@/application/dto/MonthlyDashboardDTO";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SplitResumesPanelProps {
  rows: ContactBreakdownRow[];
  globalTotalCents: number;
}

const initialColor: Record<ContactBreakdownRow["colorRole"], string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
};

export function SplitResumesPanel({ rows, globalTotalCents }: SplitResumesPanelProps) {
  return (
    <section className="glass-panel p-md md:p-lg rounded-xl">
      <div className="mb-md border-outline-variant/10 pb-sm flex items-center justify-between border-b">
        <h3 className="text-headline-md text-on-surface font-sans font-semibold">
          Resumos de Rateio
        </h3>
        <span className="text-label-sm text-on-surface-variant font-mono">
          Total Geral:
          <span className="ml-xs text-primary font-semibold">{formatBRL(globalTotalCents)}</span>
        </span>
      </div>
      <ul className="gap-sm flex flex-col">
        {rows.map((row, index) => (
          <li key={row.contactId}>
            <div className="group p-sm hover:bg-surface-variant/20 flex flex-col justify-between rounded-lg transition-colors md:flex-row md:items-center">
              <div className="mb-xs gap-sm flex items-center md:mb-0">
                <div
                  className={cn(
                    "bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full font-mono font-semibold",
                    initialColor[row.colorRole],
                  )}
                >
                  {row.initial}
                </div>
                <span className="text-body-lg text-on-surface font-sans font-medium">
                  {row.contactName}
                </span>
              </div>
              <div className="gap-md text-label-md text-on-surface-variant flex flex-1 items-center justify-between font-mono md:flex-none md:justify-end">
                <div className="flex flex-col md:items-end">
                  <span>Dividido</span>
                  <span className="text-on-surface">{formatBRL(row.splitCents)}</span>
                </div>
                <div className="flex flex-col md:items-end">
                  <span>Direto</span>
                  <span className="text-on-surface">{formatBRL(row.individualCents)}</span>
                </div>
                <div className="text-primary flex flex-col font-semibold md:items-end">
                  <span>Total</span>
                  <span>{formatBRL(row.totalCents)}</span>
                </div>
              </div>
            </div>
            {index < rows.length - 1 ? (
              <div aria-hidden className="bg-outline-variant/10 h-px w-full" />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

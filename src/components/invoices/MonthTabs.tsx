import Link from "next/link";
import { Filter } from "lucide-react";
import { shiftReference, formatReferenceShort } from "@/application/services/invoice";
import { cn } from "@/lib/utils";

interface MonthTabsProps {
  cardId: string;
  activeYear: number;
  activeMonth: number;
  currentYear: number;
  currentMonth: number;
}

interface Tab {
  year: number;
  month: number;
  label: string;
  isCurrent: boolean;
  isActive: boolean;
}

export function MonthTabs({
  cardId,
  activeYear,
  activeMonth,
  currentYear,
  currentMonth,
}: MonthTabsProps) {
  const tabs: Tab[] = [];
  for (let i = 0; i < 4; i++) {
    const { year, month } = shiftReference(currentYear, currentMonth, -i);
    tabs.push({
      year,
      month,
      label: formatReferenceShort(year, month),
      isCurrent: i === 0,
      isActive: year === activeYear && month === activeMonth,
    });
  }

  return (
    <div className="border-outline-variant/20 pb-sm flex items-center justify-between border-b">
      <div className="space-x-md hide-scrollbar pb-xs flex overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={`${tab.year}-${tab.month}`}
            href={{
              pathname: `/fatura/${cardId}`,
              query: { m: `${tab.year}-${String(tab.month).padStart(2, "0")}` },
            }}
            className={cn(
              "text-label-md pb-sm px-xs font-mono whitespace-nowrap transition-colors",
              tab.isActive
                ? "text-primary border-primary border-b-2"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab.label}
            {tab.isCurrent ? " (Atual)" : ""}
          </Link>
        ))}
      </div>
      <button
        type="button"
        disabled
        title="Em breve"
        className="text-on-surface-variant hover:text-primary gap-xs flex items-center transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Filter size={14} aria-hidden />
        <span className="text-label-sm font-mono">Filtrar</span>
      </button>
    </div>
  );
}

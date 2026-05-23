import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftCompetence } from "@/lib/format";

interface MonthSelectorProps {
  competence: string;
  label: string;
  pathname?: string;
}

export function MonthSelector({ competence, label, pathname = "/" }: MonthSelectorProps) {
  const prev = shiftCompetence(competence, -1);
  const next = shiftCompetence(competence, +1);

  return (
    <div className="self-center">
      <div className="glass-panel gap-md px-lg py-sm flex items-center justify-between rounded-full">
        <Link
          href={{ pathname, query: { m: prev } }}
          aria-label="Mês anterior"
          className="p-xs text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary rounded-full transition-colors"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h2 className="text-headline-md text-on-surface font-sans font-semibold tracking-wide">
          {label}
        </h2>
        <Link
          href={{ pathname, query: { m: next } }}
          aria-label="Próximo mês"
          className="p-xs text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary rounded-full transition-colors"
        >
          <ChevronRight size={20} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

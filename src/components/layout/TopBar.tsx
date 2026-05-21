import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

export function TopBar() {
  return (
    <header className="border-outline-variant/10 bg-surface/60 px-lg py-md fixed top-0 right-0 z-40 flex w-full items-center justify-between border-b backdrop-blur-xl md:ml-64 md:w-[calc(100%-256px)]">
      <div className="gap-sm flex items-center">
        <h1 className="text-headline-md text-primary font-sans font-semibold">FinLux</h1>
      </div>
      <div className="gap-md flex items-center">
        <button
          type="button"
          aria-label="Selecionar mês"
          className="text-on-surface-variant hover:bg-primary-container/20 hover:text-primary focus-visible:ring-primary/50 flex h-10 w-10 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-0"
        >
          <CalendarDays size={20} aria-hidden />
        </button>
        <Link
          href="/gastos/novo"
          aria-label="Novo lançamento"
          className="text-on-surface-variant hover:bg-primary-container/20 hover:text-primary focus-visible:ring-primary/50 flex h-10 w-10 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-0"
        >
          <Plus size={22} aria-hidden />
        </Link>
        <div
          aria-hidden
          className="border-outline-variant/20 bg-surface-container-high text-label-sm text-primary flex h-10 w-10 items-center justify-center rounded-full border font-mono font-semibold"
        >
          MB
        </div>
      </div>
    </header>
  );
}

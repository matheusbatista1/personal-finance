"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthChoice {
  competence: string;
  label: string;
}

function buildChoices(): MonthChoice[] {
  const now = new Date();
  const result: MonthChoice[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const competence = `${year}-${String(month).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date);
    result.push({ competence, label });
  }
  return result;
}

export function MonthQuickPicker() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const choices = buildChoices();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Selecionar mês"
        className="text-on-surface-variant hover:bg-primary-container/20 hover:text-primary focus-visible:ring-primary/50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-0"
      >
        <CalendarDays size={20} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "modal-glass absolute right-0 z-50 mt-2 w-56 rounded-xl py-2",
            "border-outline-variant/30 border shadow-xl",
          )}
        >
          <p className="text-label-sm text-on-surface-variant px-md pb-xs font-mono uppercase">
            Pular para
          </p>
          {choices.map((choice) => (
            <Link
              key={choice.competence}
              role="menuitem"
              href={`/?m=${choice.competence}`}
              onClick={() => setOpen(false)}
              className="text-body-md text-on-surface hover:bg-primary-container/20 hover:text-primary px-md py-sm block cursor-pointer font-sans transition-colors"
            >
              {choice.label.charAt(0).toUpperCase() + choice.label.slice(1)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

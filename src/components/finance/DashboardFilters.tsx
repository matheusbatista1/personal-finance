"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Users } from "lucide-react";
import type { AllContactsRow } from "@/application/dto/MonthlyDashboardDTO";
import { cn } from "@/lib/utils";

interface Props {
  view: "overview" | "mine";
  selectedPeopleIds: string[];
  contacts: AllContactsRow[];
}

const colorClass: Record<AllContactsRow["colorRole"], string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
};

export function DashboardFilters({ view, selectedPeopleIds, contacts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selectedSet = useMemo(() => new Set(selectedPeopleIds), [selectedPeopleIds]);

  function updateParam(key: string, value: string | string[] | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else if (Array.isArray(value)) {
      if (value.length === 0) params.delete(key);
      else params.set(key, value.join(","));
    } else {
      params.set(key, value);
    }
    router.replace(`/dashboard?${params.toString()}`);
  }

  function togglePerson(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateParam("people", [...next]);
  }

  function clearPeople() {
    updateParam("people", null);
  }

  return (
    <nav
      ref={containerRef}
      className="bg-surface-container-low/50 border-outline-variant/10 gap-xs p-xs flex w-fit items-center self-center rounded-full border backdrop-blur-md"
    >
      <div className="gap-xs flex items-center">
        <button
          type="button"
          onClick={() => updateParam("view", "overview")}
          className={cn(
            "px-md text-label-md cursor-pointer rounded-full py-1.5 font-medium transition-all",
            view === "overview"
              ? "bg-primary-container text-on-primary-container shadow-sm"
              : "text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface",
          )}
        >
          Visão Geral
        </button>
        <button
          type="button"
          onClick={() => updateParam("view", "mine")}
          className={cn(
            "px-md text-label-md cursor-pointer rounded-full py-1.5 font-medium transition-all",
            view === "mine"
              ? "bg-primary-container text-on-primary-container shadow-sm"
              : "text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface",
          )}
        >
          Minhas Gastos
        </button>
      </div>
      <div className="bg-outline-variant/20 mx-xs h-4 w-px" />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "gap-xs px-md text-label-md flex cursor-pointer items-center rounded-full py-1.5 font-medium transition-all",
            selectedSet.size > 0
              ? "bg-primary/15 text-primary border-primary/40 border"
              : "text-on-surface-variant hover:bg-primary/10 hover:text-primary",
          )}
        >
          <Users size={16} aria-hidden />
          <span>
            {selectedSet.size === 0
              ? "Pessoas"
              : `${selectedSet.size} ${selectedSet.size === 1 ? "pessoa" : "pessoas"}`}
          </span>
          <ChevronDown size={16} aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            className="modal-glass border-outline-variant/30 absolute right-0 z-50 mt-2 w-56 rounded-xl border py-2 shadow-xl"
          >
            <div className="px-md pb-xs flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant font-mono uppercase">
                Filtrar por
              </span>
              {selectedSet.size > 0 ? (
                <button
                  type="button"
                  onClick={clearPeople}
                  className="text-label-sm text-primary cursor-pointer font-mono hover:underline"
                >
                  Limpar
                </button>
              ) : null}
            </div>
            {contacts.length === 0 ? (
              <p className="px-md py-sm text-label-sm text-on-surface-variant font-mono">
                Sem contatos.
              </p>
            ) : (
              <ul>
                {contacts.map((c) => {
                  const active = selectedSet.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => togglePerson(c.id)}
                        role="menuitemcheckbox"
                        aria-checked={active}
                        className="gap-sm px-md py-sm text-body-md text-on-surface hover:bg-primary-container/20 flex w-full cursor-pointer items-center font-sans transition-colors"
                      >
                        <span
                          className={cn(
                            "bg-surface-bright flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                            colorClass[c.colorRole] ?? "text-on-surface",
                          )}
                        >
                          {c.initial}
                        </span>
                        <span className="flex-1 text-left">{c.name}</span>
                        {active ? (
                          <span aria-hidden className="bg-primary h-2 w-2 rounded-full" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

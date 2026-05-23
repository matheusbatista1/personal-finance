"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, CreditCard, Landmark, Users } from "lucide-react";
import type { AllContactsRow, SourceOptionRow } from "@/application/dto/MonthlyDashboardDTO";
import { cn } from "@/lib/utils";

interface Props {
  view: "overview" | "mine";
  selectedPeopleIds: string[];
  selectedCardIds: string[];
  selectedWalletIds: string[];
  contacts: AllContactsRow[];
  cards: SourceOptionRow[];
  wallets: SourceOptionRow[];
}

const colorClass: Record<AllContactsRow["colorRole"], string> = {
  primary: "text-primary",
  tertiary: "text-tertiary",
  secondary: "text-secondary",
};

export function DashboardFilters({
  view,
  selectedPeopleIds,
  selectedCardIds,
  selectedWalletIds,
  contacts,
  cards,
  wallets,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard");

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
    router.replace(`/?${params.toString()}`);
  }

  return (
    <nav className="bg-surface-container-low/50 border-outline-variant/10 gap-xs p-xs flex w-fit flex-wrap items-center self-center rounded-full border backdrop-blur-md">
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
          {t("overview")}
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
          {t("myExpenses")}
        </button>
      </div>
      <div className="bg-outline-variant/20 mx-xs h-4 w-px" />
      <FilterPopover
        label={t("peoplePicker")}
        icon={<Users size={16} aria-hidden />}
        selectedIds={selectedPeopleIds}
        options={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          initial: c.initial,
          colorRole: c.colorRole,
        }))}
        onChange={(ids) => updateParam("people", ids)}
      />
      <FilterPopover
        label={t("cardsPicker")}
        icon={<CreditCard size={16} aria-hidden />}
        selectedIds={selectedCardIds}
        options={cards.map((c) => ({ id: c.id, name: c.name }))}
        onChange={(ids) => updateParam("cards", ids)}
      />
      <FilterPopover
        label={t("walletsPicker")}
        icon={<Landmark size={16} aria-hidden />}
        selectedIds={selectedWalletIds}
        options={wallets.map((w) => ({ id: w.id, name: w.name }))}
        onChange={(ids) => updateParam("wallets", ids)}
      />
    </nav>
  );
}

interface PopoverOption {
  id: string;
  name: string;
  initial?: string;
  colorRole?: AllContactsRow["colorRole"];
}

interface FilterPopoverProps {
  label: string;
  icon: React.ReactNode;
  selectedIds: string[];
  options: PopoverOption[];
  onChange: (ids: string[]) => void;
}

function FilterPopover({ label, icon, selectedIds, options, onChange }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function recompute() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    recompute();
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const popover = document.getElementById(`filter-pop-${label}`);
      if (popover?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, label]);

  const selectedSet = new Set(selectedIds);

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <>
      <button
        ref={triggerRef}
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
        {icon}
        <span>{selectedSet.size === 0 ? label : `${selectedSet.size} ${label.toLowerCase()}`}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              id={`filter-pop-${label}`}
              role="menu"
              style={{ top: position.top, right: position.right }}
              className="modal-glass border-outline-variant/30 fixed z-[100] w-60 rounded-xl border py-2 shadow-2xl"
            >
              <div className="px-md pb-xs flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant font-mono uppercase">
                  {label}
                </span>
                {selectedSet.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-label-sm text-primary cursor-pointer font-mono hover:underline"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
              {options.length === 0 ? (
                <p className="px-md py-sm text-label-sm text-on-surface-variant font-mono">
                  Sem opções.
                </p>
              ) : (
                <ul>
                  {options.map((opt) => {
                    const active = selectedSet.has(opt.id);
                    return (
                      <li key={opt.id}>
                        <button
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={active}
                          onClick={() => toggle(opt.id)}
                          className="gap-sm px-md py-sm text-body-md text-on-surface hover:bg-primary-container/20 flex w-full cursor-pointer items-center font-sans transition-colors"
                        >
                          {opt.initial ? (
                            <span
                              className={cn(
                                "bg-surface-bright flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                                opt.colorRole
                                  ? (colorClass[opt.colorRole] ?? "text-on-surface")
                                  : "text-on-surface",
                              )}
                            >
                              {opt.initial}
                            </span>
                          ) : null}
                          <span className="flex-1 text-left">{opt.name}</span>
                          {active ? (
                            <span aria-hidden className="bg-primary h-2 w-2 rounded-full" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

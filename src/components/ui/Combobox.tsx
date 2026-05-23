"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  ariaInvalid?: boolean;
}

export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  searchPlaceholder = "Buscar…",
  emptyLabel = "Nenhum resultado.",
  className,
  ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return options;
    const lower = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function recompute() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    recompute();
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-invalid={ariaInvalid ? "true" : undefined}
        className={cn(
          "bg-surface-container-low border-outline-variant/50 focus:border-primary text-on-surface py-sm px-sm flex w-full cursor-pointer items-center justify-between rounded-md border-b font-sans outline-none focus:ring-0",
          className,
        )}
      >
        <span className={cn(selected ? "text-on-surface" : "text-on-surface-variant")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "text-on-surface-variant ml-xs shrink-0 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>
      {open && rect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              role="listbox"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.min(320, window.innerHeight - rect.top - 16),
              }}
              className="modal-glass border-outline-variant/30 fixed z-[110] flex flex-col overflow-hidden rounded-xl border shadow-2xl"
            >
              <div className="border-outline-variant/20 p-xs relative border-b">
                <Search
                  size={14}
                  aria-hidden
                  className="text-outline absolute top-1/2 left-3 -translate-y-1/2"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-surface-container-low text-on-surface placeholder:text-outline/50 w-full rounded-md py-2 pr-3 pl-9 text-sm outline-none"
                />
              </div>
              <ul className="custom-scrollbar overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-md py-sm text-label-sm text-on-surface-variant font-mono">
                    {emptyLabel}
                  </li>
                ) : (
                  filtered.map((opt) => {
                    const active = opt.value === value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            onChange(opt.value);
                            setOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "px-md py-sm text-body-md flex w-full cursor-pointer items-center justify-between font-sans transition-colors",
                            active
                              ? "bg-primary-container/20 text-primary"
                              : "text-on-surface hover:bg-primary-container/10",
                          )}
                        >
                          <span className="flex-1 text-left">
                            {opt.label}
                            {opt.hint ? (
                              <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                                {opt.hint}
                              </span>
                            ) : null}
                          </span>
                          {active ? (
                            <Check size={14} aria-hidden className="text-primary shrink-0" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

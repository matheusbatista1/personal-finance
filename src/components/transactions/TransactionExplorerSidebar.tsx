"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CreditCard, Filter, Landmark, Search, X } from "lucide-react";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { cn } from "@/lib/utils";

export interface SidebarContact {
  id: string;
  name: string;
  initial: string;
}

export interface SidebarOption {
  id: string;
  name: string;
}

export interface SidebarCategoryOption extends SidebarOption {
  iconName: string;
}

interface Props {
  competence: string;
  q: string;
  includeMe: boolean;
  selectedPeopleIds: string[];
  selectedCardIds: string[];
  selectedWalletIds: string[];
  selectedCategoryIds: string[];
  groupBy: "date" | "source";
  contacts: SidebarContact[];
  cards: SidebarOption[];
  wallets: SidebarOption[];
  categories: SidebarCategoryOption[];
}

export function TransactionExplorerSidebar({
  competence,
  q,
  includeMe,
  selectedPeopleIds,
  selectedCardIds,
  selectedWalletIds,
  selectedCategoryIds,
  groupBy,
  contacts,
  cards,
  wallets,
  categories,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const peopleSet = new Set(selectedPeopleIds);
  const cardsSet = new Set(selectedCardIds);
  const walletsSet = new Set(selectedWalletIds);
  const catsSet = new Set(selectedCategoryIds);

  function navigate(next: URLSearchParams) {
    next.set("m", competence);
    startTransition(() => {
      router.replace(`/transacoes?${next.toString()}`);
    });
  }

  function setMulti(key: string, ids: string[]) {
    const next = new URLSearchParams(searchParams.toString());
    if (ids.length === 0) next.delete(key);
    else next.set(key, ids.join(","));
    navigate(next);
  }

  function setQuery(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    navigate(next);
  }

  function toggleId(set: Set<string>, id: string, key: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMulti(key, [...next]);
  }

  function clearAll() {
    const next = new URLSearchParams();
    next.set("m", competence);
    startTransition(() => {
      router.replace(`/transacoes?${next.toString()}`);
    });
  }

  function toggleMe() {
    const next = new URLSearchParams(searchParams.toString());
    if (includeMe) next.delete("me");
    else next.set("me", "1");
    navigate(next);
  }

  function setGrouping(value: "date" | "source") {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "date") next.delete("group");
    else next.set("group", value);
    navigate(next);
  }

  const hasAnyFilter =
    q.length > 0 ||
    includeMe ||
    selectedPeopleIds.length > 0 ||
    selectedCardIds.length > 0 ||
    selectedWalletIds.length > 0 ||
    selectedCategoryIds.length > 0;

  return (
    <aside className="glass-panel border-outline-variant/10 flex h-full flex-col overflow-y-auto rounded-2xl border">
      <div className="p-md border-outline-variant/10 border-b">
        <h2 className="text-headline-md text-on-surface gap-xs mb-md flex items-center font-sans font-semibold">
          <Filter size={18} aria-hidden /> Filtros
        </h2>

        <h3 className="text-label-sm text-on-surface-variant mb-sm font-mono uppercase">
          Contexto
        </h3>
        <div className="mb-sm relative">
          <Search
            size={14}
            aria-hidden
            className="text-outline absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            defaultValue={q}
            placeholder="Buscar transação…"
            onBlur={(e) => {
              if (e.target.value !== q) setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQuery((e.target as HTMLInputElement).value);
              }
            }}
            className="bg-surface-container-low border-outline-variant/30 focus:border-primary text-on-surface placeholder:text-outline/50 w-full rounded-md border-b py-2 pr-3 pl-10 text-sm outline-none focus:ring-0"
          />
        </div>

        <h3 className="text-label-sm text-on-surface-variant mt-md mb-sm font-mono uppercase">
          Agrupar por
        </h3>
        <div className="gap-xs flex">
          <button
            type="button"
            onClick={() => setGrouping("date")}
            className={cn(
              "text-label-sm flex-1 cursor-pointer rounded-full border px-3 py-1.5 font-mono transition-all",
              groupBy === "date"
                ? "bg-primary/15 border-primary/50 text-primary"
                : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant/50",
            )}
          >
            Data
          </button>
          <button
            type="button"
            onClick={() => setGrouping("source")}
            className={cn(
              "text-label-sm flex-1 cursor-pointer rounded-full border px-3 py-1.5 font-mono transition-all",
              groupBy === "source"
                ? "bg-primary/15 border-primary/50 text-primary"
                : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant/50",
            )}
          >
            Origem
          </button>
        </div>

        <h3 className="text-label-sm text-on-surface-variant mt-md mb-sm font-mono uppercase">
          Pessoas
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleMe}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              includeMe
                ? "bg-primary/15 border-primary/50 text-primary"
                : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant/50",
            )}
          >
            <span className="bg-surface-bright flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
              Eu
            </span>
            Eu
          </button>
          {contacts.length === 0 ? (
            <p className="text-label-sm text-on-surface-variant font-mono">
              Sem contatos cadastrados.
            </p>
          ) : null}
          {contacts.map((c) => {
            const active = peopleSet.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleId(peopleSet, c.id, "people")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant/50",
                )}
              >
                <span
                  aria-hidden
                  className="bg-surface-bright flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                >
                  {c.initial}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>

        <h3 className="text-label-sm text-on-surface-variant mt-md mb-sm font-mono uppercase">
          Meios de Pagamento
        </h3>
        {cards.length > 0 ? (
          <div className="mb-3">
            <span className="text-on-surface-variant mb-2 block text-xs">Cartões</span>
            <ul className="space-y-2">
              {cards.map((c) => {
                const active = cardsSet.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleId(cardsSet, c.id, "cards")}
                        className="bg-surface-container-low border-outline-variant/30 text-primary focus:ring-primary/40 h-4 w-4 cursor-pointer rounded border"
                      />
                      <span className="text-on-surface group-hover:text-primary flex items-center gap-2 text-sm transition-colors">
                        <CreditCard size={14} aria-hidden className="text-on-surface-variant" />
                        {c.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {wallets.length > 0 ? (
          <div>
            <span className="text-on-surface-variant mb-2 block text-xs">Contas</span>
            <ul className="space-y-2">
              {wallets.map((w) => {
                const active = walletsSet.has(w.id);
                return (
                  <li key={w.id}>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleId(walletsSet, w.id, "wallets")}
                        className="bg-surface-container-low border-outline-variant/30 text-primary focus:ring-primary/40 h-4 w-4 cursor-pointer rounded border"
                      />
                      <span className="text-on-surface group-hover:text-primary flex items-center gap-2 text-sm transition-colors">
                        <Landmark size={14} aria-hidden className="text-on-surface-variant" />
                        {w.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <h3 className="text-label-sm text-on-surface-variant mt-md mb-sm font-mono uppercase">
          Categorias
        </h3>
        <ul className="space-y-2">
          {categories.map((cat) => {
            const active = catsSet.has(cat.id);
            return (
              <li key={cat.id}>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleId(catsSet, cat.id, "cats")}
                    className="bg-surface-container-low border-outline-variant/30 text-primary focus:ring-primary/40 h-4 w-4 cursor-pointer rounded border"
                  />
                  <span className="text-on-surface group-hover:text-primary flex items-center gap-2 text-sm transition-colors">
                    <TransactionIcon name={cat.iconName} size={14} />
                    {cat.name}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-md mt-auto">
        <button
          type="button"
          onClick={clearAll}
          disabled={!hasAnyFilter}
          className="bg-surface-variant text-on-surface hover:bg-surface-bright border-outline-variant/20 gap-xs text-label-md flex w-full cursor-pointer items-center justify-center rounded-lg border py-2 font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={14} aria-hidden /> Limpar Filtros
        </button>
      </div>
    </aside>
  );
}

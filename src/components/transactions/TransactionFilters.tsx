"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type TransactionFilter = "all" | "expense" | "income";
export type OperationFilter = "all" | "card" | "pix" | "loan";

export interface WalletOption {
  id: string;
  name: string;
}

export interface CardOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  competence: string;
  activeType: TransactionFilter;
  activeOperation: OperationFilter;
  activeWalletId: string;
  activeCardId: string;
  activeCategoryId: string;
  dateFrom: string;
  dateTo: string;
  wallets: WalletOption[];
  cards: CardOption[];
  categories: CategoryOption[];
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

const TYPE_CHIPS: ChipOption<TransactionFilter>[] = [
  { value: "all", label: "Tudo" },
  { value: "expense", label: "Despesas" },
  { value: "income", label: "Receitas" },
];

const OPERATION_CHIPS: ChipOption<OperationFilter>[] = [
  { value: "all", label: "Todas operações" },
  { value: "card", label: "Cartão" },
  { value: "pix", label: "Pix" },
  { value: "loan", label: "Empréstimo" },
];

export function TransactionFilters({
  competence,
  activeType,
  activeOperation,
  activeWalletId,
  activeCardId,
  activeCategoryId,
  dateFrom,
  dateTo,
  wallets,
  cards,
  categories,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("m", competence);
    startTransition(() => {
      router.replace(`/transacoes?${params.toString()}`);
    });
  }

  const hasExtraFilters = Boolean(
    (activeWalletId && activeWalletId !== "all") ||
    (activeCardId && activeCardId !== "all") ||
    (activeCategoryId && activeCategoryId !== "all") ||
    dateFrom ||
    dateTo,
  );

  function clearExtraFilters() {
    const params = new URLSearchParams();
    params.set("m", competence);
    if (activeType !== "all") params.set("type", activeType);
    if (activeOperation !== "all") params.set("op", activeOperation);
    startTransition(() => {
      router.replace(`/transacoes?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-sm">
      <ChipRow
        competence={competence}
        chips={TYPE_CHIPS}
        param="type"
        active={activeType}
        searchParams={searchParams}
      />
      <ChipRow
        competence={competence}
        chips={OPERATION_CHIPS}
        param="op"
        active={activeOperation}
        searchParams={searchParams}
      />

      <div className="gap-sm md:gap-md grid grid-cols-1 md:grid-cols-3">
        <FilterSelect
          label="Conta"
          value={activeWalletId || "all"}
          onChange={(v) => updateParam("wallet", v)}
          options={[{ id: "all", name: "Todas" }, ...wallets]}
        />
        <FilterSelect
          label="Cartão"
          value={activeCardId || "all"}
          onChange={(v) => updateParam("card", v)}
          options={[{ id: "all", name: "Todos" }, ...cards]}
        />
        <FilterSelect
          label="Categoria"
          value={activeCategoryId || "all"}
          onChange={(v) => updateParam("cat", v)}
          options={[{ id: "all", name: "Todas" }, ...categories]}
        />
      </div>

      <div className="gap-sm md:gap-md grid grid-cols-2 md:grid-cols-3">
        <DateInput label="De" value={dateFrom} onChange={(v) => updateParam("from", v)} />
        <DateInput label="Até" value={dateTo} onChange={(v) => updateParam("to", v)} />
        {hasExtraFilters ? (
          <button
            type="button"
            onClick={clearExtraFilters}
            className="text-on-surface-variant hover:text-on-surface gap-xs px-md py-sm border-outline-variant/30 hover:border-outline-variant/60 flex items-center justify-center rounded-full border font-mono text-sm transition-colors"
          >
            <Filter size={14} aria-hidden />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface ChipRowProps<T extends string> {
  competence: string;
  chips: ChipOption<T>[];
  param: string;
  active: T;
  searchParams: URLSearchParams;
}

function ChipRow<T extends string>({
  competence,
  chips,
  param,
  active,
  searchParams,
}: ChipRowProps<T>) {
  return (
    <div className="gap-xs flex flex-wrap">
      {chips.map((chip) => {
        const isActive = chip.value === active;
        const params = new URLSearchParams(searchParams.toString());
        params.set("m", competence);
        if (chip.value === "all") params.delete(param);
        else params.set(param, chip.value);
        return (
          <Link
            key={chip.value}
            href={`/transacoes?${params.toString()}`}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-sm transition-all",
              isActive
                ? "border-primary bg-primary-container/15 text-primary"
                : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60",
            )}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex flex-col">
      <span className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container-low border-outline-variant/30 text-on-surface focus:border-primary py-sm px-sm rounded-md border font-sans outline-none focus:ring-0"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </label>
  );
}

interface DateInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function DateInput({ label, value, onChange }: DateInputProps) {
  return (
    <label className="flex flex-col">
      <span className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container-low border-outline-variant/30 text-on-surface focus:border-primary py-sm px-sm rounded-md border font-sans outline-none focus:ring-0"
      />
    </label>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

export type TransactionFilter = "all" | "expense" | "income";
export type OperationFilter = "all" | "card" | "pix" | "loan";

interface Props {
  competence: string;
  activeType: TransactionFilter;
  activeOperation: OperationFilter;
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

export function TransactionFilters({ competence, activeType, activeOperation }: Props) {
  return (
    <div className="space-y-sm">
      <ChipRow
        competence={competence}
        chips={TYPE_CHIPS}
        param="type"
        active={activeType}
        otherParam={{ key: "op", value: activeOperation }}
      />
      <ChipRow
        competence={competence}
        chips={OPERATION_CHIPS}
        param="op"
        active={activeOperation}
        otherParam={{ key: "type", value: activeType }}
      />
    </div>
  );
}

interface ChipRowProps<T extends string> {
  competence: string;
  chips: ChipOption<T>[];
  param: string;
  active: T;
  otherParam: { key: string; value: string };
}

function ChipRow<T extends string>({
  competence,
  chips,
  param,
  active,
  otherParam,
}: ChipRowProps<T>) {
  return (
    <div className="gap-xs flex flex-wrap">
      {chips.map((chip) => {
        const isActive = chip.value === active;
        const query: Record<string, string> = { m: competence };
        if (otherParam.value !== "all") query[otherParam.key] = otherParam.value;
        if (chip.value !== "all") query[param] = chip.value;
        return (
          <Link
            key={chip.value}
            href={{ pathname: "/transacoes", query }}
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

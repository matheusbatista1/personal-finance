import Link from "next/link";
import { Receipt } from "lucide-react";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface GroupedTxRow {
  id: string;
  type: "expense" | "income";
  description: string;
  occurredAt: Date;
  timeLabel: string;
  iconName: string;
  amountCents: number;
  userShareCents: number;
  hasSplit: boolean;
  sourceLabel: string;
  participantInitials: string[];
  installmentNumber: number;
  installmentTotal: number;
}

interface Props {
  rows: GroupedTxRow[];
}

interface DayGroup {
  key: string;
  label: string;
  rows: GroupedTxRow[];
}

const RELATIVE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function relativeDayLabel(date: Date, now = new Date()): string {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (diff === 0) return `Hoje, ${RELATIVE_FORMAT.format(date)}`;
  if (diff === 1) return `Ontem, ${RELATIVE_FORMAT.format(date)}`;
  return RELATIVE_FORMAT.format(date);
}

function groupByDay(rows: GroupedTxRow[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const r of rows) {
    const d = r.occurredAt;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let group = map.get(key);
    if (!group) {
      group = { key, label: relativeDayLabel(d), rows: [] };
      map.set(key, group);
    }
    group.rows.push(r);
  }
  return [...map.values()];
}

export function GroupedTransactionList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="glass-panel p-lg gap-sm flex flex-col items-center justify-center rounded-2xl text-center">
        <div className="bg-primary-container/20 text-primary mb-xs flex h-14 w-14 items-center justify-center rounded-2xl">
          <Receipt size={22} aria-hidden />
        </div>
        <p className="text-body-lg text-on-surface font-sans font-semibold">
          Nenhuma transação encontrada
        </p>
        <p className="text-body-md text-on-surface-variant max-w-[28rem] font-sans">
          Ajuste os filtros à esquerda ou registre um novo lançamento.
        </p>
      </div>
    );
  }

  const groups = groupByDay(rows);

  return (
    <div className="gap-sm flex flex-col">
      {groups.map((g) => (
        <section key={g.key} className="gap-sm flex flex-col">
          <h3 className="bg-surface/80 text-label-md text-outline sticky top-0 z-20 py-2 font-mono backdrop-blur-md">
            {g.label}
          </h3>
          {g.rows.map((row) => (
            <Link
              key={row.id}
              href={`/gastos/${row.id}/editar`}
              className="glass-panel p-md hover:bg-surface-variant/20 focus-visible:ring-primary/50 group flex cursor-pointer items-center justify-between rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="gap-md flex items-center">
                <div className="bg-surface-container border-outline-variant/20 group-hover:border-primary/30 flex h-12 w-12 items-center justify-center rounded-full border transition-colors">
                  <TransactionIcon name={row.iconName} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-body-lg text-on-surface font-sans font-medium">
                    {row.description}
                    {row.installmentTotal > 1 ? (
                      <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                        {row.installmentNumber}/{row.installmentTotal}
                      </span>
                    ) : null}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-label-sm text-on-surface-variant font-mono">
                      {row.timeLabel}
                    </span>
                    <span className="bg-surface-variant text-on-surface-variant border-outline-variant/20 rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">
                      {row.sourceLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="gap-lg flex items-center">
                {row.participantInitials.length > 0 ? (
                  <div className="hidden -space-x-2 md:flex">
                    {row.participantInitials.slice(0, 3).map((initial, i) => (
                      <span
                        key={`${row.id}-${initial}-${i}`}
                        className="bg-surface-bright border-surface flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold"
                      >
                        {initial}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="text-right">
                  <p
                    className={cn(
                      "text-body-lg font-sans font-medium",
                      row.type === "income" ? "text-tertiary" : "text-on-surface",
                    )}
                  >
                    {row.type === "income" ? "+" : "-"}
                    {formatBRL(row.amountCents)}
                  </p>
                  {row.hasSplit && row.type === "expense" ? (
                    <p className="text-label-sm text-primary font-mono">
                      Sua parte: {formatBRL(row.userShareCents)}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}

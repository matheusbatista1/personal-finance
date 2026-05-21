import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContactBreakdownRow,
  MonthlyDashboardDTO,
  ParticipantBadge,
  RecentTransactionRow,
} from "@/application/dto/MonthlyDashboardDTO";
import type { IDashboardRepository } from "@/application/repositories/IDashboardRepository";
import type { ContactColorRole } from "@/domain/contact/Contact";
import { formatCompetence } from "@/lib/format";

interface ContactRow {
  id: string;
  name: string;
}

interface WalletRow {
  balance_cents: number | string;
}

interface SplitRow {
  contact_id: string;
  amount_cents: number | string;
}

interface CategoryRow {
  name: string | null;
  icon_name: string | null;
}

interface TransactionRow {
  id: string;
  description: string;
  type: "expense" | "income";
  amount_cents: number | string;
  user_share_cents: number | string;
  occurred_at: string;
  split_mode: "none" | "equal" | "custom";
  categories: CategoryRow | null;
  transaction_splits: SplitRow[];
}

const PALETTE: ContactColorRole[] = ["primary", "tertiary", "secondary"];

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function formatWhen(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDays === 0) return `Hoje, ${time}`;
  if (diffDays === 1) return `Ontem, ${time}`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export class SupabaseDashboardRepository implements IDashboardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByCompetence(input: { year: number; month: number }): Promise<MonthlyDashboardDTO> {
    const { year, month } = input;
    const competence = `${year}-${String(month).padStart(2, "0")}`;
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [contactsRes, walletsRes, txRes] = await Promise.all([
      this.supabase.from("contacts").select("id, name").order("name"),
      this.supabase.from("wallets").select("balance_cents"),
      this.supabase
        .from("transactions")
        .select(
          "id, description, type, amount_cents, user_share_cents, occurred_at, split_mode, categories(name, icon_name), transaction_splits(contact_id, amount_cents)",
        )
        .gte("occurred_at", startDate)
        .lt("occurred_at", endDate)
        .order("occurred_at", { ascending: false }),
    ]);

    const contacts = ((contactsRes.data ?? []) as unknown as ContactRow[]) ?? [];
    const wallets = ((walletsRes.data ?? []) as unknown as WalletRow[]) ?? [];
    const transactions = ((txRes.data ?? []) as unknown as TransactionRow[]) ?? [];

    const expenseTransactions = transactions.filter((tx) => tx.type === "expense");
    const incomeTransactions = transactions.filter((tx) => tx.type === "income");

    const availableCents = wallets.reduce((sum, w) => sum + toNumber(w.balance_cents), 0);
    const userTotalCents = expenseTransactions.reduce(
      (sum, t) => sum + toNumber(t.user_share_cents),
      0,
    );
    const globalTotalCents = expenseTransactions.reduce(
      (sum, t) => sum + toNumber(t.amount_cents),
      0,
    );
    const incomeTotalCents = incomeTransactions.reduce(
      (sum, t) => sum + toNumber(t.amount_cents),
      0,
    );

    const breakdownMap = new Map<string, { split: number; individual: number }>();
    for (const tx of expenseTransactions) {
      for (const split of tx.transaction_splits ?? []) {
        const entry = breakdownMap.get(split.contact_id) ?? { split: 0, individual: 0 };
        const amount = toNumber(split.amount_cents);
        if (tx.split_mode === "equal") {
          entry.split += amount;
        } else if (tx.split_mode === "custom") {
          entry.individual += amount;
        }
        breakdownMap.set(split.contact_id, entry);
      }
    }

    const contactsBreakdown: ContactBreakdownRow[] = contacts
      .map<ContactBreakdownRow>((contact, idx) => {
        const data = breakdownMap.get(contact.id) ?? { split: 0, individual: 0 };
        return {
          contactId: contact.id,
          contactName: contact.name,
          initial: contact.name.charAt(0).toUpperCase(),
          colorRole: PALETTE[idx % PALETTE.length] ?? "primary",
          splitCents: data.split,
          individualCents: data.individual,
          totalCents: data.split + data.individual,
        };
      })
      .filter((row) => row.totalCents > 0);

    const receivableCents = contactsBreakdown.reduce((sum, row) => sum + row.totalCents, 0);

    const recentTransactions: RecentTransactionRow[] = transactions
      .slice(0, 5)
      .map<RecentTransactionRow>((tx) => {
        const participants: ParticipantBadge[] = (tx.transaction_splits ?? []).map((s) => {
          const contact = contacts.find((c) => c.id === s.contact_id);
          const initial = contact?.name.charAt(0).toUpperCase() ?? "?";
          const contactIdx = contacts.findIndex((c) => c.id === s.contact_id);
          return {
            initial,
            colorRole: PALETTE[contactIdx % PALETTE.length] ?? "primary",
          };
        });

        const absoluteAmount = toNumber(tx.amount_cents);
        const amountSigned = tx.type === "income" ? absoluteAmount : -absoluteAmount;

        const badge =
          tx.type === "income"
            ? { text: "Receita", tone: "tertiary" as const }
            : tx.split_mode === "equal"
              ? { text: "Dividido", tone: "primary" as const }
              : tx.split_mode === "custom"
                ? { text: "Personalizado", tone: "primary" as const }
                : { text: "Individual", tone: "muted" as const };

        return {
          id: tx.id,
          type: tx.type,
          description: tx.description || "Sem descrição",
          categoryLabel: tx.categories?.name ?? "Sem categoria",
          iconName: tx.categories?.icon_name ?? "Receipt",
          whenLabel: formatWhen(tx.occurred_at),
          amountCents: amountSigned,
          participants,
          badge,
        };
      });

    return {
      competence,
      competenceLabel: formatCompetence(year, month),
      user: { totalCents: userTotalCents },
      totalsAll: { totalCents: globalTotalCents },
      income: { totalCents: incomeTotalCents },
      balance: { availableCents, deltaPct: 0 },
      receivable: { amountCents: receivableCents, progress: 0 },
      contactsBreakdown,
      recentTransactions,
    };
  }
}

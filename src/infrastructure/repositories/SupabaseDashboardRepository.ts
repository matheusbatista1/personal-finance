import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AllContactsRow,
  ContactBreakdownRow,
  MonthlyDashboardDTO,
  ParticipantBadge,
  RecentTransactionRow,
  SourceOptionRow,
} from "@/application/dto/MonthlyDashboardDTO";
import type {
  DashboardQuery,
  IDashboardRepository,
} from "@/application/repositories/IDashboardRepository";
import type { ContactColorRole } from "@/domain/contact/Contact";
import { formatCompetence } from "@/lib/format";
import { effectiveBalance, fetchWalletNetFlows } from "@/infrastructure/services/walletBalances";

interface ContactRow {
  id: string;
  name: string;
}

interface WalletRow {
  id: string;
  name: string;
  balance_cents: number | string;
  is_active: boolean;
}

interface CardRow {
  id: string;
  name: string;
  is_active: boolean;
}

interface SplitRow {
  contact_id: string;
  amount_cents: number | string;
  settled_at?: string | null;
  is_custom?: boolean;
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
  installment_number: number | null;
  installment_total: number | null;
  wallet_id: string | null;
  card_id: string | null;
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

  async findByCompetence(input: DashboardQuery): Promise<MonthlyDashboardDTO> {
    const { year, month } = input;
    const view = input.view ?? "overview";
    const peopleIds = input.peopleIds ?? [];
    const cardIds = input.cardIds ?? [];
    const walletIds = input.walletIds ?? [];
    const competence = `${year}-${String(month).padStart(2, "0")}`;
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [contactsRes, walletsRes, cardsRes, txRes, netFlows] = await Promise.all([
      this.supabase.from("contacts").select("id, name").order("name"),
      this.supabase.from("wallets").select("id, name, balance_cents, is_active").order("name"),
      this.supabase.from("cards").select("id, name, is_active").order("name"),
      this.supabase
        .from("transactions")
        .select(
          "id, description, type, amount_cents, user_share_cents, occurred_at, split_mode, installment_number, installment_total, wallet_id, card_id, categories(name, icon_name), transaction_splits(contact_id, amount_cents, settled_at, is_custom)",
        )
        .gte("occurred_at", startDate)
        .lt("occurred_at", endDate)
        .order("occurred_at", { ascending: false }),
      fetchWalletNetFlows(this.supabase),
    ]);

    const contacts = ((contactsRes.data ?? []) as unknown as ContactRow[]) ?? [];
    const wallets = ((walletsRes.data ?? []) as unknown as WalletRow[]) ?? [];
    const cards = ((cardsRes.data ?? []) as unknown as CardRow[]) ?? [];
    const transactions = ((txRes.data ?? []) as unknown as TransactionRow[]) ?? [];

    const peopleFilterSet = new Set(peopleIds);
    const cardFilterSet = new Set(cardIds);
    const walletFilterSet = new Set(walletIds);
    const isFilteringPeople = peopleFilterSet.size > 0;
    const isFilteringCards = cardFilterSet.size > 0;
    const isFilteringWallets = walletFilterSet.size > 0;

    function matchesFilters(tx: TransactionRow): boolean {
      if (isFilteringPeople) {
        const hit = (tx.transaction_splits ?? []).some((s) => peopleFilterSet.has(s.contact_id));
        if (!hit) return false;
      }
      if (isFilteringCards && (!tx.card_id || !cardFilterSet.has(tx.card_id))) return false;
      if (isFilteringWallets && (!tx.wallet_id || !walletFilterSet.has(tx.wallet_id))) return false;
      // In "mine" view, hide transactions where the user has no share (e.g. paid for someone else
      // and the entire amount belongs to that contact).
      if (view === "mine" && tx.type === "expense" && toNumber(tx.user_share_cents) <= 0) {
        return false;
      }
      return true;
    }

    const expenseTransactions = transactions
      .filter((tx) => tx.type === "expense")
      .filter(matchesFilters);
    const incomeTransactions = transactions
      .filter((tx) => tx.type === "income")
      .filter(matchesFilters);

    const availableCents = wallets.reduce(
      (sum, w) => sum + effectiveBalance(toNumber(w.balance_cents), netFlows.get(w.id)),
      0,
    );
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
    // The hero card shows the user's share by default ("Minhas Gastos"). "Visão Geral"
    // surfaces the full month total including everyone's share.
    const heroTotalCents = view === "overview" ? globalTotalCents : userTotalCents;

    // "Dividido" vs "Direto" é por split, não por transação inteira: o flag is_custom
    // identifica splits com valor fixo (Direto) vs rateio igualitário (Dividido).
    const breakdownMap = new Map<string, { split: number; individual: number }>();
    for (const tx of expenseTransactions) {
      for (const split of tx.transaction_splits ?? []) {
        if (split.settled_at) continue;
        const entry = breakdownMap.get(split.contact_id) ?? { split: 0, individual: 0 };
        const amount = toNumber(split.amount_cents);
        if (split.is_custom) {
          entry.individual += amount;
        } else {
          entry.split += amount;
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
      .filter(matchesFilters)
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
          installmentNumber: tx.installment_number ?? 1,
          installmentTotal: tx.installment_total ?? 1,
        };
      });

    const allContacts: AllContactsRow[] = contacts.map((c, idx) => ({
      id: c.id,
      name: c.name,
      initial: c.name.charAt(0).toUpperCase(),
      colorRole: PALETTE[idx % PALETTE.length] ?? "primary",
    }));
    const allCards: SourceOptionRow[] = cards
      .filter((c) => c.is_active)
      .map((c) => ({ id: c.id, name: c.name }));
    const allWallets: SourceOptionRow[] = wallets
      .filter((w) => w.is_active)
      .map((w) => ({ id: w.id, name: w.name }));

    return {
      competence,
      competenceLabel: formatCompetence(year, month),
      user: { totalCents: heroTotalCents },
      totalsAll: { totalCents: globalTotalCents },
      income: { totalCents: incomeTotalCents },
      balance: { availableCents, deltaPct: 0 },
      receivable: { amountCents: receivableCents, progress: 0 },
      contactsBreakdown,
      recentTransactions,
      allContacts,
      allCards,
      allWallets,
    };
  }
}

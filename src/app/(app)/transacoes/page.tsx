import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { materializeRecurring } from "@/infrastructure/services/recurring";
import { MonthSelector } from "@/components/layout/MonthSelector";
import {
  TransactionExplorerSidebar,
  type SidebarCategoryOption,
  type SidebarContact,
  type SidebarOption,
} from "@/components/transactions/TransactionExplorerSidebar";
import {
  GroupedTransactionList,
  type GroupedTxRow,
} from "@/components/transactions/GroupedTransactionList";
import { computeBillingWindow, formatReferenceLong } from "@/application/services/invoice";
import { currentCompetence, formatCompetence, parseCompetence } from "@/lib/format";

export const metadata = {
  title: "Transações — FinLux",
};

interface PageProps {
  searchParams: Promise<{
    m?: string;
    q?: string;
    people?: string;
    cards?: string;
    wallets?: string;
    cats?: string;
  }>;
}

interface TransactionRow {
  id: string;
  type: "expense" | "income";
  description: string;
  amount_cents: number | string;
  user_share_cents: number | string;
  occurred_at: string;
  split_mode: "none" | "equal" | "custom";
  operation: "card" | "pix" | "loan" | null;
  wallet_id: string | null;
  card_id: string | null;
  category_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  categories: { name: string; icon_name: string | null } | null;
  wallets: { name: string } | null;
  cards: { name: string } | null;
  transaction_splits: Array<{ contact_id: string }> | null;
}

function resolveCompetence(input?: string) {
  if (!input) return parseCompetence(currentCompetence());
  try {
    return parseCompetence(input);
  } catch {
    return parseCompetence(currentCompetence());
  }
}

function parseMulti(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function TransacoesPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const { year, month } = resolveCompetence(params.m);
  const q = (params.q ?? "").trim();
  const selectedPeople = parseMulti(params.people);
  const selectedCards = parseMulti(params.cards);
  const selectedWallets = parseMulti(params.wallets);
  const selectedCats = parseMulti(params.cats);
  const competence = `${year}-${String(month).padStart(2, "0")}`;
  const window = computeBillingWindow(year, month);

  const supabase = await createClient();
  await materializeRecurring(supabase, user.id, year, month);

  const [walletsRes, cardsRes, categoriesRes, contactsRes] = await Promise.all([
    supabase.from("wallets").select("id, name").order("name"),
    supabase.from("cards").select("id, name").order("name"),
    supabase.from("categories").select("id, name, icon_name").order("name"),
    supabase.from("contacts").select("id, name").order("name"),
  ]);

  const wallets: SidebarOption[] = (walletsRes.data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
  }));
  const cards: SidebarOption[] = (cardsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const categories: SidebarCategoryOption[] = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    iconName: c.icon_name ?? "Receipt",
  }));
  const contacts: SidebarContact[] = (contactsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    initial: c.name.charAt(0).toUpperCase(),
  }));

  let query = supabase
    .from("transactions")
    .select(
      "id, type, description, amount_cents, user_share_cents, occurred_at, split_mode, operation, wallet_id, card_id, category_id, installment_number, installment_total, categories(name, icon_name), wallets(name), cards(name), transaction_splits(contact_id)",
    )
    .gte("occurred_at", window.startIso)
    .lt("occurred_at", window.endIso)
    .order("occurred_at", { ascending: false });

  if (selectedCards.length > 0) query = query.in("card_id", selectedCards);
  if (selectedWallets.length > 0) query = query.in("wallet_id", selectedWallets);
  if (selectedCats.length > 0) query = query.in("category_id", selectedCats);
  if (q) query = query.ilike("description", `%${q}%`);

  const { data } = await query;
  const allTx = ((data ?? []) as unknown as TransactionRow[]) ?? [];

  // Filter by people (any split contact must match).
  const peopleSet = new Set(selectedPeople);
  const transactions =
    selectedPeople.length === 0
      ? allTx
      : allTx.filter((tx) =>
          (tx.transaction_splits ?? []).some((s) => peopleSet.has(s.contact_id)),
        );

  function toNumber(v: number | string) {
    return typeof v === "number" ? v : Number(v);
  }

  const contactsById = new Map(contacts.map((c) => [c.id, c]));

  const rows: GroupedTxRow[] = transactions.map((tx) => {
    const sourceLabel = tx.card_id ? (tx.cards?.name ?? "Cartão") : (tx.wallets?.name ?? "Conta");
    const participantInitials: string[] = ["Eu"];
    for (const s of tx.transaction_splits ?? []) {
      const initial = contactsById.get(s.contact_id)?.initial ?? "?";
      participantInitials.push(initial);
    }
    return {
      id: tx.id,
      type: tx.type,
      description: tx.description || "Sem descrição",
      occurredAt: new Date(tx.occurred_at),
      timeLabel: new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(tx.occurred_at)),
      iconName: tx.categories?.icon_name ?? "Receipt",
      amountCents: toNumber(tx.amount_cents),
      userShareCents: toNumber(tx.user_share_cents),
      hasSplit: tx.split_mode !== "none",
      sourceLabel,
      participantInitials,
      installmentNumber: tx.installment_number ?? 1,
      installmentTotal: tx.installment_total ?? 1,
    };
  });

  // Build a compact summary for the subtitle (e.g. "Outubro · FinLux Obs · Viagem +1")
  const summaryParts: string[] = [formatReferenceLong(year, month)];
  if (selectedCards.length > 0) {
    summaryParts.push(cards.find((c) => c.id === selectedCards[0])?.name ?? "Cartões");
    if (selectedCards.length > 1)
      summaryParts[summaryParts.length - 1] += ` +${selectedCards.length - 1}`;
  }
  if (selectedCats.length > 0) {
    summaryParts.push(categories.find((c) => c.id === selectedCats[0])?.name ?? "Categorias");
    if (selectedCats.length > 1)
      summaryParts[summaryParts.length - 1] += ` +${selectedCats.length - 1}`;
  }
  if (selectedPeople.length > 0) {
    summaryParts.push(contacts.find((c) => c.id === selectedPeople[0])?.name ?? "Pessoas");
    if (selectedPeople.length > 1)
      summaryParts[summaryParts.length - 1] += ` +${selectedPeople.length - 1}`;
  }
  const summary = summaryParts.join(" · ");

  return (
    <div className="gap-md grid grid-cols-1 md:grid-cols-[300px_1fr]">
      <div className="md:sticky md:top-[100px] md:h-[calc(100vh-120px)]">
        <TransactionExplorerSidebar
          competence={competence}
          q={q}
          selectedPeopleIds={selectedPeople}
          selectedCardIds={selectedCards}
          selectedWalletIds={selectedWallets}
          selectedCategoryIds={selectedCats}
          contacts={contacts}
          cards={cards}
          wallets={wallets}
          categories={categories}
        />
      </div>

      <section className="gap-md flex min-w-0 flex-col">
        <header className="gap-md flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <h1 className="text-display-lg text-gradient font-sans leading-none font-bold">
              Transações
            </h1>
            <p className="text-label-md text-on-surface-variant mt-2 flex flex-wrap items-center gap-2 font-mono">
              Exibindo: {summary} · {transactions.length}{" "}
              {transactions.length === 1 ? "lançamento" : "lançamentos"}
            </p>
          </div>
          <MonthSelector
            competence={competence}
            label={formatCompetence(year, month)}
            pathname="/transacoes"
          />
        </header>

        <GroupedTransactionList rows={rows} />
      </section>
    </div>
  );
}

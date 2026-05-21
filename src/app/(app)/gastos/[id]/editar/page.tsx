import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import {
  NewTransactionForm,
  type CategoryOption,
  type ContactOption,
  type SourceOption,
} from "@/components/transactions/NewTransactionForm";
import type { CreateTransactionInput } from "@/application/validation/transaction";

export const metadata = {
  title: "Editar lançamento — FinLux",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TransactionRow {
  id: string;
  type: "expense" | "income";
  amount_cents: number | string;
  description: string;
  occurred_at: string;
  category_id: string | null;
  wallet_id: string | null;
  card_id: string | null;
  split_mode: "none" | "equal" | "custom";
  user_included_in_split: boolean;
}

interface SplitRow {
  contact_id: string;
  amount_cents: number | string;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function formatCentsForInput(cents: number): string {
  if (cents === 0) return "";
  const reais = cents / 100;
  return reais.toFixed(2).replace(".", ",");
}

export default async function EditTransactionPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const [txRes, splitsRes, walletsRes, cardsRes, contactsRes, categoriesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, type, amount_cents, description, occurred_at, category_id, wallet_id, card_id, split_mode, user_included_in_split",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("transaction_splits").select("contact_id, amount_cents").eq("transaction_id", id),
    supabase
      .from("wallets")
      .select("id, name, account_type, is_default, banks(name)")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, name, wallets(name)")
      .order("created_at", { ascending: true }),
    supabase.from("contacts").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const tx = txRes.data as TransactionRow | null;
  if (!tx) notFound();

  const splits = ((splitsRes.data ?? []) as unknown as SplitRow[]) ?? [];

  const walletRows =
    (walletsRes.data as unknown as Array<{
      id: string;
      name: string;
      account_type: "PF" | "PJ";
      is_default: boolean;
      banks: { name: string } | null;
    }> | null) ?? [];

  const cardRows =
    (cardsRes.data as unknown as Array<{
      id: string;
      name: string;
      wallets: { name: string } | null;
    }> | null) ?? [];

  const contactsRows = (contactsRes.data ?? []) as Array<{ id: string; name: string }>;
  const categoryRows = (categoriesRes.data ?? []) as Array<{ id: string; name: string }>;

  const sources: SourceOption[] = [
    ...walletRows.map((w) => ({
      kind: "wallet" as const,
      id: w.id,
      label: w.name,
      hint: w.banks?.name ?? `Conta ${w.account_type}`,
    })),
    ...cardRows.map((c) => ({
      kind: "card" as const,
      id: c.id,
      label: c.name,
      hint: c.wallets?.name ? `Cartão · ${c.wallets.name}` : "Cartão de crédito",
    })),
  ];

  const categories: CategoryOption[] = categoryRows.map((cat) => ({ id: cat.id, name: cat.name }));
  const contacts: ContactOption[] = contactsRows.map((contact) => ({
    id: contact.id,
    name: contact.name,
    initial: contact.name.charAt(0).toUpperCase(),
  }));

  const source: CreateTransactionInput["source"] = tx.card_id
    ? { kind: "card", id: tx.card_id }
    : tx.wallet_id
      ? { kind: "wallet", id: tx.wallet_id }
      : sources[0]
        ? { kind: sources[0].kind, id: sources[0].id }
        : { kind: "wallet", id: "" };

  const participants: CreateTransactionInput["participants"] = splits.map((s) => ({
    contactId: s.contact_id,
    customAmountCents:
      tx.split_mode === "custom" ? formatCentsForInput(toNumber(s.amount_cents)) : "",
  }));

  const initialValues: CreateTransactionInput = {
    type: tx.type,
    amountCents: formatCentsForInput(toNumber(tx.amount_cents)),
    description: tx.description ?? "",
    occurredAt: tx.occurred_at.slice(0, 10),
    categoryId: tx.category_id ?? "",
    source,
    userIncludedInSplit: tx.user_included_in_split,
    participants,
  };

  return (
    <NewTransactionForm
      mode="edit"
      transactionId={tx.id}
      initialValues={initialValues}
      sources={sources}
      categories={categories}
      contacts={contacts}
    />
  );
}

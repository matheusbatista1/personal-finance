import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import {
  NewTransactionForm,
  type SourceOption,
  type CategoryOption,
  type ContactOption,
} from "@/components/transactions/NewTransactionForm";
import { fetchCategoriesForUser } from "@/infrastructure/services/activeItems";

export const metadata = {
  title: "Novo lançamento — FinLux",
};

export default async function NewTransactionPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [walletsRes, cardsRes, contactsRes, allCategories] = await Promise.all([
    supabase
      .from("wallets")
      .select("id, name, account_type, is_default, banks(name)")
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, name, wallets(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase.from("contacts").select("id, name").order("name", { ascending: true }),
    fetchCategoriesForUser(supabase, user.id),
  ]);
  const categoriesRes = { data: allCategories.filter((c) => c.effectiveActive) };

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

  const categories: CategoryOption[] = categoryRows.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  const contacts: ContactOption[] = contactsRows.map((contact) => ({
    id: contact.id,
    name: contact.name,
    initial: contact.name.charAt(0).toUpperCase(),
  }));

  return <NewTransactionForm sources={sources} categories={categories} contacts={contacts} />;
}

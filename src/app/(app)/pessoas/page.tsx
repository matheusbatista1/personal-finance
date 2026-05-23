import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { PersonCard } from "@/components/contacts/PersonCard";
import { AddPersonDialog } from "@/components/contacts/AddPersonDialog";

export const metadata = {
  title: "Pessoas — FinLux",
};

const PALETTE = ["primary", "tertiary", "secondary"] as const;

export default async function PessoasPage() {
  await requireUser();
  const supabase = await createClient();
  const t = await getTranslations("people");

  const [contactsRes, splitsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, color")
      .order("created_at", { ascending: true }),
    supabase.from("transaction_splits").select("contact_id, amount_cents, settled_at"),
  ]);

  const rows = contactsRes.data ?? [];
  const splitRows = (splitsRes.data ?? []) as Array<{
    contact_id: string;
    amount_cents: number | string;
    settled_at: string | null;
  }>;

  const receivableByContact = new Map<string, number>();
  for (const split of splitRows) {
    if (split.settled_at) continue;
    const amount =
      typeof split.amount_cents === "number" ? split.amount_cents : Number(split.amount_cents);
    receivableByContact.set(
      split.contact_id,
      (receivableByContact.get(split.contact_id) ?? 0) + amount,
    );
  }

  return (
    <>
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
            {t("kicker")}
          </span>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            {t("title")}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">{t("subtitle")}</p>
        </div>
        <AddPersonDialog />
      </header>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} copy={t("emptyCopy")} contactLabel={t("contact")} />
      ) : (
        <div className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row, idx) => (
            <PersonCard
              key={row.id}
              contactId={row.id}
              name={row.name}
              initial={row.name.charAt(0).toUpperCase()}
              role={row.color || t("contact")}
              email={row.email}
              owedToMeCents={receivableByContact.get(row.id) ?? 0}
              iOweCents={0}
              initialColor={PALETTE[idx % PALETTE.length] ?? "primary"}
            />
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState({
  title,
  copy,
  contactLabel,
}: {
  title: string;
  copy: string;
  contactLabel: string;
}) {
  return (
    <div className="glass-panel p-xl flex flex-col items-center justify-center rounded-2xl text-center">
      <div className="bg-primary-container/20 text-primary mb-md flex h-16 w-16 items-center justify-center rounded-2xl">
        <Users size={28} aria-hidden />
      </div>
      <h3 className="text-headline-md text-on-surface mb-xs font-sans font-semibold">{title}</h3>
      <p className="text-body-md text-on-surface-variant mb-lg max-w-[28rem] font-sans">{copy}</p>
      <p className="text-label-sm text-on-surface-variant font-mono">{contactLabel}</p>
    </div>
  );
}

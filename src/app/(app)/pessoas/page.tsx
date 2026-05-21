import { Users } from "lucide-react";
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

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, color")
    .order("created_at", { ascending: true });

  const rows = contacts ?? [];

  return (
    <>
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
            Rede
          </span>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            Gerenciar Pessoas
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">
            Adicione contatos para ratear gastos, registrar empréstimos e acompanhar saldos.
          </p>
        </div>
        <AddPersonDialog />
      </header>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row, idx) => (
            <PersonCard
              key={row.id}
              name={row.name}
              initial={row.name.charAt(0).toUpperCase()}
              role={row.color || "Contato"}
              owedToMeCents={0}
              iOweCents={0}
              initialColor={PALETTE[idx % PALETTE.length] ?? "primary"}
            />
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel p-xl flex flex-col items-center justify-center rounded-2xl text-center">
      <div className="bg-primary-container/20 text-primary mb-md flex h-16 w-16 items-center justify-center rounded-2xl">
        <Users size={28} aria-hidden />
      </div>
      <h3 className="text-headline-md text-on-surface mb-xs font-sans font-semibold">
        Você ainda não tem contatos
      </h3>
      <p className="text-body-md text-on-surface-variant mb-lg max-w-[28rem] font-sans">
        Adicione as pessoas com quem você divide gastos — Arthur, Mãe, sócios, amigos — para começar
        a usar o motor de rateio.
      </p>
      <p className="text-label-sm text-on-surface-variant font-mono">
        Use o botão <span className="text-primary font-semibold">Adicionar Pessoa</span> acima.
      </p>
    </div>
  );
}

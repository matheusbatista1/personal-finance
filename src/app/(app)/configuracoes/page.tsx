import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { NewCategoryButton } from "@/components/categories/CategoryFormDialog";
import { ActiveToggleRow } from "@/components/settings/ActiveToggleRow";
import { fetchCategoriesForUser } from "@/infrastructure/services/activeItems";

export const metadata = {
  title: "Configurações — FinLux",
};

export default async function ConfiguracoesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [categories, walletsRes, cardsRes] = await Promise.all([
    fetchCategoriesForUser(supabase, user.id),
    supabase
      .from("wallets")
      .select("id, name, is_active, is_default")
      .order("name", { ascending: true }),
    supabase.from("cards").select("id, name, is_active, color").order("name", { ascending: true }),
  ]);

  const walletRows = walletsRes.data ?? [];
  const cardRows = cardsRes.data ?? [];

  return (
    <>
      <header className="mb-lg">
        <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
          Dados
        </span>
        <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
          Configurações
        </h1>
        <p className="text-body-md text-on-surface-variant mt-sm font-sans">
          Categorias, contas e cartões. Perfil e segurança ficam no menu do avatar.
        </p>
      </header>

      <section className="glass-panel p-md md:p-lg mb-lg rounded-2xl">
        <div className="mb-md flex items-center justify-between">
          <div>
            <h3 className="text-headline-md text-on-surface font-sans font-semibold">Categorias</h3>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              {categories.filter((c) => c.effectiveActive).length} ativas · toggle para ocultar
            </p>
          </div>
          <NewCategoryButton />
        </div>
        {categories.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">
            Nenhuma categoria configurada ainda.
          </p>
        ) : (
          <div className="gap-base grid grid-cols-1 md:grid-cols-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-container-low gap-sm flex items-center rounded-xl p-2"
              >
                <div className="min-w-0 flex-1">
                  <CategoryChip
                    id={cat.id}
                    name={cat.name}
                    iconName={cat.icon_name}
                    color={cat.color}
                    kind={cat.kind}
                    editable={cat.user_id === user.id}
                  />
                </div>
                <ActiveToggleRow kind="category" id={cat.id} isActive={cat.effectiveActive} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-panel p-md md:p-lg mb-lg rounded-2xl">
        <div className="mb-md">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">Contas</h3>
          <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
            {walletRows.filter((w) => w.is_active).length} ativas · toggle para ocultar (a padrão
            não pode ser desativada).
          </p>
        </div>
        {walletRows.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">Sem contas.</p>
        ) : (
          <div className="gap-base grid grid-cols-1 md:grid-cols-2">
            {walletRows.map((w) => (
              <div
                key={w.id}
                className="bg-surface-container-low gap-sm flex items-center justify-between rounded-xl p-3"
              >
                <div>
                  <p className="text-body-md text-on-surface font-sans font-medium">{w.name}</p>
                  {w.is_default ? (
                    <p className="text-label-sm text-primary font-mono uppercase">Padrão</p>
                  ) : null}
                </div>
                <ActiveToggleRow
                  kind="wallet"
                  id={w.id}
                  isActive={w.is_active}
                  disabled={w.is_default}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-panel p-md md:p-lg mb-lg rounded-2xl">
        <div className="mb-md">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">Cartões</h3>
          <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
            {cardRows.filter((c) => c.is_active).length} ativos · toggle para ocultar
          </p>
        </div>
        {cardRows.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">Sem cartões.</p>
        ) : (
          <div className="gap-base grid grid-cols-1 md:grid-cols-2">
            {cardRows.map((c) => (
              <div
                key={c.id}
                className="bg-surface-container-low gap-sm flex items-center justify-between rounded-xl p-3"
              >
                <div className="gap-sm flex items-center">
                  <span
                    aria-hidden
                    className="inline-block h-6 w-6 rounded"
                    style={{ backgroundColor: c.color }}
                  />
                  <p className="text-body-md text-on-surface font-sans font-medium">{c.name}</p>
                </div>
                <ActiveToggleRow kind="card" id={c.id} isActive={c.is_active} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

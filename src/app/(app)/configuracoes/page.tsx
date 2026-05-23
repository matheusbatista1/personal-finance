import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("settings");

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
          {t("kicker")}
        </span>
        <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
          {t("title")}
        </h1>
        <p className="text-body-md text-on-surface-variant mt-sm font-sans">{t("subtitle")}</p>
      </header>

      <section className="glass-panel p-md md:p-lg mb-lg rounded-2xl">
        <div className="mb-md flex items-center justify-between">
          <div>
            <h3 className="text-headline-md text-on-surface font-sans font-semibold">
              {t("categories")}
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              {t("categoriesHint", {
                count: categories.filter((c) => c.effectiveActive).length,
              })}
            </p>
          </div>
          <NewCategoryButton />
        </div>
        {categories.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">{t("noCategories")}</p>
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
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">
            {t("accounts")}
          </h3>
          <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
            {t("accountsHint", { count: walletRows.filter((w) => w.is_active).length })}
          </p>
        </div>
        {walletRows.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">{t("noAccounts")}</p>
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
                    <p className="text-label-sm text-primary font-mono uppercase">
                      {t("defaultBadge")}
                    </p>
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
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">{t("cards")}</h3>
          <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
            {t("cardsHint", { count: cardRows.filter((c) => c.is_active).length })}
          </p>
        </div>
        {cardRows.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">{t("noCards")}</p>
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

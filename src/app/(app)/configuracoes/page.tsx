import { ChevronRight, Key, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { DangerZone } from "@/components/settings/DangerZone";

export const metadata = {
  title: "Configurações — FinLux",
};

export default async function ConfiguracoesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [profileRes, categoriesRes] = await Promise.all([
    supabase.from("profiles").select("display_name, created_at").eq("id", user.id).single(),
    supabase
      .from("categories")
      .select("id, name, icon_name, user_id")
      .order("name", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const categories = categoriesRes.data ?? [];

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
        new Date(profile.created_at),
      )
    : "—";

  return (
    <>
      <header className="mb-lg">
        <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
          Configurações
        </h1>
        <p className="text-body-md text-on-surface-variant mt-sm font-sans">
          Gerencie suas preferências de conta e segurança.
        </p>
      </header>

      <section className="glass-panel p-md md:p-lg mb-lg gap-md flex flex-col rounded-2xl md:flex-row md:items-center md:justify-between">
        <div className="gap-md flex items-center">
          <div className="bg-primary-container/20 text-primary text-headline-md flex h-16 w-16 items-center justify-center rounded-2xl font-mono font-semibold">
            {(profile?.display_name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">
              {profile?.display_name ?? "Sem nome"}
            </h2>
            <p className="text-label-sm text-primary mt-xs font-mono tracking-widest uppercase">
              Membro FinLux
            </p>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              Conta criada em {memberSince}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          title="Em breve"
          className="border-outline-variant/30 text-on-surface hover:bg-surface-variant/40 px-md py-sm rounded-full border font-sans font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          Editar perfil
        </button>
      </section>

      <div className="gap-md mb-lg grid grid-cols-1 lg:grid-cols-2">
        <section className="glass-panel p-md md:p-lg rounded-2xl">
          <div className="mb-md gap-sm flex items-center">
            <ShieldCheck size={20} aria-hidden className="text-primary" />
            <h3 className="text-headline-md text-on-surface font-sans font-semibold">Segurança</h3>
          </div>
          <div className="space-y-md">
            <SettingsRow
              label="E-mail"
              value={user.email ?? "—"}
              icon={<Mail size={18} aria-hidden />}
            />
            <SettingsRow
              label="Senha"
              value="Última alteração desconhecida"
              icon={<Key size={18} aria-hidden />}
              actionDisabled
            />
            <SettingsRow
              label="Autenticação em duas etapas"
              value="Desativada"
              icon={<ShieldCheck size={18} aria-hidden />}
              actionDisabled
            />
          </div>
        </section>

        <section className="glass-panel p-md md:p-lg rounded-2xl">
          <div className="mb-md gap-sm flex items-center">
            <Sparkles size={20} aria-hidden className="text-primary" />
            <h3 className="text-headline-md text-on-surface font-sans font-semibold">
              Preferências
            </h3>
          </div>
          <div className="space-y-md">
            <SettingsRow label="Idioma" value="Português (BR)" actionDisabled />
            <div>
              <p className="text-label-sm text-on-surface-variant mb-sm font-mono uppercase">
                Tema
              </p>
              <ThemeSelector />
            </div>
          </div>
        </section>
      </div>

      <section className="glass-panel p-md md:p-lg mb-lg rounded-2xl">
        <div className="mb-md flex items-center justify-between">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">Categorias</h3>
          <span className="text-label-sm text-on-surface-variant font-mono">
            {categories.length} ativas
          </span>
        </div>
        {categories.length === 0 ? (
          <p className="text-body-md text-on-surface-variant font-sans">
            Nenhuma categoria configurada ainda.
          </p>
        ) : (
          <div className="gap-base grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-container-low gap-sm p-sm flex items-center rounded-xl"
              >
                <div className="bg-primary-container/20 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <TransactionIcon name={cat.icon_name ?? "Receipt"} size={18} />
                </div>
                <span className="text-label-md text-on-surface font-sans font-medium">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <DangerZone />
    </>
  );
}

interface SettingsRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  actionDisabled?: boolean;
}

function SettingsRow({ label, value, icon, actionDisabled }: SettingsRowProps) {
  return (
    <div className="border-outline-variant/10 gap-md pb-sm flex items-center justify-between border-b last:border-0 last:pb-0">
      <div className="gap-sm flex items-center">
        {icon ? <span className="text-on-surface-variant">{icon}</span> : null}
        <div>
          <p className="text-label-sm text-on-surface-variant font-mono uppercase">{label}</p>
          <p className="text-body-md text-on-surface font-sans">{value}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={actionDisabled}
        title={actionDisabled ? "Em breve" : undefined}
        aria-label={`Alterar ${label.toLowerCase()}`}
        className="text-on-surface-variant hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight size={20} aria-hidden />
      </button>
    </div>
  );
}

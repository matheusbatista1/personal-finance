import { Key, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { DangerZone } from "@/components/settings/DangerZone";
import { EditProfileDialog } from "@/components/settings/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { TwoFactorPanel } from "@/components/settings/TwoFactorPanel";

export const metadata = {
  title: "Perfil — FinLux",
};

export default async function PerfilPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .single();

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
        new Date(profile.created_at as string),
      )
    : "—";

  return (
    <>
      <header className="mb-lg">
        <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
          Conta
        </span>
        <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">Perfil</h1>
        <p className="text-body-md text-on-surface-variant mt-sm font-sans">
          Sua identidade, segurança e preferências.
        </p>
      </header>

      <section className="glass-panel p-md md:p-lg mb-lg gap-md flex flex-col rounded-2xl md:flex-row md:items-center md:justify-between">
        <div className="gap-md flex items-center">
          <div className="bg-primary-container/20 text-primary text-headline-md flex h-16 w-16 items-center justify-center rounded-2xl font-mono font-semibold">
            {(profile?.display_name ?? user.email ?? "?").toString().charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">
              {(profile?.display_name as string | null) ?? "Sem nome"}
            </h2>
            <p className="text-label-sm text-primary mt-xs font-mono tracking-widest uppercase">
              Membro FinLux
            </p>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              Conta criada em {memberSince}
            </p>
          </div>
        </div>
        <EditProfileDialog currentName={(profile?.display_name as string | null) ?? ""} />
      </section>

      <div className="gap-md mb-lg grid grid-cols-1 lg:grid-cols-2">
        <section id="seguranca" className="glass-panel p-md md:p-lg scroll-mt-32 rounded-2xl">
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
              value="Defina uma nova senha quando quiser"
              icon={<Key size={18} aria-hidden />}
              actionSlot={<ChangePasswordDialog />}
            />
            <TwoFactorPanel />
          </div>
        </section>

        <section id="preferencias" className="glass-panel p-md md:p-lg scroll-mt-32 rounded-2xl">
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

      <DangerZone />
    </>
  );
}

interface SettingsRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  actionDisabled?: boolean;
  actionSlot?: React.ReactNode;
}

function SettingsRow({ label, value, icon, actionDisabled, actionSlot }: SettingsRowProps) {
  return (
    <div className="border-outline-variant/10 gap-md pb-sm flex items-center justify-between border-b last:border-0 last:pb-0">
      <div className="gap-sm flex items-center">
        {icon ? <span className="text-on-surface-variant">{icon}</span> : null}
        <div>
          <p className="text-label-sm text-on-surface-variant font-mono uppercase">{label}</p>
          <p className="text-body-md text-on-surface font-sans">{value}</p>
        </div>
      </div>
      {actionSlot ? (
        actionSlot
      ) : (
        <span
          aria-disabled={actionDisabled}
          className="text-on-surface-variant text-label-sm font-mono"
        >
          {actionDisabled ? "Em breve" : ""}
        </span>
      )}
    </div>
  );
}

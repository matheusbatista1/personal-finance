import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";

export async function DangerZone() {
  const t = await getTranslations("profile");
  return (
    <section className="border-error/30 bg-error/5 p-md md:p-lg gap-md flex flex-col rounded-2xl border md:flex-row md:items-center md:justify-between">
      <div className="gap-sm flex items-start">
        <AlertTriangle size={22} aria-hidden className="text-error mt-1 shrink-0" />
        <div>
          <h3 className="text-label-md text-error mb-xs font-mono tracking-wider uppercase">
            {t("dangerZone")}
          </h3>
          <p className="text-body-md text-on-surface-variant font-sans">{t("dangerCopy")}</p>
        </div>
      </div>
      <DeleteAccountDialog />
    </section>
  );
}

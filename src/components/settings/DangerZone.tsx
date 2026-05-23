import { AlertTriangle } from "lucide-react";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";

export function DangerZone() {
  return (
    <section className="border-error/30 bg-error/5 p-md md:p-lg gap-md flex flex-col rounded-2xl border md:flex-row md:items-center md:justify-between">
      <div className="gap-sm flex items-start">
        <AlertTriangle size={22} aria-hidden className="text-error mt-1 shrink-0" />
        <div>
          <h3 className="text-label-md text-error mb-xs font-mono tracking-wider uppercase">
            Zona perigosa
          </h3>
          <p className="text-body-md text-on-surface-variant font-sans">
            Após deletar a conta, todos os dados são removidos permanentemente. Não há como voltar
            atrás.
          </p>
        </div>
      </div>
      <DeleteAccountDialog />
    </section>
  );
}

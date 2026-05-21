import { AlertTriangle } from "lucide-react";

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
      <button
        type="button"
        disabled
        title="Em breve"
        className="border-error/50 text-error hover:bg-error/10 px-md py-sm shrink-0 rounded-full border font-sans font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        Deletar conta
      </button>
    </section>
  );
}

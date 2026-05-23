import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Página não encontrada — FinLux",
};

export default function NotFound() {
  return (
    <div className="bg-background text-on-background relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="floating-orb bg-primary-container absolute top-[-120px] left-[-120px] h-[480px] w-[480px]"
      />
      <div
        aria-hidden
        className="floating-orb bg-secondary-container absolute right-[-120px] bottom-[-120px] h-[420px] w-[420px]"
        style={{ animationDelay: "-5s" }}
      />

      <div
        className="glass-panel reveal-anim p-lg md:p-xl relative z-10 w-full max-w-[520px] rounded-[32px] text-center"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex justify-center">
          <Logo size={64} glow />
        </div>

        <p className="text-label-sm text-on-surface-variant mt-md font-mono tracking-[0.3em] uppercase">
          Erro 404
        </p>

        <h1
          className="text-display-lg mt-xs font-sans leading-none font-bold tracking-tight"
          style={{
            background: "linear-gradient(to bottom, #dcb8ff, #8a2be2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Caminho não encontrado
        </h1>

        <p className="text-body-md text-on-surface-variant mt-md font-sans">
          A página que você procurou saiu do mapa. Pode ter sido movida, renomeada — ou nunca
          existiu. Voltar ao início é o caminho mais curto.
        </p>

        <Link
          href="/"
          className="glow-button text-body-lg py-md mt-lg inline-block w-full rounded-xl bg-gradient-to-b from-[#8a2be2] to-[#9370db] font-sans font-bold text-white transition-all active:scale-[0.98]"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

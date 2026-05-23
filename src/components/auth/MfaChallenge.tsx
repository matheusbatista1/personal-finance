"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Logo } from "@/components/ui/Logo";
import { signOut, verifyMfa } from "@/actions/auth";

export function MfaChallenge() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [abandoned, setAbandoned] = useState(false);

  // If this tab never set the in-flight flag (meaning the auth flow didn't
  // originate here — e.g. user closed the tab mid-flow and opened a new one
  // while still holding an AAL1 session), sign the user out and bounce back
  // to the login.
  //
  // Note: this flag is a UX signal, not a security boundary. An attacker
  // could trivially set `sessionStorage["finlux_mfa_flow"] = "1"` via DevTools
  // — and even if they did, they'd still need to know the valid TOTP code to
  // get past verifyMfa, which validates server-side against Supabase. The
  // real security is the AAL2 check in getAuthState/requireUser.
  useEffect(() => {
    let inFlow = false;
    try {
      inFlow = sessionStorage.getItem("finlux_mfa_flow") === "1";
    } catch {
      inFlow = true; // play it safe and let them attempt
    }
    if (inFlow) return;

    setAbandoned(true);
    (async () => {
      try {
        await signOut();
      } catch {
        // server-action redirect throws NEXT_REDIRECT — that's the happy path.
      }
      // Defensive hard nav in case the action's redirect didn't fire.
      window.location.replace("/");
    })();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Use o código de 6 dígitos do seu autenticador.");
      return;
    }
    setError(null);
    try {
      sessionStorage.removeItem("finlux_splash_shown");
      sessionStorage.removeItem("finlux_mfa_flow");
      document.documentElement.removeAttribute("data-splash");
    } catch {
      // ignore
    }
    startTransition(async () => {
      const result = await verifyMfa({ code });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Hard nav so the splash plays on the freshly-mounted page.
      window.location.href = "/";
    });
  }

  if (abandoned) {
    return (
      <div className="glass-panel p-lg w-full max-w-[440px] rounded-[32px] text-center">
        <p className="text-label-sm text-on-surface-variant font-mono tracking-widest uppercase">
          Sessão expirada
        </p>
        <p className="text-body-md text-on-surface mt-sm font-sans">Redirecionando para o login…</p>
      </div>
    );
  }

  return (
    <div
      className="glass-panel reveal-anim p-md md:p-lg w-full max-w-[440px] rounded-[32px]"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="mb-lg gap-xs flex flex-col items-center text-center">
        <Logo size={64} glow />
        <h1 className="mt-sm text-headline-md text-primary font-sans font-semibold tracking-tight">
          FinLux
        </h1>
        <p className="text-label-sm text-on-surface-variant font-mono tracking-widest uppercase">
          Verificação em duas etapas
        </p>
      </div>

      <div className="mb-md gap-sm flex items-start">
        <span className="text-primary mt-1">
          <ShieldCheck size={20} aria-hidden />
        </span>
        <p className="text-body-md text-on-surface-variant font-sans">
          Abra seu app autenticador (Google Authenticator, Authy, 1Password) e digite o código de 6
          dígitos que aparece para o FinLux.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-md" noValidate>
        <div>
          <label
            htmlFor="mfa-code"
            className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
          >
            Código de 6 dígitos
          </label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            aria-invalid={Boolean(error)}
          />
        </div>

        {error ? <FormError>{error}</FormError> : null}

        <div className="pt-sm">
          <button
            type="submit"
            disabled={pending || code.length !== 6}
            className="glow-button text-body-lg py-md w-full rounded-xl bg-gradient-to-b from-[#8a2be2] to-[#9370db] font-sans font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Verificando…" : "Confirmar"}
          </button>
        </div>
      </form>

      <form action={signOut} className="text-center">
        <button
          type="submit"
          className="text-label-sm text-on-surface-variant hover:text-primary mt-md font-mono transition-colors"
        >
          Sair e tentar com outra conta
        </button>
      </form>
    </div>
  );
}

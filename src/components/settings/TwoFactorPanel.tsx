"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldCheck, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { createClient } from "@/infrastructure/database/supabase/client";
import { cn } from "@/lib/utils";

type Status = "loading" | "idle" | "enrolling" | "enrolled" | "error";

interface ActiveFactor {
  id: string;
  friendlyName: string;
}

export function TwoFactorPanel() {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [factors, setFactors] = useState<ActiveFactor[]>([]);
  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, startTransition] = useTransition();

  async function refresh() {
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
      setStatus("error");
      return;
    }
    const verified =
      data.totp
        ?.filter((f) => f.status === "verified")
        .map((f) => ({
          id: f.id,
          friendlyName: f.friendly_name || "Autenticador",
        })) ?? [];
    setFactors(verified);
    setStatus(verified.length > 0 ? "enrolled" : "idle");
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function beginEnrollment() {
    setError(null);
    startTransition(async () => {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "FinLux Authenticator",
      });
      if (enrollError || !data) {
        setError(enrollError?.message ?? "Falha ao iniciar 2FA.");
        return;
      }
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
      setStatus("enrolling");
    });
  }

  async function confirmEnrollment() {
    if (!enrollment) return;
    setError(null);
    startTransition(async () => {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (challengeError || !challenge) {
        setError(challengeError?.message ?? "Falha ao iniciar verificação.");
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) {
        setError("Código inválido. Tente novamente.");
        return;
      }
      setEnrollment(null);
      setCode("");
      await refresh();
    });
  }

  async function cancelEnrollment() {
    if (!enrollment) {
      setStatus(factors.length > 0 ? "enrolled" : "idle");
      return;
    }
    startTransition(async () => {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
      setEnrollment(null);
      setCode("");
      await refresh();
    });
  }

  async function disable(factorId: string) {
    setError(null);
    startTransition(async () => {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollError) {
        setError(unenrollError.message);
        return;
      }
      await refresh();
    });
  }

  const value =
    status === "loading"
      ? "Verificando…"
      : status === "enrolled"
        ? "Ativada (autenticador)"
        : "Desativada";

  return (
    <div className="border-outline-variant/10 gap-md pb-sm flex items-center justify-between border-b last:border-0 last:pb-0">
      <div className="gap-sm flex items-center">
        <span className="text-on-surface-variant">
          <ShieldCheck size={18} aria-hidden />
        </span>
        <div>
          <p className="text-label-sm text-on-surface-variant font-mono uppercase">
            Autenticação em duas etapas
          </p>
          <p className="text-body-md text-on-surface font-sans">{value}</p>
          {error ? <FormError>{error}</FormError> : null}
        </div>
      </div>

      {status === "loading" ? null : status === "enrolled" ? (
        <button
          type="button"
          onClick={() => factors[0] && disable(factors[0].id)}
          disabled={busy}
          className="border-error/40 text-error hover:bg-error/10 gap-xs flex items-center rounded-full border px-3 py-1 font-mono text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 size={12} aria-hidden />
          Desativar
        </button>
      ) : (
        <button
          type="button"
          onClick={beginEnrollment}
          disabled={busy}
          className="primary-gradient-btn rounded-full px-3 py-1 font-sans text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Aguarde…" : "Habilitar"}
        </button>
      )}

      {enrollment ? (
        <div
          role="dialog"
          aria-modal="true"
          className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelEnrollment();
          }}
        >
          <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2 className="text-headline-md text-on-surface font-sans font-semibold">
                  Habilitar 2FA
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Escaneie o QR no Google Authenticator, Authy ou 1Password e confirme com o código.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEnrollment}
                aria-label="Cancelar"
                className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="space-y-md">
              <div className="p-sm flex items-center justify-center rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- inline data URI from supabase, no remote optimization needed */}
                <img
                  src={enrollment.qrCode}
                  alt="QR code para configurar 2FA"
                  className="h-48 w-48"
                />
              </div>
              <div className="bg-surface-container-low p-sm rounded-lg">
                <p className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
                  Ou digite manualmente
                </p>
                <p className="text-body-md text-on-surface font-mono break-all select-all">
                  {enrollment.secret}
                </p>
              </div>
              <div>
                <label
                  htmlFor="totp-code"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Código de 6 dígitos
                </label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                />
              </div>
              {error ? <FormError>{error}</FormError> : null}
              <div className="gap-md flex justify-end">
                <button
                  type="button"
                  onClick={cancelEnrollment}
                  className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm rounded-full font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmEnrollment}
                  disabled={busy || code.length !== 6}
                  className={cn(
                    "primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {busy ? "Verificando…" : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

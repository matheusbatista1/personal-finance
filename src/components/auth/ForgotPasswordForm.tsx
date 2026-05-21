"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { requestPasswordReset } from "@/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/application/validation/auth";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-body-md text-on-surface font-sans">
        Se houver uma conta com esse e-mail, enviamos um link de recuperação. Confira sua caixa de
        entrada.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
      <div>
        <label
          htmlFor="email"
          className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
        >
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="voce@email.com"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        <FormError>{errors.email?.message}</FormError>
      </div>

      {serverError ? <FormError>{serverError}</FormError> : null}

      <div className="pt-sm">
        <button
          type="submit"
          disabled={isPending}
          className="glow-button text-body-lg py-md w-full rounded-xl bg-gradient-to-b from-[#8a2be2] to-[#9370db] font-sans font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Enviando…" : "Enviar link"}
        </button>
      </div>
    </form>
  );
}

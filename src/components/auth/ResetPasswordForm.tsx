"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { signOut, updatePassword } from "@/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/application/validation/auth";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  });

  function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePassword(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      // Sign the recovery session out and bounce to /, where the user can
      // log in fresh with their new password.
      try {
        await signOut();
      } catch {
        // signOut throws NEXT_REDIRECT — expected.
      }
      window.location.replace("/");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
      <div>
        <label
          htmlFor="password"
          className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
        >
          Nova senha
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        <FormError>{errors.password?.message}</FormError>
      </div>

      <div>
        <label
          htmlFor="passwordConfirm"
          className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
        >
          Confirmar senha
        </label>
        <Input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("passwordConfirm")}
          aria-invalid={Boolean(errors.passwordConfirm)}
        />
        <FormError>{errors.passwordConfirm?.message}</FormError>
      </div>

      {serverError ? <FormError>{serverError}</FormError> : null}

      <div className="pt-sm">
        <button
          type="submit"
          disabled={isPending}
          className="glow-button text-body-lg py-md w-full rounded-xl bg-gradient-to-b from-[#8a2be2] to-[#9370db] font-sans font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Salvando…" : "Salvar nova senha"}
        </button>
      </div>
    </form>
  );
}

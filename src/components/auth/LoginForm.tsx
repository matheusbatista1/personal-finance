"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { signInWithEmail } from "@/actions/auth";
import { signInSchema, type SignInInput } from "@/application/validation/auth";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: SignInInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signInWithEmail(values);
      if (result && !result.ok) {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="space-y-md">
      <GoogleButton label="Entrar com Google" />
      <div className="gap-sm flex items-center">
        <div className="bg-outline-variant/20 h-px flex-1" />
        <span className="text-label-sm text-on-surface-variant font-mono uppercase">ou</span>
        <div className="bg-outline-variant/20 h-px flex-1" />
      </div>
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

        <div>
          <div className="mb-xs flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-label-sm text-outline block font-mono tracking-wider uppercase"
            >
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-label-sm text-primary hover:text-on-surface font-mono transition-colors"
            >
              Esqueci a senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
          />
          <FormError>{errors.password?.message}</FormError>
        </div>

        {serverError ? <FormError>{serverError}</FormError> : null}

        <div className="pt-sm">
          <button
            type="submit"
            disabled={isPending}
            className="glow-button text-body-lg py-md w-full rounded-xl bg-gradient-to-b from-[#8a2be2] to-[#9370db] font-sans font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

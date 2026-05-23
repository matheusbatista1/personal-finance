"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { signUpWithEmail } from "@/actions/auth";
import { signUpSchema, type SignUpInput } from "@/application/validation/auth";

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  function onSubmit(values: SignUpInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpWithEmail(values);
      if (result && !result.ok) {
        setServerError(result.error);
        return;
      }
      if (result && result.ok) {
        setConfirmationSent(true);
      }
    });
  }

  if (confirmationSent) {
    return (
      <p className="text-body-md text-on-surface font-sans">
        Conta criada. Verifique seu e-mail para confirmar e entrar.
      </p>
    );
  }

  return (
    <div className="space-y-md">
      <GoogleButton label="Criar conta com Google" />
      <div className="gap-sm flex items-center">
        <div className="bg-outline-variant/20 h-px flex-1" />
        <span className="text-label-sm text-on-surface-variant font-mono uppercase">ou</span>
        <div className="bg-outline-variant/20 h-px flex-1" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
        <div>
          <label
            htmlFor="displayName"
            className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
          >
            Nome (opcional)
          </label>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            {...register("displayName")}
            aria-invalid={Boolean(errors.displayName)}
          />
          <FormError>{errors.displayName?.message}</FormError>
        </div>

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
            placeholder="voce@email.com"
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
          />
          <FormError>{errors.email?.message}</FormError>
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
          >
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
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
            {isPending ? "Criando conta…" : "Criar conta"}
          </button>
        </div>

        <p className="text-label-sm text-outline mt-md text-center font-mono">
          Ao continuar, você concorda com os{" "}
          <a href="#" className="text-on-surface underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="text-on-surface underline">
            Política de Privacidade
          </a>
          .
        </p>
      </form>
    </div>
  );
}

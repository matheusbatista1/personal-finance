"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
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
      <div className="gap-md flex flex-col">
        <p className="text-body-md text-on-surface font-sans">
          Conta criada. Verifique seu e-mail para confirmar e fazer login.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="gap-lg flex flex-col" noValidate>
      <div className="gap-xs flex flex-col">
        <Label htmlFor="displayName">Nome (opcional)</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          {...register("displayName")}
          aria-invalid={Boolean(errors.displayName)}
        />
        <FormError>{errors.displayName?.message}</FormError>
      </div>

      <div className="gap-xs flex flex-col">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        <FormError>{errors.email?.message}</FormError>
      </div>

      <div className="gap-xs flex flex-col">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        <FormError>{errors.password?.message}</FormError>
      </div>

      {serverError ? <FormError>{serverError}</FormError> : null}

      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}

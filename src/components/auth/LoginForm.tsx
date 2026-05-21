"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
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
    <form onSubmit={handleSubmit(onSubmit)} className="gap-lg flex flex-col" noValidate>
      <div className="gap-xs flex flex-col">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        <FormError>{errors.email?.message}</FormError>
      </div>

      <div className="gap-xs flex flex-col">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/forgot-password"
            className="text-label-sm text-primary font-mono hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        <FormError>{errors.password?.message}</FormError>
      </div>

      {serverError ? <FormError>{serverError}</FormError> : null}

      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
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

      {serverError ? <FormError>{serverError}</FormError> : null}

      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}

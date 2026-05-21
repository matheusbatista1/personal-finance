"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { updatePassword } from "@/actions/profile";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/application/validation/profile";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function close() {
    setOpen(false);
    setSuccess(false);
    setServerError(null);
    reset();
  }

  function onSubmit(values: UpdatePasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePassword(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
      reset();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Alterar senha"
        className="text-on-surface-variant hover:text-primary"
      >
        <ChevronRight size={20} aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2 className="text-headline-md text-on-surface font-sans font-semibold">
                  Alterar senha
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Mínimo 8 caracteres. Você continuará logado nessa sessão.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            {success ? (
              <div className="space-y-md">
                <p className="text-body-md text-on-surface font-sans">
                  Senha alterada. Use a nova senha no próximo login.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                  >
                    Nova senha
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    {...register("newPassword")}
                    aria-invalid={Boolean(errors.newPassword)}
                  />
                  <FormError>{errors.newPassword?.message}</FormError>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                  >
                    Confirmar nova senha
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  <FormError>{errors.confirmPassword?.message}</FormError>
                </div>

                {serverError ? <FormError>{serverError}</FormError> : null}

                <div className="pt-sm gap-md flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm rounded-full font-mono transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Alterando…" : "Alterar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

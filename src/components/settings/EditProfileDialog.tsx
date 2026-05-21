"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { updateProfile } from "@/actions/profile";
import { updateProfileSchema, type UpdateProfileInput } from "@/application/validation/profile";

interface Props {
  currentName: string;
}

export function EditProfileDialog({ currentName }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: currentName },
  });

  function onSubmit(values: UpdateProfileInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfile(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      reset({ displayName: values.displayName });
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-outline-variant/30 text-on-surface hover:bg-surface-variant/40 px-md py-sm gap-xs flex items-center rounded-full border font-sans font-semibold transition-all"
      >
        <Pencil size={14} aria-hidden />
        Editar perfil
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2 className="text-headline-md text-on-surface font-sans font-semibold">
                  Editar perfil
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Como você quer ser chamado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
              <div>
                <label
                  htmlFor="displayName"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Nome
                </label>
                <Input
                  id="displayName"
                  type="text"
                  autoFocus
                  {...register("displayName")}
                  aria-invalid={Boolean(errors.displayName)}
                />
                <FormError>{errors.displayName?.message}</FormError>
              </div>

              {serverError ? <FormError>{serverError}</FormError> : null}

              <div className="pt-sm gap-md flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm rounded-full font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

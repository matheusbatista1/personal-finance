"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { createContact } from "@/actions/contacts";
import { createContactSchema, type CreateContactInput } from "@/application/validation/contact";

export function AddPersonDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: { name: "", role: "", email: "" },
  });

  function onSubmit(values: CreateContactInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createContact(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="primary-gradient-btn gap-base px-md py-sm flex items-center rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95"
      >
        <Plus size={18} aria-hidden />
        Adicionar Pessoa
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-person-title"
          className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-glass p-md md:p-lg w-full max-w-md rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2
                  id="add-person-title"
                  className="text-headline-md text-on-surface font-sans font-semibold"
                >
                  Adicionar pessoa
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Para rateio de gastos e empréstimos.
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
                  htmlFor="name"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Nome
                </label>
                <Input
                  id="name"
                  type="text"
                  autoFocus
                  placeholder="Arthur"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
                <FormError>{errors.name?.message}</FormError>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Relação (opcional)
                </label>
                <Input
                  id="role"
                  type="text"
                  placeholder="Amigo, família, sócio…"
                  {...register("role")}
                  aria-invalid={Boolean(errors.role)}
                />
                <FormError>{errors.role?.message}</FormError>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  E-mail (opcional)
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="arthur@email.com"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                />
                <FormError>{errors.email?.message}</FormError>
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
                  {isPending ? "Adicionando…" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

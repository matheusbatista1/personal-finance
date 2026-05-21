"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { deleteContact, updateContact } from "@/actions/contacts";
import { createContactSchema, type CreateContactInput } from "@/application/validation/contact";
import { cn } from "@/lib/utils";

interface Props {
  contactId: string;
  initialValues: CreateContactInput;
  open: boolean;
  onClose: () => void;
}

export function EditContactDialog({ contactId, initialValues, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: initialValues,
  });

  if (!open) return null;

  function onSubmit(values: CreateContactInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateContact(contactId, values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      onClose();
    });
  }

  function onDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteContact(contactId);
      if (!result.ok) {
        setServerError(result.error);
        setConfirmingDelete(false);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
        <div className="mb-lg flex items-start justify-between">
          <div>
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">
              Editar pessoa
            </h2>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              Atualize o nome, relação ou e-mail.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
          <div>
            <label
              htmlFor="edit-contact-name"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Nome
            </label>
            <Input
              id="edit-contact-name"
              type="text"
              autoFocus
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="edit-contact-role"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Relação (opcional)
            </label>
            <Input
              id="edit-contact-role"
              type="text"
              placeholder="Amigo, família, sócio…"
              {...register("role")}
              aria-invalid={Boolean(errors.role)}
            />
            <FormError>{errors.role?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="edit-contact-email"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              E-mail (opcional)
            </label>
            <Input
              id="edit-contact-email"
              type="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            <FormError>{errors.email?.message}</FormError>
          </div>

          {serverError ? <FormError>{serverError}</FormError> : null}

          <div className="pt-sm flex items-center justify-between">
            <button
              type="button"
              onClick={onDeleteClick}
              disabled={deletePending}
              className={cn(
                "gap-xs px-md py-sm flex items-center rounded-full font-mono text-sm transition-colors",
                confirmingDelete
                  ? "bg-error text-on-error font-semibold"
                  : "text-error hover:bg-error/10",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Trash2 size={14} aria-hidden />
              {deletePending ? "Excluindo…" : confirmingDelete ? "Confirmar exclusão" : "Excluir"}
            </button>
            <div className="gap-sm flex">
              <button
                type="button"
                onClick={onClose}
                className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm rounded-full font-mono transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || deletePending}
                className="primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

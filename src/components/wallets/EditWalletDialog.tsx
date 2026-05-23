"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Combobox } from "@/components/ui/Combobox";
import { deleteWallet, updateWallet } from "@/actions/wallets";
import {
  createWalletSchema,
  type CreateWalletInput,
  type CreateWalletOutput,
} from "@/application/validation/wallet";
import type { BankOption } from "@/components/wallets/AddWalletDialog";
import { cn } from "@/lib/utils";

interface Props {
  walletId: string;
  isDefault: boolean;
  initialValues: CreateWalletInput;
  banks: BankOption[];
  open: boolean;
  onClose: () => void;
}

export function EditWalletDialog({
  walletId,
  isDefault,
  initialValues,
  banks,
  open,
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWalletInput, unknown, CreateWalletOutput>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: initialValues,
  });

  if (!open) return null;

  function onSubmit(values: CreateWalletOutput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateWallet(walletId, values);
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
      const result = await deleteWallet(walletId);
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
              Editar conta
            </h2>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              {isDefault
                ? "Esta é sua conta padrão (Outros). Não pode ser excluída."
                : "Renomeie, mude o banco ou ajuste o saldo inicial."}
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
              htmlFor="wallet-edit-name"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Nome
            </label>
            <Input
              id="wallet-edit-name"
              type="text"
              autoFocus
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="wallet-edit-bank"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Banco
            </label>
            <Controller
              control={control}
              name="bankId"
              render={({ field }) => (
                <Combobox
                  id="wallet-edit-bank"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Outros"
                  searchPlaceholder="Buscar banco…"
                  options={[
                    { value: "", label: "Outros" },
                    ...banks.map((b) => ({ value: b.id, label: b.name, hint: b.shortName })),
                  ]}
                />
              )}
            />
            <FormError>{errors.bankId?.message}</FormError>
          </div>

          <div>
            <span className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase">
              Tipo
            </span>
            <div className="gap-sm flex">
              {(["PF", "PJ"] as const).map((option) => (
                <label
                  key={option}
                  className="bg-surface-container-low border-outline-variant/30 has-[:checked]:border-primary has-[:checked]:bg-primary-container/10 has-[:checked]:text-primary text-on-surface-variant py-sm flex flex-1 cursor-pointer items-center justify-center rounded-md border font-mono font-medium transition-all"
                >
                  <input
                    type="radio"
                    value={option}
                    className="sr-only"
                    {...register("accountType")}
                  />
                  {option}
                </label>
              ))}
            </div>
            <FormError>{errors.accountType?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="wallet-edit-balance"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Saldo inicial (R$)
            </label>
            <Input
              id="wallet-edit-balance"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              {...register("balanceCents")}
              aria-invalid={Boolean(errors.balanceCents)}
            />
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              O saldo real é este valor + receitas − despesas.
            </p>
            <FormError>{errors.balanceCents?.message}</FormError>
          </div>

          {serverError ? <FormError>{serverError}</FormError> : null}

          <div className="pt-sm flex items-center justify-between">
            {!isDefault ? (
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
            ) : (
              <span />
            )}
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

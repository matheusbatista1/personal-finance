"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { deleteCard, updateCard } from "@/actions/cards";
import {
  createCardSchema,
  type CreateCardInput,
  type CreateCardOutput,
} from "@/application/validation/card";
import type { WalletOption } from "@/components/wallets/AddCardDialog";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { value: "#2a2a2a", label: "Obsidian" },
  { value: "#6b7280", label: "Cinza" },
  { value: "#4a148c", label: "Purple" },
  { value: "#8a2be2", label: "Violet" },
  { value: "#b76e79", label: "Rose Gold" },
  { value: "#0a6e4a", label: "Emerald" },
  { value: "#1a3a8a", label: "Sapphire" },
  { value: "#7a1f2e", label: "Carmine" },
  { value: "#c9a96e", label: "Champagne" },
] as const;

interface Props {
  cardId: string;
  wallets: WalletOption[];
  initialValues: CreateCardInput;
}

export function EditCardDialog({ cardId, wallets, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCardInput, unknown, CreateCardOutput>({
    resolver: zodResolver(createCardSchema),
    defaultValues: initialValues,
  });

  const currentColor = watch("color");

  function onSubmit(values: CreateCardOutput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateCard(cardId, values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  function onDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteCard(cardId);
      if (!result.ok) {
        setServerError(result.error);
        setConfirmingDelete(false);
        return;
      }
      setOpen(false);
      window.location.assign("/carteira");
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
        Editar cartão
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
          <div className="modal-glass p-md md:p-lg w-full max-w-[32rem] rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2 className="text-headline-md text-on-surface font-sans font-semibold">
                  Editar cartão
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Mude nome, cor, conta vinculada ou datas.
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
                  htmlFor="edit-card-name"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Nome do cartão
                </label>
                <Input
                  id="edit-card-name"
                  type="text"
                  autoFocus
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
                <FormError>{errors.name?.message}</FormError>
              </div>

              <div>
                <label
                  htmlFor="edit-card-wallet"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Conta vinculada
                </label>
                <select
                  id="edit-card-wallet"
                  className="bg-surface-container-low border-outline-variant/50 focus:border-primary text-on-surface py-sm px-sm w-full rounded-md border-b font-sans outline-none focus:ring-0"
                  {...register("walletId")}
                  aria-invalid={Boolean(errors.walletId)}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                      {wallet.isDefault ? " (padrão)" : ""}
                    </option>
                  ))}
                </select>
                <FormError>{errors.walletId?.message}</FormError>
              </div>

              <div>
                <label
                  htmlFor="edit-card-limit"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Limite total (R$)
                </label>
                <Input
                  id="edit-card-limit"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  {...register("creditLimitCents")}
                  aria-invalid={Boolean(errors.creditLimitCents)}
                />
                <FormError>{errors.creditLimitCents?.message}</FormError>
              </div>

              <div className="gap-md grid grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-closing-day"
                    className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                  >
                    Dia de fechamento
                  </label>
                  <Input
                    id="edit-closing-day"
                    type="number"
                    min={1}
                    max={31}
                    {...register("closingDay")}
                    aria-invalid={Boolean(errors.closingDay)}
                  />
                  <FormError>{errors.closingDay?.message}</FormError>
                </div>
                <div>
                  <label
                    htmlFor="edit-due-day"
                    className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                  >
                    Dia de vencimento
                  </label>
                  <Input
                    id="edit-due-day"
                    type="number"
                    min={1}
                    max={31}
                    {...register("dueDay")}
                    aria-invalid={Boolean(errors.dueDay)}
                  />
                  <FormError>{errors.dueDay?.message}</FormError>
                </div>
              </div>

              <div>
                <span className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase">
                  Cor
                </span>
                <div className="gap-sm grid grid-cols-4 sm:grid-cols-8">
                  {COLOR_PRESETS.map((preset) => {
                    const selected = currentColor === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        aria-label={preset.label}
                        aria-pressed={selected}
                        onClick={() => setValue("color", preset.value, { shouldValidate: true })}
                        className={cn(
                          "relative h-12 rounded-lg border-2 transition-all",
                          selected ? "border-primary scale-105" : "border-transparent",
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${preset.value}, color-mix(in srgb, ${preset.value} 45%, #000))`,
                        }}
                      />
                    );
                  })}
                </div>
                <FormError>{errors.color?.message}</FormError>
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
                  {deletePending
                    ? "Excluindo…"
                    : confirmingDelete
                      ? "Confirmar exclusão"
                      : "Excluir"}
                </button>
                <div className="gap-sm flex">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
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
      ) : null}
    </>
  );
}

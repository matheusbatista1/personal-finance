"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Combobox } from "@/components/ui/Combobox";
import { createWallet } from "@/actions/wallets";
import {
  createWalletSchema,
  type CreateWalletInput,
  type CreateWalletOutput,
} from "@/application/validation/wallet";

export interface BankOption {
  id: string;
  name: string;
  shortName: string;
}

interface AddWalletDialogProps {
  banks: BankOption[];
}

export function AddWalletDialog({ banks }: AddWalletDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateWalletInput, unknown, CreateWalletOutput>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      name: "",
      bankId: "",
      accountType: "PF",
      balanceCents: "0",
    },
  });

  function onSubmit(values: CreateWalletOutput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createWallet(values);
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
        Nova conta
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-wallet-title"
          className="bg-background/60 p-margin-mobile md:p-lg fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
            <div className="mb-lg flex items-start justify-between">
              <div>
                <h2
                  id="add-wallet-title"
                  className="text-headline-md text-on-surface font-sans font-semibold"
                >
                  Nova conta bancária
                </h2>
                <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                  Sem dados sensíveis — só o essencial para acompanhar saldo.
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
                  placeholder="Conta principal, Investimento, etc."
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
                <FormError>{errors.name?.message}</FormError>
              </div>

              <div>
                <label
                  htmlFor="bankId"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Banco
                </label>
                <Controller
                  control={control}
                  name="bankId"
                  render={({ field }) => (
                    <Combobox
                      id="bankId"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Outros"
                      searchPlaceholder="Buscar banco…"
                      ariaInvalid={Boolean(errors.bankId)}
                      options={[
                        { value: "", label: "Outros" },
                        ...banks.map((b) => ({
                          value: b.id,
                          label: b.name,
                          hint: b.shortName,
                        })),
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
                  htmlFor="balanceCents"
                  className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                >
                  Saldo inicial (R$)
                </label>
                <Input
                  id="balanceCents"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  {...register("balanceCents")}
                  aria-invalid={Boolean(errors.balanceCents)}
                />
                <FormError>{errors.balanceCents?.message}</FormError>
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
                  {isPending ? "Criando…" : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

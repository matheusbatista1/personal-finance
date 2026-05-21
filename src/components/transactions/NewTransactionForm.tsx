"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { X, Wallet, CreditCard, Users, Plus, Trash2, Check, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import {
  createTransaction,
  deleteTransaction,
  toggleSplitSettlement,
  updateTransaction,
} from "@/actions/transactions";
import {
  createTransactionSchema,
  type CreateTransactionInput,
  type CreateTransactionOutput,
} from "@/application/validation/transaction";
import { calculateSplit, InvalidSplitError } from "@/application/services/splitCalculator";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SourceOption {
  kind: "wallet" | "card";
  id: string;
  label: string;
  hint?: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface ContactOption {
  id: string;
  name: string;
  initial: string;
}

export interface ExistingSplit {
  id: string;
  contactId: string;
  settledAt: string | null;
}

type Mode = "create" | "edit";

interface Props {
  sources: SourceOption[];
  categories: CategoryOption[];
  contacts: ContactOption[];
  mode?: Mode;
  transactionId?: string;
  initialValues?: CreateTransactionInput;
  existingSplits?: ExistingSplit[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseAmountToCents(raw: string | undefined | null): number {
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

export function NewTransactionForm({
  sources,
  categories,
  contacts,
  mode = "create",
  transactionId,
  initialValues,
  existingSplits,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [settlePendingId, setSettlePendingId] = useState<string | null>(null);
  const [settlementState, setSettlementState] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const split of existingSplits ?? []) {
      initial[split.contactId] = split.settledAt;
    }
    return initial;
  });

  const splitIdByContact = useMemo(() => {
    const map = new Map<string, string>();
    for (const split of existingSplits ?? []) {
      map.set(split.contactId, split.id);
    }
    return map;
  }, [existingSplits]);

  function onToggleSettled(contactId: string) {
    const splitId = splitIdByContact.get(contactId);
    if (!splitId) return;
    setSettlePendingId(splitId);
    void toggleSplitSettlement(splitId).then((result) => {
      if (result.ok) {
        setSettlementState((prev) => ({
          ...prev,
          [contactId]: prev[contactId] ? null : new Date().toISOString(),
        }));
      }
      setSettlePendingId(null);
    });
  }

  const defaultSource = sources[0];

  const form = useForm<CreateTransactionInput, unknown, CreateTransactionOutput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: initialValues ?? {
      type: "expense",
      amountCents: "",
      description: "",
      occurredAt: todayIso(),
      categoryId: "",
      source: defaultSource
        ? { kind: defaultSource.kind, id: defaultSource.id }
        : { kind: "wallet", id: "" },
      operation: "",
      installmentTotal: 1,
      userIncludedInSplit: true,
      participants: [],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const watchedAmount = watch("amountCents");
  const watchedParticipants = watch("participants");
  const watchedDividido = watch("userIncludedInSplit");
  const watchedSource = watch("source");
  const watchedType = watch("type");

  const splitEnabled = fields.length > 0;

  const liveSplit = useMemo(() => {
    const amountCents = parseAmountToCents(watchedAmount);
    if (amountCents === 0) return null;
    try {
      return calculateSplit({
        amountCents,
        participants: (watchedParticipants ?? []).map((p) => ({
          contactId: p.contactId,
          customAmountCents:
            p.customAmountCents == null || p.customAmountCents === ""
              ? null
              : parseAmountToCents(p.customAmountCents),
        })),
        userIncludedInSplit: watchedDividido,
      });
    } catch (error) {
      return error instanceof InvalidSplitError ? { error: error.message } : null;
    }
  }, [watchedAmount, watchedParticipants, watchedDividido]);

  function onSubmit(values: CreateTransactionOutput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && transactionId
          ? await updateTransaction(transactionId, values)
          : await createTransaction(values);
      if (result && !result.ok) setServerError(result.error);
    });
  }

  function onDeleteClick() {
    if (!transactionId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteTransaction(transactionId);
      if (result && !result.ok) {
        setServerError(result.error);
        setConfirmingDelete(false);
      }
    });
  }

  const availableContacts = contacts.filter((c) => !fields.some((f) => f.contactId === c.id));

  const title = mode === "edit" ? "Editar lançamento" : "Novo lançamento";
  const subtitle =
    mode === "edit"
      ? "Ajuste valores, rateio e categoria."
      : "Despesa, receita ou rateio entre pessoas.";
  const submitLabel = mode === "edit" ? "Salvar alterações" : "Salvar";

  return (
    <div
      className="bg-background/70 p-margin-mobile md:p-lg fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <Link href="/dashboard" className="absolute inset-0 cursor-default" aria-label="Fechar" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="modal-glass relative my-auto w-full max-w-[680px] rounded-2xl"
        noValidate
      >
        <header className="border-outline-variant/10 p-md flex items-start justify-between border-b">
          <div>
            <h1 className="text-headline-md text-on-surface font-sans font-semibold">{title}</h1>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">{subtitle}</p>
          </div>
          <Link
            href="/dashboard"
            aria-label="Fechar"
            className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <X size={20} aria-hidden />
          </Link>
        </header>

        <div className="p-md md:p-lg space-y-md max-h-[70vh] overflow-y-auto">
          <div className="glass-panel p-xs flex w-fit gap-2 rounded-lg">
            {(["expense", "income"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("type", option)}
                className={cn(
                  "px-md py-sm rounded-md font-mono text-sm transition-all",
                  watchedType === option
                    ? "bg-surface-container-high text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {option === "expense" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          <div className="gap-xs flex flex-col">
            <label
              htmlFor="amount"
              className="text-label-sm text-primary font-mono tracking-wider uppercase"
            >
              Valor
            </label>
            <div className="text-display-lg text-on-surface flex items-center font-sans font-bold">
              <span className="text-on-surface-variant mr-xs">R$</span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="text-display-lg placeholder-on-surface-variant/30 w-full bg-transparent font-sans font-bold outline-none"
                {...register("amountCents")}
                aria-invalid={Boolean(errors.amountCents)}
              />
            </div>
            <FormError>{errors.amountCents?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase"
            >
              Descrição
            </label>
            <Input
              id="description"
              type="text"
              placeholder="ex.: Jantar Fogo de Chão"
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
            />
            <FormError>{errors.description?.message}</FormError>
          </div>

          <div className="gap-md grid grid-cols-1 md:grid-cols-2">
            <div>
              <label
                htmlFor="categoryId"
                className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase"
              >
                Categoria
              </label>
              <select
                id="categoryId"
                className="bg-surface-container-low border-outline-variant/50 focus:border-primary text-on-surface py-sm px-sm w-full rounded-md border-b font-sans outline-none focus:ring-0"
                {...register("categoryId")}
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <FormError>{errors.categoryId?.message}</FormError>
            </div>
            <div>
              <label
                htmlFor="occurredAt"
                className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase"
              >
                Data
              </label>
              <Input id="occurredAt" type="date" {...register("occurredAt")} />
              <FormError>{errors.occurredAt?.message}</FormError>
            </div>
          </div>

          <div>
            <span className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase">
              Origem
            </span>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <div className="gap-sm flex flex-wrap">
                  {sources.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant font-sans">
                      Cadastre uma conta ou cartão primeiro.
                    </p>
                  ) : null}
                  {sources.map((source) => {
                    const selected =
                      field.value.kind === source.kind && field.value.id === source.id;
                    const Icon = source.kind === "wallet" ? Wallet : CreditCard;
                    return (
                      <button
                        key={`${source.kind}-${source.id}`}
                        type="button"
                        onClick={() => field.onChange({ kind: source.kind, id: source.id })}
                        className={cn(
                          "glass-panel gap-sm py-sm px-md flex items-center rounded-lg transition-all",
                          selected
                            ? "border-primary/50 bg-primary-container/10 text-primary"
                            : "text-on-surface-variant hover:bg-surface-variant/30",
                        )}
                      >
                        <Icon size={18} aria-hidden />
                        <div className="text-left">
                          <div className="text-label-md font-mono">{source.label}</div>
                          {source.hint ? (
                            <div className="text-label-sm text-on-surface-variant font-mono">
                              {source.hint}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <FormError>{errors.source?.message as string | undefined}</FormError>
          </div>

          <div className="gap-md grid grid-cols-1 md:grid-cols-2">
            <div>
              <label
                htmlFor="operation"
                className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase"
              >
                Operação (opcional)
              </label>
              <select
                id="operation"
                className="bg-surface-container-low border-outline-variant/50 focus:border-primary text-on-surface py-sm px-sm w-full rounded-md border-b font-sans outline-none focus:ring-0"
                {...register("operation")}
              >
                <option value="">Sem operação</option>
                <option value="card">Cartão de outra pessoa</option>
                <option value="pix">Pix</option>
                <option value="loan">Empréstimo</option>
              </select>
              <FormError>{errors.operation?.message}</FormError>
            </div>
            {watchedSource.kind === "card" && mode === "create" ? (
              <div>
                <label
                  htmlFor="installmentTotal"
                  className="text-label-sm text-on-surface-variant mb-xs block font-mono tracking-wider uppercase"
                >
                  Parcelas
                </label>
                <Input
                  id="installmentTotal"
                  type="number"
                  min={1}
                  max={36}
                  {...register("installmentTotal")}
                  aria-invalid={Boolean(errors.installmentTotal)}
                />
                <FormError>{errors.installmentTotal?.message}</FormError>
              </div>
            ) : null}
          </div>

          <section className="glass-panel p-md gap-md flex flex-col rounded-xl">
            <div className="flex items-center justify-between">
              <div className="gap-sm flex items-center">
                <div className="bg-surface-container text-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <Users size={16} aria-hidden />
                </div>
                <div>
                  <h3 className="text-body-lg text-on-surface font-sans font-semibold">Rateio</h3>
                  <p className="text-label-sm text-on-surface-variant font-mono">
                    {splitEnabled
                      ? `${fields.length} ${fields.length === 1 ? "pessoa" : "pessoas"}`
                      : "Sem rateio"}
                  </p>
                </div>
              </div>
              <label className="gap-sm flex cursor-pointer items-center select-none">
                <span className="text-label-sm text-on-surface-variant font-mono">Dividido</span>
                <input type="checkbox" className="sr-only" {...register("userIncludedInSplit")} />
                <span
                  className={cn(
                    "relative inline-block h-6 w-12 cursor-pointer rounded-full border transition-colors",
                    watchedDividido
                      ? "bg-primary-container/40 border-primary/40"
                      : "bg-surface-container-highest border-outline-variant/30",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full transition-transform",
                      watchedDividido
                        ? "bg-primary translate-x-7"
                        : "bg-on-surface-variant translate-x-1",
                    )}
                  />
                </span>
              </label>
            </div>

            {splitEnabled ? (
              <ul className="gap-sm flex flex-col">
                {fields.map((field, index) => {
                  const contact = contacts.find((c) => c.id === field.contactId);
                  if (!contact) return null;
                  const splitId = splitIdByContact.get(field.contactId);
                  const settledAt = settlementState[field.contactId] ?? null;
                  const isSettled = Boolean(settledAt);
                  const isToggling = settlePendingId === splitId;
                  return (
                    <li
                      key={field.id}
                      className="bg-surface-container-low gap-sm p-sm flex items-center rounded-lg"
                    >
                      <div className="bg-primary-container/20 text-primary flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-semibold">
                        {contact.initial}
                      </div>
                      <span className="text-body-md text-on-surface flex-1 font-sans font-medium">
                        {contact.name}
                      </span>
                      {mode === "edit" && splitId ? (
                        <button
                          type="button"
                          onClick={() => onToggleSettled(field.contactId)}
                          disabled={isToggling}
                          aria-pressed={isSettled}
                          title={isSettled ? "Marcar como pendente" : "Marcar como pago"}
                          className={cn(
                            "gap-xs flex items-center rounded-full border px-2 py-1 font-mono text-[11px] transition-colors disabled:opacity-60",
                            isSettled
                              ? "border-tertiary/40 bg-tertiary/10 text-tertiary"
                              : "border-outline-variant/30 text-on-surface-variant hover:border-tertiary/40 hover:text-tertiary",
                          )}
                        >
                          {isSettled ? (
                            <RotateCcw size={12} aria-hidden />
                          ) : (
                            <Check size={12} aria-hidden />
                          )}
                          {isSettled ? "Pago" : "Marcar pago"}
                        </button>
                      ) : null}
                      <div className="gap-xs flex items-center">
                        <span className="text-label-sm text-on-surface-variant font-mono">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Igual"
                          className="bg-surface-container border-outline-variant/30 focus:border-primary text-on-surface w-24 rounded-md border-b px-2 py-1 text-right font-mono text-sm outline-none focus:ring-0"
                          {...register(`participants.${index}.customAmountCents`)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Remover ${contact.name}`}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {availableContacts.length > 0 ? (
              <div className="gap-xs flex flex-wrap">
                {availableContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => append({ contactId: contact.id, customAmountCents: "" })}
                    className="border-outline-variant/30 hover:border-primary/50 hover:text-primary text-on-surface-variant gap-xs flex items-center rounded-full border px-3 py-1 font-mono text-sm transition-colors"
                  >
                    <Plus size={14} aria-hidden />
                    {contact.name}
                  </button>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant font-mono">
                Cadastre pessoas em{" "}
                <Link href="/pessoas" className="text-primary hover:underline">
                  /pessoas
                </Link>{" "}
                para usar o rateio.
              </p>
            ) : null}

            {liveSplit && "error" in liveSplit ? (
              <FormError>{liveSplit.error}</FormError>
            ) : liveSplit && liveSplit.userShareCents !== null ? (
              <div className="bg-surface-container-low p-sm rounded-lg">
                <p className="text-label-sm text-on-surface-variant mb-xs font-mono uppercase">
                  Prévia do rateio
                </p>
                <div className="gap-xs flex flex-col">
                  <PreviewRow
                    label="Você"
                    amountCents={liveSplit.userShareCents}
                    accent="primary"
                  />
                  {liveSplit.splits.map((split) => {
                    const contact = contacts.find((c) => c.id === split.contactId);
                    return (
                      <PreviewRow
                        key={split.contactId}
                        label={contact?.name ?? "?"}
                        amountCents={split.amountCents}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          {serverError ? <FormError>{serverError}</FormError> : null}
        </div>

        <footer className="border-outline-variant/10 p-md bg-surface/30 gap-sm flex items-center justify-between border-t">
          {mode === "edit" && transactionId ? (
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
            <p className="text-label-sm text-on-surface-variant font-mono">
              {sourceHint(watchedType, watchedSource.kind)}
            </p>
          )}
          <div className="gap-sm flex">
            <Link
              href="/dashboard"
              className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm rounded-full font-mono transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending || deletePending}
              className="primary-gradient-btn px-lg py-sm rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Salvando…" : submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function sourceHint(type: "expense" | "income", kind: "wallet" | "card"): string {
  if (type === "income") {
    return kind === "card" ? "Abate a fatura (estorno)" : "Entra na conta";
  }
  return kind === "card" ? "Vai pra fatura do cartão" : "Sai da conta";
}

function PreviewRow({
  label,
  amountCents,
  accent,
}: {
  label: string;
  amountCents: number;
  accent?: "primary";
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-body-md font-sans",
          accent === "primary" ? "text-primary font-semibold" : "text-on-surface",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-label-md font-mono",
          accent === "primary" ? "text-primary font-semibold" : "text-on-surface",
        )}
      >
        {formatBRL(amountCents)}
      </span>
    </div>
  );
}

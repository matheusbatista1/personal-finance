"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import {
  allowedCategoryIcons,
  createCategorySchema,
  type CreateCategoryInput,
} from "@/application/validation/category";
import { cn } from "@/lib/utils";

interface Props {
  mode: "create" | "edit";
  categoryId?: string;
  initialValues?: CreateCategoryInput;
  open: boolean;
  onClose: () => void;
  onCreated?: (category: {
    id: string;
    name: string;
    iconName: string;
    kind: "expense" | "income" | "both";
  }) => void;
}

const ICON_OPTIONS = allowedCategoryIcons;

const DEFAULT_VALUES: CreateCategoryInput = {
  name: "",
  iconName: "Receipt",
  color: "",
  kind: "expense",
};

export function CategoryFormDialog({
  mode,
  categoryId,
  initialValues,
  open,
  onClose,
  onCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });

  if (!open) return null;

  const selectedIcon = watch("iconName") ?? "Receipt";

  function onSubmit(values: CreateCategoryInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && categoryId
          ? await updateCategory(categoryId, values)
          : await createCategory(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      if (mode === "create" && result.id && onCreated) {
        onCreated({
          id: result.id,
          name: values.name,
          iconName: values.iconName,
          kind: values.kind,
        });
      }
      onClose();
    });
  }

  function onDeleteClick() {
    if (!categoryId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setServerError(null);
    startDeleteTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.ok) {
        setServerError(result.error);
        setConfirmingDelete(false);
        return;
      }
      onClose();
    });
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="bg-background/80 p-margin-mobile md:p-lg fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
        <div className="mb-lg flex items-start justify-between">
          <div>
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">
              {mode === "edit" ? "Editar categoria" : "Nova categoria"}
            </h2>
            <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
              Personalize ícone e cor da sua categoria.
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
              htmlFor="category-name"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Nome
            </label>
            <Input
              id="category-name"
              type="text"
              autoFocus
              placeholder="Ex.: Streaming, Academia…"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div>
            <span className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase">
              Aplica-se a
            </span>
            <div className="gap-xs grid grid-cols-3">
              {(["expense", "income", "both"] as const).map((opt) => (
                <label
                  key={opt}
                  className="bg-surface-container-low border-outline-variant/30 has-[:checked]:border-primary has-[:checked]:bg-primary-container/10 has-[:checked]:text-primary text-on-surface-variant py-sm flex cursor-pointer items-center justify-center rounded-md border font-mono text-sm transition-all"
                >
                  <input type="radio" value={opt} className="sr-only" {...register("kind")} />
                  {opt === "expense" ? "Despesa" : opt === "income" ? "Receita" : "Ambos"}
                </label>
              ))}
            </div>
            <FormError>{errors.kind?.message}</FormError>
          </div>

          <div>
            <span className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase">
              Ícone
            </span>
            <div className="gap-xs grid grid-cols-7">
              {ICON_OPTIONS.map((icon) => {
                const active = icon === selectedIcon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue("iconName", icon, { shouldDirty: true })}
                    aria-pressed={active}
                    aria-label={icon}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
                      active
                        ? "bg-primary-container/20 border-primary text-primary"
                        : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    <TransactionIcon name={icon} size={18} />
                  </button>
                );
              })}
            </div>
            <FormError>{errors.iconName?.message}</FormError>
          </div>

          <div>
            <label
              htmlFor="category-color"
              className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
            >
              Cor (opcional)
            </label>
            <Input
              id="category-color"
              type="text"
              placeholder="#8a2be2"
              {...register("color")}
              aria-invalid={Boolean(errors.color)}
            />
            <FormError>{errors.color?.message}</FormError>
          </div>

          {serverError ? <FormError>{serverError}</FormError> : null}

          <div className="pt-sm flex items-center justify-between">
            {mode === "edit" ? (
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
                {isPending ? "Salvando…" : mode === "edit" ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function NewCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="primary-gradient-btn gap-xs px-md py-sm flex items-center rounded-full font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-95"
      >
        <Plus size={16} aria-hidden />
        Nova
      </button>
      <CategoryFormDialog mode="create" open={open} onClose={() => setOpen(false)} />
    </>
  );
}

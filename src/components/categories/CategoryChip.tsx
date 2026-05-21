"use client";

import { useState } from "react";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import type { CreateCategoryInput } from "@/application/validation/category";
import { allowedCategoryIcons } from "@/application/validation/category";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  iconName: string | null;
  color: string | null;
  editable: boolean;
}

function isAllowedIcon(value: string | null): value is (typeof allowedCategoryIcons)[number] {
  return Boolean(value) && (allowedCategoryIcons as readonly string[]).includes(value as string);
}

export function CategoryChip({ id, name, iconName, color, editable }: Props) {
  const [open, setOpen] = useState(false);

  const initialValues: CreateCategoryInput = {
    name,
    iconName: isAllowedIcon(iconName) ? iconName : "Receipt",
    color: color ?? "",
  };

  const inner = (
    <>
      <div className="bg-primary-container/20 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
        <TransactionIcon name={iconName ?? "Receipt"} size={18} />
      </div>
      <span className="text-label-md text-on-surface font-sans font-medium">{name}</span>
    </>
  );

  if (!editable) {
    return (
      <div className="bg-surface-container-low gap-sm p-sm flex items-center rounded-xl opacity-80">
        {inner}
        <span className="text-on-surface-variant ml-auto font-mono text-[10px] uppercase">sys</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${name}`}
        className={cn(
          "bg-surface-container-low gap-sm p-sm focus-visible:ring-primary/50 group flex w-full items-center rounded-xl transition-all hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none",
        )}
      >
        {inner}
      </button>
      <CategoryFormDialog
        mode="edit"
        categoryId={id}
        initialValues={initialValues}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

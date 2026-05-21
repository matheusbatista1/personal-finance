"use client";

import { useState, useTransition } from "react";
import { setWalletActive } from "@/actions/wallets";
import { setCardActive } from "@/actions/cards";
import { setCategoryActive } from "@/actions/categories";
import { cn } from "@/lib/utils";

interface Props {
  kind: "wallet" | "card" | "category";
  id: string;
  isActive: boolean;
  disabled?: boolean;
}

export function ActiveToggleRow({ kind, id, isActive, disabled }: Props) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    if (disabled) return;
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result =
        kind === "wallet"
          ? await setWalletActive(id, next)
          : kind === "card"
            ? await setCardActive(id, next)
            : await setCategoryActive(id, next);
      if (!result.ok) {
        setActive(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || pending}
      aria-pressed={active}
      aria-label={active ? "Desativar" : "Ativar"}
      className={cn(
        "relative inline-block h-6 w-12 shrink-0 rounded-full border transition-colors",
        active
          ? "bg-primary-container/40 border-primary/40"
          : "bg-surface-container-highest border-outline-variant/30",
        disabled ? "opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-4 w-4 rounded-full transition-all",
          active ? "bg-primary right-1" : "bg-on-surface-variant left-1",
        )}
      />
    </button>
  );
}

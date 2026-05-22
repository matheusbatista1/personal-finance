"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/actions/auth";

interface Props {
  initial: string;
}

export function AvatarMenu({ initial }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
        className="border-outline-variant/20 bg-surface-container-high text-label-sm text-primary hover:border-primary/50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border font-mono font-semibold transition-colors"
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          className="modal-glass border-outline-variant/30 absolute right-0 z-50 mt-2 w-56 rounded-xl border py-2 shadow-xl"
        >
          <Link
            role="menuitem"
            href="/perfil"
            onClick={() => setOpen(false)}
            className="gap-sm px-md py-sm text-body-md text-on-surface hover:bg-primary-container/20 hover:text-primary flex cursor-pointer items-center font-sans transition-colors"
          >
            <UserRound size={16} aria-hidden />
            Editar perfil
          </Link>
          <div className="border-outline-variant/20 mx-md my-1 border-t" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="gap-sm px-md py-sm text-body-md text-error hover:bg-error/10 flex w-full cursor-pointer items-center font-sans transition-colors"
            >
              <LogOut size={16} aria-hidden />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

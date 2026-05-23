"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { deleteAccount } from "@/actions/profile";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount({ confirm });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirm("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-error/50 text-error hover:bg-error/10 px-md py-sm shrink-0 cursor-pointer rounded-full border font-sans font-semibold transition-all"
      >
        Deletar conta
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              className="bg-background/80 p-margin-mobile fixed inset-0 z-[120] flex items-center justify-center backdrop-blur-md"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div className="modal-glass p-md md:p-lg w-full max-w-[28rem] rounded-2xl">
                <div className="mb-lg flex items-start justify-between">
                  <div className="gap-sm flex items-start">
                    <AlertTriangle size={24} aria-hidden className="text-error mt-1 shrink-0" />
                    <div>
                      <h2 className="text-headline-md text-on-surface font-sans font-semibold">
                        Deletar conta
                      </h2>
                      <p className="text-label-sm text-on-surface-variant mt-xs font-mono">
                        Esta ação é irreversível. Todos os seus dados serão removidos.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar"
                    className="text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
                  >
                    <X size={20} aria-hidden />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-md" noValidate>
                  <div>
                    <label
                      htmlFor="delete-confirm"
                      className="text-label-sm text-outline mb-xs block font-mono tracking-wider uppercase"
                    >
                      Digite <span className="text-error">DELETAR</span> para confirmar
                    </label>
                    <Input
                      id="delete-confirm"
                      type="text"
                      autoFocus
                      autoComplete="off"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="DELETAR"
                    />
                  </div>

                  {error ? <FormError>{error}</FormError> : null}

                  <div className="pt-sm gap-sm flex justify-end">
                    <button
                      type="button"
                      onClick={close}
                      disabled={pending}
                      className="text-label-md text-on-surface hover:bg-surface-variant/50 px-lg py-sm cursor-pointer rounded-full font-mono transition-colors disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pending || confirm !== "DELETAR"}
                      className="bg-error text-on-error px-lg py-sm cursor-pointer rounded-full font-sans font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? "Excluindo…" : "Excluir conta"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

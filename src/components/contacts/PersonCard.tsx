"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, MoreVertical } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import type { CreateContactInput } from "@/application/validation/contact";

interface PersonCardProps {
  contactId: string;
  name: string;
  initial: string;
  role: string;
  email: string | null;
  owedToMeCents: number;
  iOweCents: number;
  active?: boolean;
  initialColor: "primary" | "tertiary" | "secondary";
}

const initialBg: Record<PersonCardProps["initialColor"], string> = {
  primary: "bg-primary-container/30 text-primary",
  tertiary: "bg-tertiary-container/30 text-tertiary",
  secondary: "bg-secondary-container/30 text-secondary",
};

export function PersonCard({
  contactId,
  name,
  initial,
  role,
  email,
  owedToMeCents,
  iOweCents,
  active,
  initialColor,
}: PersonCardProps) {
  const [open, setOpen] = useState(false);

  const initialValues: CreateContactInput = {
    name,
    role: role === "Contato" ? "" : role,
    email: email ?? "",
  };

  return (
    <>
      <article className="glass-panel group p-md gap-md hover:shadow-primary/10 relative flex flex-col rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Editar ${name}`}
          className="focus-visible:ring-primary/50 absolute inset-0 z-10 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        />
        <div className="pointer-events-none relative z-0 flex items-start justify-between">
          <div className="relative">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl font-mono text-2xl font-semibold transition-all duration-500",
                initialBg[initialColor],
              )}
            >
              {initial}
            </div>
            {active ? (
              <div
                aria-hidden
                className="border-surface absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 bg-green-500"
              />
            ) : null}
          </div>
          <div className="text-outline-variant" aria-hidden>
            <MoreVertical size={20} />
          </div>
        </div>

        <div className="pointer-events-none relative z-0">
          <h4 className="text-headline-md text-on-surface font-sans font-semibold">{name}</h4>
          <p className="text-label-sm text-outline font-mono">{role}</p>
        </div>

        <div className="space-y-base border-outline-variant/10 pt-base pointer-events-none relative z-0 border-t">
          <div className="flex items-center justify-between">
            <span className="text-label-sm text-on-surface-variant font-mono">A receber</span>
            <span
              className={cn(
                "text-label-md font-mono",
                owedToMeCents > 0 ? "text-tertiary font-semibold" : "text-on-surface",
              )}
            >
              {formatBRL(owedToMeCents)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label-sm text-on-surface-variant font-mono">A pagar</span>
            <span
              className={cn(
                "text-label-md font-mono",
                iOweCents > 0 ? "text-error font-semibold" : "text-on-surface",
              )}
            >
              {formatBRL(iOweCents)}
            </span>
          </div>
        </div>
        <Link
          href={`/pessoas/${contactId}/relatorio`}
          onClick={(e) => e.stopPropagation()}
          className="border-outline-variant/30 hover:border-primary/50 hover:text-primary text-on-surface-variant gap-xs px-md py-sm relative z-20 flex cursor-pointer items-center justify-center rounded-full border font-mono text-sm transition-colors"
        >
          <FileText size={14} aria-hidden />
          Ver relatório
        </Link>
      </article>
      <EditContactDialog
        contactId={contactId}
        initialValues={initialValues}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

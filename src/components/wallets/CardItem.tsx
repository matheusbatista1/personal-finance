"use client";

import Link from "next/link";
import { Nfc } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CardItemProps {
  id: string;
  name: string;
  color: string;
  creditLimitCents: number;
  availableLimitCents: number;
  dueDay: number;
  isActive?: boolean;
  onActivate?: () => void;
}

export function CardItem({
  id,
  name,
  color,
  creditLimitCents,
  availableLimitCents,
  dueDay,
  isActive = false,
  onActivate,
}: CardItemProps) {
  const isDarkCard = isDark(color);
  const onSurface = isDarkCard ? "text-white" : "text-on-surface";
  const onMuted = isDarkCard ? "text-white/70" : "text-on-surface-variant";

  const background = `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 45%, #000))`;

  return (
    <Link
      href={`/fatura/${id}`}
      aria-label={`Abrir fatura de ${name}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      className={cn(
        "wallet-card p-md focus-visible:ring-primary/50 relative flex h-[220px] w-full flex-col justify-between overflow-hidden rounded-[1.25rem] border border-white/10 focus-visible:ring-2 focus-visible:outline-none",
        isActive && "wallet-card--active",
      )}
      style={{ background }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className={`text-label-sm font-mono tracking-wider uppercase ${onMuted}`}>{name}</p>
          <p className={`text-body-md mt-1 font-sans ${onSurface}`}>Crédito</p>
        </div>
        <Nfc size={28} className={onSurface} aria-hidden />
      </div>

      <div className="relative z-10">
        <p className={`text-label-md mb-1 font-mono ${onMuted}`}>Limite total</p>
        <p className={`text-headline-md font-sans font-semibold tracking-tight ${onSurface}`}>
          {formatBRL(creditLimitCents)}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <p className={`text-label-sm font-mono ${onMuted}`}>
            Disponível {formatBRL(availableLimitCents)}
          </p>
          <p className={`text-label-sm font-mono ${onMuted}`}>Vence dia {dueDay}</p>
        </div>
      </div>
    </Link>
  );
}

function isDark(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return true;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

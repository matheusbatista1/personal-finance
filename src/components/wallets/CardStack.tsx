"use client";

import { useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { CardItem } from "@/components/wallets/CardItem";

export interface CardRow {
  id: string;
  name: string;
  color: string;
  creditLimitCents: number;
  availableLimitCents: number;
  dueDay: number;
}

interface CardStackProps {
  cards: CardRow[];
}

// Visual layout constants. Keep in sync with globals.css `.wallet-stack`:
// each next card overlaps by 160px, leaving 60px of header visible per card.
const STACK_TOP_PADDING = 12; // matches `pt-sm`
const SLOT_HEIGHT = 60;
const CARD_HEIGHT = 220;

export function CardStack({ cards }: CardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  function pickSlot(clientX: number, clientY: number): number | null {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    // Bail out if pointer is outside the horizontal bounds.
    if (clientX < rect.left || clientX > rect.right) return null;

    const y = clientY - rect.top - STACK_TOP_PADDING;
    if (y < 0) return null;

    const lastIdx = cards.length - 1;
    // Slots 0..lastIdx-1 are tight 60px lanes (the visible header strip each
    // card peeks above the next one).
    if (y < SLOT_HEIGHT * lastIdx) {
      return Math.floor(y / SLOT_HEIGHT);
    }
    // The last card's lane extends down through its full body (it has nothing
    // overlapping it from below).
    const lastBottom = SLOT_HEIGHT * lastIdx + CARD_HEIGHT;
    if (y <= lastBottom) return lastIdx;
    return null;
  }

  function handleMove(e: React.MouseEvent) {
    const slot = pickSlot(e.clientX, e.clientY);
    if (slot === null) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    const target = cards[slot];
    if (target && target.id !== activeId) {
      setActiveId(target.id);
    }
  }

  function handleLeave() {
    setActiveId(null);
  }

  if (cards.length === 0) {
    return (
      <div className="glass-panel p-lg flex h-[260px] flex-col items-center justify-center rounded-2xl text-center">
        <div className="bg-primary-container/20 text-primary mb-md flex h-14 w-14 items-center justify-center rounded-2xl">
          <CreditCard size={24} aria-hidden />
        </div>
        <h3 className="text-body-lg text-on-surface mb-xs font-sans font-semibold">
          Nenhum cartão ainda
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-[24rem] font-sans">
          Adicione um cartão de crédito para começar a registrar gastos e organizar suas faturas.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="wallet-stack pt-sm relative pb-[200px]"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {cards.map((card) => (
        <CardItem
          key={card.id}
          id={card.id}
          name={card.name}
          color={card.color}
          creditLimitCents={card.creditLimitCents}
          availableLimitCents={card.availableLimitCents}
          dueDay={card.dueDay}
          isActive={activeId === card.id}
          onActivate={() => setActiveId(card.id)}
        />
      ))}
    </div>
  );
}

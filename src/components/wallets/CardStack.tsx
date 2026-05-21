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

export function CardStack({ cards }: CardStackProps) {
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
    <div className="wallet-stack pt-sm relative pb-[200px]">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          name={card.name}
          color={card.color}
          creditLimitCents={card.creditLimitCents}
          availableLimitCents={card.availableLimitCents}
          dueDay={card.dueDay}
        />
      ))}
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/infrastructure/database/supabase/server";
import { CardStack, type CardRow } from "@/components/wallets/CardStack";
import { BankList, type BankRow } from "@/components/wallets/BankList";
import { WalletTotals } from "@/components/wallets/WalletTotals";
import { AddWalletDialog, type BankOption } from "@/components/wallets/AddWalletDialog";
import { AddCardDialog, type WalletOption } from "@/components/wallets/AddCardDialog";
import {
  effectiveBalance,
  fetchCardUsedLimits,
  fetchWalletNetFlows,
} from "@/infrastructure/services/walletBalances";

export const metadata = {
  title: "Carteira — FinLux",
};

interface WalletQueryRow {
  id: string;
  name: string;
  balance_cents: number | string;
  account_type: "PF" | "PJ";
  is_default: boolean;
  bank_id: string | null;
  banks: { name: string; brand_color: string | null; short_name: string } | null;
}

interface CardQueryRow {
  id: string;
  name: string;
  color: string;
  credit_limit_cents: number | string;
  due_day: number;
  closing_day: number;
  wallet_id: string;
}

interface BankQueryRow {
  id: string;
  name: string;
  short_name: string;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export default async function CarteiraPage() {
  await requireUser();
  const supabase = await createClient();

  const [walletsRes, cardsRes, banksRes, netFlows, cardUsed] = await Promise.all([
    supabase
      .from("wallets")
      .select(
        "id, name, balance_cents, account_type, is_default, bank_id, banks(name, brand_color, short_name)",
      )
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, name, color, credit_limit_cents, due_day, closing_day, wallet_id")
      .order("created_at", { ascending: true }),
    supabase.from("banks").select("id, name, short_name").order("name"),
    fetchWalletNetFlows(supabase),
    fetchCardUsedLimits(supabase),
  ]);

  const wallets = ((walletsRes.data ?? []) as unknown as WalletQueryRow[]) ?? [];
  const cards = ((cardsRes.data ?? []) as unknown as CardQueryRow[]) ?? [];
  const banks = ((banksRes.data ?? []) as unknown as BankQueryRow[]) ?? [];

  const cardRows: CardRow[] = cards.map((card) => {
    const limit = toNumber(card.credit_limit_cents);
    const used = cardUsed.get(card.id) ?? 0;
    return {
      id: card.id,
      name: card.name,
      color: card.color,
      creditLimitCents: limit,
      availableLimitCents: Math.max(0, limit - used),
      dueDay: card.due_day,
    };
  });

  const bankRows: BankRow[] = wallets.map((wallet) => ({
    walletId: wallet.id,
    walletName: wallet.name,
    bankId: wallet.bank_id,
    bankName: wallet.banks?.name ?? null,
    brandColor: wallet.banks?.brand_color ?? null,
    shortName: wallet.banks?.short_name ?? null,
    initialBalanceCents: toNumber(wallet.balance_cents),
    balanceCents: effectiveBalance(toNumber(wallet.balance_cents), netFlows.get(wallet.id)),
    accountType: wallet.account_type,
    isDefault: wallet.is_default,
  }));

  const consolidatedCents = bankRows.reduce((sum, row) => sum + row.balanceCents, 0);
  const totalCreditLimitCents = cardRows.reduce((sum, card) => sum + card.creditLimitCents, 0);

  const bankOptions: BankOption[] = banks.map((bank) => ({
    id: bank.id,
    name: bank.name,
    shortName: bank.short_name,
  }));
  const walletOptions: WalletOption[] = wallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    isDefault: wallet.is_default,
  }));

  return (
    <>
      <header className="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <span className="text-label-sm text-primary mb-2 block font-mono tracking-[0.2em] uppercase">
            Patrimônio
          </span>
          <h1 className="text-display-lg text-on-surface font-sans leading-none font-bold">
            Carteira
          </h1>
          <p className="text-body-md text-on-surface-variant mt-sm font-sans">
            Suas contas e cartões em um único lugar.
          </p>
        </div>
        <div className="gap-sm flex flex-wrap items-center">
          <AddCardDialog wallets={walletOptions} />
          <AddWalletDialog banks={bankOptions} />
        </div>
      </header>

      <div className="gap-lg lg:gap-gutter grid grid-cols-1 lg:grid-cols-12">
        <section className="gap-md flex flex-col lg:col-span-5">
          <div className="flex items-end justify-between">
            <h2 className="text-headline-md text-on-surface font-sans font-semibold">
              Minha Carteira
            </h2>
            <span className="text-label-sm text-on-surface-variant font-mono">
              {cardRows.length} {cardRows.length === 1 ? "cartão" : "cartões"}
            </span>
          </div>
          <CardStack cards={cardRows} />
        </section>

        <section className="gap-lg flex flex-col lg:col-span-7">
          <BankList rows={bankRows} banks={bankOptions} />
          <WalletTotals
            consolidatedCents={consolidatedCents}
            totalCreditLimitCents={totalCreditLimitCents}
          />
        </section>
      </div>
    </>
  );
}

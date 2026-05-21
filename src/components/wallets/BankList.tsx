import { BankItem } from "@/components/wallets/BankItem";
import type { BankOption } from "@/components/wallets/AddWalletDialog";

export interface BankRow {
  walletId: string;
  walletName: string;
  bankId: string | null;
  bankName: string | null;
  brandColor: string | null;
  shortName: string | null;
  initialBalanceCents: number;
  balanceCents: number;
  accountType: "PF" | "PJ";
  isDefault: boolean;
}

interface BankListProps {
  rows: BankRow[];
  banks: BankOption[];
}

export function BankList({ rows, banks }: BankListProps) {
  return (
    <div className="glass-panel p-md md:p-lg gap-md flex flex-col rounded-xl">
      <div className="border-outline-variant/20 pb-sm flex items-center justify-between border-b">
        <h2 className="text-headline-md text-on-surface font-sans font-semibold">
          Contas Bancárias
        </h2>
        <span className="text-label-sm text-on-surface-variant font-mono">
          {rows.length} {rows.length === 1 ? "conta" : "contas"}
        </span>
      </div>
      <ul className="gap-xs flex flex-col">
        {rows.map((row) => (
          <li key={row.walletId}>
            <BankItem
              walletId={row.walletId}
              walletName={row.walletName}
              bankId={row.bankId}
              bankName={row.bankName}
              brandColor={row.brandColor}
              shortName={row.shortName}
              initialBalanceCents={row.initialBalanceCents}
              balanceCents={row.balanceCents}
              accountType={row.accountType}
              isDefault={row.isDefault}
              banks={banks}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

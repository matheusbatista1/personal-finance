import { BankItem } from "@/components/wallets/BankItem";

export interface BankRow {
  walletId: string;
  walletName: string;
  bankName: string | null;
  brandColor: string | null;
  shortName: string | null;
  balanceCents: number;
  accountType: "PF" | "PJ";
  isDefault: boolean;
}

interface BankListProps {
  rows: BankRow[];
}

export function BankList({ rows }: BankListProps) {
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
              walletName={row.walletName}
              bankName={row.bankName}
              brandColor={row.brandColor}
              shortName={row.shortName}
              balanceCents={row.balanceCents}
              accountType={row.accountType}
              isDefault={row.isDefault}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

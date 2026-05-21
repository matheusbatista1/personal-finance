import { Landmark } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BankItemProps {
  walletName: string;
  bankName: string | null;
  brandColor: string | null;
  shortName: string | null;
  balanceCents: number;
  accountType: "PF" | "PJ";
  isDefault: boolean;
}

export function BankItem({
  walletName,
  bankName,
  brandColor,
  shortName,
  balanceCents,
  accountType,
  isDefault,
}: BankItemProps) {
  return (
    <div
      className={cn(
        "p-sm group relative flex items-center justify-between overflow-hidden rounded-lg border transition-all hover:bg-white/5",
        isDefault ? "bg-primary-container/5 border-primary/20" : "border-transparent",
      )}
    >
      {isDefault ? (
        <div aria-hidden className="bg-primary absolute top-0 bottom-0 left-0 w-1" />
      ) : null}
      <div className="gap-md flex items-center pl-2">
        <BankAvatar brandColor={brandColor} shortName={shortName} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-body-lg text-on-surface font-sans font-semibold">
              {walletName}
            </span>
            {isDefault ? (
              <span className="bg-surface-variant text-on-surface-variant border-outline-variant/30 rounded border px-2 py-0.5 font-mono text-[10px]">
                Padrão
              </span>
            ) : null}
          </div>
          <span className="text-label-sm text-on-surface-variant font-mono">
            {bankName ?? "Sem banco"}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-body-lg text-on-surface font-sans font-medium">
          {formatBRL(balanceCents)}
        </span>
        <span
          className={cn(
            "text-label-sm font-mono",
            accountType === "PJ" ? "text-tertiary" : "text-emerald-400",
          )}
        >
          {accountType}
        </span>
      </div>
    </div>
  );
}

function BankAvatar({
  brandColor,
  shortName,
}: {
  brandColor: string | null;
  shortName: string | null;
}) {
  if (!brandColor || !shortName) {
    return (
      <div className="bg-surface-container border-outline-variant/30 text-primary flex h-12 w-12 items-center justify-center rounded-full border">
        <Landmark size={20} aria-hidden />
      </div>
    );
  }

  const display = shortName.length > 4 ? shortName.slice(0, 4) : shortName;

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full border font-mono text-xs font-bold"
      style={{
        backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
        borderColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
        color: brandColor,
      }}
    >
      {display}
    </div>
  );
}

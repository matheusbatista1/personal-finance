import { MoreVertical } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  name: string;
  initial: string;
  role: string;
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
  name,
  initial,
  role,
  owedToMeCents,
  iOweCents,
  active,
  initialColor,
}: PersonCardProps) {
  return (
    <article className="glass-panel group p-md gap-md hover:shadow-primary/10 flex flex-col rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between">
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
        <button
          type="button"
          aria-label="Opções"
          className="text-outline-variant hover:text-on-surface transition-colors"
        >
          <MoreVertical size={20} aria-hidden />
        </button>
      </div>

      <div>
        <h4 className="text-headline-md text-on-surface font-sans font-semibold">{name}</h4>
        <p className="text-label-sm text-outline font-mono">{role}</p>
      </div>

      <div className="space-y-base border-outline-variant/10 pt-base border-t">
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
    </article>
  );
}

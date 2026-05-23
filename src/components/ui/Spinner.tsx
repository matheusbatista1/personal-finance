import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizes: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? "Carregando"}
      className={cn("inline-flex flex-col items-center gap-2", className)}
    >
      <span
        aria-hidden
        className={cn(
          "border-primary-container/30 border-t-primary inline-block animate-spin rounded-full",
          sizes[size],
        )}
      />
      {label ? (
        <span className="text-label-sm text-on-surface-variant font-mono uppercase">{label}</span>
      ) : null}
    </span>
  );
}

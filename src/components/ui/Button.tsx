import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "primary-gradient-btn text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50",
  ghost:
    "text-on-surface hover:bg-surface-variant/50 focus-visible:ring-2 focus-visible:ring-primary/50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "text-label-md gap-sm px-lg py-sm inline-flex items-center justify-center rounded-full font-mono font-medium transition-all focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
});

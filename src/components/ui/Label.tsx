import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-label-sm text-on-surface-variant font-mono tracking-wider uppercase",
        className,
      )}
      {...props}
    />
  );
}

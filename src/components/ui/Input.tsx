import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "text-body-md text-on-surface border-outline-variant/50 placeholder-on-surface-variant/40 focus-visible:border-primary pb-sm w-full border-b bg-transparent font-sans transition-colors outline-none",
          "focus-visible:pb-[calc(theme(spacing.sm)-1px)] focus-visible:border-b-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

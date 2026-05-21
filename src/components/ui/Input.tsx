import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "bg-surface-container-low border-outline-variant/50 focus:border-primary text-on-surface placeholder-outline-variant/50 py-sm px-sm w-full rounded-md border-b font-sans transition-all outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

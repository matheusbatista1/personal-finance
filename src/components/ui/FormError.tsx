import { cn } from "@/lib/utils";

export function FormError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p className={cn("text-label-sm text-error mt-xs font-mono", className)} role="alert">
      {children}
    </p>
  );
}

import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("modal-glass p-lg md:p-xl w-full max-w-md rounded-2xl", className)}>
      <div className="mb-lg gap-xs flex flex-col">
        <div className="bg-primary-container/20 text-primary mb-sm flex h-12 w-12 items-center justify-center rounded-full">
          <span className="text-label-md font-mono font-semibold uppercase">F</span>
        </div>
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface font-sans font-semibold">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-body-md text-on-surface-variant font-sans">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="mt-lg text-center">{footer}</div> : null}
    </div>
  );
}

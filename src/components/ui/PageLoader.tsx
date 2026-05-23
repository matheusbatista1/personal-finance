import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  /** Hint text (e.g. "Carregando dashboard"). */
  label?: string;
  /** Number of skeleton cards to show below the hero. Default 3. */
  blocks?: number;
}

export function PageLoader({ label, blocks = 3 }: PageLoaderProps) {
  return (
    <div className="gap-lg flex flex-col">
      <div className="glass-panel p-lg gap-md flex flex-col items-center justify-center rounded-2xl">
        <Spinner size="lg" label={label ?? "Carregando"} />
      </div>
      <div className="gap-md grid grid-cols-1 md:grid-cols-2">
        {Array.from({ length: blocks }).map((_, i) => (
          <SkeletonBlock key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "glass-panel p-md gap-sm flex flex-col rounded-2xl",
        "animate-pulse",
        className,
      )}
    >
      <div className="bg-surface-container-high h-3 w-1/3 rounded" />
      <div className="bg-surface-container-high h-6 w-2/3 rounded" />
      <div className="bg-surface-container-high mt-sm h-3 w-full rounded" />
      <div className="bg-surface-container-high h-3 w-5/6 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div aria-hidden className="glass-panel p-md gap-md flex animate-pulse items-center rounded-xl">
      <div className="bg-surface-container-high h-12 w-12 rounded-full" />
      <div className="gap-xs flex flex-1 flex-col">
        <div className="bg-surface-container-high h-4 w-2/5 rounded" />
        <div className="bg-surface-container-high h-3 w-1/4 rounded" />
      </div>
      <div className="bg-surface-container-high h-5 w-20 rounded" />
    </div>
  );
}

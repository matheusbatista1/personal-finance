import { SkeletonBlock, SkeletonRow } from "@/components/ui/PageLoader";
import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="gap-md grid grid-cols-1 md:grid-cols-[300px_1fr]">
      <SkeletonBlock />
      <section className="gap-md flex flex-col">
        <div className="glass-panel p-lg flex items-center justify-center rounded-2xl">
          <Spinner size="lg" label="Carregando transações" />
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </section>
    </div>
  );
}

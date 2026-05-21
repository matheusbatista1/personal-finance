import { Plus } from "lucide-react";

export function Fab() {
  return (
    <button
      type="button"
      aria-label="Novo lançamento"
      className="bg-primary-gradient primary-glow text-on-primary fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus size={26} strokeWidth={2.4} aria-hidden />
    </button>
  );
}

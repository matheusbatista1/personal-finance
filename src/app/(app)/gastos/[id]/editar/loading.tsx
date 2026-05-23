import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="bg-background/70 p-margin-mobile fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm">
      <div className="modal-glass p-lg flex flex-col items-center rounded-2xl">
        <Spinner size="lg" label="Carregando transação" />
      </div>
    </div>
  );
}

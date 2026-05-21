"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="primary-gradient-btn gap-xs px-md py-sm no-print flex cursor-pointer items-center rounded-full font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
    >
      <Printer size={14} aria-hidden />
      PDF
    </button>
  );
}

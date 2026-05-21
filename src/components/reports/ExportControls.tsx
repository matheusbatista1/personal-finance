"use client";

import { Download, Printer } from "lucide-react";
import type { CategorySlice } from "@/components/reports/SpendingByCategory";
import type { TrendPoint } from "@/components/reports/MonthlyTrend";
import type { ContactBreakdownRow } from "@/components/reports/PerContactBreakdown";

interface Props {
  competence: string;
  expenseTotalCents: number;
  incomeTotalCents: number;
  userShareTotalCents: number;
  categorySlices: CategorySlice[];
  trendPoints: TrendPoint[];
  contactRows: ContactBreakdownRow[];
}

function centsToBR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(props: Props): string {
  const lines: string[] = [];
  lines.push(`Relatório FinLux - ${props.competence}`);
  lines.push("");
  lines.push("Resumo do mês");
  lines.push(`Gasto total (R$);${centsToBR(props.expenseTotalCents)}`);
  lines.push(`Receitas (R$);${centsToBR(props.incomeTotalCents)}`);
  lines.push(`Sua parte (R$);${centsToBR(props.userShareTotalCents)}`);
  lines.push(`Saldo (R$);${centsToBR(props.incomeTotalCents - props.expenseTotalCents)}`);
  lines.push("");

  lines.push("Gastos por categoria");
  lines.push("Categoria;Total (R$);Sua parte (R$)");
  for (const slice of props.categorySlices) {
    lines.push(
      [escapeCsv(slice.name), centsToBR(slice.amountCents), centsToBR(slice.shareCents)].join(";"),
    );
  }
  lines.push("");

  lines.push("Tendência mensal");
  lines.push("Mês;Despesas (R$);Receitas (R$)");
  for (const point of props.trendPoints) {
    lines.push(
      [
        escapeCsv(`${point.label} ${point.competence}`),
        centsToBR(point.expenseCents),
        centsToBR(point.incomeCents),
      ].join(";"),
    );
  }
  lines.push("");

  lines.push("Por pessoa");
  lines.push("Pessoa;Dividido (R$);Direto (R$);Total (R$)");
  for (const row of props.contactRows) {
    lines.push(
      [
        escapeCsv(row.name),
        centsToBR(row.equalCents),
        centsToBR(row.customCents),
        centsToBR(row.totalCents),
      ].join(";"),
    );
  }

  return lines.join("\r\n");
}

export function ExportControls(props: Props) {
  function handleCsvDownload() {
    const csv = buildCsv(props);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-finlux-${props.competence}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrintPdf() {
    window.print();
  }

  return (
    <div className="gap-sm no-print flex">
      <button
        type="button"
        onClick={handleCsvDownload}
        className="gap-xs px-md py-sm border-outline-variant/30 hover:border-primary/50 hover:text-primary text-on-surface-variant flex cursor-pointer items-center rounded-full border font-mono text-sm transition-colors"
      >
        <Download size={14} aria-hidden />
        CSV
      </button>
      <button
        type="button"
        onClick={handlePrintPdf}
        className="primary-gradient-btn gap-xs px-md py-sm flex cursor-pointer items-center rounded-full font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
      >
        <Printer size={14} aria-hidden />
        PDF
      </button>
    </div>
  );
}

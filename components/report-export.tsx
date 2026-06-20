"use client";

import { Download } from "lucide-react";

import { logReportExport } from "@/app/(dashboard)/raporlar/actions";
import { Button } from "@/components/ui/button";

interface ExportPayload {
  periodLabel: string;
  kpis: { label: string; value: string }[];
  trend: { date: string; revenue: number; cost: number }[];
  categories: { name: string; value: number }[];
}

function q(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ReportExport({ periodLabel, kpis, trend, categories }: ExportPayload) {
  function buildCsv(): string {
    const lines: string[] = [];
    lines.push(q("Jade Gold NYC — Rapor"));
    lines.push([q("Dönem"), q(periodLabel)].join(","));
    lines.push("");
    lines.push(q("Özet"));
    lines.push([q("Metrik"), q("Değer")].join(","));
    kpis.forEach((k) => lines.push([q(k.label), q(k.value)].join(",")));
    lines.push("");
    lines.push([q("Gün"), q("Gelir"), q("Maliyet")].join(","));
    trend.forEach((t) =>
      lines.push([q(t.date), q(t.revenue), q(t.cost)].join(",")),
    );
    lines.push("");
    lines.push([q("Kategori"), q("Tutar")].join(","));
    categories.forEach((c) => lines.push([q(c.name), q(c.value)].join(",")));
    return lines.join("\n");
  }

  function onExport() {
    const csv = buildCsv();
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jadegoldnyc-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    void logReportExport(periodLabel);
  }

  return (
    <Button variant="outline" onClick={onExport}>
      <Download className="size-4" />
      CSV Dışa Aktar
    </Button>
  );
}

"use client";

import { Download, Printer } from "lucide-react";

import { logReportExport } from "@/app/(dashboard)/raporlar/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

interface ExportPayload {
  periodLabel: string;
  kpis: { label: string; value: string }[];
  trend: { date: string; revenue: number; cost: number }[];
  categories: { name: string; value: number }[];
  /** PDF/baskı çıktısında parasal değerleri biçimlemek için (varsayılan USD). */
  currency?: string;
}

function q(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Gerçek JG monogramı (public/brand/logo/monogram-jg.svg) — markalı başlık için
// inline. Yerel/kendine yeten: yazdırma penceresinde harici varlık beklenmez.
const MONOGRAM_SVG = `<svg viewBox="0 0 2048 2048" width="40" height="40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="#B89347" d="M 1141.71 674.42 C 1149.24 673.462 1168.35 673.583 1175.49 673.936 C 1224.6 676.362 1267.92 689.872 1308.91 717.153 C 1322.59 724.187 1333.2 737.361 1345.97 744.998 C 1370.42 759.614 1373.97 729.281 1379.62 719.438 C 1382.84 717.318 1381.14 717.683 1384.85 718.155 C 1386.58 722.434 1386.6 753.944 1386.06 759.594 C 1384.24 778.916 1389.94 886.31 1382.83 893.128 C 1380.52 893.318 1377.71 892.017 1377.46 889.741 C 1368.84 810.656 1337.9 747.283 1266.09 706.008 C 1161.3 645.78 1045.05 686.032 986.577 789.4 C 975.279 809.03 966.418 829.964 960.191 851.74 C 941.962 916.865 943.774 1009.45 961.606 1074.74 C 977.969 1134.65 1014.9 1189.09 1069.86 1219.59 C 1112.74 1243.38 1162.46 1253.02 1210.35 1239.24 C 1254.95 1226.4 1293.35 1198.99 1316.27 1158.05 C 1334.26 1125.78 1340.99 1079.62 1330.5 1044.63 C 1317.15 1000.11 1285.88 984.329 1241.69 988.26 C 1234.69 988.883 1223.69 986.807 1216.75 988.911 C 1198.42 994.463 1180.64 1000.92 1162.29 1006.46 C 1104.98 1020.9 1054.7 1029.02 995.4 1032.86 C 987.114 1033.4 969.567 1035.62 962.596 1033.83 C 960.227 1031.12 960.96 1032.64 960.32 1029.1 C 964.07 1024.66 979.407 1025.78 985.751 1025.4 C 997.771 1024.57 1009.77 1023.5 1021.75 1022.21 C 1074.13 1016.92 1124.5 1010.17 1174.9 994.165 C 1185.59 990.772 1196.35 986.927 1207.07 983.768 C 1211.8 982.329 1216.68 981.473 1221.61 981.219 C 1237.35 980.561 1258.79 981.285 1275.04 981.335 L 1387 981.611 C 1407.6 981.598 1436.07 981.478 1457.12 981.369 C 1457.87 981.773 1458.62 982.178 1459.37 982.582 L 1459.51 984.957 C 1455.24 990.114 1447.85 988.234 1441.61 989.757 C 1376.76 1005.57 1386.01 1061.55 1386.02 1113.22 L 1386.01 1207.14 C 1386.02 1217.78 1386.76 1231.9 1385.62 1242.43 C 1385.47 1243.82 1384.19 1243.9 1382.36 1244.77 C 1374.68 1242.07 1379.83 1155.28 1327.97 1194.08 C 1147.02 1329.45 901.911 1210.34 887.452 987.32 C 882.17 905.846 900.251 832.752 954.438 769.432 C 1001.5 713.81 1069.03 679.549 1141.71 674.42 z"/><path fill="#B89347" d="M 782.681 670.196 C 808.802 670.183 1010.96 668.253 1019.15 671.655 C 1021.06 672.447 1020.41 671.951 1021.25 673.96 C 1016.59 678.94 1001.17 678.805 993.869 681.036 C 942.318 696.786 938.126 728.874 938.756 777.025 C 934.585 782.339 930.6 787.796 926.806 793.386 C 876.561 867.33 869.466 954.167 885.573 1039.82 C 805.276 1042.02 710.421 1062.12 650.819 1119.17 C 619.607 1149.05 597.437 1189.47 596.549 1233.41 C 595.454 1274.12 611.114 1313.49 639.869 1342.33 C 698.548 1402.26 808.53 1398.75 852.6 1323.08 C 874.642 1285.23 873.109 1239.07 873.106 1196.59 L 873.041 1119.25 L 873.019 1047.41 C 878.005 1047.2 883.489 1047.3 888.518 1047.28 C 901.813 1086.49 913.705 1115.93 938.745 1149.91 C 938.818 1168.9 939.384 1191.94 937.656 1210.47 C 933.749 1253.78 916.587 1294.84 888.508 1328.05 C 829.397 1396.81 709.614 1415.97 639.65 1354.57 C 572.625 1295.74 570.927 1193.76 629.728 1128.59 C 692.63 1058.87 783.123 1037.34 872.948 1031.72 C 871.367 969.122 873.021 906.066 872.605 843.43 C 872.245 811.312 873.933 779.767 870.943 747.74 C 865.463 689.021 832.744 684.383 784.451 676.322 C 782.244 674.252 782.982 674.237 782.681 670.196 z"/></svg>`;

export function ReportExport({
  periodLabel,
  kpis,
  trend,
  categories,
  currency = "USD",
}: ExportPayload) {
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

  function onExportCsv() {
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

  // Paydaşa giden çıktı: markalı (monogram + JADE GOLD kelime kilidi + ince altın
  // kural çizgisi). Yerel/kendine yeten HTML; tarayıcının "PDF olarak kaydet"
  // diyaloguyla PDF üretilir. Mevcut CSV akışı korunur.
  function buildPrintHtml(): string {
    const money = (n: number) => formatMoney(Math.round(n * 100), currency);
    const generatedAt = new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "long",
    }).format(new Date());

    const kpiRows = kpis
      .map(
        (k) =>
          `<tr><th scope="row">${esc(k.label)}</th><td>${esc(k.value)}</td></tr>`,
      )
      .join("");

    const trendRows = trend.length
      ? trend
          .map(
            (t) =>
              `<tr><td>${esc(t.date)}</td><td class="num">${esc(money(t.revenue))}</td><td class="num">${esc(money(t.cost))}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="3" class="empty">Bu dönemde veri yok.</td></tr>`;

    const catRows = categories.length
      ? categories
          .map(
            (c) =>
              `<tr><td>${esc(c.name)}</td><td class="num">${esc(money(c.value))}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="2" class="empty">Bu dönemde maliyet yok.</td></tr>`;

    return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Jade Gold NYC — Rapor (${esc(periodLabel)})</title>
<style>
  :root { --gold:#B89347; --char:#131313; --ivory:#F2EFE6; --stone:#A39F94; --jade:#3F4A44; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px;
    font: 14px/1.55 -apple-system, "Segoe UI", system-ui, sans-serif;
    color: var(--jade); background: #fff;
  }
  .brand-header {
    display: flex; align-items: center; gap: 14px;
    padding-bottom: 18px; margin-bottom: 4px;
  }
  .brand-header .wordlock { display: flex; flex-direction: column; gap: 2px; }
  .brand-header .wordmark {
    font-size: 20px; font-weight: 700; letter-spacing: .16em; color: var(--char);
  }
  .brand-header .subtitle {
    font-size: 11px; letter-spacing: .34em; color: var(--stone); text-transform: uppercase;
  }
  .gold-rule { height: 2px; background: var(--gold); border: 0; margin: 0 0 22px; }
  .meta { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 26px; font-size: 12px; color: var(--stone); }
  .meta strong { color: var(--jade); font-weight: 600; }
  h2 { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--jade); margin: 26px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eceadf; }
  thead th { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: var(--stone); border-bottom: 1.5px solid var(--gold); }
  .summary th[scope="row"] { font-weight: 500; color: var(--jade); width: 60%; }
  .summary td { font-weight: 600; font-variant-numeric: tabular-nums; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .empty { color: var(--stone); font-style: italic; }
  footer { margin-top: 34px; padding-top: 14px; border-top: 1px solid #eceadf; font-size: 11px; color: var(--stone); }
  @media print { body { padding: 24px; } }
  @page { margin: 16mm; }
</style>
</head>
<body>
  <header class="brand-header">
    ${MONOGRAM_SVG}
    <div class="wordlock">
      <span class="wordmark">JADE GOLD</span>
      <span class="subtitle">New York · Rapor</span>
    </div>
  </header>
  <hr class="gold-rule" />

  <div class="meta">
    <span><strong>Dönem:</strong> ${esc(periodLabel)}</span>
    <span>Oluşturulma: ${esc(generatedAt)}</span>
  </div>

  <h2>Özet (Kâr / Zarar)</h2>
  <table class="summary"><tbody>${kpiRows}</tbody></table>

  <h2>Günlük Gelir / Maliyet</h2>
  <table>
    <thead><tr><th>Gün</th><th class="num">Gelir</th><th class="num">Maliyet</th></tr></thead>
    <tbody>${trendRows}</tbody>
  </table>

  <h2>Maliyet Kategorileri</h2>
  <table>
    <thead><tr><th>Kategori</th><th class="num">Tutar</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>

  <footer>Jade Gold NYC · Gizli · İç Kullanım</footer>
</body>
</html>`;
  }

  function onExportPdf() {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.open();
    win.document.write(buildPrintHtml());
    win.document.close();
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
    void logReportExport(periodLabel);
  }

  return (
    <>
      <Button variant="outline" onClick={onExportPdf}>
        <Printer className="size-4" />
        PDF / Yazdır
      </Button>
      <Button variant="outline" onClick={onExportCsv}>
        <Download className="size-4" />
        CSV Dışa Aktar
      </Button>
    </>
  );
}

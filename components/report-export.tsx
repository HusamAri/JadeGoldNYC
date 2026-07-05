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

// Gerçek marka amblemi (public/brand/logo/monogram-jg.svg) — markalı başlık için
// inline. Yerel/kendine yeten: yazdırma penceresinde harici varlık beklenmez.
const MONOGRAM_SVG = `<svg viewBox="605 705 839 640" width="52" height="40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="#B89347" d="M 1180.72 729.454 C 1215.6 728.277 1251.2 729.547 1286.1 729.707 L 1419.6 729.357 C 1406.62 844.523 1351.16 952.099 1244.48 1006.68 C 1231.34 1013.41 1217.23 1017.66 1203.22 1022.14 C 1237.29 1035.16 1256.68 1045.36 1285.86 1067.33 C 1310.57 1086.27 1332.49 1108.6 1350.96 1133.66 C 1396.18 1195.31 1407.46 1246.24 1417.98 1320.25 C 1403.73 1321.01 1387.51 1320.49 1373.01 1320.52 C 1341.06 1320.66 1309.11 1320.46 1277.16 1319.93 C 1183.53 1318.72 1116.12 1327.77 1027.48 1287.38 C 1047.8 1276.91 1063.19 1264.82 1079.99 1249.79 C 1115.25 1264.26 1175.9 1262.63 1213.95 1262.92 C 1260.26 1263.26 1306.68 1261.5 1353.15 1261.81 C 1351.18 1249.76 1347.21 1237.04 1342.94 1225.64 C 1316.76 1155.75 1270 1110.49 1202.61 1080.11 C 1193.63 1075.96 1185.89 1073.34 1176.49 1070.37 C 1180.48 1032.35 1184.8 1016 1177.68 975.322 C 1275.73 940.732 1328.02 890.25 1354.52 786.926 C 1297.7 786.791 1240.47 785.069 1183.55 785.122 C 1038.67 785.262 928.758 894.037 934.16 1040.32 C 936.853 1113.24 966.616 1157.55 1017.9 1206.28 C 1000.06 1217.9 987.099 1224.28 967.944 1233.72 C 913.923 1181.43 882.134 1122.01 879.241 1046.01 C 872.292 863.468 1000.81 736.287 1180.72 729.454 z"/><path fill="#B89347" d="M 698.987 729.478 C 809.359 731.873 918.621 713.03 1021.58 762.24 C 999.857 772.455 985.949 783.983 968.256 799.298 C 899.89 781.194 844.813 784.298 774.581 786.611 C 749.44 787.439 721.56 787.292 696.194 787.5 C 700.818 810.285 710.669 835.325 721.546 855.715 C 755.764 919.861 804.13 954.572 872.981 975.304 C 867.747 1006.58 867.052 1038.45 870.916 1069.93 C 777.797 1100.59 715.873 1167.71 694.215 1263.27 C 734.633 1264.22 777.411 1262.48 818.02 1262.41 C 854.002 1262.09 886.995 1265.05 922.81 1258.67 C 1050.98 1235.84 1131.32 1107.86 1112.35 981.857 C 1107.48 949.487 1095.44 922.858 1077.77 895.474 C 1064.63 876.971 1049.25 860.174 1031.96 845.471 C 1046.39 834.767 1064.96 824.23 1080.91 816.071 L 1089.87 824.822 C 1142.89 876.944 1170.35 941.198 1170.66 1015.66 C 1170.98 1096.38 1140.51 1176.1 1083.17 1233.56 C 1031.35 1285.49 953.355 1313.18 881.203 1319.59 C 852.471 1322.15 808.6 1320.83 778.551 1320.83 L 629.303 1320.76 C 632.663 1283.6 641.774 1240.09 656.109 1205.86 C 683.549 1139.33 732.35 1083.84 794.817 1048.11 C 813.242 1037.8 828.473 1031.72 847.956 1023.73 C 813.289 1011.52 788.982 1000.36 759.446 977.47 C 701.89 932.099 660.807 869.101 642.497 798.138 C 636.687 776.116 633.378 752.801 630.575 730.241 C 652.883 729.439 676.519 729.732 698.987 729.478 z"/><path fill="#B89347" d="M 1100.68 987.471 C 1101.8 987.16 1102.04 987.443 1103.4 987.739 C 1107.51 998.127 1103.41 1040.41 1101.57 1053.09 C 1059.29 1047.49 991.256 1052.24 948.957 1055.98 L 946.639 1055.41 C 942.485 1045.19 946.089 1003.75 947.288 991.228 C 985.984 997.654 1061.39 991.81 1100.68 987.471 z"/></svg>`;

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
    // noopener/noreferrer KULLANMA: tarayıcı noreferrer'ı no-opener sayar ve
    // window.open null döner → yazılabilir handle kalmaz. Pencere same-origin
    // about:blank; içeriği biz (esc'li) yazıyoruz, ters-tabnabbing riski yok.
    const win = window.open("", "_blank");
    if (!win) return; // açılır pencere engellendi
    win.document.open();
    win.document.write(buildPrintHtml());
    win.document.close();
    // load zaten geçmiş olabilir (senkron yazım) → readyState'e göre tetikle.
    const print = () => {
      win.focus();
      win.print();
    };
    if (win.document.readyState === "complete") print();
    else win.addEventListener("load", print);
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

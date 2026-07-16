/**
 * Para birimi yardımcıları. Tüm parasal değerler veritabanında tam sayı
 * (cent / minor unit) olarak saklanır — float kayması olmaz.
 */

/** "$12.34", "12,34", "1.234,56", 12.34 gibi girdileri cent'e çevirir. */
export function parseMoneyToCents(
  input: string | number | null | undefined,
): number {
  if (input == null || input === "") return 0;
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.round(input * 100) : 0;
  }

  let s = String(input)
    .trim()
    .replace(/[^\d.,-]/g, ""); // para sembolleri, boşluk vb. temizle
  if (s === "" || s === "-") return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    // Her ikisi de varsa: en sondaki ondalık ayraçtır.
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    // Yalnız virgül: son grup 1-2 hane ise ondalık, değilse binlik ayraç.
    const decimals = s.length - lastComma - 1;
    s = decimals === 1 || decimals === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  // Yalnız nokta veya düz sayı: olduğu gibi bırak.

  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Cent değerini ondalık sayıya çevirir (12345 -> 123.45). */
export function centsToDecimal(cents: number | null | undefined): number {
  return (cents ?? 0) / 100;
}

/** Cent değerini para birimi metnine biçimler. */
export function formatMoney(
  cents: number | null | undefined,
  currency = "USD",
  locale = "tr-TR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

/**
 * Para tutarını iki parçaya böler: `main` (para birimi + tam sayı) ve
 * `fraction` (ondalık ayraç + kuruş). UI'da kuruşu küçük/aşağı kaydırıp
 * estetik "büyük tutar + küçük ondalık" görünümü için (bkz. <Money>).
 */
export function formatMoneyParts(
  cents: number | null | undefined,
  currency = "USD",
  locale = "tr-TR",
): { main: string; fraction: string } {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
  }).formatToParts((cents ?? 0) / 100);
  let main = "";
  let fraction = "";
  let afterDecimal = false;
  for (const p of parts) {
    if (p.type === "decimal") {
      afterDecimal = true;
      fraction += p.value;
    } else if (afterDecimal) {
      fraction += p.value;
    } else {
      main += p.value;
    }
  }
  return { main, fraction };
}

/** Yüzde biçimi (0.182 -> "%18,2"). */
export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  const v = Number.isFinite(ratio ?? NaN) ? (ratio as number) : 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(v);
}

import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

/** Tarih biçimi (Türkçe). */
export function formatDate(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy",
): string {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: tr }) : "—";
}

/** Tarih + saat biçimi (Türkçe). */
export function formatDateTime(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy HH:mm",
): string {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: tr }) : "—";
}

/** Tam sayı / ondalık biçimi (Türkçe). */
export function formatNumber(
  value: number | null | undefined,
  digits = 0,
): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value ?? 0);
}

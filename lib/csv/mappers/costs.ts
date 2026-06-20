import { parseMoneyToCents } from "@/lib/money";
import { pick, parseDateLoose } from "@/lib/csv/helpers";
import type { CostsMapResult, MappedCost } from "@/lib/csv/types";

/** Genel maliyet CSV imzası. */
export function detectCostsCsv(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const hasAmount =
    lower.includes("amount") || lower.includes("tutar") || lower.includes("fiyat");
  const hasDesc =
    lower.includes("description") ||
    lower.includes("açıklama") ||
    lower.includes("aciklama");
  return hasAmount && hasDesc;
}

/** Genel maliyet CSV → maliyet kayıtlarına eşler. */
export function mapCostsCsv(rows: Record<string, string>[]): CostsMapResult {
  const warnings: string[] = [];
  const costs: MappedCost[] = [];

  rows.forEach((row, idx) => {
    const description = pick(row, ["Description", "Açıklama", "Aciklama"]);
    if (!description) {
      warnings.push(`Satır ${idx + 2}: Açıklama boş, atlandı.`);
      return;
    }
    const amount = parseMoneyToCents(
      pick(row, ["Amount", "Tutar", "Fiyat", "Price"]),
    );
    const date =
      parseDateLoose(pick(row, ["Date", "Tarih", "Cost Date"])) ??
      new Date().toISOString();
    costs.push({
      description,
      amount_cents: amount,
      currency: pick(row, ["Currency", "Para Birimi"]) || "USD",
      cost_date: date.slice(0, 10),
      vendor: pick(row, ["Vendor", "Tedarikçi", "Satıcı"]) || null,
      category_key: pick(row, ["Category Key", "Kategori"]) || null,
      notes: pick(row, ["Notes", "Not"]) || null,
    });
  });

  return { costs, warnings };
}

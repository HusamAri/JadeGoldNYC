import { parseMoneyToCents } from "@/lib/money";
import { pick, parseDateLoose, parseIntLoose } from "@/lib/csv/helpers";
import type { MappedSale, SalesMapResult } from "@/lib/csv/types";
import type { SaleStatus } from "@/lib/types";

/** Etsy "Orders" CSV imzası: sipariş başına satır (kalem yok). */
export function detectEtsyOrders(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return (
    lower.includes("order id") &&
    (lower.includes("order total") || lower.includes("order value")) &&
    !lower.includes("item name")
  );
}

function mapStatus(raw: string): SaleStatus {
  const s = raw.toLowerCase();
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("refund")) return "refunded";
  return "completed";
}

/** Etsy "Orders" → sipariş kayıtlarına (sale) eşler. */
export function mapEtsyOrders(rows: Record<string, string>[]): SalesMapResult {
  const warnings: string[] = [];
  const sales: MappedSale[] = [];

  rows.forEach((row, idx) => {
    const orderId = pick(row, ["Order ID", "Order Id"]);
    if (!orderId) {
      warnings.push(`Satır ${idx + 2}: Order ID boş, atlandı.`);
      return;
    }
    const currency = pick(row, ["Currency"]) || "USD";
    const orderDate =
      parseDateLoose(pick(row, ["Sale Date", "Date Paid"])) ??
      new Date().toISOString();
    const grand = parseMoneyToCents(
      pick(row, ["Order Total", "Order Value", "Adjusted Order Total"]),
    );
    const shipping = parseMoneyToCents(pick(row, ["Order Shipping"]));
    const fees =
      parseMoneyToCents(pick(row, ["Card Processing Fees"])) +
      parseMoneyToCents(pick(row, ["Transaction Fees"]));

    sales.push({
      etsy_receipt_id: parseIntLoose(orderId),
      order_no: orderId,
      buyer_name: pick(row, ["Buyer", "Ship Name"]) || null,
      buyer_email: pick(row, ["Buyer Email", "Email"]) || null,
      status: mapStatus(pick(row, ["Status"])),
      order_date: orderDate,
      ship_country: pick(row, ["Ship Country"]) || null,
      item_total_cents:
        parseMoneyToCents(pick(row, ["Order Value", "Item Total"])) ||
        Math.max(grand - shipping, 0),
      shipping_cents: shipping,
      tax_cents: parseMoneyToCents(pick(row, ["Order Sales Tax"])),
      discount_cents: parseMoneyToCents(pick(row, ["Discount Amount"])),
      etsy_fees_cents: fees,
      grand_total_cents: grand,
      currency,
      items: [],
    });
  });

  return { sales, warnings };
}

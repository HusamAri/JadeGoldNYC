import { parseMoneyToCents } from "@/lib/money";
import { pick, parseDateLoose, parseIntLoose } from "@/lib/csv/helpers";
import type { MappedSale, SalesMapResult } from "@/lib/csv/types";

/** Etsy "Sold Order Items" CSV imzası: kalem başına satır. */
export function detectEtsySoldOrderItems(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.includes("order id") && lower.includes("item name");
}

/** Etsy "Sold Order Items" → siparişlere (sale + sale_items) eşler. */
export function mapEtsySoldOrderItems(
  rows: Record<string, string>[],
): SalesMapResult {
  const warnings: string[] = [];
  const byOrder = new Map<string, MappedSale>();

  rows.forEach((row, idx) => {
    const orderId = pick(row, ["Order ID", "Order Id"]);
    if (!orderId) {
      warnings.push(`Satır ${idx + 2}: Order ID boş, atlandı.`);
      return;
    }
    const currency = pick(row, ["Currency"]) || "USD";
    const qty = parseIntLoose(pick(row, ["Quantity"])) ?? 1;
    const unit = parseMoneyToCents(pick(row, ["Price"]));
    const itemTotal = parseMoneyToCents(pick(row, ["Item Total"])) || unit * qty;

    const item = {
      etsy_transaction_id: parseIntLoose(pick(row, ["Transaction ID"])),
      title: pick(row, ["Item Name", "Title"]) || null,
      sku: pick(row, ["SKU"]) || null,
      quantity: qty,
      unit_price_cents: unit,
      line_total_cents: itemTotal,
      currency,
    };

    let sale = byOrder.get(orderId);
    if (!sale) {
      const orderDate =
        parseDateLoose(pick(row, ["Sale Date", "Date Paid", "Order Date"])) ??
        new Date().toISOString();
      sale = {
        etsy_receipt_id: parseIntLoose(orderId),
        order_no: orderId,
        buyer_name: pick(row, ["Buyer", "Ship Name", "Full Name"]) || null,
        buyer_email: pick(row, ["Buyer Email", "Email"]) || null,
        status: "completed",
        order_date: orderDate,
        ship_country: pick(row, ["Ship Country", "Country"]) || null,
        item_total_cents: 0,
        shipping_cents: parseMoneyToCents(
          pick(row, ["Order Shipping", "Shipping"]),
        ),
        tax_cents: parseMoneyToCents(pick(row, ["Order Sales Tax", "Sales Tax"])),
        discount_cents: parseMoneyToCents(pick(row, ["Discount Amount"])),
        etsy_fees_cents: parseMoneyToCents(
          pick(row, ["Card Processing Fees", "Transaction Fees"]),
        ),
        grand_total_cents: parseMoneyToCents(
          pick(row, ["Order Total", "Order Value"]),
        ),
        currency,
        items: [],
      };
      byOrder.set(orderId, sale);
    }
    sale.items.push(item);
    sale.item_total_cents += itemTotal;
  });

  const sales = [...byOrder.values()].map((s) => {
    if (!s.grand_total_cents) {
      s.grand_total_cents =
        s.item_total_cents + s.shipping_cents + s.tax_cents - s.discount_cents;
    }
    return s;
  });

  return { sales, warnings };
}

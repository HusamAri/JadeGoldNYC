import type { SaleStatus } from "@/lib/types";

export interface MappedSaleItem {
  etsy_transaction_id: number | null;
  title: string | null;
  sku: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
}

export interface MappedSale {
  etsy_receipt_id: number | null;
  order_no: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  status: SaleStatus;
  order_date: string; // ISO
  ship_country: string | null;
  item_total_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  etsy_fees_cents: number;
  grand_total_cents: number;
  currency: string;
  items: MappedSaleItem[];
}

export interface MappedCost {
  description: string;
  amount_cents: number;
  currency: string;
  cost_date: string; // YYYY-MM-DD
  vendor: string | null;
  category_key: string | null;
  notes: string | null;
}

export interface SalesMapResult {
  sales: MappedSale[];
  warnings: string[];
}

export interface CostsMapResult {
  costs: MappedCost[];
  warnings: string[];
}

export type MappingTemplateId =
  | "etsy_sold_order_items"
  | "etsy_orders"
  | "costs_generic";

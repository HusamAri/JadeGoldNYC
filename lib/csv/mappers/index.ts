import {
  detectEtsySoldOrderItems,
  mapEtsySoldOrderItems,
} from "@/lib/csv/mappers/etsy-sold-orders";
import { detectEtsyOrders, mapEtsyOrders } from "@/lib/csv/mappers/etsy-orders";
import { detectCostsCsv, mapCostsCsv } from "@/lib/csv/mappers/costs";
import type { MappingTemplateId } from "@/lib/csv/types";

export interface MappingTemplateMeta {
  id: MappingTemplateId;
  label: string;
  module: "sales" | "costs";
  detect: (headers: string[]) => boolean;
}

export const MAPPING_TEMPLATES: MappingTemplateMeta[] = [
  {
    id: "etsy_sold_order_items",
    label: "Etsy — Sold Order Items (kalem başına)",
    module: "sales",
    detect: detectEtsySoldOrderItems,
  },
  {
    id: "etsy_orders",
    label: "Etsy — Orders (sipariş başına)",
    module: "sales",
    detect: detectEtsyOrders,
  },
  {
    id: "costs_generic",
    label: "Maliyetler (genel CSV)",
    module: "costs",
    detect: detectCostsCsv,
  },
];

/** Başlıklara göre uygun şablonu otomatik tespit eder. */
export function detectTemplate(
  headers: string[],
  module: "sales" | "costs",
): MappingTemplateId | null {
  const candidate = MAPPING_TEMPLATES.find(
    (t) => t.module === module && t.detect(headers),
  );
  return candidate?.id ?? null;
}

export { mapEtsySoldOrderItems, mapEtsyOrders, mapCostsCsv };

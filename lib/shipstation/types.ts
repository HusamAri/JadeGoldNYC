// ShipStation legacy API (ssapi.shipstation.com) — yanıt tipleri.
// Para alanları dolar cinsinden ondalık döner (ör. 5.23) → cent'e çevrilir.

export interface ShipStationListResponse<T> {
  total?: number;
  page?: number;
  pages?: number;
  orders?: T[];
  shipments?: T[];
}

export interface ShipStationOrder {
  orderId: number;
  orderNumber?: string;
  orderDate?: string;
  orderStatus?: string;
  customerEmail?: string;
  customerUsername?: string;
  billTo?: { name?: string };
  shipTo?: { name?: string };
  orderTotal?: number;
  amountPaid?: number;
  advancedOptions?: { storeId?: number; source?: string };
}

export interface ShipStationShipment {
  shipmentId: number;
  orderId?: number;
  orderNumber?: string;
  createDate?: string;
  shipDate?: string;
  trackingNumber?: string;
  carrierCode?: string;
  serviceCode?: string;
  shipmentCost?: number;
  insuranceCost?: number;
  voided?: boolean;
  customerEmail?: string;
}

export interface ShipStationProduct {
  productId: number;
  sku?: string;
  name?: string;
  price?: number;
  defaultCost?: number;
  weightOz?: number;
  active?: boolean;
}

export interface ShipStationCarrier {
  name?: string;
  code: string;
  accountNumber?: string;
  balance?: number;
}

/** Dolar (ondalık) → cent. */
export function dollarsToCents(v?: number | null): number | null {
  if (v == null) return null;
  return Math.round(v * 100);
}

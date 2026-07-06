import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { syncListingVariants } from "@/lib/etsy/variants";

// Envanter gezme birden çok listing çağrısı yapar; süreyi uzat.
export const maxDuration = 60;

/**
 * Etsy varyant senkronu. `Authorization: Bearer ${CRON_SECRET}` ile korunur.
 * Bağlı her org için getListingInventory'yi gezip product_variants'i
 * (SKU↔listing + beden/renk + fiyat/adet) doldurur, ardından ShipStation
 * gramajlarını eşler. Üretimde çalışır (geçerli Etsy token + ETSY_API_SECRET).
 * Manuel de tetiklenebilir: GET /api/cron/etsy-variants (Bearer CRON_SECRET).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: conns } = await admin
    .from("etsy_connection")
    .select("org_id")
    .eq("status", "connected");

  const results: Record<string, unknown> = {};
  for (const c of (conns ?? []) as { org_id: string }[]) {
    try {
      results[c.org_id] = await syncListingVariants(c.org_id, { budgetMs: 50_000 });
    } catch (e) {
      results[c.org_id] = { error: e instanceof Error ? e.message : "error" };
    }
  }

  return NextResponse.json({ ok: true, results });
}

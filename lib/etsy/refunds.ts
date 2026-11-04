import type { SupabaseClient } from "@supabase/supabase-js";

import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import type { EtsyReceipt } from "@/lib/etsy/types";
import { upsertSalesPage } from "@/lib/etsy/sync";

/**
 * İADE GERİ DOLDURMA — receipt.refunds[] / shipments[] / kalan alanlar.
 *
 * Etsy v3'te ayrı iade ucu YOK: iade verisi yalnız ShopReceipt gövdesindedir
 * (refunds[]). Artımlı senkron `min_last_modified` penceresiyle çalışır;
 * bu sürümden ÖNCE okunmuş eski iadeli siparişlerin gövdesi bir daha
 * gelmez. Çözüm: durumu iade olup `refunds_synced_at` boş kalan siparişleri
 * tek tek `getShopReceipt` ile yeniden okuyup aynı upsert yolundan geçirmek
 * (idempotent; aynı mapping, ayrı kod yolu yok).
 *
 * Süre bütçesiyle çalışır (sipariş başına 1 GET + ~120ms nezaket); bitmezse
 * `remaining: true` döner, sonraki tur kaldığı yerden sürer.
 */
export interface RefundRefreshResult {
  refreshed: number;
  errors: number;
  remaining: boolean;
}

export async function refreshRefundedReceipts(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
  opts: { budgetMs?: number; limit?: number; onlyRefunded?: boolean } = {},
): Promise<RefundRefreshResult> {
  const deadline = Date.now() + (opts.budgetMs ?? 30_000);
  const limit = opts.limit ?? 300;
  const onlyRefunded = opts.onlyRefunded ?? true;

  let q = admin
    .from("sales")
    .select("id, etsy_receipt_id")
    .eq("org_id", orgId)
    .not("etsy_receipt_id", "is", null)
    .is("refunds_synced_at", null)
    .order("order_date", { ascending: false })
    .limit(limit);
  if (onlyRefunded) q = q.in("status", ["refunded", "partially_refunded"]);
  const { data, error } = await q;
  if (error) throw new Error(`sales okuma: ${error.message}`);
  const rows = (data ?? []) as { id: string; etsy_receipt_id: number }[];

  const result: RefundRefreshResult = {
    refreshed: 0,
    errors: 0,
    remaining: rows.length >= limit,
  };

  for (const [i, s] of rows.entries()) {
    if (Date.now() > deadline) {
      result.remaining = i < rows.length;
      break;
    }
    try {
      const receipt = await client.get<EtsyReceipt>(
        etsyPaths.receipt(shopId, s.etsy_receipt_id),
      );
      if (receipt?.receipt_id) {
        await upsertSalesPage(admin, orgId, [receipt]);
        result.refreshed++;
      } else {
        // Gövde boş geldiyse bile damgala ki sonsuza dek kuyrukta kalmasın;
        // tutar "bilinmiyor" yerine 0 iade olarak değil, senkron zamanı ile
        // birlikte görünür (tekrar denemek için damga elle sıfırlanabilir).
        result.errors++;
      }
    } catch {
      result.errors++;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return result;
}

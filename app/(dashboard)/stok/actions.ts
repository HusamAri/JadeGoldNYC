"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { pushListingQuantity, type PushOutcome } from "@/lib/etsy/inventory";

export interface StockChange {
  id: string;
  etsy_listing_id: number | null;
  sku: string | null;
  title: string;
  current: number | null;
  target: number;
  has_variations: boolean | null;
}

/** Bir ürünün hedef (elde/istenen) adedini kaydeder — satır içi otomatik kayıt. */
export async function saveTargetQuantity(
  productId: string,
  qty: number | null,
): Promise<{ error?: string }> {
  await requireMembership();
  if (qty != null && (!Number.isInteger(qty) || qty < 0)) {
    return { error: "Adet 0 veya daha büyük tam sayı olmalı." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ target_quantity: qty })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/stok");
  return {};
}

/**
 * Senkron önizlemesi: hedef adedi girilmiş ve güncel adetten farklı olan
 * ürünleri (değişecekler) döndürür. Etsy'ye dokunmaz — güncel adet son
 * senkrondan (products.quantity) alınır; asıl gönderimde canlı envanter tekrar
 * okunur.
 */
export async function previewStockSync(): Promise<{
  connected: boolean;
  writeEnabled: boolean;
  changes: StockChange[];
}> {
  const m = await requireMembership();
  const { connected, writeEnabled } = await getEtsyWriteAccess(m.org_id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, etsy_listing_id, sku, title, quantity, target_quantity, has_variations",
    )
    .eq("org_id", m.org_id)
    .eq("status", "active")
    .not("target_quantity", "is", null)
    .order("title", { ascending: true });

  const rows = (data ?? []) as unknown as {
    id: string;
    etsy_listing_id: number | null;
    sku: string | null;
    title: string;
    quantity: number | null;
    target_quantity: number | null;
    has_variations: boolean | null;
  }[];

  const changes: StockChange[] = rows
    .filter((r) => r.target_quantity != null && r.target_quantity !== r.quantity)
    .map((r) => ({
      id: r.id,
      etsy_listing_id: r.etsy_listing_id,
      sku: r.sku,
      title: r.title,
      current: r.quantity,
      target: r.target_quantity as number,
      has_variations: r.has_variations,
    }));

  return { connected, writeEnabled, changes };
}

/**
 * Verilen ürün id'leri için Etsy'ye adet yazar (küçük parça — istemci domino
 * döngüsüyle çağırır, timeout riskini böler). Her liste için canlı envanter
 * okunur, yalnız hedef offering güncellenir, geri yazılır. Başarılı olanların
 * yerel products.quantity değeri de gerçek sonuca göre tazelenir. Denetim
 * kaydı bu parti için burada, gerçek sonuçlardan (server-side) yazılır.
 */
export async function applyStockSyncBatch(
  ids: string[],
  applyToAll = false,
): Promise<{
  outcomes: PushOutcome[];
  needsReconnect?: boolean;
  error?: string;
}> {
  const m = await requireMembership();
  if (ids.length === 0) return { outcomes: [] };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { outcomes: [], needsReconnect: true };

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, etsy_listing_id, sku, target_quantity")
    .eq("org_id", m.org_id)
    .in("id", ids);

  const rows = (data ?? []) as unknown as {
    id: string;
    etsy_listing_id: number | null;
    sku: string | null;
    target_quantity: number | null;
  }[];

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) {
      return { outcomes: [], needsReconnect: true };
    }
    return {
      outcomes: [],
      error: e instanceof Error ? e.message : "Etsy istemcisi kurulamadı.",
    };
  }

  const outcomes: PushOutcome[] = [];
  for (const r of rows) {
    if (r.etsy_listing_id == null || r.target_quantity == null) {
      outcomes.push({
        listingId: r.etsy_listing_id ?? 0,
        sku: r.sku,
        before: null,
        after: r.target_quantity ?? 0,
        status: "skipped",
        detail:
          r.etsy_listing_id == null
            ? "Etsy liste kimliği yok"
            : "Hedef adet girilmemiş",
      });
      continue;
    }
    const outcome = await pushListingQuantity(
      client,
      r.etsy_listing_id,
      r.sku,
      r.target_quantity,
      applyToAll,
    );
    outcomes.push(outcome);

    // Yereli gerçek sonuca göre tazele: başarılıysa hedefe, aksi halde canlı
    // "before" biliniyorsa ona çek (iki yönlü tutarlılık).
    const newLocal =
      outcome.status === "updated"
        ? outcome.after
        : outcome.before != null
          ? outcome.before
          : null;
    if (newLocal != null) {
      await supabase
        .from("products")
        .update({ quantity: newLocal })
        .eq("id", r.id);
    }
  }

  // Denetim kaydı SUNUCUDA, gerçek sonuçlardan üretilir (istemci verisine
  // güvenilmez — şirket hafızası). Her parti kendi gerçek çıktısıyla loglanır;
  // böylece kısmi senkronlar da (bir parti sonrası kesilse bile) iz bırakır.
  const updated = outcomes.filter((o) => o.status === "updated").length;
  const skipped = outcomes.filter((o) => o.status === "skipped").length;
  const errors = outcomes.filter((o) => o.status === "error").length;
  if (updated > 0 || errors > 0) {
    await logAudit(supabase, {
      orgId: m.org_id,
      action: "etsy.stock_push",
      entityType: "products",
      summary: `Etsy stok senkronizasyonu: ${updated} güncellendi, ${skipped} atlandı, ${errors} hata`,
      diff: outcomes,
      source: "etsy",
    });
  }

  revalidatePath("/stok");
  return { outcomes };
}

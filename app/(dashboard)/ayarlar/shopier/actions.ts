"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { ShopierClient, ShopierNotConfiguredError } from "@/lib/shopier/client";
import { shopierPaths } from "@/lib/shopier/endpoints";
import type { ShopierShopOwner } from "@/lib/shopier/types";
import {
  advanceShopierSync,
  getShopierProgress,
  type ShopierProgress,
} from "@/lib/shopier/sync";

/** Owner yanıtından sır içermeyen görünen ad çıkarır (şema savunmacı). */
function ownerDisplayName(owner: ShopierShopOwner): string | null {
  for (const k of ["shopName", "shop_name", "name", "title", "email"]) {
    const v = owner[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Şirkete özel Shopier PAT'ini kaydeder ve BAĞLANTIYI CANLI TEST EDER
 * (GET /shop/owner). Test geçmezse kayıt yine tutulur ama status='error' +
 * hata mesajı yazılır — durum RPC'si dürüstçe gösterir. Sır service-role-only
 * shopier_connection tablosunda; üye RLS'i okuyamaz.
 */
export async function saveShopierPat(
  pat: string,
): Promise<{ error?: string; shopName?: string | null }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const token = pat.trim();
  if (!token) return { error: "Kişisel erişim anahtarı (PAT) gerekli." };

  // Canlı doğrulama — anahtar geçerli mi, mağaza kim?
  let shopName: string | null = null;
  let testError: string | null = null;
  try {
    const owner = await ShopierClient.fromPat(token).get<ShopierShopOwner>(
      shopierPaths.shopOwner(),
    );
    shopName = ownerDisplayName(owner);
  } catch (e) {
    testError = e instanceof Error ? e.message : "Bağlantı testi başarısız.";
  }

  const admin = createAdminClient();
  const { error } = await admin.from("shopier_connection").upsert(
    {
      org_id: m.org_id,
      pat: token,
      shop_name: shopName,
      status: testError ? "error" : "connected",
      sync_error: testError,
      connected_by: m.user_id,
    },
    { onConflict: "org_id" },
  );
  if (error) {
    // Tablo henüz yok (migration 0110 uygulanmamış) — İngilizce şema hatasını
    // Türkçe yola çevir; aksi halde kullanıcı "schema cache" ile kalır.
    const msg = error.message ?? "";
    if (/shopier_connection|schema cache|does not exist/i.test(msg)) {
      return {
        error:
          "Shopier tablosu henüz veritabanında yok. Supabase SQL Editor'de migration 0110_shopier_connection.sql dosyasını çalıştırın, sonra bu sayfayı yenileyip tekrar deneyin.",
      };
    }
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "shopier.credentials",
    entityType: "shopier_connection",
    summary: testError
      ? `Shopier PAT kaydedildi ama bağlantı testi başarısız: ${testError.slice(0, 140)}`
      : `Shopier bağlantısı kuruldu${shopName ? ` (${shopName})` : ""}`,
  });

  revalidatePath("/ayarlar/shopier");
  revalidatePath("/ayarlar");
  if (testError) return { error: `Anahtar kaydedildi ama test başarısız: ${testError}` };
  return { shopName };
}

/** Bağlantıyı koparır (PAT satırını siler) — yönetici işlemi. */
export async function disconnectShopier(): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const admin = createAdminClient();
  const { error } = await admin
    .from("shopier_connection")
    .delete()
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };

  const supabase = await createClient();
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "shopier.credentials",
    entityType: "shopier_connection",
    summary: "Shopier bağlantısı kaldırıldı",
  });

  revalidatePath("/ayarlar/shopier");
  revalidatePath("/ayarlar");
  return {};
}

/** Senkronu bir adım ilerletir (buton döngüsü done olana dek çağırır). */
export async function advanceShopierSyncAction(): Promise<ShopierProgress> {
  const m = await requireMembership();
  try {
    const p = await advanceShopierSync(m.org_id);
    if (p.done && p.status === "done") {
      revalidatePath("/ayarlar/shopier");
      revalidatePath("/satislar");
      revalidatePath("/panel");
    }
    return p;
  } catch (e) {
    const error =
      e instanceof ShopierNotConfiguredError
        ? "Shopier PAT tanımlı değil — önce anahtarı kaydedin."
        : e instanceof Error
          ? e.message
          : "Senkronizasyon sırasında hata oluştu.";
    return { done: true, status: "error", orders: 0, items: 0, error };
  }
}

export async function shopierStatusAction(): Promise<ShopierProgress> {
  const m = await requireMembership();
  return getShopierProgress(m.org_id);
}

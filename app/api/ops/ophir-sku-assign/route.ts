import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit";
import { EtsyClient } from "@/lib/etsy/client";
import { assignListingSkus } from "@/lib/etsy/inventory";
import { createAdminClient } from "@/lib/supabase/admin";
import { skuUret } from "@/lib/etsy/ophir-sku";
import { syncOneListingVariants } from "@/lib/etsy/variants";

export const maxDuration = 300;

/**
 * OPHIR SKU ATAMA — kimliksiz offering'lere SKU yazar (gözetimli, idempotent).
 *
 * ## Neden
 * Ophir Gold USA'nın Etsy listing'lerinde SKU YOK (93/93 `products.sku` null;
 * satılan kalemlerde de `sku: ""`). Panel Etsy'yi birebir aynalar ve SKU'suz
 * offering için varyant satırı ÜRETMEZ (`lib/etsy/variants.ts` → toRows,
 * "saf-Etsy kuralı"). Zincir bu yüzden kopuk:
 *   SKU yok → panelde varyant yok → offering-başına fiyat haritası yok →
 *   `pushListingPrices` sessizce no-op → fiyat yönetilemiyor.
 * Kimlik verilmeden fiyat yönetilemez; bu rota o kimliği verir.
 *
 * ## Şema
 * `OPH-<listingId>-<KARAT><RENK>-<BEDEN>`, çözülemeyen offering'de
 * `OPH-<listingId>-<sıra>`. listingId'yi İÇERİR: kopya-listing SKU'yu miras
 * alamaz, dolayısıyla sahiplik senkronda el değiştiremez (second-brain
 * 2026-08 vakası: miras alınan SKU yüzünden yanlış renk başlığı basılmıştı).
 *
 * ## Akış
 *  - varsayılan: KURU ÇALIŞMA — ne yazılacağını döner, Etsy'ye DOKUNMAZ.
 *  - `?listing=<id>`: tek listing (kanarya). İlk canlı yazma bununla yapılır.
 *  - `?apply=1`: gerçek yazma. Her listing'de yazımdan sonra GERİ OKUMA ile
 *    doğrulanır; doğrulanamayan listing `error` döner.
 *  - `?limit=N`: kaç listing işlenecek (varsayılan 10). Her listing bir Etsy
 *    envanter GET'i demek; 93'ün tamamı için `?limit=93` (maxDuration 300s).
 *  - `?mode=sync`: SKU ataması YAPMAZ; yalnız `syncOneListingVariants` koşar
 *    (Etsy'den okur, PANELE yazar). Etsy'ye tek bayt gitmez.
 * Mevcut SKU asla ezilmez — tekrar koşmak güvenlidir.
 *
 * ## Neden atamadan sonra senkron
 * SKU atamak zincirin yalnız ilk halkası: kimlik Etsy'ye yazılsa da panel onu
 * kendiliğinden görmez, `syncOneListingVariants` çekene kadar `product_variants`
 * boş kalır ve fiyat yönetimi hâlâ imkânsızdır. Bu yüzden `apply=1` koşusunda
 * `updated` dönen her listing AYNI TURDA panele senkronlanır — "yazdım, oldu
 * sandım" boşluğu (second-brain: dış yazmayı aynı turda geri oku) kapanır.
 *
 * ## Auth
 * `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (ops_tokens): SHA-256
 * hash CAS tüketimi — tek kullanımlık, süreli, çift kullanım imkânsız.
 */

const ORG_SLUG = "ophir-gold-usa";

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  // CAS tüketimi: koşullu UPDATE yalnız bir çağrıda satır döndürür.
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "ophir-sku-assign")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const yalnizSenkron = url.searchParams.get("mode") === "sync";
  const tekListing = url.searchParams.get("listing");
  const limit = Number(url.searchParams.get("limit") ?? 10);

  const admin = createAdminClient();
  const { data: orgRow } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();
  const orgId = (orgRow as { id: string } | null)?.id;
  if (!orgId) {
    return NextResponse.json({ error: `org bulunamadı: ${ORG_SLUG}` }, { status: 404 });
  }

  let q = admin
    .from("products")
    .select("id, etsy_listing_id, title, status")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .order("etsy_listing_id", { ascending: true })
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 5);
  if (tekListing) q = q.eq("etsy_listing_id", Number(tekListing));
  const { data: rows } = await q;
  const listings = (rows ?? []) as {
    id: string;
    etsy_listing_id: number;
    title: string | null;
    status: string | null;
  }[];
  if (listings.length === 0) {
    return NextResponse.json({ error: "işlenecek listing yok" }, { status: 404 });
  }

  const client = await EtsyClient.forOrg(orgId);
  const sonuc = [];
  let atanan = 0;
  let hata = 0;
  let senkronVaryant = 0;
  for (const l of listings) {
    if (yalnizSenkron) {
      const s = await syncOneListingVariants(orgId, l.id);
      if (s.error) hata += 1;
      senkronVaryant += s.variants;
      sonuc.push({
        listing: l.etsy_listing_id,
        baslik: (l.title ?? "").slice(0, 60),
        durum: l.status,
        panelVaryant: s.variants,
        ...(s.error ? { senkronHata: s.error } : {}),
      });
      continue;
    }

    const out = await assignListingSkus(
      client,
      l.etsy_listing_id,
      (p, i) => skuUret(l.etsy_listing_id, p, i),
      { apply },
    );
    if (out.status === "error") hata += 1;
    if (out.status === "updated") atanan += out.assigned;

    // Kimlik Etsy'ye YAZILDIYSA aynı turda panele indir: SKU'lu offering'ler
    // artık `toRows` süzgecinden geçer, yani varyantlar GERÇEK offering
    // fiyatlarıyla iner. Senkron hatası atamayı geçersiz kılmaz (SKU Etsy'de
    // duruyor, `mode=sync` ile tekrar denenebilir) — ayrı alanda raporlanır.
    let senkron: { variants: number; error?: string } | null = null;
    if (apply && out.status === "updated") {
      senkron = await syncOneListingVariants(orgId, l.id);
      senkronVaryant += senkron.variants;
    }

    sonuc.push({
      listing: l.etsy_listing_id,
      baslik: (l.title ?? "").slice(0, 60),
      durum: l.status,
      ...out,
      // Kuru çalışmada planın tamamı uzun olabilir — ilk 5 örnek yeter.
      plan: out.plan.slice(0, 5),
      planToplam: out.plan.length,
      ...(senkron
        ? {
            panelVaryant: senkron.variants,
            ...(senkron.error ? { senkronHata: senkron.error } : {}),
          }
        : {}),
    });
  }

  if (apply && atanan > 0) {
    await logAudit(admin, {
      orgId,
      action: "etsy.sku_assign",
      entityType: "products",
      summary: `Ophir SKU atama: ${atanan} offering, ${listings.length} listing (hata: ${hata}); panele inen varyant: ${senkronVaryant}`,
    });
  }

  return NextResponse.json({
    mod: yalnizSenkron
      ? "SENKRON (yalnız panele yazar, Etsy salt-okunur)"
      : apply
        ? "APPLY (canlı yazma)"
        : "kuru çalışma (Etsy'ye yazılmadı)",
    org: ORG_SLUG,
    listingSayisi: listings.length,
    atananOffering: atanan,
    panelVaryant: senkronVaryant,
    hataliListing: hata,
    sema: "OPH-<listingId>-<KARAT><RENK>-<BEDEN>",
    sonuc,
  });
}

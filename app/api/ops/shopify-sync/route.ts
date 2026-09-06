import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getShopifyConnection,
  shopifyGraphQL,
  userErrorsKapisi,
  type ShopifyConnection,
} from "@/lib/shopify/admin";
import { hizaliMi, readOptions, indirimliFiyat } from "@/lib/shopify/variant-map";

/**
 * SHOPIFY-SYNC — panel varyant fiyatlarını Shopify'a basar (gözetimli).
 *
 * ## Ne YAPAR
 *
 * Doğruluk kaynağı PANELDİR; Shopify ona eşitlenir. Fiyat `panel × (1−indirim)`
 * ile yazılır — varsayılan %5, çünkü Shopify'ın Etsy'den ucuz olması istendi
 * ve ölçüm Etsy alıcılarının şu an TAM liste fiyatını ödediğini gösteriyor
 * (son siparişlerde ödenen/liste oranı 1,000; mağaza geneli indirim kapalı).
 *
 * ## Ne YAPMAZ — ve bu kasıtlı
 *
 * Bozuk ürünü ONARMAZ. 2026-09-06'da mağazadaki 110 üründen 109'u kullanılamaz
 * bulundu: SKU'lar doluydu ama YANLIŞ kombinasyona bağlıydı ("US 3" etiketli
 * varyant beden 13'ün SKU'sunu taşıyordu). Böyle bir üründe SKU'ya güvenip
 * fiyat yazmak, 21 varyantta sessizce yanlış fiyat üretirdi — eksik kimlikten
 * çok daha pahalı bir hata. Bu yüzden rota her üründe ÖNCE kimlik hizasını
 * kanıtlar; kanıtlayamazsa o ürünü ATLAR ve sebebini raporlar. Varyant
 * yeniden kurma (silme + yaratma) geri dönüşü zor bir iştir ve ayrı, açıkça
 * onaylanmış bir rotaya aittir.
 *
 * ## Kapılar (price-sync sözleşmesinden kopyalandı)
 *
 *  - Auth: `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (`ops_tokens`
 *    purpose='shopify-sync', SHA-256 CAS — tek kullanımlık, süreli).
 *  - `?products=` ZORUNLU — "tüm mağaza" modu bilerek YOK.
 *  - `?org=` parametreli (varsayılan EON). Sabit org, rota adı genel olduğu
 *    için başka org çağrısında sessizce "eşleşme yok"a düşerdi.
 *  - Varsayılan KURU ÇALIŞMA; gerçek yazma `?apply=1`.
 *  - Apply sonrası AYNI turda read-back — "200 OK" teslim sayılmaz.
 *  - Fiyatı 0/NULL panel varyantı haritaya girmez (canlı fiyatı ezemez).
 */

const CANLI_URUN = `
  query Urun($id: ID!) {
    product(id: $id) {
      id
      title
      variants(first: 250) {
        edges { node { id sku price selectedOptions { name value } } }
      }
    }
  }
`;

const FIYAT_YAZ = `
  mutation Fiyat($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id sku price }
      userErrors { field message }
    }
  }
`;

interface CanliVaryant {
  id: string;
  sku: string | null;
  price: string;
  selectedOptions: { name: string; value: string }[];
}

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "shopify-sync")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

/** "9047476830406" ya da tam GID kabul eder; ikisini de GID'e çevirir. */
function urunGid(ham: string): string | null {
  const s = ham.trim();
  if (s.startsWith("gid://shopify/Product/")) return s;
  return /^\d+$/.test(s) ? `gid://shopify/Product/${s}` : null;
}

async function canliOku(
  conn: ShopifyConnection,
  gid: string,
): Promise<{ id: string; title: string; variants: CanliVaryant[] } | null> {
  const d = await shopifyGraphQL<{
    product: {
      id: string;
      title: string;
      variants: { edges: { node: CanliVaryant }[] };
    } | null;
  }>(conn, CANLI_URUN, { id: gid });
  if (d.product == null) return null;
  return {
    id: d.product.id,
    title: d.product.title,
    variants: d.product.variants.edges.map((e) => e.node),
  };
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = url.searchParams.get("org") ?? "EON";

  const indirimHam = url.searchParams.get("discount");
  const discountRate = indirimHam == null ? 0.05 : Number(indirimHam);
  if (!(discountRate >= 0 && discountRate < 1)) {
    return NextResponse.json(
      { error: `discount 0..0,99 aralığında olmalı (gelen: ${indirimHam})` },
      { status: 400 },
    );
  }

  const gids = (url.searchParams.get("products") ?? "")
    .split(",")
    .map((s) => urunGid(s))
    .filter((s): s is string => s != null);
  if (gids.length === 0) {
    return NextResponse.json(
      { error: "products parametresi zorunlu (virgüllü Shopify ürün id)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) {
    return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  }
  const orgId = (org as { id: string }).id;

  let conn: ShopifyConnection;
  try {
    conn = await getShopifyConnection(orgId);
  } catch (e) {
    return NextResponse.json(
      { error: "shopify not connected", detail: String(e) },
      { status: 503 },
    );
  }

  const results: Record<string, unknown>[] = [];

  for (const gid of gids) {
    const canli = await canliOku(conn, gid).catch((e) => {
      results.push({ product: gid, status: "okuma-hatasi", detail: String(e) });
      return null;
    });
    if (canli == null) {
      if (!results.some((r) => r.product === gid)) {
        results.push({ product: gid, status: "shopify-de-yok" });
      }
      continue;
    }

    const skular = canli.variants.map((v) => v.sku).filter((s): s is string => !!s);
    if (skular.length === 0) {
      results.push({
        product: gid,
        title: canli.title,
        status: "sku-yok",
        hint: "Bu ürün boş taslak — varyantları yok. Fiyat yazılamaz; önce kurulmalı.",
      });
      continue;
    }

    const { data: panelRows, error: panelErr } = await admin
      .from("product_variants")
      .select("sku, price_cents, properties")
      .eq("org_id", orgId)
      .in("sku", skular);
    if (panelErr) {
      results.push({ product: gid, status: "panel-okuma-hatasi", detail: panelErr.message });
      continue;
    }

    const panelFiyat = new Map<string, number>();
    const panelKomb = new Map<string, string>();
    for (const r of (panelRows ?? []) as {
      sku: string;
      price_cents: number | null;
      properties: unknown;
    }[]) {
      if (r.price_cents != null && r.price_cents > 0) panelFiyat.set(r.sku, r.price_cents);
      const o = readOptions(r.properties);
      if (o != null) panelKomb.set(r.sku, o.map((x) => x.value).join(" / "));
    }

    // KİMLİK KAPISI — hizasızsa yazma YOK. Ölçüt "SKU dolu mu" değil,
    // "SKU'nun panel kombinasyonu Shopify'daki seçenekle aynı mı".
    const hiza = hizaliMi(
      canli.variants.map((v) => ({
        sku: v.sku,
        optionValues: v.selectedOptions.map((o) => o.value),
      })),
      panelKomb,
    );
    if (!hiza.hizali) {
      results.push({
        product: gid,
        title: canli.title,
        status: "kimlik-hizasiz",
        sapanAdet: hiza.sapan.length,
        ornekler: hiza.sapan.slice(0, 5),
        hint:
          "SKU'lar yanlış seçenek kombinasyonuna bağlı. Fiyat yazmak sessizce " +
          "yanlış varyantı fiyatlardı — bu ürün ATLANDI, yeniden kurulması gerekiyor.",
      });
      continue;
    }

    // Hedefleri kur ve farkı say.
    const hedefler: { id: string; price: string }[] = [];
    let farkli = 0;
    const eksikPanel: string[] = [];
    for (const v of canli.variants) {
      if (!v.sku) continue;
      const cents = panelFiyat.get(v.sku);
      if (cents == null) {
        eksikPanel.push(v.sku);
        continue;
      }
      const hedef = indirimliFiyat(cents, discountRate);
      if (hedef !== Number(v.price).toFixed(2)) farkli++;
      hedefler.push({ id: v.id, price: hedef });
    }

    if (!apply) {
      results.push({
        product: gid,
        title: canli.title,
        status: "kuru-calisma",
        varyant: canli.variants.length,
        hedeflenen: hedefler.length,
        farkli,
        panelFiyatiYok: eksikPanel.length,
        ornek: hedefler.slice(0, 3),
      });
      continue;
    }

    try {
      const yaz = await shopifyGraphQL<{
        productVariantsBulkUpdate: {
          productVariants: { id: string; sku: string; price: string }[];
          userErrors: { field?: string[] | null; message: string }[];
        };
      }>(conn, FIYAT_YAZ, { productId: canli.id, variants: hedefler });
      userErrorsKapisi("productVariantsBulkUpdate", yaz.productVariantsBulkUpdate.userErrors);

      // READ-BACK — aracın kendi raporu, aracın kendi hatasını doğrulayamaz.
      const geri = await canliOku(conn, gid);
      let kalanFark = 0;
      for (const v of geri?.variants ?? []) {
        if (!v.sku) continue;
        const cents = panelFiyat.get(v.sku);
        if (cents == null) continue;
        if (indirimliFiyat(cents, discountRate) !== Number(v.price).toFixed(2)) kalanFark++;
      }
      results.push({
        product: gid,
        title: canli.title,
        status: kalanFark === 0 ? "uygulandi" : "read-back-uyusmadi",
        yazilan: yaz.productVariantsBulkUpdate.productVariants.length,
        kalanFark,
      });
    } catch (e) {
      results.push({ product: gid, status: "yazma-hatasi", detail: String(e) });
    }
  }

  return NextResponse.json({
    ok: true,
    mod: apply ? "apply" : "kuru-calisma",
    org: orgName,
    shop: conn.shopDomain,
    indirim: discountRate,
    urun: gids.length,
    results,
  });
}

/**
 * EON HAYALET BANKASI — mağaza silme/yeniden-adlandırma ÖNCESİ kalıcı arşiv.
 *
 * Her aktif listing'in başlığı, fiyatı, TÜM varyasyonları + SKU + varyant
 * fiyatları, etiketleri, açıklaması, TÜM görselleri ve linki Etsy'den TAZE
 * çekilir; yerelde yapısal JSON + göz-atılabilir HTML tablo + indirilmiş
 * görseller olarak saklanır. Doğrulama sayıları sonda basılır.
 *
 *   npx tsx scripts/eon-ghost-bank.ts                 # EON (varsayılan org)
 *   npx tsx scripts/eon-ghost-bank.ts --org <uuid>    # başka org
 *   npx tsx scripts/eon-ghost-bank.ts --out ./arsiv   # çıktı klasörü
 *
 * Çıktı: <out>/ghost-bank.json, <out>/index.html, <out>/images/<listingId>/*
 * GERÇEK Etsy kimlik bilgileri gerekir (.env.local: ETSY_API_KEY/SECRET +
 * SUPABASE_SERVICE_ROLE_KEY). Salt-OKUMA — Etsy'de hiçbir şey değişmez/silinmez.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { EtsyClient } from "../lib/etsy/client";
import { etsyPaths } from "../lib/etsy/endpoints";
import type {
  EtsyListing,
  EtsyListResponse,
  EtsyInventory,
  EtsyInventoryProduct,
} from "../lib/etsy/types";

// ── .env.local'ı elle yükle (Next dışı bağlam) ───────────────────────────
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const argv = process.argv.slice(2);
const argVal = (flag: string, def: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const ORG_ID = argVal("--org", "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0"); // EON
const OUT = argVal("--out", "eon-ghost-bank");

function centsFrom(price: { amount?: number; divisor?: number } | undefined): number | null {
  if (!price || price.amount == null || !price.divisor) return null;
  return Math.round((price.amount / price.divisor) * 100);
}
function money(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} ${currency}`;
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface VariantRow {
  sku: string | null;
  options: string; // "Size: 7 · Width: 4mm"
  priceCents: number | null;
  quantity: number | null;
}
interface GhostListing {
  listingId: number;
  title: string;
  url: string | null;
  priceCents: number | null;
  currency: string;
  tags: string[];
  materials: string[];
  description: string;
  imageUrls: string[];
  imageFiles: string[];
  variants: VariantRow[];
}

function variantsFrom(inv: EtsyInventory | null): VariantRow[] {
  if (!inv?.products) return [];
  return (inv.products as EtsyInventoryProduct[])
    .filter((p) => !p.is_deleted)
    .map((p) => {
      const opts = (p.property_values ?? [])
        .map((pv) => `${pv.property_name ?? pv.scale_name ?? "Seçenek"}: ${(pv.values ?? []).join("/")}`)
        .join(" · ");
      const off = (p.offerings ?? []).filter((o) => !o.is_deleted)[0];
      return {
        sku: p.sku ?? null,
        options: opts || "—",
        priceCents: centsFrom(off?.price),
        quantity: off?.quantity ?? null,
      };
    });
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const client = await EtsyClient.forOrg(ORG_ID);
  const shopId = await client.requireShopId();
  console.log(`EON hayalet bankası · org ${ORG_ID} · shop ${shopId}`);

  // Tüm aktif listing'ler (görsellerle) — sayfalı
  const all: EtsyListing[] = [];
  let offset = 0;
  for (;;) {
    const page = await client.get<EtsyListResponse<EtsyListing>>(
      etsyPaths.shopListings(shopId),
      { state: "active", includes: "Images", limit: 100, offset },
    );
    const rows = (page.results ?? []).filter((l) => l.state === "active");
    all.push(...rows);
    if ((page.results ?? []).length < 100) break;
    offset += 100;
  }
  console.log(`${all.length} aktif listing bulundu. Envanter + görseller çekiliyor…`);

  mkdirSync(join(OUT, "images"), { recursive: true });
  const listings: GhostListing[] = [];
  let imgOk = 0;
  let imgFail = 0;

  for (const l of all) {
    let inv: EtsyInventory | null = null;
    try {
      inv = await client.get<EtsyInventory>(etsyPaths.listingInventory(l.listing_id));
    } catch {
      inv = null;
    }
    const imageUrls = (l.images ?? [])
      .map((im) => im.url_570xN ?? null)
      .filter((u): u is string => !!u);

    const dir = join(OUT, "images", String(l.listing_id));
    mkdirSync(dir, { recursive: true });
    const imageFiles: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const ext = (imageUrls[i].split("?")[0].match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] ?? "jpg").toLowerCase();
      const rel = `images/${l.listing_id}/${i + 1}.${ext}`;
      const ok = await download(imageUrls[i], join(OUT, rel));
      if (ok) { imageFiles.push(rel); imgOk++; } else imgFail++;
    }

    listings.push({
      listingId: l.listing_id,
      title: l.title ?? `Listing ${l.listing_id}`,
      url: l.url ?? null,
      priceCents: centsFrom(l.price),
      currency: l.price?.currency_code ?? "USD",
      tags: l.tags ?? [],
      materials: l.materials ?? [],
      description: l.description ?? "",
      imageUrls,
      imageFiles,
      variants: variantsFrom(inv),
    });
    process.stdout.write(".");
  }
  console.log("");

  // JSON
  writeFileSync(
    join(OUT, "ghost-bank.json"),
    JSON.stringify(
      { org_id: ORG_ID, shop_id: shopId, captured_at: new Date().toISOString(), count: listings.length, listings },
      null,
      2,
    ),
  );

  // HTML tablo
  const rowsHtml = listings
    .map((L) => {
      const thumb = L.imageFiles[0]
        ? `<img src="${esc(L.imageFiles[0])}" loading="lazy" style="width:84px;height:84px;object-fit:cover;border-radius:8px">`
        : "—";
      const gallery = L.imageFiles
        .map((f) => `<a href="${esc(f)}" target="_blank"><img src="${esc(f)}" loading="lazy" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin:1px"></a>`)
        .join("");
      const vars = L.variants.length
        ? `<table class="v"><tr><th>Seçenek</th><th>SKU</th><th>Fiyat</th><th>Adet</th></tr>${L.variants
            .map((v) => `<tr><td>${esc(v.options)}</td><td>${esc(v.sku ?? "—")}</td><td>${money(v.priceCents, L.currency)}</td><td>${v.quantity ?? "—"}</td></tr>`)
            .join("")}</table>`
        : '<span class="muted">varyasyon yok</span>';
      return `<tr>
        <td>${thumb}<div>${gallery}</div><div class="muted">${L.imageFiles.length} görsel</div></td>
        <td><b>${esc(L.title)}</b><div class="muted">#${L.listingId}</div>${L.url ? `<a href="${esc(L.url)}" target="_blank">Etsy'de aç ↗</a>` : ""}</td>
        <td class="price">${money(L.priceCents, L.currency)}</td>
        <td>${vars}</td>
        <td class="tags">${L.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</td>
        <td><details><summary>Açıklama</summary><pre>${esc(L.description)}</pre></details></td>
      </tr>`;
    })
    .join("\n");

  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EON Hayalet Bankası — ${listings.length} listing</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#1c1626;background:#faf9fc}
  h1{font-size:20px} .sub{color:#6b6480;margin-bottom:16px}
  table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px #0001}
  th,td{border-bottom:1px solid #eee;padding:10px;vertical-align:top;text-align:left;font-size:13px}
  th{background:#f3f1f8;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b6480}
  .price{font-weight:700;white-space:nowrap} .muted{color:#9a93ad;font-size:11px}
  .tags span{display:inline-block;background:#f0edf7;border-radius:5px;padding:1px 6px;margin:1px;font-size:11px}
  table.v{width:auto;box-shadow:none;font-size:11px} table.v th,table.v td{padding:3px 6px;border:1px solid #eee}
  pre{white-space:pre-wrap;max-width:420px;font-size:11px;color:#453e57}
  details summary{cursor:pointer;color:#6b46c1}
  a{color:#6b46c1}
</style></head><body>
<h1>EON Hayalet Bankası</h1>
<div class="sub">${listings.length} aktif listing · shop ${shopId} · ${new Date().toLocaleString("tr-TR")} · <b>silmeden önce kalıcı fiyat/veri arşivi</b></div>
<table><tr><th>Görseller</th><th>Başlık / Link</th><th>Fiyat</th><th>Varyasyon + SKU</th><th>Etiketler</th><th>Açıklama</th></tr>
${rowsHtml}
</table></body></html>`;
  writeFileSync(join(OUT, "index.html"), html);

  // ── Doğrulama ────────────────────────────────────────────────────────
  const withPrice = listings.filter((l) => l.priceCents != null).length;
  const withVariants = listings.filter((l) => l.variants.length > 0).length;
  const totalSkus = listings.reduce((n, l) => n + l.variants.filter((v) => v.sku).length, 0);
  console.log("\n── DOĞRULAMA ──────────────────────────────");
  console.log(`Listing sayısı        : ${listings.length}`);
  console.log(`Fiyatı yakalanan      : ${withPrice}/${listings.length}`);
  console.log(`Varyasyonu olan       : ${withVariants}/${listings.length}`);
  console.log(`Toplam SKU            : ${totalSkus}`);
  console.log(`Görsel indirildi      : ${imgOk} (başarısız ${imgFail})`);
  console.log(`\nÇıktı: ${OUT}/index.html · ${OUT}/ghost-bank.json · ${OUT}/images/`);
  if (withPrice < listings.length)
    console.log("⚠ Bazı fiyatlar boş — elle kontrol et; bu geçmeden Etsy'de silme.");
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exit(1);
});

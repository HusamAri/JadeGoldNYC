#!/usr/bin/env node
/**
 * EON lab-grown Double Shared Prong band, galeri → panel:
 * supabase/migrations/0174_eon_lab_grown_dsp_gallery.sql
 *
 * 0173 ürünü ve 39 varyantı açtı (dondurulmuş, yeniden üretilmez). Bu migration
 * YALNIZ galeriyi bağlar: listing_images satırları, products.image_url/num_images,
 * listing_metadata.gallery + güncel blocker'lar + hold gerekçesi. Açıklamaya
 * DOKUNMAZ: kamuya açık metinde AI/görselleştirme beyanı yok (sahip kuralı
 * 2026-10-27/31; her Etsy yazma yolu assertPublicText ile reddeder).
 * Etsy'de açılmış (etsy_listing_id dolu) ürüne dokunmaz.
 *
 * Girdi: docs/eon/lab-grown/01-double-shared-prong/listing.json (`gallery`,
 * `galleryUpdate`). Dosyalar public/eon/lab-grown-dsp/ altında
 * diskte OLMALI (assert) ve prod domain'inden servis edilir.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_dsp_gallery_migration.mjs
 */
import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/01-double-shared-prong";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0174_eon_lab_grown_dsp_gallery.sql");
const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

const G = L.gallery;
assert.equal(G.images.length, 10);
// Diskteki galeri paketle birebir (ad ve sıra).
const onDisk = (await readdir(path.join(repoRoot, G.publicDir))).filter((f) => /^\d{2}-.+\.jpg$/.test(f)).sort();
assert.deepEqual(onDisk, G.images.map(([f]) => f), "public galeri paketle uyuşmuyor");
for (const [file, alt] of G.images) {
  assert(alt.length <= 250, `${file}: alt 250 kr`);
  assert(!/\bAI\b|render|visuali|nano|higgsfield|gemini/i.test(alt), `${file}: alt'ta araç/üreteç adı yok`);
}
// FTC §23.25: alt metinde ve görsel bölümünde niteliksiz "diamond" yok.
const UNQUALIFIED =
  /(?<!\blab grown )(?<!\blab-grown )(?<!\blaboratory-grown )(?<!\blab created )(?<!\bmined )\bdiamonds?\b/i;
for (const [file, alt] of G.images) assert(!UNQUALIFIED.test(alt), `${file}: niteliksiz "diamond"`);
assert(!("imagesSection" in L), "kamuya açık görsel/AI beyanı yazılmaz (sahip kuralı 2026-10-27/31)");
const q = (s) => {
  assert(!String(s).includes("$ww$"), "dollar-quote çakışması");
  return `$ww$${s}$ww$`;
};
const urlOf = (file) => `${G.urlBase}/${file}`;
const imagesJson = G.images.map(([file, alt]) => [file, alt]);
const metaPatch = {
  gallery: {
    count: G.images.length,
    status: G.status,
    source: G.source,
    qa: G.qa,
    urlBase: G.urlBase,
    revision: 1,
    attachedAt: "2026-11-04",
  },
  approval: { ...L.approval, blockers: L.galleryUpdate.blockers },
  draftTransfer: L.galleryUpdate.draftTransfer,
};

const sql = `-- 0174_eon_lab_grown_dsp_gallery.sql
-- EON-DSP (lab-grown Double Shared Prong) galerisi: sahibin 2026-11-04 yüklediği 10 görsel,
-- public/eon/lab-grown-dsp/ altından prod domain'inden servis edilir (JPEG q92, meta veri sökülü).
-- 0173 (ürün + 39 varyant) dondurulmuş; burada yalnız galeri, image_url/num_images,
-- listing_metadata.gallery + güncel blocker'lar + hold gerekçesi. Açıklamaya dokunmaz.
-- Üretici: scripts/eon/gen_lab_grown_dsp_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Etsy'ye yazmaz. Etsy'de açılmış ürüne (etsy_listing_id dolu) dokunmaz.
-- Idempotent: görsel satırı aynı URL varsa atlanır; ürün alanları her koşuda aynı değere yazılır.
begin;

update public.products p set
  image_url = ${q(urlOf(G.images[0][0]))},
  num_images = ${G.images.length},
  listing_metadata = coalesce(p.listing_metadata, '{}'::jsonb) || ${q(JSON.stringify(metaPatch))}::jsonb,
  updated_at = now()
where p.org_id = '${EON_ORG}' and p.sku = '${L.productSku}' and p.etsy_listing_id is null;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, '${G.urlBase}/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from public.products p
cross join lateral jsonb_array_elements(${q(JSON.stringify(imagesJson))}::jsonb) with ordinality img(v, n)
where p.org_id = '${EON_ORG}' and p.sku = '${L.productSku}' and p.etsy_listing_id is null
  and not exists (
    select 1 from public.listing_images li
    where li.product_id = p.id and li.url = '${G.urlBase}/' || (img.v->>0)
  );

commit;
`;

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: ${G.images.length} images, description untouched`);

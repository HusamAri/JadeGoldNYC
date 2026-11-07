#!/usr/bin/env node
/**
 * EON-VB6 galerisi → supabase/migrations/0177_eon_lab_grown_vb6_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/02-vertical-baguette/images/status.json (sahibin onayladığı 10 kare; seçilen ve
 * reddedilen çekimler gerekçeleriyle). Dosyalar public/eon/lab-grown-vb6/NN.jpg, panelin kendi alan adından
 * servis edilir. UYGULAMA SIRASI: önce bu dosyalar main'e girip prod'a dağıtılır, 10 URL'in 10'u canlıda 200
 * döner, SONRA migration uygulanır (aksi hâlde panel push'u fotoğrafsız taslak açar; 2026-09-25 dersi).
 *
 * Kapılar: 10 kare, pozisyon 0-9 sıralı, dosya var ve md5 manifestle aynı, alt ≤250 kr, FTC niteleyicisi,
 * görsel/AI beyanı yok. Kapak (products.image_url) pozisyon 0'daki yazısız hero; push önce image_url'i yükler.
 * Idempotent: aynı URL ikinci kez eklenmez; image_url yalnız boşsa yazılır; Etsy'ye çıkmış ürüne dokunmaz.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_vb_gallery_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UNQUALIFIED_DIAMOND } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const S = JSON.parse(await readFile(path.join(repoRoot, "docs/eon/lab-grown/02-vertical-baguette/images/status.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0177_eon_lab_grown_vb6_gallery.sql");
const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

assert.equal(S.product, "EON-VB6");
assert.equal(S.gallery.length, 10);
for (const [i, g] of S.gallery.entries()) {
  assert.equal(g.position, i);
  assert.equal(g.url, `https://amuletta.artifactstudio.info/eon/lab-grown-vb6/${String(i + 1).padStart(2, "0")}.jpg`);
  const bytes = await readFile(path.join(repoRoot, g.file));
  assert.equal(createHash("md5").update(bytes).digest("hex"), g.md5, `${g.file} md5`);
  assert(bytes.length < 1_000_000, `${g.file} ≥ 1 MB`);
  assert(g.alt.length <= 250, `alt ${i}`);
  assert(!UNQUALIFIED_DIAMOND.test(g.alt), `alt ${i}: niteliksiz diamond`);
  assert(!/\bAI\b|\brender|\bvisuali[sz]ation|\bgenerated\b/i.test(g.alt), `alt ${i}: görsel beyanı`);
}
assert.equal(new Set(S.gallery.map((g) => g.md5)).size, 10, "aynı kare iki kez");

const q = (s) => {
  assert(!s.includes("$vb$"));
  return `$vb$${s}$vb$`;
};
const rows = S.gallery.map((g) => `  (${g.position}, ${q(g.url)}, ${q(g.alt)})`).join(",\n");

const sql = `-- 0177_eon_lab_grown_vb6_gallery.sql
-- EON-VB6 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, amber + teal ev stüdyosu),
-- public/eon/lab-grown-vb6/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/02-vertical-baguette/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_vb_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
${rows}
) g(pos, url, alt)
join public.products p on p.org_id = '${EON_ORG}' and p.sku = 'EON-VB6' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = ${q(S.gallery[0].url)},
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '${EON_ORG}' and p.sku = 'EON-VB6' and p.etsy_listing_id is null and p.image_url is null;

commit;
`;
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 10 images, cover ${S.gallery[0].url}`);

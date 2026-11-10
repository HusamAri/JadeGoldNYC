/**
 * EON lab-grown galeri migration'ları için ortak üreteç (02 VB6, 03 FR6 ...).
 *
 * Girdi: paketin images/status.json'u (sahibin onayladığı kareler; seçilen/reddedilen çekimler gerekçeleriyle).
 * Dosyalar public/eon/<klasör>/NN.jpg, panelin kendi alan adından servis edilir. UYGULAMA SIRASI: önce dosyalar
 * main'e girip prod'a dağıtılır, URL'lerin hepsi canlıda 200 döner, SONRA migration uygulanır (aksi hâlde panel
 * push'u fotoğrafsız taslak açar; 2026-09-25 dersi).
 *
 * Kapılar: kare sayısı, pozisyon 0..n-1 sıralı, URL deseni, dosya var ve md5 manifestle aynı, <1 MB, alt ≤250 kr,
 * FTC niteleyicisi, görsel/AI beyanı yok, aynı kare iki kez yok. Kapak (products.image_url) pozisyon 0'daki yazısız
 * hero; push önce image_url'i yükler. Idempotent: aynı URL ikinci kez eklenmez; image_url yalnız boşsa yazılır;
 * Etsy'ye çıkmış ürüne dokunmaz. 0177 (VB6) bu modüle taşındığında çıktısı bayt bayt aynı kaldı (2026-11-08).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { EON_ORG } from "./lab_grown_band.mjs";
import { UNQUALIFIED_DIAMOND } from "./lab_grown_gates.mjs";

const PROD = "https://amuletta.artifactstudio.info";

export async function galleryMigrationSql({
  repoRoot, statusRel, sku, folder, count, fileName, generatorScript, tag,
  look = "amber + teal ev stüdyosu",
}) {
  const S = JSON.parse(await readFile(path.join(repoRoot, statusRel), "utf8"));
  assert.equal(S.product, sku);
  assert.equal(S.gallery.length, count);
  for (const [i, g] of S.gallery.entries()) {
    assert.equal(g.position, i);
    assert.equal(g.url, `${PROD}/eon/${folder}/${String(i + 1).padStart(2, "0")}.jpg`);
    const bytes = await readFile(path.join(repoRoot, g.file));
    assert.equal(createHash("md5").update(bytes).digest("hex"), g.md5, `${g.file} md5`);
    assert(bytes.length < 1_000_000, `${g.file} ≥ 1 MB`);
    assert(g.alt.length <= 250, `alt ${i}`);
    assert(!UNQUALIFIED_DIAMOND.test(g.alt), `alt ${i}: niteliksiz diamond`);
    assert(!/\bAI\b|\brender|\bvisuali[sz]ation|\bgenerated\b/i.test(g.alt), `alt ${i}: görsel beyanı`);
  }
  assert.equal(new Set(S.gallery.map((g) => g.md5)).size, count, "aynı kare iki kez");

  const quote = `$${tag}$`;
  const q = (s) => {
    assert(!s.includes(quote));
    return `${quote}${s}${quote}`;
  };
  const rows = S.gallery.map((g) => `  (${g.position}, ${q(g.url)}, ${q(g.alt)})`).join(",\n");
  const last = String(count).padStart(2, "0");

  return `-- ${fileName}
-- ${sku} galerisi: sahibin onayladığı ${count} kare (Higgsfield nano_banana_2, 2k, 4:3, ${look}),
-- public/eon/${folder}/01-${last}.jpg. Seçilen/reddedilen çekimler: ${statusRel}.
-- Üretici: ${generatorScript} — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: ${count} URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
${rows}
) g(pos, url, alt)
join public.products p on p.org_id = '${EON_ORG}' and p.sku = '${sku}' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = ${q(S.gallery[0].url)},
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '${EON_ORG}' and p.sku = '${sku}' and p.etsy_listing_id is null and p.image_url is null;

commit;
`;
}

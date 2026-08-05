-- 0131: TTG başlıklarını Etsy'nin güncel (Ağustos 2025) başlık rehberine çeker.
--
-- Neden: 0127–0129'daki başlıklar eski uzun-başlık modeliyle yazılmıştı —
-- 133 karakter / 24 kelime, "Gold" üç kez, ve dördü de rehberliğin başlıktan
-- çıkarıp ETİKETLERE taşımayı söylediği alıcı/vesile terimi ("Mens",
-- "Anniversary", "Gift for Him"). Ayrıca "2mm to 12mm" ARTIK YANLIŞ: katalog
-- ekseni 6–12mm'ye çekildi (bkz. docs/eon/width-prune-runbook.md).
--
-- Yeni başlıklar 79 karakter / 14 kelime; sert kurallarda (140 kr, yasak
-- karakter, %:&+ tekrarı, 3 caps kelime) ve rehberlikte (15 kelime altı,
-- kelime tekrarı yok, alıcı/vesile/promosyon terimi yok) temiz doğrulandı.
--
-- DİKKAT — AYNA UYARISI: bu üç listing 2026-08-05 18:24'te Etsy'de TASLAK
-- olarak açıldı (audit: etsy.listing_create #4550516268 / #4550506421 /
-- #4550506827) ve ESKİ başlıkları taşıyor. Panelin toplu SEO gönderimi
-- başlığa BİLEREK dokunmaz (31 Temmuz'da başlıkların dış taraftan ezilmesi
-- vakasından sonra konan kural, bkz. docs/second-brain.md) — yani buradaki
-- güncelleme Etsy'ye KENDİLİĞİNDEN GİTMEZ ve senkron Etsy'yi doğruluk kaynağı
-- saydığı için eski başlığı panele geri yazabilir. Kalıcı olması için başlık
-- Etsy editöründen elle düzeltilmelidir; kanonik metin bu dosyada yaşar
-- (repo = kaynak, panel = ayna).
--
-- Ürünler id ile DEĞİL varyant SKU önekiyle bulunur (ortamlar arası taşınır).

update public.products p
set title = '10K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit'
where p.id in (
  select distinct v.product_id from public.product_variants v
  where v.sku like 'TTG-R-1006-%'
)
and p.title <> '10K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit';

update public.products p
set title = '14K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit'
where p.id in (
  select distinct v.product_id from public.product_variants v
  where v.sku like 'TTG-R-1406-%'
)
and p.title <> '14K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit';

update public.products p
set title = '18K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit'
where p.id in (
  select distinct v.product_id from public.product_variants v
  where v.sku like 'TTG-R-1806-%'
)
and p.title <> '18K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit';

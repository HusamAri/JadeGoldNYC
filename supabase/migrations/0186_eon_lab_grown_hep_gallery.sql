-- 0186_eon_lab_grown_hep_gallery.sql
-- EON-HEP galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş taş tablosu),
-- public/eon/lab-grown-hep/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/05-half-eternity-pave/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_hep_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/01.jpg$hep$, $hep$14K yellow gold 1.5 mm half eternity band with one row of small round lab-grown diamonds across its front half, lying on a pale blue-grey ceramic tile in soft window light.$hep$),
  (1, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/02.jpg$hep$, $hep$Close view of the row of round lab-grown diamonds on the 14K yellow gold band, each pair held by tiny shared prongs that form a fine beaded line along both edges.$hep$),
  (2, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/03.jpg$hep$, $hep$The 1.5 mm 14K yellow gold band standing on light indigo chambray, its lab-grown diamonds arching over the top half and the lower half plain polished gold.$hep$),
  (3, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/04.jpg$hep$, $hep$The slim 14K yellow gold half eternity band worn on a woman's ring finger, the row of lab-grown diamonds across the top of the finger, hand resting on blue-grey linen.$hep$),
  (4, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/05.jpg$hep$, $hep$Five of the twenty stone choices in 14K yellow gold, left to right: lab-grown diamond, lab-created sapphire, lab-created ruby, lab-created emerald and amethyst. Sold as one ring.$hep$),
  (5, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/06.jpg$hep$, $hep$14K white gold version of the 1.5 mm half eternity band standing on a warm terracotta clay tile, lab-grown diamonds across the top half, the lower half plain.$hep$),
  (6, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/07.jpg$hep$, $hep$The half eternity band in 14K yellow, white and rose gold side by side on grey limestone, each with lab-grown diamonds along its front half.$hep$),
  (7, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/08.jpg$hep$, $hep$The 14K yellow gold band held edge-on between a woman's thumb and index finger to show its real size: a thin line of lab-grown diamonds about 21 mm long.$hep$),
  (8, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/09.jpg$hep$, $hep$14K rose gold version of the 1.5 mm half eternity band with lab-grown diamonds across its front half, on sage green linen with eucalyptus leaves behind.$hep$),
  (9, $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/10.jpg$hep$, $hep$Chart of the twenty stone choices for this band, each named with its origin: laboratory-grown, laboratory-created, natural or cultured, with the usual treatments noted.$hep$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HEP' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $hep$https://amuletta.artifactstudio.info/eon/lab-grown-hep/01.jpg$hep$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HEP' and p.etsy_listing_id is null and p.image_url is null;

commit;

-- 0177_eon_lab_grown_vb6_gallery.sql
-- EON-VB6 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, amber + teal ev stüdyosu),
-- public/eon/lab-grown-vb6/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/02-vertical-baguette/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_vb_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/01.jpg$vb$, $vb$14K yellow gold 6 mm band with one lab-grown diamond baguette set crosswise and flush, standing on pale travertine in soft window light.$vb$),
  (1, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/02.jpg$vb$, $vb$Close-up of the lab-grown diamond baguette set flush across the brushed 14K gold band, its step-cut facets meeting clean gold edges.$vb$),
  (2, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/03.jpg$vb$, $vb$The 14K gold band lying flat on light oak, showing the 2.2 mm wall, the 6 mm brushed face and the crosswise lab-grown diamond baguette.$vb$),
  (3, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/04.jpg$vb$, $vb$A man's hand on linen wearing the 6 mm brushed 14K gold band with a lab-grown diamond baguette on the ring finger.$vb$),
  (4, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/05.jpg$vb$, $vb$View through the ring showing the smooth polished inside of the 14K gold band, with the lab-grown diamond baguette flush at the top.$vb$),
  (5, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/06.jpg$vb$, $vb$A woman's hand beside a ceramic cup wearing the 6 mm brushed 14K gold band with a lab-grown diamond baguette on the ring finger.$vb$),
  (6, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/07.jpg$vb$, $vb$The band in 14K yellow, white and rose gold side by side, each with one lab-grown diamond baguette set crosswise across the band.$vb$),
  (7, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/08.jpg$vb$, $vb$The ring held between thumb and index finger to show its true size: a 6 mm brushed 14K gold band with a lab-grown diamond baguette.$vb$),
  (8, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/09.jpg$vb$, $vb$Low view of the 14K gold band on travertine in a beam of sunlight, the lab-grown diamond baguette sitting flush and flashing in clean lines.$vb$),
  (9, $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/10.jpg$vb$, $vb$The 14K gold band with its lab-grown diamond baguette resting in a small ceramic dish on an oak bedside table by the window.$vb$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-VB6' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $vb$https://amuletta.artifactstudio.info/eon/lab-grown-vb6/01.jpg$vb$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-VB6' and p.etsy_listing_id is null and p.image_url is null;

commit;

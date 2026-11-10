-- 0184_eon_lab_grown_hs5_gallery.sql
-- EON-HS5 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, her metal tamamlayıcı renk zeminde),
-- public/eon/lab-grown-hs5/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/04-hammered-star/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_hs_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/01.jpg$hs$, $hs$14K yellow gold 5 mm hammered band with four star-set round lab-grown diamonds spaced evenly around it, two showing on the front, lying on blue-grey slate in soft window light.$hs$),
  (1, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/02.jpg$hs$, $hs$Close view of one engraved eight-point star with a round lab-grown diamond at its centre, set level with the hammered 14K yellow gold surface.$hs$),
  (2, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/03.jpg$hs$, $hs$The 5 mm hammered 14K yellow gold band standing on indigo linen, two of its four star-set lab-grown diamonds on the visible side a quarter turn apart, polished inside.$hs$),
  (3, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/04.jpg$hs$, $hs$The 5 mm hammered 14K yellow gold band worn on a man's ring finger, two star-set lab-grown diamonds on top, hand resting on washed denim.$hs$),
  (4, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/05.jpg$hs$, $hs$Looking into the hammered 14K yellow gold band standing on slate: the plain polished inside, with two star-set lab-grown diamonds along the top of the band.$hs$),
  (5, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/06.jpg$hs$, $hs$14K white gold version of the 5 mm hammered band with star-set round lab-grown diamonds, lying on warm terracotta sandstone in daylight.$hs$),
  (6, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/07.jpg$hs$, $hs$The hammered star-set band in 14K yellow, white and rose gold side by side on grey limestone, each showing two of its four lab-grown diamonds.$hs$),
  (7, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/08.jpg$hs$, $hs$The 5 mm hammered 14K yellow gold band held between a man's thumb and index finger to show its real size, two star-set lab-grown diamonds facing the camera.$hs$),
  (8, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/09.jpg$hs$, $hs$14K rose gold version of the 5 mm hammered band with star-set round lab-grown diamonds, on sage green linen with eucalyptus leaves behind.$hs$),
  (9, $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/10.jpg$hs$, $hs$The hammered 14K yellow gold star-set band resting in a cobalt blue ceramic dish on an oak bedside table by the window.$hs$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $hs$https://amuletta.artifactstudio.info/eon/lab-grown-hs5/01.jpg$hs$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5' and p.etsy_listing_id is null and p.image_url is null;

commit;

-- 0194_eon_lab_grown_pear2_gallery.sql
-- EON-PEAR2 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, taşlar kameraya yüzü dönük, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş ölçü kartı),
-- public/eon/lab-grown-pear2/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/08-double-pear/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_pear_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/01.jpg$pear2$, $pear2$14K yellow gold toi et moi ring with two pear cut lab grown diamonds side by side, points facing opposite ways, lying on a pale blue-grey ceramic tile in soft window light.$pear2$),
  (1, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/02.jpg$pear2$, $pear2$Close view of the two pear cut lab grown diamonds on the slim 14K yellow gold band, the larger pointing down and the smaller pointing up, each held by three claw prongs, on blue slate.$pear2$),
  (2, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/03.jpg$pear2$, $pear2$14K yellow gold toi et moi ring on light indigo chambray, its two pear cut lab grown diamonds facing up, the slim band and its shadow behind them.$pear2$),
  (3, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/04.jpg$pear2$, $pear2$The 14K yellow gold toi et moi ring worn on the ring finger, two pear cut lab grown diamonds side by side across the finger, the larger pointing to the fingertip.$pear2$),
  (4, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/05.jpg$pear2$, $pear2$Three toi et moi rings in 14K yellow, white and rose gold on grey limestone, each with two pear cut lab grown diamonds pointing opposite ways.$pear2$),
  (5, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/06.jpg$pear2$, $pear2$14K white gold toi et moi ring with two pear cut lab grown diamonds, standing on a warm terracotta tile, seen from above.$pear2$),
  (6, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/07.jpg$pear2$, $pear2$14K rose gold toi et moi ring with two pear cut lab grown diamonds lying on sage green linen, eucalyptus leaves behind.$pear2$),
  (7, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/08.jpg$pear2$, $pear2$Side view of the 14K yellow gold toi et moi ring on dark slate: the slim band and the two pear cut lab grown diamonds in their low claw baskets on top.$pear2$),
  (8, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/09.jpg$pear2$, $pear2$The 14K yellow gold toi et moi ring held between thumb and index finger, showing the real size of its two pear cut lab grown diamonds.$pear2$),
  (9, $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/10.jpg$pear2$, $pear2$Detail card: two pear cut lab grown diamonds, about 8 x 6 mm and 5 x 3.5 mm, on a 14K gold band about 1.8 mm wide and 1.6 mm thick; sizes US 4 to US 16.$pear2$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PEAR2' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $pear2$https://amuletta.artifactstudio.info/eon/lab-grown-pear2/01.jpg$pear2$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PEAR2' and p.etsy_listing_id is null and p.image_url is null;

commit;

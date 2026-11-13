-- 0190_eon_lab_grown_pc9_gallery.sql
-- EON-PC9 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, her metal tamamlayıcı renk zeminde; 10. kare yerelde dizilmiş ölçü kartı),
-- public/eon/lab-grown-pc9/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/06-princess-channel/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_pc_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/01.jpg$pc9$, $pc9$14K yellow gold 3 mm band with nine square princess cut lab-grown diamonds channel set across its front, lying on a pale blue-grey ceramic tile in soft window light.$pc9$),
  (1, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/02.jpg$pc9$, $pc9$Close view of the nine princess cut lab-grown diamonds set edge to edge in the channel of the 14K yellow gold band, between two slim polished rails and two flat end walls.$pc9$),
  (2, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/03.jpg$pc9$, $pc9$The 3 mm 14K yellow gold band standing on light indigo chambray, its short row of princess cut lab-grown diamonds across the top and the rest of the band plain polished gold.$pc9$),
  (3, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/04.jpg$pc9$, $pc9$A hand on blue-grey linen wearing the 14K yellow gold band on the ring finger, its row of princess cut lab-grown diamonds across the top of the finger.$pc9$),
  (4, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/05.jpg$pc9$, $pc9$Three versions of the band side by side on grey limestone: 14K yellow, white and rose gold, each with nine princess cut lab-grown diamonds in a channel.$pc9$),
  (5, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/06.jpg$pc9$, $pc9$The 14K white gold band standing on a warm terracotta tile, its short row of princess cut lab-grown diamonds along the top and the rest of the band plain polished white gold.$pc9$),
  (6, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/07.jpg$pc9$, $pc9$The 14K rose gold band lying on sage green linen with eucalyptus leaves behind, its nine princess cut lab-grown diamonds channel set across the front.$pc9$),
  (7, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/08.jpg$pc9$, $pc9$Real-size view: the 14K yellow gold band lying in the palm of an open hand, its row of princess cut lab-grown diamonds at the front of the ring.$pc9$),
  (8, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/09.jpg$pc9$, $pc9$Close view of one end of the stone row: a flat polished wall of 14K yellow gold closes the channel after the last princess cut lab-grown diamond, and the band continues plain.$pc9$),
  (9, $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/10.jpg$pc9$, $pc9$Spec card: top view and cross-section drawings of the band, 3 mm wide and 1.8 mm thick, with nine 2 mm princess cut lab-grown diamonds in a row about 18 mm long.$pc9$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PC9' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $pc9$https://amuletta.artifactstudio.info/eon/lab-grown-pc9/01.jpg$pc9$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PC9' and p.etsy_listing_id is null and p.image_url is null;

commit;

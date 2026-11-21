-- 0196_eon_lab_grown_sde6_gallery.sql
-- EON-SDE6 galerisi: sahibin onayladığı 11 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, metalin tamamlayıcısı düşük doygun zeminler; 10. kare yerelde dizilmiş ölçü kartı; 11. kare sahibin kendi fotoğrafı, düzenlenmeden),
-- public/eon/lab-grown-sde6/01-11.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/09-satin-diamond-edge/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_sde_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 11 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/01.jpg$sde6$, $sde6$Gold band lying on a pale blue-grey tile: a brushed satin face between two beveled edges, each set with a row of small round lab-grown diamonds all the way around.$sde6$),
  (1, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/02.jpg$sde6$, $sde6$Close view of a beveled edge: small round lab-grown diamonds side by side with tiny gold beads between them, the thin polished lip above and the brushed satin face below, over blue-grey slate.$sde6$),
  (2, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/03.jpg$sde6$, $sde6$The band lying on charcoal slate, seen from the front: a row of round lab-grown diamonds along its top edge, a second row along its bottom edge and the brushed satin face between them.$sde6$),
  (3, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/04.jpg$sde6$, $sde6$A man's hand on charcoal grey wool wearing the band on the ring finger, its two rows of lab-grown diamonds crossing the finger on either side of the brushed face.$sde6$),
  (4, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/05.jpg$sde6$, $sde6$The band in yellow, white and rose gold side by side on pale limestone, each with a row of round lab-grown diamonds along both of its beveled edges.$sde6$),
  (5, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/06.jpg$sde6$, $sde6$The white gold band standing on sandstone, its opening framed by the full circle of round lab-grown diamonds on the near edge and the brushed face curving away.$sde6$),
  (6, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/07.jpg$sde6$, $sde6$The rose gold band on sage green linen seen from above: a complete circle of round lab-grown diamonds around the opening, the thin polished lip inside it and the brushed face outside.$sde6$),
  (7, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/08.jpg$sde6$, $sde6$The band resting in a man's open palm to show its size, a row of lab-grown diamonds along its top edge and another along its bottom edge.$sde6$),
  (8, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/09.jpg$sde6$, $sde6$The band standing on black basalt, seen along its axis: the row of round lab-grown diamonds forms one continuous circle around the opening, the polished inside beyond.$sde6$),
  (9, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/10.jpg$sde6$, $sde6$Drawing of the band from the side and in cross-section: about 6 mm wide and 1.8 mm thick, a row of round lab-grown diamonds of about 1.3 mm on each beveled edge, all the way round.$sde6$),
  (10, $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/11.jpg$sde6$, $sde6$The ring on a red holder over a white towel on the workbench: the brushed satin face and a beveled edge with its row of small round lab-grown diamonds running around the band.$sde6$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-SDE6' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $sde6$https://amuletta.artifactstudio.info/eon/lab-grown-sde6/01.jpg$sde6$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-SDE6' and p.etsy_listing_id is null and p.image_url is null;

commit;

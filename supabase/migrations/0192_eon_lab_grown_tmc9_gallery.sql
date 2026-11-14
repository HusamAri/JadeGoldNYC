-- 0192_eon_lab_grown_tmc9_gallery.sql
-- EON-TMC9 galerisi: sahibin onayladığı 11 kare (Higgsfield nano_banana_2, 2k, 4:3, pencere gün ışığı, sarının tamamlayıcısı soğuk zeminler; 10. kare yerelde dizilmiş ölçü kartı; 11. kare sahibin kendi fotoğrafı, düzenlenmeden),
-- public/eon/lab-grown-tmc9/01-11.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/07-two-tone-milgrain-channel/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_tmc_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 11 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/01.jpg$tmc9$, $tmc9$Two tone gold band lying on a pale blue-grey tile: white gold rails edged with milgrain, a domed yellow gold centre and nine round lab-grown diamonds channel set across the front.$tmc9$),
  (1, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/02.jpg$tmc9$, $tmc9$Close view of the nine round lab-grown diamonds set side by side in the channel of the domed yellow gold centre, framed by white gold rails with fine milgrain bead lines, over blue-grey slate.$tmc9$),
  (2, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/03.jpg$tmc9$, $tmc9$The band standing on light indigo chambray, its row of round lab-grown diamonds along the upper part of the ring and the rest of the band plain white gold milgrain rails and polished yellow gold.$tmc9$),
  (3, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/04.jpg$tmc9$, $tmc9$A man's hand resting on charcoal grey wool by a window, wearing the two tone band on the ring finger with its row of lab-grown diamonds across the top of the finger.$tmc9$),
  (4, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/05.jpg$tmc9$, $tmc9$The plain back of the band over pale concrete: two white gold rails, two fine milgrain bead lines and the softly domed, polished yellow gold centre between them.$tmc9$),
  (5, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/06.jpg$tmc9$, $tmc9$The band standing upright on charcoal slate, seen edge-on: its 7 mm width across the white gold rails, milgrain lines and domed yellow gold centre, with the first stones of the row at the top.$tmc9$),
  (6, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/07.jpg$tmc9$, $tmc9$The band lying on matte black basalt, its nine round lab-grown diamonds channel set in the yellow gold centre between the white gold milgrain rails.$tmc9$),
  (7, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/08.jpg$tmc9$, $tmc9$The band resting in a man's open palm to show its size, its row of round lab-grown diamonds facing up.$tmc9$),
  (8, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/09.jpg$tmc9$, $tmc9$Close view of the end of the stone row: the last round lab-grown diamonds, the channel closing in a rounded end and the plain domed yellow gold beyond it, between white gold milgrain rails.$tmc9$),
  (9, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/10.jpg$tmc9$, $tmc9$Drawing of the band from the top and in cross-section: about 7 mm wide and 2 mm thick, nine round lab-grown diamonds of about 2.75 mm in one channel, in 10K, 14K or 18K, US 4 to US 16.$tmc9$),
  (10, $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/11.jpg$tmc9$, $tmc9$The ring on a blue holder over a white paper towel, close up: round lab-grown diamonds side by side in the channel, its rounded end in the yellow gold centre and the white gold milgrain rails.$tmc9$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-TMC9' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $tmc9$https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/01.jpg$tmc9$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-TMC9' and p.etsy_listing_id is null and p.image_url is null;

commit;

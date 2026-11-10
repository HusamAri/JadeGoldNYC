-- 0180_eon_lab_grown_fr6_gallery.sql
-- EON-FR6 galerisi: sahibin onayladığı 10 kare (Higgsfield nano_banana_2, 2k, 4:3, amber + teal ev stüdyosu),
-- public/eon/lab-grown-fr6/01-10.jpg. Seçilen/reddedilen çekimler: docs/eon/lab-grown/03-flush-round/images/status.json.
-- Üretici: scripts/eon/gen_lab_grown_fr_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
-- ÖNCE dağıtım: 10 URL canlıda 200 dönmeden uygulanmaz. Etsy'ye yazmaz.
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/01.jpg$fr$, $fr$14K yellow gold 6 mm band with a brushed face, polished beveled edges and one round lab-grown diamond set flush on a thin off-center groove, standing on pale travertine in soft window light.$fr$),
  (1, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/02.jpg$fr$, $fr$Close view of the brushed 14K gold band: a small round lab-grown diamond sits flush on the thin polished groove, framed by bright beveled edges.$fr$),
  (2, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/03.jpg$fr$, $fr$The 14K gold band lying flat on light oak, showing the 1.5 mm wall, the polished bevel and the round lab-grown diamond at the front.$fr$),
  (3, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/04.jpg$fr$, $fr$The 6 mm 14K yellow gold band worn on a man's ring finger, the flush-set round lab-grown diamond facing up, hand resting on natural linen.$fr$),
  (4, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/05.jpg$fr$, $fr$Inside view of the 14K gold band: smooth polished interior with no engraving, the round lab-grown diamond sitting flush at the top.$fr$),
  (5, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/06.jpg$fr$, $fr$The band worn on a woman's ring finger beside a matte ceramic cup on travertine, with amber and teal light falling across the travertine.$fr$),
  (6, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/07.jpg$fr$, $fr$Three versions of the band side by side in 14K yellow, white and rose gold, each with one flush-set round lab-grown diamond on the groove.$fr$),
  (7, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/08.jpg$fr$, $fr$The ring held between thumb and index finger to show its real size: a slim 6 mm 14K gold band with one small round lab-grown diamond.$fr$),
  (8, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/09.jpg$fr$, $fr$Low view of the 14K gold band on travertine in late sun: the polished bevel and groove catch the light beside the flush-set round lab-grown diamond.$fr$),
  (9, $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/10.jpg$fr$, $fr$The 14K yellow gold band resting in a small off-white ceramic dish on an oak bedside table, the round lab-grown diamond facing the camera.$fr$)
) g(pos, url, alt)
join public.products p on p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-FR6' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = $fr$https://amuletta.artifactstudio.info/eon/lab-grown-fr6/01.jpg$fr$,
    num_images = (select count(*) from public.listing_images li where li.product_id = p.id),
    updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-FR6' and p.etsy_listing_id is null and p.image_url is null;

commit;

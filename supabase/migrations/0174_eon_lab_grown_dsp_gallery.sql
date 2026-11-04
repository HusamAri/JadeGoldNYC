-- 0174_eon_lab_grown_dsp_gallery.sql
-- EON-DSP (lab-grown Double Shared Prong) galerisi: sahibin 2026-11-04 yüklediği 10 görsel,
-- public/eon/lab-grown-dsp/ altından prod domain'inden servis edilir (JPEG q92, meta veri sökülü).
-- 0173 (ürün + 39 varyant) dondurulmuş; burada yalnız galeri, image_url/num_images,
-- listing_metadata.gallery + güncel blocker'lar + hold gerekçesi. Açıklamaya dokunmaz.
-- Üretici: scripts/eon/gen_lab_grown_dsp_gallery_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Etsy'ye yazmaz. Etsy'de açılmış ürüne (etsy_listing_id dolu) dokunmaz.
-- Idempotent: görsel satırı aynı URL varsa atlanır; ürün alanları her koşuda aynı değere yazılır.
begin;

update public.products p set
  image_url = $ww$https://amuletta.artifactstudio.info/eon/lab-grown-dsp/01-cover.jpg$ww$,
  num_images = 10,
  listing_metadata = coalesce(p.listing_metadata, '{}'::jsonb) || $ww${"gallery":{"count":10,"status":"AI visualization; Etsy activation needs at least one unedited real photo (draft push allowed)","source":"owner upload 2026-11-04 (EON-Etsy-10-images.zip, 10 x PNG 1448x1086), converted to JPEG q92 with metadata stripped","qa":"10/10 reviewed on a contact sheet and 3 zoomed crops: spec frames 2.50 mm / 2.75 mm match the listing, cover text-free, hands plausible (thumb hidden in 03), prongs paired, caption 'LAB-GROWN DIAMONDS' qualified. Finding: the face-on frame (04) shows 11 stones, spec is 13. All frames are yellow gold; no white/rose frame. No public AI statement (owner rule 2026-10-27/31, assertPublicText).","urlBase":"https://amuletta.artifactstudio.info/eon/lab-grown-dsp","revision":1,"attachedAt":"2026-11-04"},"approval":{"authority":"Owner 2026-11-04: list $1,200 -> 25% showcase -> $900; v1 = 14K, 3 colours, half-around (13 stones), US 4-10, one price for every size. Panel draft only; Etsy push waits for a real photo.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":false,"livePublicationAuthorized":false,"blockers":["Gallery is AI visualization: Etsy activation needs at least one unedited photo of the physical piece (draft push allowed)","Face-on frame (04) shows 11 stones, spec is 13: regenerate before the push or accept","Maker to confirm: $550 holds for US 4-10 at one price; stone colour/clarity grade; whether white gold is rhodium plated; preparation time","No shop section for lab grown pieces yet (owner creates it in Etsy before the push)","Spanish translation not written"]},"draftTransfer":{"status":"hold","route":"manual","reason":"gallery attached 2026-11-04; waiting for the owner's go for the Etsy draft push (prod must serve public/eon/lab-grown-dsp and the diamond_band protocol); activation needs a real photo","heldAt":"2026-11-04"}}$ww$::jsonb,
  updated_at = now()
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-DSP' and p.etsy_listing_id is null;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/eon/lab-grown-dsp/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from public.products p
cross join lateral jsonb_array_elements($ww$[["01-cover.jpg","Yellow gold half eternity band with a row of round lab grown diamonds in double shared prongs, lying on brushed metal"],["02-double-shared-prongs.jpg","Macro of three round lab grown diamonds held by paired ball-tip shared prongs on the yellow gold band"],["03-on-hand-scale.jpg","Yellow gold lab grown diamond band worn on the ring finger, hand resting on a brushed metal surface"],["04-half-eternity.jpg","The yellow gold band standing upright, seen face on: stones along the top half, plain polished lower half; half-eternity design"],["05-side-profile.jpg","Side profile of the yellow gold band with the 2.50 mm height marked"],["06-diamond-row.jpg","Yellow gold band leaning on a brushed metal block, the row of round lab grown diamonds facing forward"],["07-handheld-detail.jpg","Yellow gold lab grown diamond band held between two fingertips, the row of stones facing the camera"],["08-polished-gold.jpg","Polished yellow gold back of the band with the stones on the far side, standing against draped fabric"],["09-round-brilliant.jpg","Macro of round brilliant lab grown diamonds in the yellow gold band, captioned round brilliant, lab-grown diamonds"],["10-band-width.jpg","Yellow gold band standing upright with the 2.75 mm width marked"]]$ww$::jsonb) with ordinality img(v, n)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-DSP' and p.etsy_listing_id is null
  and not exists (
    select 1 from public.listing_images li
    where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/eon/lab-grown-dsp/' || (img.v->>0)
  );

commit;

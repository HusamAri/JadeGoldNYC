-- 0167_artifact_twig.sql
-- by Artifact Studio Jewelry: Twig and Baroque Pearl Bracelet, 1 listing, 27 variants
-- (Karat x Metal Color x Bracelet Length), 12 images. Panel draft only; this migration does not write to Etsy.
-- Source package: docs/artifact-studio/twig/ (catalog.py). Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku);
-- images insert only under a product still unpublished (etsy_listing_id is null).
-- Seals (run after apply):
--   variants: 27 / 2d0a9ca905e7825b9c68334abec43966   (md5 of sku|Karat|Metal Color|Bracelet Length|price_cents|grams, order by sku collate "C")
--   md5(description) = e8aecbd6d395f5f1376ad2eef07b0e26
--   md5(sku||'|'||array_to_string(tags, ',')) = 8381bedeeb5098bbf78eba7a7548dd96
--   gallery: 12 / 8817c28461898f581d8243d91551dca3
begin;

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $mo$8ba135ac-a75f-5329-ada2-2d54cbbae2d0$mo$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $mo$BAS-TWIG-B01$mo$, $mo$Twig and Baroque Pearl Bracelet, Solid Gold Branch Station with a Freshwater Pearl, Dainty Cable Chain, Woodland Christmas Gift$mo$, $mo$One white baroque pearl held on a small solid gold twig, set at the centre of a fine gold cable chain.

The twig is cast with a soft bark texture and two short spurs, like a branch in a winter garden, and the pearl sits in a small gold cup on top of it. Each baroque pearl has its own shape and lustre, so no two bracelets are quite alike. It is light enough to wear every day and to stack with other chains.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Pearl: one white baroque freshwater pearl, about 6 mm, set in a gold cup; each pearl is unique in shape.
Size: twig 20 mm long, cup 4.6 mm across.
Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Pearls are soft, so put the bracelet on after perfume and lotion, keep it away from water and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece and its pearl may vary slightly.$mo$,
  ARRAY[$mo$pearl bracelet$mo$,$mo$baroque pearl$mo$,$mo$solid gold bracelet$mo$,$mo$twig bracelet$mo$,$mo$woodland jewelry$mo$,$mo$gold twig jewelry$mo$,$mo$christmas gift$mo$,$mo$gift for her$mo$,$mo$branch bracelet$mo$,$mo$14k gold bracelet$mo$,$mo$dainty bracelet$mo$,$mo$pearl gold jewelry$mo$,$mo$bridesmaid gift$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  40000, 20, true, 'https://amuletta.artifactstudio.info/artifact/twig/B01/01.jpg', 12, 'bracelet',
  $mo${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "B01", "name": "Twig and Baroque Pearl Bracelet", "collection": "Twig and Pearl", "enamel": [], "goldOnly": true, "dims": "twig 20 mm, 6 mm baroque pearl", "variationAxes": ["Karat", "Metal Color", "Bracelet Length"], "sourcePackage": "2026-10-13-artifact-twig", "sourcePackagePath": "docs/artifact-studio/twig", "generatorScript": "docs/artifact-studio/twig/gen_migration.py", "grams14Ref": 2.0, "refPriceCents": 53000, "makerCost14KRefUsd": 265.0, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; bracelet chain 100 USD at 7 in scaled by length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: station at the 1 g unit floor (UNCALIBRATED_ASSUMPTION); pearl 15 USD (UNCALIBRATED_ASSUMPTION)."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Station grams sit at the shop's 1 g unit floor and the pearl at 15 USD; no sample has been cast and no pearl sourced.", "Images are design visualizations (Higgsfield): frame 01 is the hero built on the owner's reference render, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-13 (as-twig-baroque-pearl-bracelet); decisions: white pearl only, no diamond, no engraving (no tag, no extender); images generated on the owner's go; \"bitirene kadar devam\"."}, "variantSeal": "2d0a9ca905e7825b9c68334abec43966"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $mo$BAS-TWIG-B01$mo$ or p.id = $mo$8ba135ac-a75f-5329-ada2-2d54cbbae2d0$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$BAS-TWIG-B01-10KY-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Yellow Gold, 6.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Bracelet Length": "6.5 inches"}$mo$, 40000, 1.72),
  ($mo$BAS-TWIG-B01-10KY-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Yellow Gold, 7 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Bracelet Length": "7 inches"}$mo$, 41000, 1.78),
  ($mo$BAS-TWIG-B01-10KY-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Yellow Gold, 7.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Bracelet Length": "7.5 inches"}$mo$, 42000, 1.85),
  ($mo$BAS-TWIG-B01-10KW-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K White Gold, 6.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Bracelet Length": "6.5 inches"}$mo$, 40000, 1.72),
  ($mo$BAS-TWIG-B01-10KW-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K White Gold, 7 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Bracelet Length": "7 inches"}$mo$, 41000, 1.78),
  ($mo$BAS-TWIG-B01-10KW-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K White Gold, 7.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Bracelet Length": "7.5 inches"}$mo$, 42000, 1.85),
  ($mo$BAS-TWIG-B01-10KR-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Rose Gold, 6.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Bracelet Length": "6.5 inches"}$mo$, 40000, 1.72),
  ($mo$BAS-TWIG-B01-10KR-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Rose Gold, 7 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Bracelet Length": "7 inches"}$mo$, 41000, 1.78),
  ($mo$BAS-TWIG-B01-10KR-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 10K Rose Gold, 7.5 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Bracelet Length": "7.5 inches"}$mo$, 42000, 1.85),
  ($mo$BAS-TWIG-B01-14KY-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Yellow Gold, 6.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Bracelet Length": "6.5 inches"}$mo$, 52000, 1.93),
  ($mo$BAS-TWIG-B01-14KY-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Yellow Gold, 7 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Bracelet Length": "7 inches"}$mo$, 53000, 2.00),
  ($mo$BAS-TWIG-B01-14KY-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Yellow Gold, 7.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Bracelet Length": "7.5 inches"}$mo$, 55000, 2.07),
  ($mo$BAS-TWIG-B01-14KW-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K White Gold, 6.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Bracelet Length": "6.5 inches"}$mo$, 52000, 1.93),
  ($mo$BAS-TWIG-B01-14KW-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K White Gold, 7 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Bracelet Length": "7 inches"}$mo$, 53000, 2.00),
  ($mo$BAS-TWIG-B01-14KW-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K White Gold, 7.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Bracelet Length": "7.5 inches"}$mo$, 55000, 2.07),
  ($mo$BAS-TWIG-B01-14KR-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Rose Gold, 6.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Bracelet Length": "6.5 inches"}$mo$, 52000, 1.93),
  ($mo$BAS-TWIG-B01-14KR-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Rose Gold, 7 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Bracelet Length": "7 inches"}$mo$, 53000, 2.00),
  ($mo$BAS-TWIG-B01-14KR-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 14K Rose Gold, 7.5 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Bracelet Length": "7.5 inches"}$mo$, 55000, 2.07),
  ($mo$BAS-TWIG-B01-18KY-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Yellow Gold, 6.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Bracelet Length": "6.5 inches"}$mo$, 67000, 2.19),
  ($mo$BAS-TWIG-B01-18KY-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Yellow Gold, 7 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Bracelet Length": "7 inches"}$mo$, 69000, 2.27),
  ($mo$BAS-TWIG-B01-18KY-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Yellow Gold, 7.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Bracelet Length": "7.5 inches"}$mo$, 71000, 2.36),
  ($mo$BAS-TWIG-B01-18KW-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K White Gold, 6.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Bracelet Length": "6.5 inches"}$mo$, 67000, 2.19),
  ($mo$BAS-TWIG-B01-18KW-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K White Gold, 7 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Bracelet Length": "7 inches"}$mo$, 69000, 2.27),
  ($mo$BAS-TWIG-B01-18KW-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K White Gold, 7.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Bracelet Length": "7.5 inches"}$mo$, 71000, 2.36),
  ($mo$BAS-TWIG-B01-18KR-6_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Rose Gold, 6.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Bracelet Length": "6.5 inches"}$mo$, 67000, 2.19),
  ($mo$BAS-TWIG-B01-18KR-7IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Rose Gold, 7 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Bracelet Length": "7 inches"}$mo$, 69000, 2.27),
  ($mo$BAS-TWIG-B01-18KR-7_5IN$mo$, $mo$Twig and Baroque Pearl Bracelet: 18K Rose Gold, 7.5 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Bracelet Length": "7.5 inches"}$mo$, 71000, 2.36)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $mo$BAS-TWIG-B01$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/01.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet in solid 14K yellow gold on frosted slate blue stone$mo$),
  (1, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/02.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet worn below a knit sweater cuff$mo$),
  (2, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/03.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet worn, hand holding a frosted twig$mo$),
  (3, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/04.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet on a wrist rising from a slate blue plinth$mo$),
  (4, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/05.jpg$mo$, $mo$Scale view of the Twig and Baroque Pearl Bracelet beside a fingertip, twig 20 mm, pearl about 6 mm$mo$),
  (5, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/06.jpg$mo$, $mo$Close-up of the gold twig and baroque pearl of the Twig and Baroque Pearl Bracelet$mo$),
  (6, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/07.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet lying in a circle around a frosted twig$mo$),
  (7, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/08.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet on a white card beside an open gift box$mo$),
  (8, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/09.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet shown in yellow, white and rose gold (colour visualization)$mo$),
  (9, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/10.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet worn with a wool coat collar$mo$),
  (10, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/11.jpg$mo$, $mo$Side view of the gold twig and pearl cup of the Twig and Baroque Pearl Bracelet$mo$),
  (11, $mo$https://amuletta.artifactstudio.info/artifact/twig/B01/12.jpg$mo$, $mo$Twig and Baroque Pearl Bracelet worn in winter window light$mo$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $mo$BAS-TWIG-B01$mo$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;

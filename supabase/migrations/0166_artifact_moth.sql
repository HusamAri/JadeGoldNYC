-- 0166_artifact_moth.sql
-- by Artifact Studio Jewelry: Openwork Moth Pendant Necklace, 1 listing, 27 variants
-- (Karat x Metal Color x Chain Length), 12 images. Panel draft only; this migration does not write to Etsy.
-- Source package: docs/artifact-studio/moth/ (catalog.py). Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku);
-- images insert only under a product still unpublished (etsy_listing_id is null).
-- Seals (run after apply):
--   variants: 27 / af689d25b2d4575dca0ee101e4dc9a7b   (md5 of sku|Karat|Metal Color|Chain Length|price_cents|grams, order by sku collate "C")
--   md5(description) = b36c64f14233eaeff0e75f1353656c71
--   md5(sku||'|'||array_to_string(tags, ',')) = 0cd337ac5822c0f05052302c121db695
--   gallery: 12 / 8a86b41ef2a7524bea5d23428a8bb140
begin;

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $mo$fa342629-6a80-5a7a-b041-11716a41dcd4$mo$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $mo$BAS-MOTH-N01$mo$, $mo$Openwork Moth Necklace, Solid Gold Moth Pendant on a Dainty Cable Chain, Minimalist Gold Moth Charm, Gift for Her$mo$, $mo$An openwork moth in solid gold, 14 mm across, hanging from a fine gold cable chain.

The wings are drawn as bold polished outlines around a few large open cells, so the skin shows through them, and two smooth antennae sweep out from the head. It is cast flat, about 1 mm thick, light enough to wear every day and to layer with other chains.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey, warmer at 10K.
Finish: polished solid gold; no stones, no enamel.
Size: moth 14 x 11 mm, about 1 mm thick, on a 3 mm bail.
Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp; choose 16, 18 or 20 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$moth necklace$mo$,$mo$moth pendant$mo$,$mo$gold moth necklace$mo$,$mo$moth jewelry$mo$,$mo$insect necklace$mo$,$mo$openwork pendant$mo$,$mo$solid gold pendant$mo$,$mo$14k gold necklace$mo$,$mo$dainty necklace$mo$,$mo$minimalist necklace$mo$,$mo$layering necklace$mo$,$mo$nature jewelry$mo$,$mo$gift for her$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  34000, 20, true, 'https://amuletta.artifactstudio.info/artifact/moth/N01/01.jpg', 12, 'necklace',
  $mo${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "N01", "name": "Openwork Moth Necklace", "collection": "Openwork Moth", "enamel": [], "goldOnly": true, "dims": "moth 14 x 11 mm, 1 mm thick", "variationAxes": ["Karat", "Metal Color", "Chain Length"], "sourcePackage": "2026-10-13-artifact-moth", "sourcePackagePath": "docs/artifact-studio/moth", "generatorScript": "docs/artifact-studio/moth/gen_migration.py", "grams14Ref": 2.6, "refPriceCents": 52000, "makerCost14KRefUsd": 260.0, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; chain 130 USD at 18 in scaled by length; 10K/18K by density and purity. Estimated parts: pendant 1.3 g 14K from geometry (UNCALIBRATED_ASSUMPTION); chain at the maker's 18 in convention."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Pendant grams are a geometry estimate (1.3 g 14K); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-13 (as-openwork-moth-pendant-necklace); decisions: full grid, no stone, no engraving; images approved; \"bitirene kadar devam\"."}, "variantSeal": "af689d25b2d4575dca0ee101e4dc9a7b"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $mo$BAS-MOTH-N01$mo$ or p.id = $mo$fa342629-6a80-5a7a-b041-11716a41dcd4$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$BAS-MOTH-N01-10KY-16IN$mo$, $mo$Openwork Moth Necklace: 10K Yellow Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 34000, 2.19),
  ($mo$BAS-MOTH-N01-10KY-18IN$mo$, $mo$Openwork Moth Necklace: 10K Yellow Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 36000, 2.32),
  ($mo$BAS-MOTH-N01-10KY-20IN$mo$, $mo$Openwork Moth Necklace: 10K Yellow Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 38000, 2.45),
  ($mo$BAS-MOTH-N01-10KW-16IN$mo$, $mo$Openwork Moth Necklace: 10K White Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 34000, 2.19),
  ($mo$BAS-MOTH-N01-10KW-18IN$mo$, $mo$Openwork Moth Necklace: 10K White Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 36000, 2.32),
  ($mo$BAS-MOTH-N01-10KW-20IN$mo$, $mo$Openwork Moth Necklace: 10K White Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 38000, 2.45),
  ($mo$BAS-MOTH-N01-10KR-16IN$mo$, $mo$Openwork Moth Necklace: 10K Rose Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 34000, 2.19),
  ($mo$BAS-MOTH-N01-10KR-18IN$mo$, $mo$Openwork Moth Necklace: 10K Rose Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 36000, 2.32),
  ($mo$BAS-MOTH-N01-10KR-20IN$mo$, $mo$Openwork Moth Necklace: 10K Rose Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 38000, 2.45),
  ($mo$BAS-MOTH-N01-14KY-16IN$mo$, $mo$Openwork Moth Necklace: 14K Yellow Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 50000, 2.46),
  ($mo$BAS-MOTH-N01-14KY-18IN$mo$, $mo$Openwork Moth Necklace: 14K Yellow Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 52000, 2.60),
  ($mo$BAS-MOTH-N01-14KY-20IN$mo$, $mo$Openwork Moth Necklace: 14K Yellow Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 55000, 2.74),
  ($mo$BAS-MOTH-N01-14KW-16IN$mo$, $mo$Openwork Moth Necklace: 14K White Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 50000, 2.46),
  ($mo$BAS-MOTH-N01-14KW-18IN$mo$, $mo$Openwork Moth Necklace: 14K White Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 52000, 2.60),
  ($mo$BAS-MOTH-N01-14KW-20IN$mo$, $mo$Openwork Moth Necklace: 14K White Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 55000, 2.74),
  ($mo$BAS-MOTH-N01-14KR-16IN$mo$, $mo$Openwork Moth Necklace: 14K Rose Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 50000, 2.46),
  ($mo$BAS-MOTH-N01-14KR-18IN$mo$, $mo$Openwork Moth Necklace: 14K Rose Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 52000, 2.60),
  ($mo$BAS-MOTH-N01-14KR-20IN$mo$, $mo$Openwork Moth Necklace: 14K Rose Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 55000, 2.74),
  ($mo$BAS-MOTH-N01-18KY-16IN$mo$, $mo$Openwork Moth Necklace: 18K Yellow Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 69000, 2.79),
  ($mo$BAS-MOTH-N01-18KY-18IN$mo$, $mo$Openwork Moth Necklace: 18K Yellow Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 73000, 2.96),
  ($mo$BAS-MOTH-N01-18KY-20IN$mo$, $mo$Openwork Moth Necklace: 18K Yellow Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 77000, 3.12),
  ($mo$BAS-MOTH-N01-18KW-16IN$mo$, $mo$Openwork Moth Necklace: 18K White Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 69000, 2.79),
  ($mo$BAS-MOTH-N01-18KW-18IN$mo$, $mo$Openwork Moth Necklace: 18K White Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 73000, 2.96),
  ($mo$BAS-MOTH-N01-18KW-20IN$mo$, $mo$Openwork Moth Necklace: 18K White Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 77000, 3.12),
  ($mo$BAS-MOTH-N01-18KR-16IN$mo$, $mo$Openwork Moth Necklace: 18K Rose Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 69000, 2.79),
  ($mo$BAS-MOTH-N01-18KR-18IN$mo$, $mo$Openwork Moth Necklace: 18K Rose Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 73000, 2.96),
  ($mo$BAS-MOTH-N01-18KR-20IN$mo$, $mo$Openwork Moth Necklace: 18K Rose Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 77000, 3.12)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $mo$BAS-MOTH-N01$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/01.jpg$mo$, $mo$Openwork Moth Necklace in solid 14K yellow gold on burnt orange gerbera petals$mo$),
  (1, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/02.jpg$mo$, $mo$Openwork Moth Necklace worn with an open linen shirt$mo$),
  (2, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/03.jpg$mo$, $mo$Openwork Moth Necklace worn above a silk slip dress neckline$mo$),
  (3, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/04.jpg$mo$, $mo$Openwork Moth Necklace worn, with gerbera petals at the shoulder$mo$),
  (4, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/05.jpg$mo$, $mo$Scale view of the Openwork Moth Necklace beside a fingertip, moth 14 x 11 mm$mo$),
  (5, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/06.jpg$mo$, $mo$Close-up of the Openwork Moth Necklace on a gerbera flower centre$mo$),
  (6, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/07.jpg$mo$, $mo$Openwork Moth Necklace resting on a single gerbera petal$mo$),
  (7, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/08.jpg$mo$, $mo$Openwork Moth Necklace on a white card beside an open gift box$mo$),
  (8, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/09.jpg$mo$, $mo$Openwork Moth Necklace shown in yellow, white and rose gold (colour visualization)$mo$),
  (9, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/10.jpg$mo$, $mo$Openwork Moth Necklace worn with an open blazer$mo$),
  (10, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/11.jpg$mo$, $mo$Close-up of the open wings of the Openwork Moth Necklace on gerbera petals$mo$),
  (11, $mo$https://amuletta.artifactstudio.info/artifact/moth/N01/12.jpg$mo$, $mo$Openwork Moth Necklace worn in warm evening window light$mo$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $mo$BAS-MOTH-N01$mo$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;

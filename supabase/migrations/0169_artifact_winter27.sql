-- 0169_artifact_winter27.sql
-- by Artifact Studio Jewelry: Winter 26/27 set, 5 listings, 315 variants, 60 images. Panel drafts only;
-- this migration does not write to Etsy. Source package: docs/artifact-studio/winter27/ (catalog.py).
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku);
-- images insert only under a product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): 315 variants / 02c411efebe4d7e5a492ec8ab94f2b50
--   (md5 of sku|axis values|price_cents|grams over all five products, order by line collate "C")
begin;

-- W01 Thaw Cuff: 27 variants (Karat x Metal Color x Bracelet Length), seal 9bb926dffaf8bf81272e99a31abcaed2, md5(description) 7ecbd3e67abde8c8840466b87f1474e9,
-- tags 2f807b3e9b33149143cde89c768b3ea8, gallery 719fe6cbfab458c461e593294589eed5
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $wn$5c4142b8-386f-52d0-aba6-576928150740$wn$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $wn$BAS-W01$wn$, $wn$Thaw Cuff, Solid Gold Molten Open Cuff Bracelet with a Contrasting Gold Tip, Two Tone Sculptural Bangle, Winter Gift$wn$, $wn$An open cuff of solid gold with a molten, softly rippled surface and one white gold tip, as if the gold were thawing out of ice.

The band is 4 mm wide and cast with a flowing, gently rippled high-polish surface, so light pools in every wave. The last 12 mm of one end is a second gold colour, joined in a soft melted seam: a yellow body with a white tip, a white body with a yellow tip, or a rose body with a white tip. The cuff is a smooth open C with rounded ends and sits close on the wrist; it is the one piece you wear with a bare arm and a wool sleeve pushed back.

Metal: solid 10K, 14K or 18K gold. Choose the body and the tip: yellow body with a white gold tip, white body with a yellow tip, or rose body with a white tip. White gold, not rhodium plated: a soft warm grey.
Finish: molten rippled high polish on the body, polished tip, smooth polished inside.
Size: band 4 mm wide, about 1.3 mm thick, 25 mm opening; choose a 6.5, 7 or 7.5 inch wrist.
Fit: the opening slips over the side of the wrist; a cuff is not meant to be bent to adjust.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$wn$,
  ARRAY[$wn$gold cuff bracelet$wn$,$wn$molten gold cuff$wn$,$wn$two tone cuff$wn$,$wn$open cuff bracelet$wn$,$wn$sculptural cuff$wn$,$wn$solid gold bangle$wn$,$wn$mixed metal cuff$wn$,$wn$statement cuff$wn$,$wn$winter jewelry$wn$,$wn$14k gold cuff$wn$,$wn$gift for her$wn$,$wn$organic gold cuff$wn$,$wn$modern gold cuff$wn$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  130000, 20, true, 'https://amuletta.artifactstudio.info/artifact/winter27/W01/01.jpg', 12, 'bracelet',
  $wn${"productType": "bracelet", "listingProtocol": "cuff_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "W01", "name": "Thaw Cuff", "collection": "Winter 26/27", "enamel": [], "goldOnly": true, "dims": "band 4 x 1.3 mm, 25 mm opening", "variationAxes": ["Karat", "Metal Color", "Bracelet Length"], "sourcePackage": "2026-10-15-artifact-winter27", "sourcePackagePath": "docs/artifact-studio/winter27", "generatorScript": "docs/artifact-studio/winter27/gen_migration.py", "grams14Ref": 9.34, "refPriceCents": 197000, "makerCost14KRefUsd": 983.66, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes; W02 shank counted in full because the accepted hero carries the scales down the shoulders; W03 four spheres per earring (accepted hero), spec was three."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Grams are geometry estimates (pricing.py); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."}, "variantSeal": "9bb926dffaf8bf81272e99a31abcaed2"}$wn$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $wn$BAS-W01$wn$ or p.id = $wn$5c4142b8-386f-52d0-aba6-576928150740$wn$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($wn$BAS-W01-10KYW-6_5IN$wn$, $wn$Thaw Cuff: 10K Yellow/White Gold, 6.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 130000, 7.70),
  ($wn$BAS-W01-10KYW-7IN$wn$, $wn$Thaw Cuff: 10K Yellow/White Gold, 7 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7 inches"}$wn$, 139000, 8.33),
  ($wn$BAS-W01-10KYW-7_5IN$wn$, $wn$Thaw Cuff: 10K Yellow/White Gold, 7.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 149000, 8.95),
  ($wn$BAS-W01-10KWY-6_5IN$wn$, $wn$Thaw Cuff: 10K White/Yellow Gold, 6.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "6.5 inches"}$wn$, 130000, 7.70),
  ($wn$BAS-W01-10KWY-7IN$wn$, $wn$Thaw Cuff: 10K White/Yellow Gold, 7 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7 inches"}$wn$, 139000, 8.33),
  ($wn$BAS-W01-10KWY-7_5IN$wn$, $wn$Thaw Cuff: 10K White/Yellow Gold, 7.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7.5 inches"}$wn$, 149000, 8.95),
  ($wn$BAS-W01-10KRW-6_5IN$wn$, $wn$Thaw Cuff: 10K Rose/White Gold, 6.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 130000, 7.70),
  ($wn$BAS-W01-10KRW-7IN$wn$, $wn$Thaw Cuff: 10K Rose/White Gold, 7 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7 inches"}$wn$, 139000, 8.33),
  ($wn$BAS-W01-10KRW-7_5IN$wn$, $wn$Thaw Cuff: 10K Rose/White Gold, 7.5 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 149000, 8.95),
  ($wn$BAS-W01-14KYW-6_5IN$wn$, $wn$Thaw Cuff: 14K Yellow/White Gold, 6.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 183000, 8.63),
  ($wn$BAS-W01-14KYW-7IN$wn$, $wn$Thaw Cuff: 14K Yellow/White Gold, 7 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7 inches"}$wn$, 197000, 9.34),
  ($wn$BAS-W01-14KYW-7_5IN$wn$, $wn$Thaw Cuff: 14K Yellow/White Gold, 7.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 211000, 10.04),
  ($wn$BAS-W01-14KWY-6_5IN$wn$, $wn$Thaw Cuff: 14K White/Yellow Gold, 6.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "6.5 inches"}$wn$, 183000, 8.63),
  ($wn$BAS-W01-14KWY-7IN$wn$, $wn$Thaw Cuff: 14K White/Yellow Gold, 7 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7 inches"}$wn$, 197000, 9.34),
  ($wn$BAS-W01-14KWY-7_5IN$wn$, $wn$Thaw Cuff: 14K White/Yellow Gold, 7.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7.5 inches"}$wn$, 211000, 10.04),
  ($wn$BAS-W01-14KRW-6_5IN$wn$, $wn$Thaw Cuff: 14K Rose/White Gold, 6.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 183000, 8.63),
  ($wn$BAS-W01-14KRW-7IN$wn$, $wn$Thaw Cuff: 14K Rose/White Gold, 7 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7 inches"}$wn$, 197000, 9.34),
  ($wn$BAS-W01-14KRW-7_5IN$wn$, $wn$Thaw Cuff: 14K Rose/White Gold, 7.5 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 211000, 10.04),
  ($wn$BAS-W01-18KYW-6_5IN$wn$, $wn$Thaw Cuff: 18K Yellow/White Gold, 6.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 250000, 9.82),
  ($wn$BAS-W01-18KYW-7IN$wn$, $wn$Thaw Cuff: 18K Yellow/White Gold, 7 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7 inches"}$wn$, 270000, 10.62),
  ($wn$BAS-W01-18KYW-7_5IN$wn$, $wn$Thaw Cuff: 18K Yellow/White Gold, 7.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 289000, 11.41),
  ($wn$BAS-W01-18KWY-6_5IN$wn$, $wn$Thaw Cuff: 18K White/Yellow Gold, 6.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "6.5 inches"}$wn$, 250000, 9.82),
  ($wn$BAS-W01-18KWY-7IN$wn$, $wn$Thaw Cuff: 18K White/Yellow Gold, 7 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7 inches"}$wn$, 270000, 10.62),
  ($wn$BAS-W01-18KWY-7_5IN$wn$, $wn$Thaw Cuff: 18K White/Yellow Gold, 7.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White/Yellow Gold", "Bracelet Length": "7.5 inches"}$wn$, 289000, 11.41),
  ($wn$BAS-W01-18KRW-6_5IN$wn$, $wn$Thaw Cuff: 18K Rose/White Gold, 6.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose/White Gold", "Bracelet Length": "6.5 inches"}$wn$, 250000, 9.82),
  ($wn$BAS-W01-18KRW-7IN$wn$, $wn$Thaw Cuff: 18K Rose/White Gold, 7 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7 inches"}$wn$, 270000, 10.62),
  ($wn$BAS-W01-18KRW-7_5IN$wn$, $wn$Thaw Cuff: 18K Rose/White Gold, 7.5 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose/White Gold", "Bracelet Length": "7.5 inches"}$wn$, 289000, 11.41)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W01$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/01.jpg$wn$, $wn$Thaw Cuff in solid 14K yellow gold with a white gold tip, standing on frozen river ice$wn$),
  (1, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/02.jpg$wn$, $wn$Thaw Cuff worn below a knit sweater cuff$wn$),
  (2, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/03.jpg$wn$, $wn$Close-up of the molten rippled surface of the Thaw Cuff$wn$),
  (3, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/04.jpg$wn$, $wn$Close-up of the melted seam between the yellow gold body and the white gold tip of the Thaw Cuff$wn$),
  (4, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/05.jpg$wn$, $wn$Edge view of the Thaw Cuff showing the 4 mm band and the 25 mm opening$wn$),
  (5, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/06.jpg$wn$, $wn$Thaw Cuff worn, hand resting beside a cup of tea$wn$),
  (6, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/07.jpg$wn$, $wn$Scale view of the Thaw Cuff beside a fingertip, band 4 mm wide$wn$),
  (7, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/08.jpg$wn$, $wn$Thaw Cuff beside an open gift box$wn$),
  (8, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/09.jpg$wn$, $wn$Thaw Cuff shown in the three two tone combinations: yellow with white tip, white with yellow tip, rose with white tip (colour visualization)$wn$),
  (9, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/10.jpg$wn$, $wn$Thaw Cuff worn with a wool coat collar$wn$),
  (10, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/11.jpg$wn$, $wn$Thaw Cuff seen from above showing the open C shape$wn$),
  (11, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W01/12.jpg$wn$, $wn$Thaw Cuff worn in winter window light$wn$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W01$wn$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- W02 Pinecone Signet Ring: 243 variants (Karat x Metal Color x Ring Size), seal b4a5e63a4690254ca8246b3211d9ea74, md5(description) 6060a6e3050a9dc0904a50bdd2030d2c,
-- tags 6b9e820ba942376b2195823328c4c3fc, gallery caf56b19c39024ee10de197f99c86bd1
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $wn$08368a74-6ac9-55f2-977d-121128ecb110$wn$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $wn$BAS-W02$wn$, $wn$Pinecone Signet Ring, Solid Gold Oval Signet with Carved Scales and Oxblood Enamel, Chunky Statement Ring, Winter Gift$wn$, $wn$A chunky oval signet carved with overlapping pinecone scales, the recesses between the scales filled with deep oxblood enamel.

The 13 x 11 mm oval table and both shoulders are cast in deep relief, each scale a small pointed shield rising in a spiral like a real pinecone, with glossy oxblood vitreous enamel set flush between them so the gold tips stand out against the dark red. A thin polished rim frames the table, the lower shank is smooth and polished, and the table is solid and closed underneath. It wears like a classic signet and reads like a piece of the winter forest.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey.
Enamel: oxblood red vitreous enamel, glass fused to gold, set flush between the scales.
Size: oval table 13 x 11 mm, about 2 mm deep; shank 3 mm wide; US 3 to 16 in whole and half sizes.
Fit: a signet sits best a little snug; if you are between sizes, choose the larger one.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$wn$,
  ARRAY[$wn$pinecone ring$wn$,$wn$gold signet ring$wn$,$wn$oxblood enamel ring$wn$,$wn$chunky signet ring$wn$,$wn$oval signet ring$wn$,$wn$carved gold ring$wn$,$wn$enamel signet$wn$,$wn$statement signet$wn$,$wn$woodland ring$wn$,$wn$14k signet ring$wn$,$wn$unisex signet ring$wn$,$wn$winter jewelry$wn$,$wn$gift for him$wn$]::text[], ARRAY['Solid gold', 'Vitreous enamel'], 'draft', 'USD',
  102000, 20, true, 'https://amuletta.artifactstudio.info/artifact/winter27/W02/01.jpg', 12, 'ring',
  $wn${"productType": "ring", "listingProtocol": "signet_ring", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "W02", "name": "Pinecone Signet Ring", "collection": "Winter 26/27", "enamel": ["oxblood red"], "goldOnly": false, "dims": "table 13 x 11 mm, shank 3 mm", "variationAxes": ["Karat", "Metal Color", "Ring Size"], "sourcePackage": "2026-10-15-artifact-winter27", "sourcePackagePath": "docs/artifact-studio/winter27", "generatorScript": "docs/artifact-studio/winter27/gen_migration.py", "grams14Ref": 7.34, "refPriceCents": 157000, "makerCost14KRefUsd": 783.98, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes; W02 shank counted in full because the accepted hero carries the scales down the shoulders; W03 four spheres per earring (accepted hero), spec was three."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Grams are geometry estimates (pricing.py); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."}, "variantSeal": "b4a5e63a4690254ca8246b3211d9ea74"}$wn$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $wn$BAS-W02$wn$ or p.id = $wn$08368a74-6ac9-55f2-977d-121128ecb110$wn$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($wn$BAS-W02-10KY-US3$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 3$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 3"}$wn$, 102000, 5.89),
  ($wn$BAS-W02-10KY-US3_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 3.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 3.5"}$wn$, 103000, 5.97),
  ($wn$BAS-W02-10KY-US4$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 4$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$wn$, 104000, 6.05),
  ($wn$BAS-W02-10KY-US4_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 4.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$wn$, 105000, 6.13),
  ($wn$BAS-W02-10KY-US5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$wn$, 107000, 6.22),
  ($wn$BAS-W02-10KY-US5_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 5.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$wn$, 108000, 6.30),
  ($wn$BAS-W02-10KY-US6$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 6$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$wn$, 109000, 6.38),
  ($wn$BAS-W02-10KY-US6_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 6.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$wn$, 111000, 6.46),
  ($wn$BAS-W02-10KY-US7$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 7$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$wn$, 112000, 6.55),
  ($wn$BAS-W02-10KY-US7_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 7.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$wn$, 113000, 6.63),
  ($wn$BAS-W02-10KY-US8$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 8$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$wn$, 114000, 6.71),
  ($wn$BAS-W02-10KY-US8_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 8.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$wn$, 116000, 6.80),
  ($wn$BAS-W02-10KY-US9$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 9$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$wn$, 117000, 6.88),
  ($wn$BAS-W02-10KY-US9_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 9.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$wn$, 118000, 6.96),
  ($wn$BAS-W02-10KY-US10$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 10$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$wn$, 120000, 7.04),
  ($wn$BAS-W02-10KY-US10_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 10.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$wn$, 121000, 7.13),
  ($wn$BAS-W02-10KY-US11$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 11$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$wn$, 122000, 7.21),
  ($wn$BAS-W02-10KY-US11_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 11.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$wn$, 123000, 7.29),
  ($wn$BAS-W02-10KY-US12$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 12$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$wn$, 125000, 7.37),
  ($wn$BAS-W02-10KY-US12_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 12.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 12.5"}$wn$, 126000, 7.46),
  ($wn$BAS-W02-10KY-US13$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 13$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 13"}$wn$, 127000, 7.54),
  ($wn$BAS-W02-10KY-US13_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 13.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 13.5"}$wn$, 129000, 7.62),
  ($wn$BAS-W02-10KY-US14$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 14$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 14"}$wn$, 130000, 7.70),
  ($wn$BAS-W02-10KY-US14_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 14.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 14.5"}$wn$, 131000, 7.79),
  ($wn$BAS-W02-10KY-US15$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 15$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 15"}$wn$, 132000, 7.87),
  ($wn$BAS-W02-10KY-US15_5$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 15.5$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 15.5"}$wn$, 134000, 7.95),
  ($wn$BAS-W02-10KY-US16$wn$, $wn$Pinecone Signet Ring: 10K Yellow Gold, US 16$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 16"}$wn$, 135000, 8.04),
  ($wn$BAS-W02-10KW-US3$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 3$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 3"}$wn$, 102000, 5.89),
  ($wn$BAS-W02-10KW-US3_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 3.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 3.5"}$wn$, 103000, 5.97),
  ($wn$BAS-W02-10KW-US4$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 4$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4"}$wn$, 104000, 6.05),
  ($wn$BAS-W02-10KW-US4_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 4.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$wn$, 105000, 6.13),
  ($wn$BAS-W02-10KW-US5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5"}$wn$, 107000, 6.22),
  ($wn$BAS-W02-10KW-US5_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 5.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$wn$, 108000, 6.30),
  ($wn$BAS-W02-10KW-US6$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 6$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6"}$wn$, 109000, 6.38),
  ($wn$BAS-W02-10KW-US6_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 6.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$wn$, 111000, 6.46),
  ($wn$BAS-W02-10KW-US7$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 7$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7"}$wn$, 112000, 6.55),
  ($wn$BAS-W02-10KW-US7_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 7.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$wn$, 113000, 6.63),
  ($wn$BAS-W02-10KW-US8$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 8$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8"}$wn$, 114000, 6.71),
  ($wn$BAS-W02-10KW-US8_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 8.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$wn$, 116000, 6.80),
  ($wn$BAS-W02-10KW-US9$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 9$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9"}$wn$, 117000, 6.88),
  ($wn$BAS-W02-10KW-US9_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 9.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$wn$, 118000, 6.96),
  ($wn$BAS-W02-10KW-US10$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 10$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10"}$wn$, 120000, 7.04),
  ($wn$BAS-W02-10KW-US10_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 10.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$wn$, 121000, 7.13),
  ($wn$BAS-W02-10KW-US11$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 11$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11"}$wn$, 122000, 7.21),
  ($wn$BAS-W02-10KW-US11_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 11.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$wn$, 123000, 7.29),
  ($wn$BAS-W02-10KW-US12$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 12$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 12"}$wn$, 125000, 7.37),
  ($wn$BAS-W02-10KW-US12_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 12.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 12.5"}$wn$, 126000, 7.46),
  ($wn$BAS-W02-10KW-US13$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 13$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 13"}$wn$, 127000, 7.54),
  ($wn$BAS-W02-10KW-US13_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 13.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 13.5"}$wn$, 129000, 7.62),
  ($wn$BAS-W02-10KW-US14$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 14$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 14"}$wn$, 130000, 7.70),
  ($wn$BAS-W02-10KW-US14_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 14.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 14.5"}$wn$, 131000, 7.79),
  ($wn$BAS-W02-10KW-US15$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 15$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 15"}$wn$, 132000, 7.87),
  ($wn$BAS-W02-10KW-US15_5$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 15.5$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 15.5"}$wn$, 134000, 7.95),
  ($wn$BAS-W02-10KW-US16$wn$, $wn$Pinecone Signet Ring: 10K White Gold, US 16$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 16"}$wn$, 135000, 8.04),
  ($wn$BAS-W02-10KR-US3$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 3$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 3"}$wn$, 102000, 5.89),
  ($wn$BAS-W02-10KR-US3_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 3.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 3.5"}$wn$, 103000, 5.97),
  ($wn$BAS-W02-10KR-US4$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 4$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$wn$, 104000, 6.05),
  ($wn$BAS-W02-10KR-US4_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 4.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$wn$, 105000, 6.13),
  ($wn$BAS-W02-10KR-US5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$wn$, 107000, 6.22),
  ($wn$BAS-W02-10KR-US5_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 5.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$wn$, 108000, 6.30),
  ($wn$BAS-W02-10KR-US6$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 6$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$wn$, 109000, 6.38),
  ($wn$BAS-W02-10KR-US6_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 6.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$wn$, 111000, 6.46),
  ($wn$BAS-W02-10KR-US7$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 7$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$wn$, 112000, 6.55),
  ($wn$BAS-W02-10KR-US7_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 7.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$wn$, 113000, 6.63),
  ($wn$BAS-W02-10KR-US8$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 8$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$wn$, 114000, 6.71),
  ($wn$BAS-W02-10KR-US8_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 8.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$wn$, 116000, 6.80),
  ($wn$BAS-W02-10KR-US9$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 9$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$wn$, 117000, 6.88),
  ($wn$BAS-W02-10KR-US9_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 9.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$wn$, 118000, 6.96),
  ($wn$BAS-W02-10KR-US10$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 10$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$wn$, 120000, 7.04),
  ($wn$BAS-W02-10KR-US10_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 10.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$wn$, 121000, 7.13),
  ($wn$BAS-W02-10KR-US11$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 11$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$wn$, 122000, 7.21),
  ($wn$BAS-W02-10KR-US11_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 11.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$wn$, 123000, 7.29),
  ($wn$BAS-W02-10KR-US12$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 12$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$wn$, 125000, 7.37),
  ($wn$BAS-W02-10KR-US12_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 12.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 12.5"}$wn$, 126000, 7.46),
  ($wn$BAS-W02-10KR-US13$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 13$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 13"}$wn$, 127000, 7.54),
  ($wn$BAS-W02-10KR-US13_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 13.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 13.5"}$wn$, 129000, 7.62),
  ($wn$BAS-W02-10KR-US14$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 14$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 14"}$wn$, 130000, 7.70),
  ($wn$BAS-W02-10KR-US14_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 14.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 14.5"}$wn$, 131000, 7.79),
  ($wn$BAS-W02-10KR-US15$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 15$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 15"}$wn$, 132000, 7.87),
  ($wn$BAS-W02-10KR-US15_5$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 15.5$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 15.5"}$wn$, 134000, 7.95),
  ($wn$BAS-W02-10KR-US16$wn$, $wn$Pinecone Signet Ring: 10K Rose Gold, US 16$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 16"}$wn$, 135000, 8.04),
  ($wn$BAS-W02-14KY-US3$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 3$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 3"}$wn$, 142000, 6.60),
  ($wn$BAS-W02-14KY-US3_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 3.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 3.5"}$wn$, 144000, 6.69),
  ($wn$BAS-W02-14KY-US4$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 4$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$wn$, 146000, 6.78),
  ($wn$BAS-W02-14KY-US4_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 4.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$wn$, 148000, 6.88),
  ($wn$BAS-W02-14KY-US5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$wn$, 150000, 6.97),
  ($wn$BAS-W02-14KY-US5_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 5.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$wn$, 152000, 7.06),
  ($wn$BAS-W02-14KY-US6$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 6$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$wn$, 154000, 7.15),
  ($wn$BAS-W02-14KY-US6_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 6.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$wn$, 155000, 7.25),
  ($wn$BAS-W02-14KY-US7$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 7$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$wn$, 157000, 7.34),
  ($wn$BAS-W02-14KY-US7_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 7.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$wn$, 159000, 7.43),
  ($wn$BAS-W02-14KY-US8$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 8$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$wn$, 161000, 7.53),
  ($wn$BAS-W02-14KY-US8_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 8.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$wn$, 163000, 7.62),
  ($wn$BAS-W02-14KY-US9$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 9$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$wn$, 165000, 7.71),
  ($wn$BAS-W02-14KY-US9_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 9.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$wn$, 167000, 7.80),
  ($wn$BAS-W02-14KY-US10$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 10$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$wn$, 168000, 7.90),
  ($wn$BAS-W02-14KY-US10_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 10.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$wn$, 170000, 7.99),
  ($wn$BAS-W02-14KY-US11$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 11$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$wn$, 172000, 8.08),
  ($wn$BAS-W02-14KY-US11_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 11.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$wn$, 174000, 8.17),
  ($wn$BAS-W02-14KY-US12$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 12$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$wn$, 176000, 8.27),
  ($wn$BAS-W02-14KY-US12_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 12.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 12.5"}$wn$, 178000, 8.36),
  ($wn$BAS-W02-14KY-US13$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 13$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 13"}$wn$, 180000, 8.45),
  ($wn$BAS-W02-14KY-US13_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 13.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 13.5"}$wn$, 181000, 8.54),
  ($wn$BAS-W02-14KY-US14$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 14$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 14"}$wn$, 183000, 8.64),
  ($wn$BAS-W02-14KY-US14_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 14.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 14.5"}$wn$, 185000, 8.73),
  ($wn$BAS-W02-14KY-US15$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 15$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 15"}$wn$, 187000, 8.82),
  ($wn$BAS-W02-14KY-US15_5$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 15.5$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 15.5"}$wn$, 189000, 8.92),
  ($wn$BAS-W02-14KY-US16$wn$, $wn$Pinecone Signet Ring: 14K Yellow Gold, US 16$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 16"}$wn$, 191000, 9.01),
  ($wn$BAS-W02-14KW-US3$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 3$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 3"}$wn$, 142000, 6.60),
  ($wn$BAS-W02-14KW-US3_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 3.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 3.5"}$wn$, 144000, 6.69),
  ($wn$BAS-W02-14KW-US4$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 4$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4"}$wn$, 146000, 6.78),
  ($wn$BAS-W02-14KW-US4_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 4.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$wn$, 148000, 6.88),
  ($wn$BAS-W02-14KW-US5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5"}$wn$, 150000, 6.97),
  ($wn$BAS-W02-14KW-US5_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 5.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$wn$, 152000, 7.06),
  ($wn$BAS-W02-14KW-US6$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 6$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6"}$wn$, 154000, 7.15),
  ($wn$BAS-W02-14KW-US6_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 6.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$wn$, 155000, 7.25),
  ($wn$BAS-W02-14KW-US7$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 7$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7"}$wn$, 157000, 7.34),
  ($wn$BAS-W02-14KW-US7_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 7.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$wn$, 159000, 7.43),
  ($wn$BAS-W02-14KW-US8$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 8$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8"}$wn$, 161000, 7.53),
  ($wn$BAS-W02-14KW-US8_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 8.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$wn$, 163000, 7.62),
  ($wn$BAS-W02-14KW-US9$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 9$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9"}$wn$, 165000, 7.71),
  ($wn$BAS-W02-14KW-US9_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 9.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$wn$, 167000, 7.80),
  ($wn$BAS-W02-14KW-US10$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 10$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10"}$wn$, 168000, 7.90),
  ($wn$BAS-W02-14KW-US10_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 10.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$wn$, 170000, 7.99),
  ($wn$BAS-W02-14KW-US11$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 11$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11"}$wn$, 172000, 8.08),
  ($wn$BAS-W02-14KW-US11_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 11.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$wn$, 174000, 8.17),
  ($wn$BAS-W02-14KW-US12$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 12$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 12"}$wn$, 176000, 8.27),
  ($wn$BAS-W02-14KW-US12_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 12.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 12.5"}$wn$, 178000, 8.36),
  ($wn$BAS-W02-14KW-US13$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 13$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 13"}$wn$, 180000, 8.45),
  ($wn$BAS-W02-14KW-US13_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 13.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 13.5"}$wn$, 181000, 8.54),
  ($wn$BAS-W02-14KW-US14$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 14$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 14"}$wn$, 183000, 8.64),
  ($wn$BAS-W02-14KW-US14_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 14.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 14.5"}$wn$, 185000, 8.73),
  ($wn$BAS-W02-14KW-US15$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 15$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 15"}$wn$, 187000, 8.82),
  ($wn$BAS-W02-14KW-US15_5$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 15.5$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 15.5"}$wn$, 189000, 8.92),
  ($wn$BAS-W02-14KW-US16$wn$, $wn$Pinecone Signet Ring: 14K White Gold, US 16$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 16"}$wn$, 191000, 9.01),
  ($wn$BAS-W02-14KR-US3$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 3$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 3"}$wn$, 142000, 6.60),
  ($wn$BAS-W02-14KR-US3_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 3.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 3.5"}$wn$, 144000, 6.69),
  ($wn$BAS-W02-14KR-US4$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 4$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$wn$, 146000, 6.78),
  ($wn$BAS-W02-14KR-US4_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 4.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$wn$, 148000, 6.88),
  ($wn$BAS-W02-14KR-US5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$wn$, 150000, 6.97),
  ($wn$BAS-W02-14KR-US5_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 5.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$wn$, 152000, 7.06),
  ($wn$BAS-W02-14KR-US6$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 6$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$wn$, 154000, 7.15),
  ($wn$BAS-W02-14KR-US6_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 6.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$wn$, 155000, 7.25),
  ($wn$BAS-W02-14KR-US7$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 7$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$wn$, 157000, 7.34),
  ($wn$BAS-W02-14KR-US7_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 7.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$wn$, 159000, 7.43),
  ($wn$BAS-W02-14KR-US8$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 8$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$wn$, 161000, 7.53),
  ($wn$BAS-W02-14KR-US8_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 8.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$wn$, 163000, 7.62),
  ($wn$BAS-W02-14KR-US9$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 9$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$wn$, 165000, 7.71),
  ($wn$BAS-W02-14KR-US9_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 9.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$wn$, 167000, 7.80),
  ($wn$BAS-W02-14KR-US10$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 10$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$wn$, 168000, 7.90),
  ($wn$BAS-W02-14KR-US10_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 10.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$wn$, 170000, 7.99),
  ($wn$BAS-W02-14KR-US11$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 11$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$wn$, 172000, 8.08),
  ($wn$BAS-W02-14KR-US11_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 11.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$wn$, 174000, 8.17),
  ($wn$BAS-W02-14KR-US12$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 12$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$wn$, 176000, 8.27),
  ($wn$BAS-W02-14KR-US12_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 12.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 12.5"}$wn$, 178000, 8.36),
  ($wn$BAS-W02-14KR-US13$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 13$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 13"}$wn$, 180000, 8.45),
  ($wn$BAS-W02-14KR-US13_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 13.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 13.5"}$wn$, 181000, 8.54),
  ($wn$BAS-W02-14KR-US14$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 14$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 14"}$wn$, 183000, 8.64),
  ($wn$BAS-W02-14KR-US14_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 14.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 14.5"}$wn$, 185000, 8.73),
  ($wn$BAS-W02-14KR-US15$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 15$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 15"}$wn$, 187000, 8.82),
  ($wn$BAS-W02-14KR-US15_5$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 15.5$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 15.5"}$wn$, 189000, 8.92),
  ($wn$BAS-W02-14KR-US16$wn$, $wn$Pinecone Signet Ring: 14K Rose Gold, US 16$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 16"}$wn$, 191000, 9.01),
  ($wn$BAS-W02-18KY-US3$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 3$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 3"}$wn$, 194000, 7.50),
  ($wn$BAS-W02-18KY-US3_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 3.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 3.5"}$wn$, 196000, 7.61),
  ($wn$BAS-W02-18KY-US4$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 4$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$wn$, 199000, 7.71),
  ($wn$BAS-W02-18KY-US4_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 4.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$wn$, 202000, 7.82),
  ($wn$BAS-W02-18KY-US5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$wn$, 204000, 7.92),
  ($wn$BAS-W02-18KY-US5_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 5.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$wn$, 207000, 8.03),
  ($wn$BAS-W02-18KY-US6$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 6$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$wn$, 209000, 8.13),
  ($wn$BAS-W02-18KY-US6_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 6.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$wn$, 212000, 8.24),
  ($wn$BAS-W02-18KY-US7$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 7$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$wn$, 214000, 8.35),
  ($wn$BAS-W02-18KY-US7_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 7.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$wn$, 217000, 8.45),
  ($wn$BAS-W02-18KY-US8$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 8$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$wn$, 220000, 8.56),
  ($wn$BAS-W02-18KY-US8_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 8.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$wn$, 222000, 8.66),
  ($wn$BAS-W02-18KY-US9$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 9$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$wn$, 225000, 8.77),
  ($wn$BAS-W02-18KY-US9_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 9.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$wn$, 227000, 8.87),
  ($wn$BAS-W02-18KY-US10$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 10$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$wn$, 230000, 8.98),
  ($wn$BAS-W02-18KY-US10_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 10.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$wn$, 232000, 9.08),
  ($wn$BAS-W02-18KY-US11$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 11$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$wn$, 235000, 9.19),
  ($wn$BAS-W02-18KY-US11_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 11.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$wn$, 238000, 9.29),
  ($wn$BAS-W02-18KY-US12$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 12$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$wn$, 240000, 9.40),
  ($wn$BAS-W02-18KY-US12_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 12.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 12.5"}$wn$, 243000, 9.50),
  ($wn$BAS-W02-18KY-US13$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 13$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 13"}$wn$, 245000, 9.61),
  ($wn$BAS-W02-18KY-US13_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 13.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 13.5"}$wn$, 248000, 9.72),
  ($wn$BAS-W02-18KY-US14$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 14$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 14"}$wn$, 250000, 9.82),
  ($wn$BAS-W02-18KY-US14_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 14.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 14.5"}$wn$, 253000, 9.93),
  ($wn$BAS-W02-18KY-US15$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 15$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 15"}$wn$, 256000, 10.03),
  ($wn$BAS-W02-18KY-US15_5$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 15.5$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 15.5"}$wn$, 258000, 10.14),
  ($wn$BAS-W02-18KY-US16$wn$, $wn$Pinecone Signet Ring: 18K Yellow Gold, US 16$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 16"}$wn$, 261000, 10.24),
  ($wn$BAS-W02-18KW-US3$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 3$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 3"}$wn$, 194000, 7.50),
  ($wn$BAS-W02-18KW-US3_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 3.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 3.5"}$wn$, 196000, 7.61),
  ($wn$BAS-W02-18KW-US4$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 4$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4"}$wn$, 199000, 7.71),
  ($wn$BAS-W02-18KW-US4_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 4.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$wn$, 202000, 7.82),
  ($wn$BAS-W02-18KW-US5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5"}$wn$, 204000, 7.92),
  ($wn$BAS-W02-18KW-US5_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 5.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$wn$, 207000, 8.03),
  ($wn$BAS-W02-18KW-US6$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 6$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6"}$wn$, 209000, 8.13),
  ($wn$BAS-W02-18KW-US6_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 6.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$wn$, 212000, 8.24),
  ($wn$BAS-W02-18KW-US7$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 7$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7"}$wn$, 214000, 8.35),
  ($wn$BAS-W02-18KW-US7_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 7.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$wn$, 217000, 8.45),
  ($wn$BAS-W02-18KW-US8$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 8$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8"}$wn$, 220000, 8.56),
  ($wn$BAS-W02-18KW-US8_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 8.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$wn$, 222000, 8.66),
  ($wn$BAS-W02-18KW-US9$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 9$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9"}$wn$, 225000, 8.77),
  ($wn$BAS-W02-18KW-US9_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 9.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$wn$, 227000, 8.87),
  ($wn$BAS-W02-18KW-US10$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 10$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10"}$wn$, 230000, 8.98),
  ($wn$BAS-W02-18KW-US10_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 10.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$wn$, 232000, 9.08),
  ($wn$BAS-W02-18KW-US11$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 11$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11"}$wn$, 235000, 9.19),
  ($wn$BAS-W02-18KW-US11_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 11.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$wn$, 238000, 9.29),
  ($wn$BAS-W02-18KW-US12$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 12$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 12"}$wn$, 240000, 9.40),
  ($wn$BAS-W02-18KW-US12_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 12.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 12.5"}$wn$, 243000, 9.50),
  ($wn$BAS-W02-18KW-US13$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 13$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 13"}$wn$, 245000, 9.61),
  ($wn$BAS-W02-18KW-US13_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 13.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 13.5"}$wn$, 248000, 9.72),
  ($wn$BAS-W02-18KW-US14$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 14$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 14"}$wn$, 250000, 9.82),
  ($wn$BAS-W02-18KW-US14_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 14.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 14.5"}$wn$, 253000, 9.93),
  ($wn$BAS-W02-18KW-US15$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 15$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 15"}$wn$, 256000, 10.03),
  ($wn$BAS-W02-18KW-US15_5$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 15.5$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 15.5"}$wn$, 258000, 10.14),
  ($wn$BAS-W02-18KW-US16$wn$, $wn$Pinecone Signet Ring: 18K White Gold, US 16$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 16"}$wn$, 261000, 10.24),
  ($wn$BAS-W02-18KR-US3$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 3$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 3"}$wn$, 194000, 7.50),
  ($wn$BAS-W02-18KR-US3_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 3.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 3.5"}$wn$, 196000, 7.61),
  ($wn$BAS-W02-18KR-US4$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 4$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$wn$, 199000, 7.71),
  ($wn$BAS-W02-18KR-US4_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 4.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$wn$, 202000, 7.82),
  ($wn$BAS-W02-18KR-US5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$wn$, 204000, 7.92),
  ($wn$BAS-W02-18KR-US5_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 5.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$wn$, 207000, 8.03),
  ($wn$BAS-W02-18KR-US6$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 6$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$wn$, 209000, 8.13),
  ($wn$BAS-W02-18KR-US6_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 6.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$wn$, 212000, 8.24),
  ($wn$BAS-W02-18KR-US7$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 7$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$wn$, 214000, 8.35),
  ($wn$BAS-W02-18KR-US7_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 7.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$wn$, 217000, 8.45),
  ($wn$BAS-W02-18KR-US8$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 8$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$wn$, 220000, 8.56),
  ($wn$BAS-W02-18KR-US8_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 8.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$wn$, 222000, 8.66),
  ($wn$BAS-W02-18KR-US9$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 9$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$wn$, 225000, 8.77),
  ($wn$BAS-W02-18KR-US9_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 9.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$wn$, 227000, 8.87),
  ($wn$BAS-W02-18KR-US10$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 10$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$wn$, 230000, 8.98),
  ($wn$BAS-W02-18KR-US10_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 10.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$wn$, 232000, 9.08),
  ($wn$BAS-W02-18KR-US11$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 11$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$wn$, 235000, 9.19),
  ($wn$BAS-W02-18KR-US11_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 11.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$wn$, 238000, 9.29),
  ($wn$BAS-W02-18KR-US12$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 12$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$wn$, 240000, 9.40),
  ($wn$BAS-W02-18KR-US12_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 12.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 12.5"}$wn$, 243000, 9.50),
  ($wn$BAS-W02-18KR-US13$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 13$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 13"}$wn$, 245000, 9.61),
  ($wn$BAS-W02-18KR-US13_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 13.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 13.5"}$wn$, 248000, 9.72),
  ($wn$BAS-W02-18KR-US14$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 14$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 14"}$wn$, 250000, 9.82),
  ($wn$BAS-W02-18KR-US14_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 14.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 14.5"}$wn$, 253000, 9.93),
  ($wn$BAS-W02-18KR-US15$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 15$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 15"}$wn$, 256000, 10.03),
  ($wn$BAS-W02-18KR-US15_5$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 15.5$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 15.5"}$wn$, 258000, 10.14),
  ($wn$BAS-W02-18KR-US16$wn$, $wn$Pinecone Signet Ring: 18K Rose Gold, US 16$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 16"}$wn$, 261000, 10.24)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W02$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/01.jpg$wn$, $wn$Pinecone Signet Ring in solid 14K yellow gold with oxblood enamel, standing on pinecone scales$wn$),
  (1, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/02.jpg$wn$, $wn$Pinecone Signet Ring worn on the ring finger$wn$),
  (2, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/03.jpg$wn$, $wn$Close-up of the carved pinecone scales and oxblood enamel of the Pinecone Signet Ring$wn$),
  (3, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/04.jpg$wn$, $wn$Side view of the carved shoulders and smooth shank of the Pinecone Signet Ring$wn$),
  (4, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/05.jpg$wn$, $wn$Pinecone Signet Ring worn, hand resting beside a cup of coffee$wn$),
  (5, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/06.jpg$wn$, $wn$Scale view of the Pinecone Signet Ring beside a fingernail, table 13 mm$wn$),
  (6, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/07.jpg$wn$, $wn$Pinecone Signet Ring lying flat showing the oval table and shank$wn$),
  (7, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/08.jpg$wn$, $wn$Pinecone Signet Ring in a ring cushion beside an open gift box$wn$),
  (8, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/09.jpg$wn$, $wn$Pinecone Signet Ring shown in yellow, white and rose gold (colour visualization)$wn$),
  (9, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/10.jpg$wn$, $wn$Pinecone Signet Ring worn with a wool coat collar$wn$),
  (10, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/11.jpg$wn$, $wn$Inside view of the smooth polished shank of the Pinecone Signet Ring$wn$),
  (11, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W02/12.jpg$wn$, $wn$Pinecone Signet Ring worn in winter window light$wn$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W02$wn$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- W03 Juniper Drop Earrings: 9 variants (Karat x Metal Color), seal c4c5f10066b2e975458eb39b58ddad15, md5(description) abde2a0abe36bc9d766f724bcaab7522,
-- tags 7472a639c9b8272505a8fa0b8664d64e, gallery 569bb7e77619258e949d3a2010de2154
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $wn$50b7ab96-5a40-5a7c-8d93-6c0ed17b08ab$wn$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $wn$BAS-W03$wn$, $wn$Juniper Drop Earrings, Solid Gold Berry Cluster Dangles with One Dusty Blue Enamel Berry, French Hook, Winter Gift$wn$, $wn$A cluster of four small gold spheres on a French hook, three polished gold and one coated in dusty blue enamel, like berries on a juniper sprig.

Each earring is four 4.5 mm spheres touching in a tight cluster: three bright mirror-polished gold and exactly one in a soft powdery steel blue vitreous enamel with a matte bloom, the colour of a ripe juniper berry. The cluster hangs from a slim French hook with a tiny ball at its tip, so it moves a little as you move. Light enough for every day, enough colour for a winter table.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey.
Enamel: dusty blue vitreous enamel, glass fused to gold, matte finish on one sphere per earring.
Size: each sphere 4.5 mm, cluster about 10 mm across, total drop about 25 mm with the hook; sold as a pair.
Closure: French hook in the same gold.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$wn$,
  ARRAY[$wn$juniper earrings$wn$,$wn$berry earrings$wn$,$wn$gold drop earrings$wn$,$wn$blue enamel earrings$wn$,$wn$cluster earrings$wn$,$wn$gold ball earrings$wn$,$wn$french hook earrings$wn$,$wn$winter earrings$wn$,$wn$botanical earrings$wn$,$wn$14k drop earrings$wn$,$wn$gift for her$wn$,$wn$dusty blue jewelry$wn$,$wn$solid gold dangles$wn$]::text[], ARRAY['Solid gold', 'Vitreous enamel'], 'draft', 'USD',
  90000, 20, true, 'https://amuletta.artifactstudio.info/artifact/winter27/W03/01.jpg', 12, 'earrings',
  $wn${"productType": "earring", "listingProtocol": "dangle_earrings", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "W03", "name": "Juniper Drop Earrings", "collection": "Winter 26/27", "enamel": ["dusty blue"], "goldOnly": false, "dims": "spheres 4.5 mm, cluster 10 mm", "variationAxes": ["Karat", "Metal Color"], "sourcePackage": "2026-10-15-artifact-winter27", "sourcePackagePath": "docs/artifact-studio/winter27", "generatorScript": "docs/artifact-studio/winter27/gen_migration.py", "grams14Ref": 5.75, "refPriceCents": 126000, "makerCost14KRefUsd": 625.3, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes; W02 shank counted in full because the accepted hero carries the scales down the shoulders; W03 four spheres per earring (accepted hero), spec was three."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Grams are geometry estimates (pricing.py); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."}, "variantSeal": "c4c5f10066b2e975458eb39b58ddad15"}$wn$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $wn$BAS-W03$wn$ or p.id = $wn$50b7ab96-5a40-5a7c-8d93-6c0ed17b08ab$wn$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($wn$BAS-W03-10KY$wn$, $wn$Juniper Drop Earrings: 10K Yellow Gold$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold"}$wn$, 90000, 5.13),
  ($wn$BAS-W03-10KW$wn$, $wn$Juniper Drop Earrings: 10K White Gold$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold"}$wn$, 90000, 5.13),
  ($wn$BAS-W03-10KR$wn$, $wn$Juniper Drop Earrings: 10K Rose Gold$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold"}$wn$, 90000, 5.13),
  ($wn$BAS-W03-14KY$wn$, $wn$Juniper Drop Earrings: 14K Yellow Gold$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold"}$wn$, 126000, 5.75),
  ($wn$BAS-W03-14KW$wn$, $wn$Juniper Drop Earrings: 14K White Gold$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold"}$wn$, 126000, 5.75),
  ($wn$BAS-W03-14KR$wn$, $wn$Juniper Drop Earrings: 14K Rose Gold$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold"}$wn$, 126000, 5.75),
  ($wn$BAS-W03-18KY$wn$, $wn$Juniper Drop Earrings: 18K Yellow Gold$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold"}$wn$, 170000, 6.54),
  ($wn$BAS-W03-18KW$wn$, $wn$Juniper Drop Earrings: 18K White Gold$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold"}$wn$, 170000, 6.54),
  ($wn$BAS-W03-18KR$wn$, $wn$Juniper Drop Earrings: 18K Rose Gold$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold"}$wn$, 170000, 6.54)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W03$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/01.jpg$wn$, $wn$Juniper Drop Earrings in solid 14K yellow gold with dusty blue enamel, on juniper green slate with juniper sprigs$wn$),
  (1, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/02.jpg$wn$, $wn$Juniper Drop Earrings worn on the ear$wn$),
  (2, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/03.jpg$wn$, $wn$Close-up of the four sphere cluster of the Juniper Drop Earrings$wn$),
  (3, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/04.jpg$wn$, $wn$Close-up of the dusty blue enamel sphere of the Juniper Drop Earrings beside a real juniper berry$wn$),
  (4, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/05.jpg$wn$, $wn$Side view of the French hook of the Juniper Drop Earrings$wn$),
  (5, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/06.jpg$wn$, $wn$Scale view of the Juniper Drop Earrings held between two fingers, cluster 10 mm$wn$),
  (6, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/07.jpg$wn$, $wn$Juniper Drop Earrings hanging from a juniper sprig$wn$),
  (7, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/08.jpg$wn$, $wn$Juniper Drop Earrings beside an open gift box$wn$),
  (8, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/09.jpg$wn$, $wn$Juniper Drop Earrings shown in yellow, white and rose gold (colour visualization)$wn$),
  (9, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/10.jpg$wn$, $wn$Juniper Drop Earrings worn with hair in a low bun$wn$),
  (10, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/11.jpg$wn$, $wn$One earring of the Juniper Drop Earrings standing on slate$wn$),
  (11, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W03/12.jpg$wn$, $wn$Juniper Drop Earrings worn in winter window light$wn$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W03$wn$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- W04 Ember Lariat Necklace: 27 variants (Karat x Metal Color x Chain Length), seal a0a4f86b388472be81a2c9de90f56ea9, md5(description) 75b4bf1c3025ae06083cc41bfa48deb6,
-- tags 5a975ebf55324971be31e12860f4b6cf, gallery be7a98dbbdeed10d0344b11a87cc5b93
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $wn$663a7d68-911c-50d5-8652-8e0f7d3aeb28$wn$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $wn$BAS-W04$wn$, $wn$Ember Lariat Necklace, Solid Gold Y Necklace with a Molten Teardrop and an Orange Enamel Eye, Adjustable Y Lariat, Winter Gift$wn$, $wn$A Y lariat of solid gold: both strands of a fine cable chain pass through a small slide ring and drop together to a molten teardrop with a glowing ember orange enamel eye.

The teardrop is cast solid, 12 x 8 mm, with a softly rippled polished surface like a drop of liquid gold, and in its wide end sits one small domed eye of ember orange vitreous enamel in a thin polished bezel, like the last coal in the grate. The two chain strands pass together through a smooth slide ring and fall as a short double strand to the pendant, so the Y sits at the base of the throat and the teardrop just below the collarbones.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey.
Enamel: ember orange vitreous enamel, glass fused to gold, domed, about 3 mm across.
Size: teardrop 12 x 8 mm; choose a 16, 18 or 20 inch chain, measured as the closed length before the drop.
Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp, slide ring in the same gold.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$wn$,
  ARRAY[$wn$lariat necklace$wn$,$wn$gold y necklace$wn$,$wn$teardrop necklace$wn$,$wn$orange enamel charm$wn$,$wn$molten gold pendant$wn$,$wn$slide ring necklace$wn$,$wn$solid gold lariat$wn$,$wn$winter necklace$wn$,$wn$ember jewelry$wn$,$wn$14k lariat$wn$,$wn$gift for her$wn$,$wn$sculptural necklace$wn$,$wn$drop necklace$wn$]::text[], ARRAY['Solid gold', 'Vitreous enamel'], 'draft', 'USD',
  90000, 20, true, 'https://amuletta.artifactstudio.info/artifact/winter27/W04/01.jpg', 12, 'necklace',
  $wn${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "W04", "name": "Ember Lariat Necklace", "collection": "Winter 26/27", "enamel": ["ember orange"], "goldOnly": false, "dims": "teardrop 12 x 8 mm, eye 3 mm", "variationAxes": ["Karat", "Metal Color", "Chain Length"], "sourcePackage": "2026-10-15-artifact-winter27", "sourcePackagePath": "docs/artifact-studio/winter27", "generatorScript": "docs/artifact-studio/winter27/gen_migration.py", "grams14Ref": 2.95, "refPriceCents": 111000, "makerCost14KRefUsd": 553.46, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes; W02 shank counted in full because the accepted hero carries the scales down the shoulders; W03 four spheres per earring (accepted hero), spec was three."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Grams are geometry estimates (pricing.py); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."}, "variantSeal": "a0a4f86b388472be81a2c9de90f56ea9"}$wn$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $wn$BAS-W04$wn$ or p.id = $wn$663a7d68-911c-50d5-8652-8e0f7d3aeb28$wn$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($wn$BAS-W04-10KY-16IN$wn$, $wn$Ember Lariat Necklace: 10K Yellow Gold, 16 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$wn$, 90000, 2.63),
  ($wn$BAS-W04-10KY-18IN$wn$, $wn$Ember Lariat Necklace: 10K Yellow Gold, 18 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$wn$, 93000, 2.63),
  ($wn$BAS-W04-10KY-20IN$wn$, $wn$Ember Lariat Necklace: 10K Yellow Gold, 20 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$wn$, 96000, 2.63),
  ($wn$BAS-W04-10KW-16IN$wn$, $wn$Ember Lariat Necklace: 10K White Gold, 16 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$wn$, 90000, 2.63),
  ($wn$BAS-W04-10KW-18IN$wn$, $wn$Ember Lariat Necklace: 10K White Gold, 18 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$wn$, 93000, 2.63),
  ($wn$BAS-W04-10KW-20IN$wn$, $wn$Ember Lariat Necklace: 10K White Gold, 20 inches$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$wn$, 96000, 2.63),
  ($wn$BAS-W04-10KR-16IN$wn$, $wn$Ember Lariat Necklace: 10K Rose Gold, 16 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$wn$, 90000, 2.63),
  ($wn$BAS-W04-10KR-18IN$wn$, $wn$Ember Lariat Necklace: 10K Rose Gold, 18 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$wn$, 93000, 2.63),
  ($wn$BAS-W04-10KR-20IN$wn$, $wn$Ember Lariat Necklace: 10K Rose Gold, 20 inches$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$wn$, 96000, 2.63),
  ($wn$BAS-W04-14KY-16IN$wn$, $wn$Ember Lariat Necklace: 14K Yellow Gold, 16 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$wn$, 108000, 2.95),
  ($wn$BAS-W04-14KY-18IN$wn$, $wn$Ember Lariat Necklace: 14K Yellow Gold, 18 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$wn$, 111000, 2.95),
  ($wn$BAS-W04-14KY-20IN$wn$, $wn$Ember Lariat Necklace: 14K Yellow Gold, 20 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$wn$, 114000, 2.95),
  ($wn$BAS-W04-14KW-16IN$wn$, $wn$Ember Lariat Necklace: 14K White Gold, 16 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$wn$, 108000, 2.95),
  ($wn$BAS-W04-14KW-18IN$wn$, $wn$Ember Lariat Necklace: 14K White Gold, 18 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$wn$, 111000, 2.95),
  ($wn$BAS-W04-14KW-20IN$wn$, $wn$Ember Lariat Necklace: 14K White Gold, 20 inches$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$wn$, 114000, 2.95),
  ($wn$BAS-W04-14KR-16IN$wn$, $wn$Ember Lariat Necklace: 14K Rose Gold, 16 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$wn$, 108000, 2.95),
  ($wn$BAS-W04-14KR-18IN$wn$, $wn$Ember Lariat Necklace: 14K Rose Gold, 18 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$wn$, 111000, 2.95),
  ($wn$BAS-W04-14KR-20IN$wn$, $wn$Ember Lariat Necklace: 14K Rose Gold, 20 inches$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$wn$, 114000, 2.95),
  ($wn$BAS-W04-18KY-16IN$wn$, $wn$Ember Lariat Necklace: 18K Yellow Gold, 16 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$wn$, 131000, 3.35),
  ($wn$BAS-W04-18KY-18IN$wn$, $wn$Ember Lariat Necklace: 18K Yellow Gold, 18 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$wn$, 134000, 3.35),
  ($wn$BAS-W04-18KY-20IN$wn$, $wn$Ember Lariat Necklace: 18K Yellow Gold, 20 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$wn$, 137000, 3.35),
  ($wn$BAS-W04-18KW-16IN$wn$, $wn$Ember Lariat Necklace: 18K White Gold, 16 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$wn$, 131000, 3.35),
  ($wn$BAS-W04-18KW-18IN$wn$, $wn$Ember Lariat Necklace: 18K White Gold, 18 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$wn$, 134000, 3.35),
  ($wn$BAS-W04-18KW-20IN$wn$, $wn$Ember Lariat Necklace: 18K White Gold, 20 inches$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$wn$, 137000, 3.35),
  ($wn$BAS-W04-18KR-16IN$wn$, $wn$Ember Lariat Necklace: 18K Rose Gold, 16 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$wn$, 131000, 3.35),
  ($wn$BAS-W04-18KR-18IN$wn$, $wn$Ember Lariat Necklace: 18K Rose Gold, 18 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$wn$, 134000, 3.35),
  ($wn$BAS-W04-18KR-20IN$wn$, $wn$Ember Lariat Necklace: 18K Rose Gold, 20 inches$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$wn$, 137000, 3.35)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W04$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/01.jpg$wn$, $wn$Ember Lariat Necklace in solid 14K yellow gold with an ember orange enamel eye, on ash grey slate$wn$),
  (1, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/02.jpg$wn$, $wn$Ember Lariat Necklace worn at the collarbone$wn$),
  (2, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/03.jpg$wn$, $wn$Close-up of the molten teardrop and ember orange enamel eye of the Ember Lariat Necklace$wn$),
  (3, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/04.jpg$wn$, $wn$Close-up of the domed ember orange enamel eye of the Ember Lariat Necklace$wn$),
  (4, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/05.jpg$wn$, $wn$Close-up of the slide ring and double strand of the Ember Lariat Necklace$wn$),
  (5, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/06.jpg$wn$, $wn$Scale view of the teardrop of the Ember Lariat Necklace beside a fingertip, 12 mm$wn$),
  (6, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/07.jpg$wn$, $wn$Ember Lariat Necklace coiled on slate$wn$),
  (7, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/08.jpg$wn$, $wn$Ember Lariat Necklace on a white card beside an open gift box$wn$),
  (8, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/09.jpg$wn$, $wn$Ember Lariat Necklace shown in yellow, white and rose gold (colour visualization)$wn$),
  (9, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/10.jpg$wn$, $wn$Ember Lariat Necklace worn with a wool coat$wn$),
  (10, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/11.jpg$wn$, $wn$Side view of the molten teardrop of the Ember Lariat Necklace$wn$),
  (11, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W04/12.jpg$wn$, $wn$Ember Lariat Necklace worn in winter window light$wn$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W04$wn$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- W05 Pine Needle Brooch: 9 variants (Karat x Metal Color), seal d1270f769d35c1848f14bf61539c8e40, md5(description) afc932cc6295306290f3fe20cc36fe00,
-- tags 560695d81b8dc07d7007920bd8979e7e, gallery 43444eb68712e3f7fa0fb8caca8936bc
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $wn$da916fdd-9673-58d5-bbfd-134b915bce77$wn$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $wn$BAS-W05$wn$, $wn$Pine Needle Brooch, Solid Gold Crossed Needle Bundles with Matte Tips, Sculptural Lapel Pin, Winter Coat Brooch, Gift$wn$, $wn$Two bundles of five slender solid gold pine needles crossed in an X, polished shafts and matte brushed tips, with a pin stem and catch on the back.

Each needle is a straight 1.2 mm round wire tapering to a soft point, 45 mm long; the ten needles cross at a small central hub, the shafts mirror polished and the last 8 mm of every tip brushed matte, so the piece catches light along its length and goes quiet at the points. A plain pin stem and a small revolver safety catch are soldered to the back in the same gold. Wear it on a coat lapel, a scarf, a knit shoulder or a hat band.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey.
Finish: mirror polished shafts, matte brushed tips.
Size: 45 mm across the X; needles 1.2 mm round wire.
Closure: pin stem with a revolver safety catch, in the same gold.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$wn$,
  ARRAY[$wn$gold brooch$wn$,$wn$pine needle brooch$wn$,$wn$lapel pin brooch$wn$,$wn$sculptural brooch$wn$,$wn$solid gold pin$wn$,$wn$winter brooch$wn$,$wn$coat brooch$wn$,$wn$botanical brooch$wn$,$wn$modern gold brooch$wn$,$wn$14k gold brooch$wn$,$wn$gift for her$wn$,$wn$gift for him$wn$,$wn$scarf pin$wn$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  117000, 20, true, 'https://amuletta.artifactstudio.info/artifact/winter27/W05/01.jpg', 12, 'brooch',
  $wn${"productType": "brooch", "listingProtocol": "brooch", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "W05", "name": "Pine Needle Brooch", "collection": "Winter 26/27", "enamel": [], "goldOnly": true, "dims": "45 mm across, 1.2 mm wire", "variationAxes": ["Karat", "Metal Color"], "sourcePackage": "2026-10-15-artifact-winter27", "sourcePackagePath": "docs/artifact-studio/winter27", "generatorScript": "docs/artifact-studio/winter27/gen_migration.py", "grams14Ref": 7.72, "refPriceCents": 165000, "makerCost14KRefUsd": 822.07, "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity. Estimated parts: all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes; W02 shank counted in full because the accepted hero carries the scales down the shoulders; W03 four spheres per earring (accepted hero), spec was three."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.", "Grams are geometry estimates (pricing.py); no sample has been cast.", "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."}, "variantSeal": "d1270f769d35c1848f14bf61539c8e40"}$wn$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $wn$BAS-W05$wn$ or p.id = $wn$da916fdd-9673-58d5-bbfd-134b915bce77$wn$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($wn$BAS-W05-10KY$wn$, $wn$Pine Needle Brooch: 10K Yellow Gold$wn$, $wn${"Karat": "10K", "Metal Color": "Yellow Gold"}$wn$, 117000, 6.89),
  ($wn$BAS-W05-10KW$wn$, $wn$Pine Needle Brooch: 10K White Gold$wn$, $wn${"Karat": "10K", "Metal Color": "White Gold"}$wn$, 117000, 6.89),
  ($wn$BAS-W05-10KR$wn$, $wn$Pine Needle Brooch: 10K Rose Gold$wn$, $wn${"Karat": "10K", "Metal Color": "Rose Gold"}$wn$, 117000, 6.89),
  ($wn$BAS-W05-14KY$wn$, $wn$Pine Needle Brooch: 14K Yellow Gold$wn$, $wn${"Karat": "14K", "Metal Color": "Yellow Gold"}$wn$, 165000, 7.72),
  ($wn$BAS-W05-14KW$wn$, $wn$Pine Needle Brooch: 14K White Gold$wn$, $wn${"Karat": "14K", "Metal Color": "White Gold"}$wn$, 165000, 7.72),
  ($wn$BAS-W05-14KR$wn$, $wn$Pine Needle Brooch: 14K Rose Gold$wn$, $wn${"Karat": "14K", "Metal Color": "Rose Gold"}$wn$, 165000, 7.72),
  ($wn$BAS-W05-18KY$wn$, $wn$Pine Needle Brooch: 18K Yellow Gold$wn$, $wn${"Karat": "18K", "Metal Color": "Yellow Gold"}$wn$, 225000, 8.78),
  ($wn$BAS-W05-18KW$wn$, $wn$Pine Needle Brooch: 18K White Gold$wn$, $wn${"Karat": "18K", "Metal Color": "White Gold"}$wn$, 225000, 8.78),
  ($wn$BAS-W05-18KR$wn$, $wn$Pine Needle Brooch: 18K Rose Gold$wn$, $wn${"Karat": "18K", "Metal Color": "Rose Gold"}$wn$, 225000, 8.78)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W05$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/01.jpg$wn$, $wn$Pine Needle Brooch in solid 14K yellow gold on snow dusted pine bark$wn$),
  (1, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/02.jpg$wn$, $wn$Pine Needle Brooch worn on a wool coat lapel$wn$),
  (2, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/03.jpg$wn$, $wn$Close-up of the matte brushed needle tips of the Pine Needle Brooch$wn$),
  (3, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/04.jpg$wn$, $wn$Close-up of the central hub of the Pine Needle Brooch$wn$),
  (4, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/05.jpg$wn$, $wn$Back of the Pine Needle Brooch showing the pin stem and revolver catch$wn$),
  (5, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/06.jpg$wn$, $wn$Scale view of the Pine Needle Brooch held between two fingers, 45 mm$wn$),
  (6, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/07.jpg$wn$, $wn$Pine Needle Brooch pinned on a knit scarf$wn$),
  (7, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/08.jpg$wn$, $wn$Pine Needle Brooch beside an open gift box$wn$),
  (8, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/09.jpg$wn$, $wn$Pine Needle Brooch shown in yellow, white and rose gold (colour visualization)$wn$),
  (9, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/10.jpg$wn$, $wn$Pine Needle Brooch worn on a knit sweater shoulder$wn$),
  (10, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/11.jpg$wn$, $wn$Low angle view across the needles of the Pine Needle Brooch$wn$),
  (11, $wn$https://amuletta.artifactstudio.info/artifact/winter27/W05/12.jpg$wn$, $wn$Pine Needle Brooch worn in winter window light$wn$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $wn$BAS-W05$wn$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;

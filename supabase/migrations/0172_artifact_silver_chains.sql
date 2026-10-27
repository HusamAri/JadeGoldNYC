-- 0172_artifact_silver_chains.sql
-- by Artifact Studio Jewelry: sterling silver chains, 6 listings, 144 variants, 30 images (design visualizations).
-- Panel drafts only; this migration does not write to Etsy. Source: docs/artifact-studio/silver-chains/.
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku) under a
-- product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): 144 variants / 52eafdd878a948531e5106f9c677579a
--   (md5 of sku|Width|Length|price_cents|grams over all six products, order by line collate "C")
begin;

-- S01 925 Sterling Silver Franco Chain Necklace, Rhodium Plated, 2.2 to 5.2mm, Men's: 30 variants (Width x Length), seal f77f5d4e3e399c347702522622324d9a, md5(description) 5c53d67bc19cc0696fd7290102ce7b5d, tags 551f380bee2a75accbe265b03cbf28ba
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$11192646-cd1d-5fe1-aac9-21e62f5c7964$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S01$sv$, $sv$925 Sterling Silver Franco Chain Necklace, Rhodium Plated, 2.2 to 5.2mm, Men's$sv$, $sv$Solid 925 sterling silver Franco chain necklace for men, made to order in your width and length: 2.2 to 5.2 mm wide, 18 to 26 inches.

Franco is a square chain: V-shaped links locked tightly into each other, so every side shows the same chevron pattern and the chain sits straight and does not kink. It is rhodium plated over the sterling silver for a bright white finish.

Widths and approximate weight (weight grows with length):
- 2.2 mm: about 14.3 g at 20 inches
- 3.0 mm: about 24.1 g at 20 inches
- 3.4 mm: about 31.4 g at 20 inches
- 4.1 mm: about 45.7 g at 20 inches
- 4.8 mm: about 62.2 g at 20 inches
- 5.2 mm: about 72.6 g at 20 inches

- Lengths: 18, 20, 22, 24, 26 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$franco chain$sv$,$sv$mens silver chain$sv$,$sv$sterling franco$sv$,$sv$silver franco chain$sv$,$sv$925 silver necklace$sv$,$sv$mens franco necklace$sv$,$sv$franco link chain$sv$,$sv$rhodium silver chain$sv$,$sv$thick silver chain$sv$,$sv$everyday mens chain$sv$,$sv$solid silver chain$sv$,$sv$square link chain$sv$,$sv$mens neck chain$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$,$sv$rhodium plating$sv$]::text[], 'draft', 'USD',
  18900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/01.jpg$sv$, 5, 'necklace',
  $sv${"productType": "necklace", "listingProtocol": "chain_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S01", "name": "Franco necklace", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "f77f5d4e3e399c347702522622324d9a"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S01$sv$ or p.id = $sv$11192646-cd1d-5fe1-aac9-21e62f5c7964$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S01-2_2MM-18IN$sv$, $sv$Franco necklace: 2.2 mm, 18 in$sv$, $sv${"Width": "2.2 mm", "Length": "18 in"}$sv$, 18900, 12.90),
  ($sv$BAS-SLV-S01-2_2MM-20IN$sv$, $sv$Franco necklace: 2.2 mm, 20 in$sv$, $sv${"Width": "2.2 mm", "Length": "20 in"}$sv$, 19900, 14.30),
  ($sv$BAS-SLV-S01-2_2MM-22IN$sv$, $sv$Franco necklace: 2.2 mm, 22 in$sv$, $sv${"Width": "2.2 mm", "Length": "22 in"}$sv$, 20900, 15.80),
  ($sv$BAS-SLV-S01-2_2MM-24IN$sv$, $sv$Franco necklace: 2.2 mm, 24 in$sv$, $sv${"Width": "2.2 mm", "Length": "24 in"}$sv$, 21900, 17.20),
  ($sv$BAS-SLV-S01-2_2MM-26IN$sv$, $sv$Franco necklace: 2.2 mm, 26 in$sv$, $sv${"Width": "2.2 mm", "Length": "26 in"}$sv$, 23900, 18.60),
  ($sv$BAS-SLV-S01-3MM-18IN$sv$, $sv$Franco necklace: 3 mm, 18 in$sv$, $sv${"Width": "3 mm", "Length": "18 in"}$sv$, 25900, 21.70),
  ($sv$BAS-SLV-S01-3MM-20IN$sv$, $sv$Franco necklace: 3 mm, 20 in$sv$, $sv${"Width": "3 mm", "Length": "20 in"}$sv$, 27900, 24.10),
  ($sv$BAS-SLV-S01-3MM-22IN$sv$, $sv$Franco necklace: 3 mm, 22 in$sv$, $sv${"Width": "3 mm", "Length": "22 in"}$sv$, 29900, 26.50),
  ($sv$BAS-SLV-S01-3MM-24IN$sv$, $sv$Franco necklace: 3 mm, 24 in$sv$, $sv${"Width": "3 mm", "Length": "24 in"}$sv$, 32900, 28.90),
  ($sv$BAS-SLV-S01-3MM-26IN$sv$, $sv$Franco necklace: 3 mm, 26 in$sv$, $sv${"Width": "3 mm", "Length": "26 in"}$sv$, 34900, 31.30),
  ($sv$BAS-SLV-S01-3_4MM-18IN$sv$, $sv$Franco necklace: 3.4 mm, 18 in$sv$, $sv${"Width": "3.4 mm", "Length": "18 in"}$sv$, 31900, 28.30),
  ($sv$BAS-SLV-S01-3_4MM-20IN$sv$, $sv$Franco necklace: 3.4 mm, 20 in$sv$, $sv${"Width": "3.4 mm", "Length": "20 in"}$sv$, 34900, 31.40),
  ($sv$BAS-SLV-S01-3_4MM-22IN$sv$, $sv$Franco necklace: 3.4 mm, 22 in$sv$, $sv${"Width": "3.4 mm", "Length": "22 in"}$sv$, 36900, 34.60),
  ($sv$BAS-SLV-S01-3_4MM-24IN$sv$, $sv$Franco necklace: 3.4 mm, 24 in$sv$, $sv${"Width": "3.4 mm", "Length": "24 in"}$sv$, 39900, 37.70),
  ($sv$BAS-SLV-S01-3_4MM-26IN$sv$, $sv$Franco necklace: 3.4 mm, 26 in$sv$, $sv${"Width": "3.4 mm", "Length": "26 in"}$sv$, 42900, 40.90),
  ($sv$BAS-SLV-S01-4_1MM-18IN$sv$, $sv$Franco necklace: 4.1 mm, 18 in$sv$, $sv${"Width": "4.1 mm", "Length": "18 in"}$sv$, 42900, 41.10),
  ($sv$BAS-SLV-S01-4_1MM-20IN$sv$, $sv$Franco necklace: 4.1 mm, 20 in$sv$, $sv${"Width": "4.1 mm", "Length": "20 in"}$sv$, 46900, 45.70),
  ($sv$BAS-SLV-S01-4_1MM-22IN$sv$, $sv$Franco necklace: 4.1 mm, 22 in$sv$, $sv${"Width": "4.1 mm", "Length": "22 in"}$sv$, 50900, 50.20),
  ($sv$BAS-SLV-S01-4_1MM-24IN$sv$, $sv$Franco necklace: 4.1 mm, 24 in$sv$, $sv${"Width": "4.1 mm", "Length": "24 in"}$sv$, 54900, 54.80),
  ($sv$BAS-SLV-S01-4_1MM-26IN$sv$, $sv$Franco necklace: 4.1 mm, 26 in$sv$, $sv${"Width": "4.1 mm", "Length": "26 in"}$sv$, 58900, 59.40),
  ($sv$BAS-SLV-S01-4_8MM-18IN$sv$, $sv$Franco necklace: 4.8 mm, 18 in$sv$, $sv${"Width": "4.8 mm", "Length": "18 in"}$sv$, 55900, 56.00),
  ($sv$BAS-SLV-S01-4_8MM-20IN$sv$, $sv$Franco necklace: 4.8 mm, 20 in$sv$, $sv${"Width": "4.8 mm", "Length": "20 in"}$sv$, 60900, 62.20),
  ($sv$BAS-SLV-S01-4_8MM-22IN$sv$, $sv$Franco necklace: 4.8 mm, 22 in$sv$, $sv${"Width": "4.8 mm", "Length": "22 in"}$sv$, 65900, 68.40),
  ($sv$BAS-SLV-S01-4_8MM-24IN$sv$, $sv$Franco necklace: 4.8 mm, 24 in$sv$, $sv${"Width": "4.8 mm", "Length": "24 in"}$sv$, 71900, 74.70),
  ($sv$BAS-SLV-S01-4_8MM-26IN$sv$, $sv$Franco necklace: 4.8 mm, 26 in$sv$, $sv${"Width": "4.8 mm", "Length": "26 in"}$sv$, 76900, 80.90),
  ($sv$BAS-SLV-S01-5_2MM-18IN$sv$, $sv$Franco necklace: 5.2 mm, 18 in$sv$, $sv${"Width": "5.2 mm", "Length": "18 in"}$sv$, 63900, 65.30),
  ($sv$BAS-SLV-S01-5_2MM-20IN$sv$, $sv$Franco necklace: 5.2 mm, 20 in$sv$, $sv${"Width": "5.2 mm", "Length": "20 in"}$sv$, 69900, 72.60),
  ($sv$BAS-SLV-S01-5_2MM-22IN$sv$, $sv$Franco necklace: 5.2 mm, 22 in$sv$, $sv${"Width": "5.2 mm", "Length": "22 in"}$sv$, 75900, 79.80),
  ($sv$BAS-SLV-S01-5_2MM-24IN$sv$, $sv$Franco necklace: 5.2 mm, 24 in$sv$, $sv${"Width": "5.2 mm", "Length": "24 in"}$sv$, 81900, 87.10),
  ($sv$BAS-SLV-S01-5_2MM-26IN$sv$, $sv$Franco necklace: 5.2 mm, 26 in$sv$, $sv${"Width": "5.2 mm", "Length": "26 in"}$sv$, 88900, 94.30)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S01$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/01.jpg$sv$, $sv$Sterling silver Franco chain necklace on slate$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/02.jpg$sv$, $sv$Sterling silver Franco chain necklace worn at the collarbone, clasp at the back$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/03.jpg$sv$, $sv$Close-up of the Franco links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Franco chain necklace$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S01/05.jpg$sv$, $sv$Sterling silver Franco chain necklace laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S01$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- S02 925 Sterling Silver Franco Bracelet, Rhodium Plated Chain, 2.2 to 5.2mm, Men's: 18 variants (Width x Length), seal 749d9ea794b73fc9dfe4aa18488dbce6, md5(description) f69b31924ecd54e9cc55ad30e4e1af5f, tags aa722a8b73db4745c2600bb4e141779d
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$b007948f-45a9-5dbf-86d5-94896a981564$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S02$sv$, $sv$925 Sterling Silver Franco Bracelet, Rhodium Plated Chain, 2.2 to 5.2mm, Men's$sv$, $sv$Solid 925 sterling silver Franco chain bracelet for men, made to order in your width and length: 2.2 to 5.2 mm wide, 7 to 9 inches.

Franco is a square chain: V-shaped links locked tightly into each other, so every side shows the same chevron pattern and the chain sits straight and does not kink. It is rhodium plated over the sterling silver for a bright white finish.

Widths and approximate weight (weight grows with length):
- 2.2 mm: about 5.7 g at 8 inches
- 3.0 mm: about 9.6 g at 8 inches
- 3.4 mm: about 12.6 g at 8 inches
- 4.1 mm: about 18.3 g at 8 inches
- 4.8 mm: about 24.9 g at 8 inches
- 5.2 mm: about 29.0 g at 8 inches

- Lengths: 7, 8, 9 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$franco bracelet$sv$,$sv$mens silver bracelet$sv$,$sv$sterling bracelet$sv$,$sv$silver franco links$sv$,$sv$925 silver bracelet$sv$,$sv$mens chain bracelet$sv$,$sv$rhodium bracelet$sv$,$sv$solid 925 bracelet$sv$,$sv$square link bracelet$sv$,$sv$mens wrist chain$sv$,$sv$thick silver links$sv$,$sv$mens stack bracelet$sv$,$sv$mens franco bracelet$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$,$sv$rhodium plating$sv$]::text[], 'draft', 'USD',
  11900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/01.jpg$sv$, 5, 'bracelet',
  $sv${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S02", "name": "Franco bracelet", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "749d9ea794b73fc9dfe4aa18488dbce6"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S02$sv$ or p.id = $sv$b007948f-45a9-5dbf-86d5-94896a981564$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S02-2_2MM-7IN$sv$, $sv$Franco bracelet: 2.2 mm, 7 in$sv$, $sv${"Width": "2.2 mm", "Length": "7 in"}$sv$, 11900, 5.00),
  ($sv$BAS-SLV-S02-2_2MM-8IN$sv$, $sv$Franco bracelet: 2.2 mm, 8 in$sv$, $sv${"Width": "2.2 mm", "Length": "8 in"}$sv$, 12900, 5.70),
  ($sv$BAS-SLV-S02-2_2MM-9IN$sv$, $sv$Franco bracelet: 2.2 mm, 9 in$sv$, $sv${"Width": "2.2 mm", "Length": "9 in"}$sv$, 12900, 6.50),
  ($sv$BAS-SLV-S02-3MM-7IN$sv$, $sv$Franco bracelet: 3 mm, 7 in$sv$, $sv${"Width": "3 mm", "Length": "7 in"}$sv$, 14900, 8.40),
  ($sv$BAS-SLV-S02-3MM-8IN$sv$, $sv$Franco bracelet: 3 mm, 8 in$sv$, $sv${"Width": "3 mm", "Length": "8 in"}$sv$, 15900, 9.60),
  ($sv$BAS-SLV-S02-3MM-9IN$sv$, $sv$Franco bracelet: 3 mm, 9 in$sv$, $sv${"Width": "3 mm", "Length": "9 in"}$sv$, 16900, 10.80),
  ($sv$BAS-SLV-S02-3_4MM-7IN$sv$, $sv$Franco bracelet: 3.4 mm, 7 in$sv$, $sv${"Width": "3.4 mm", "Length": "7 in"}$sv$, 16900, 11.00),
  ($sv$BAS-SLV-S02-3_4MM-8IN$sv$, $sv$Franco bracelet: 3.4 mm, 8 in$sv$, $sv${"Width": "3.4 mm", "Length": "8 in"}$sv$, 18900, 12.60),
  ($sv$BAS-SLV-S02-3_4MM-9IN$sv$, $sv$Franco bracelet: 3.4 mm, 9 in$sv$, $sv${"Width": "3.4 mm", "Length": "9 in"}$sv$, 19900, 14.20),
  ($sv$BAS-SLV-S02-4_1MM-7IN$sv$, $sv$Franco bracelet: 4.1 mm, 7 in$sv$, $sv${"Width": "4.1 mm", "Length": "7 in"}$sv$, 20900, 16.00),
  ($sv$BAS-SLV-S02-4_1MM-8IN$sv$, $sv$Franco bracelet: 4.1 mm, 8 in$sv$, $sv${"Width": "4.1 mm", "Length": "8 in"}$sv$, 22900, 18.30),
  ($sv$BAS-SLV-S02-4_1MM-9IN$sv$, $sv$Franco bracelet: 4.1 mm, 9 in$sv$, $sv${"Width": "4.1 mm", "Length": "9 in"}$sv$, 24900, 20.60),
  ($sv$BAS-SLV-S02-4_8MM-7IN$sv$, $sv$Franco bracelet: 4.8 mm, 7 in$sv$, $sv${"Width": "4.8 mm", "Length": "7 in"}$sv$, 25900, 21.80),
  ($sv$BAS-SLV-S02-4_8MM-8IN$sv$, $sv$Franco bracelet: 4.8 mm, 8 in$sv$, $sv${"Width": "4.8 mm", "Length": "8 in"}$sv$, 28900, 24.90),
  ($sv$BAS-SLV-S02-4_8MM-9IN$sv$, $sv$Franco bracelet: 4.8 mm, 9 in$sv$, $sv${"Width": "4.8 mm", "Length": "9 in"}$sv$, 31900, 28.00),
  ($sv$BAS-SLV-S02-5_2MM-7IN$sv$, $sv$Franco bracelet: 5.2 mm, 7 in$sv$, $sv${"Width": "5.2 mm", "Length": "7 in"}$sv$, 29900, 25.40),
  ($sv$BAS-SLV-S02-5_2MM-8IN$sv$, $sv$Franco bracelet: 5.2 mm, 8 in$sv$, $sv${"Width": "5.2 mm", "Length": "8 in"}$sv$, 32900, 29.00),
  ($sv$BAS-SLV-S02-5_2MM-9IN$sv$, $sv$Franco bracelet: 5.2 mm, 9 in$sv$, $sv${"Width": "5.2 mm", "Length": "9 in"}$sv$, 35900, 32.60)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S02$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/01.jpg$sv$, $sv$Sterling silver Franco chain bracelet on indigo denim$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/02.jpg$sv$, $sv$Sterling silver Franco chain bracelet worn on a man's wrist$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/03.jpg$sv$, $sv$Close-up of the Franco links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Franco chain bracelet$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S02/05.jpg$sv$, $sv$Sterling silver Franco chain bracelet laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S02$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- S03 925 Sterling Silver Cuban Curb Chain Necklace, Flat Faceted Links, 3.3 to 10.2mm, Men's: 30 variants (Width x Length), seal c734eb296bdc20e7bd220bb7cee9e6be, md5(description) 73b0c0f427e9737910684b0a181c8ed0, tags cfa2736dd27771c13d3f003497d40850
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$07ae5ec0-304a-5501-a72a-cca42cb03c69$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S03$sv$, $sv$925 Sterling Silver Cuban Curb Chain Necklace, Flat Faceted Links, 3.3 to 10.2mm, Men's$sv$, $sv$Solid 925 sterling silver Cuban Curb chain necklace for men, made to order in your width and length: 3.3 to 10.2 mm wide, 18 to 26 inches.

Cuban curb links are flat ovals twisted so the chain lies completely flat, each link cut with bright flat facets that catch the light from every angle.

Widths and approximate weight (weight grows with length):
- 3.3 mm: about 8.4 g at 20 inches
- 4.8 mm: about 16.4 g at 20 inches
- 6.5 mm: about 27.9 g at 20 inches
- 7.6 mm: about 36.2 g at 20 inches
- 8.5 mm: about 46.2 g at 20 inches
- 10.2 mm: about 58.7 g at 20 inches

- Lengths: 18, 20, 22, 24, 26 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$cuban link chain$sv$,$sv$mens silver chain$sv$,$sv$silver curb chain$sv$,$sv$cuban curb necklace$sv$,$sv$925 silver necklace$sv$,$sv$flat curb chain$sv$,$sv$mens cuban necklace$sv$,$sv$faceted curb links$sv$,$sv$thick silver chain$sv$,$sv$solid silver chain$sv$,$sv$sterling cuban$sv$,$sv$mens neck chain$sv$,$sv$classic curb chain$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$]::text[], 'draft', 'USD',
  13900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/01.jpg$sv$, 5, 'necklace',
  $sv${"productType": "necklace", "listingProtocol": "chain_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S03", "name": "Cuban curb necklace", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "c734eb296bdc20e7bd220bb7cee9e6be"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S03$sv$ or p.id = $sv$07ae5ec0-304a-5501-a72a-cca42cb03c69$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S03-3_3MM-18IN$sv$, $sv$Cuban curb necklace: 3.3 mm, 18 in$sv$, $sv${"Width": "3.3 mm", "Length": "18 in"}$sv$, 13900, 7.60),
  ($sv$BAS-SLV-S03-3_3MM-20IN$sv$, $sv$Cuban curb necklace: 3.3 mm, 20 in$sv$, $sv${"Width": "3.3 mm", "Length": "20 in"}$sv$, 14900, 8.40),
  ($sv$BAS-SLV-S03-3_3MM-22IN$sv$, $sv$Cuban curb necklace: 3.3 mm, 22 in$sv$, $sv${"Width": "3.3 mm", "Length": "22 in"}$sv$, 15900, 9.30),
  ($sv$BAS-SLV-S03-3_3MM-24IN$sv$, $sv$Cuban curb necklace: 3.3 mm, 24 in$sv$, $sv${"Width": "3.3 mm", "Length": "24 in"}$sv$, 15900, 10.10),
  ($sv$BAS-SLV-S03-3_3MM-26IN$sv$, $sv$Cuban curb necklace: 3.3 mm, 26 in$sv$, $sv${"Width": "3.3 mm", "Length": "26 in"}$sv$, 16900, 11.00),
  ($sv$BAS-SLV-S03-4_8MM-18IN$sv$, $sv$Cuban curb necklace: 4.8 mm, 18 in$sv$, $sv${"Width": "4.8 mm", "Length": "18 in"}$sv$, 19900, 14.80),
  ($sv$BAS-SLV-S03-4_8MM-20IN$sv$, $sv$Cuban curb necklace: 4.8 mm, 20 in$sv$, $sv${"Width": "4.8 mm", "Length": "20 in"}$sv$, 21900, 16.40),
  ($sv$BAS-SLV-S03-4_8MM-22IN$sv$, $sv$Cuban curb necklace: 4.8 mm, 22 in$sv$, $sv${"Width": "4.8 mm", "Length": "22 in"}$sv$, 22900, 18.10),
  ($sv$BAS-SLV-S03-4_8MM-24IN$sv$, $sv$Cuban curb necklace: 4.8 mm, 24 in$sv$, $sv${"Width": "4.8 mm", "Length": "24 in"}$sv$, 24900, 19.70),
  ($sv$BAS-SLV-S03-4_8MM-26IN$sv$, $sv$Cuban curb necklace: 4.8 mm, 26 in$sv$, $sv${"Width": "4.8 mm", "Length": "26 in"}$sv$, 25900, 21.40),
  ($sv$BAS-SLV-S03-6_5MM-18IN$sv$, $sv$Cuban curb necklace: 6.5 mm, 18 in$sv$, $sv${"Width": "6.5 mm", "Length": "18 in"}$sv$, 28900, 25.10),
  ($sv$BAS-SLV-S03-6_5MM-20IN$sv$, $sv$Cuban curb necklace: 6.5 mm, 20 in$sv$, $sv${"Width": "6.5 mm", "Length": "20 in"}$sv$, 31900, 27.90),
  ($sv$BAS-SLV-S03-6_5MM-22IN$sv$, $sv$Cuban curb necklace: 6.5 mm, 22 in$sv$, $sv${"Width": "6.5 mm", "Length": "22 in"}$sv$, 33900, 30.70),
  ($sv$BAS-SLV-S03-6_5MM-24IN$sv$, $sv$Cuban curb necklace: 6.5 mm, 24 in$sv$, $sv${"Width": "6.5 mm", "Length": "24 in"}$sv$, 35900, 33.50),
  ($sv$BAS-SLV-S03-6_5MM-26IN$sv$, $sv$Cuban curb necklace: 6.5 mm, 26 in$sv$, $sv${"Width": "6.5 mm", "Length": "26 in"}$sv$, 38900, 36.30),
  ($sv$BAS-SLV-S03-7_6MM-18IN$sv$, $sv$Cuban curb necklace: 7.6 mm, 18 in$sv$, $sv${"Width": "7.6 mm", "Length": "18 in"}$sv$, 35900, 32.60),
  ($sv$BAS-SLV-S03-7_6MM-20IN$sv$, $sv$Cuban curb necklace: 7.6 mm, 20 in$sv$, $sv${"Width": "7.6 mm", "Length": "20 in"}$sv$, 38900, 36.20),
  ($sv$BAS-SLV-S03-7_6MM-22IN$sv$, $sv$Cuban curb necklace: 7.6 mm, 22 in$sv$, $sv${"Width": "7.6 mm", "Length": "22 in"}$sv$, 41900, 39.80),
  ($sv$BAS-SLV-S03-7_6MM-24IN$sv$, $sv$Cuban curb necklace: 7.6 mm, 24 in$sv$, $sv${"Width": "7.6 mm", "Length": "24 in"}$sv$, 44900, 43.50),
  ($sv$BAS-SLV-S03-7_6MM-26IN$sv$, $sv$Cuban curb necklace: 7.6 mm, 26 in$sv$, $sv${"Width": "7.6 mm", "Length": "26 in"}$sv$, 47900, 47.10),
  ($sv$BAS-SLV-S03-8_5MM-18IN$sv$, $sv$Cuban curb necklace: 8.5 mm, 18 in$sv$, $sv${"Width": "8.5 mm", "Length": "18 in"}$sv$, 42900, 41.60),
  ($sv$BAS-SLV-S03-8_5MM-20IN$sv$, $sv$Cuban curb necklace: 8.5 mm, 20 in$sv$, $sv${"Width": "8.5 mm", "Length": "20 in"}$sv$, 46900, 46.20),
  ($sv$BAS-SLV-S03-8_5MM-22IN$sv$, $sv$Cuban curb necklace: 8.5 mm, 22 in$sv$, $sv${"Width": "8.5 mm", "Length": "22 in"}$sv$, 50900, 50.80),
  ($sv$BAS-SLV-S03-8_5MM-24IN$sv$, $sv$Cuban curb necklace: 8.5 mm, 24 in$sv$, $sv${"Width": "8.5 mm", "Length": "24 in"}$sv$, 54900, 55.50),
  ($sv$BAS-SLV-S03-8_5MM-26IN$sv$, $sv$Cuban curb necklace: 8.5 mm, 26 in$sv$, $sv${"Width": "8.5 mm", "Length": "26 in"}$sv$, 58900, 60.10),
  ($sv$BAS-SLV-S03-10_2MM-18IN$sv$, $sv$Cuban curb necklace: 10.2 mm, 18 in$sv$, $sv${"Width": "10.2 mm", "Length": "18 in"}$sv$, 52900, 52.80),
  ($sv$BAS-SLV-S03-10_2MM-20IN$sv$, $sv$Cuban curb necklace: 10.2 mm, 20 in$sv$, $sv${"Width": "10.2 mm", "Length": "20 in"}$sv$, 57900, 58.70),
  ($sv$BAS-SLV-S03-10_2MM-22IN$sv$, $sv$Cuban curb necklace: 10.2 mm, 22 in$sv$, $sv${"Width": "10.2 mm", "Length": "22 in"}$sv$, 62900, 64.50),
  ($sv$BAS-SLV-S03-10_2MM-24IN$sv$, $sv$Cuban curb necklace: 10.2 mm, 24 in$sv$, $sv${"Width": "10.2 mm", "Length": "24 in"}$sv$, 67900, 70.40),
  ($sv$BAS-SLV-S03-10_2MM-26IN$sv$, $sv$Cuban curb necklace: 10.2 mm, 26 in$sv$, $sv${"Width": "10.2 mm", "Length": "26 in"}$sv$, 72900, 76.30)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S03$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/01.jpg$sv$, $sv$Sterling silver Cuban curb chain necklace on black marble$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/02.jpg$sv$, $sv$Sterling silver Cuban curb chain necklace worn at the collarbone, clasp at the back$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/03.jpg$sv$, $sv$Close-up of the Cuban curb links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Cuban curb chain necklace$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S03/05.jpg$sv$, $sv$Sterling silver Cuban curb chain necklace laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S03$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- S04 925 Sterling Silver Cuban Link Bracelet, Flat Curb Chain, 3.3 to 10.2mm, Men's: 18 variants (Width x Length), seal 9ceb60e59b8c56e18e38128d38ee2b97, md5(description) 53dc8aa7a891f4dffad4176d80c182b4, tags cc98d3d4657835e897338ed1e350725b
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$14ff29ea-0e1d-5192-9153-9d56285fff48$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S04$sv$, $sv$925 Sterling Silver Cuban Link Bracelet, Flat Curb Chain, 3.3 to 10.2mm, Men's$sv$, $sv$Solid 925 sterling silver Cuban Curb chain bracelet for men, made to order in your width and length: 3.3 to 10.2 mm wide, 7 to 9 inches.

Cuban curb links are flat ovals twisted so the chain lies completely flat, each link cut with bright flat facets that catch the light from every angle.

Widths and approximate weight (weight grows with length):
- 3.3 mm: about 3.4 g at 8 inches
- 4.8 mm: about 6.6 g at 8 inches
- 6.5 mm: about 11.2 g at 8 inches
- 7.6 mm: about 14.5 g at 8 inches
- 8.5 mm: about 18.5 g at 8 inches
- 10.2 mm: about 23.5 g at 8 inches

- Lengths: 7, 8, 9 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$cuban link bracelet$sv$,$sv$mens silver bracelet$sv$,$sv$curb chain bracelet$sv$,$sv$silver cuban links$sv$,$sv$925 silver bracelet$sv$,$sv$flat curb bracelet$sv$,$sv$mens cuban bracelet$sv$,$sv$faceted curb links$sv$,$sv$thick silver links$sv$,$sv$sterling bracelet$sv$,$sv$mens wrist chain$sv$,$sv$solid silver links$sv$,$sv$mens stack bracelet$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$]::text[], 'draft', 'USD',
  9900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/01.jpg$sv$, 5, 'bracelet',
  $sv${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S04", "name": "Cuban curb bracelet", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "9ceb60e59b8c56e18e38128d38ee2b97"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S04$sv$ or p.id = $sv$14ff29ea-0e1d-5192-9153-9d56285fff48$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S04-3_3MM-7IN$sv$, $sv$Cuban curb bracelet: 3.3 mm, 7 in$sv$, $sv${"Width": "3.3 mm", "Length": "7 in"}$sv$, 9900, 3.00),
  ($sv$BAS-SLV-S04-3_3MM-8IN$sv$, $sv$Cuban curb bracelet: 3.3 mm, 8 in$sv$, $sv${"Width": "3.3 mm", "Length": "8 in"}$sv$, 10900, 3.40),
  ($sv$BAS-SLV-S04-3_3MM-9IN$sv$, $sv$Cuban curb bracelet: 3.3 mm, 9 in$sv$, $sv${"Width": "3.3 mm", "Length": "9 in"}$sv$, 10900, 3.80),
  ($sv$BAS-SLV-S04-4_8MM-7IN$sv$, $sv$Cuban curb bracelet: 4.8 mm, 7 in$sv$, $sv${"Width": "4.8 mm", "Length": "7 in"}$sv$, 12900, 5.80),
  ($sv$BAS-SLV-S04-4_8MM-8IN$sv$, $sv$Cuban curb bracelet: 4.8 mm, 8 in$sv$, $sv${"Width": "4.8 mm", "Length": "8 in"}$sv$, 12900, 6.60),
  ($sv$BAS-SLV-S04-4_8MM-9IN$sv$, $sv$Cuban curb bracelet: 4.8 mm, 9 in$sv$, $sv${"Width": "4.8 mm", "Length": "9 in"}$sv$, 13900, 7.40),
  ($sv$BAS-SLV-S04-6_5MM-7IN$sv$, $sv$Cuban curb bracelet: 6.5 mm, 7 in$sv$, $sv${"Width": "6.5 mm", "Length": "7 in"}$sv$, 15900, 9.80),
  ($sv$BAS-SLV-S04-6_5MM-8IN$sv$, $sv$Cuban curb bracelet: 6.5 mm, 8 in$sv$, $sv${"Width": "6.5 mm", "Length": "8 in"}$sv$, 16900, 11.20),
  ($sv$BAS-SLV-S04-6_5MM-9IN$sv$, $sv$Cuban curb bracelet: 6.5 mm, 9 in$sv$, $sv${"Width": "6.5 mm", "Length": "9 in"}$sv$, 18900, 12.60),
  ($sv$BAS-SLV-S04-7_6MM-7IN$sv$, $sv$Cuban curb bracelet: 7.6 mm, 7 in$sv$, $sv${"Width": "7.6 mm", "Length": "7 in"}$sv$, 18900, 12.70),
  ($sv$BAS-SLV-S04-7_6MM-8IN$sv$, $sv$Cuban curb bracelet: 7.6 mm, 8 in$sv$, $sv${"Width": "7.6 mm", "Length": "8 in"}$sv$, 19900, 14.50),
  ($sv$BAS-SLV-S04-7_6MM-9IN$sv$, $sv$Cuban curb bracelet: 7.6 mm, 9 in$sv$, $sv${"Width": "7.6 mm", "Length": "9 in"}$sv$, 21900, 16.30),
  ($sv$BAS-SLV-S04-8_5MM-7IN$sv$, $sv$Cuban curb bracelet: 8.5 mm, 7 in$sv$, $sv${"Width": "8.5 mm", "Length": "7 in"}$sv$, 21900, 16.20),
  ($sv$BAS-SLV-S04-8_5MM-8IN$sv$, $sv$Cuban curb bracelet: 8.5 mm, 8 in$sv$, $sv${"Width": "8.5 mm", "Length": "8 in"}$sv$, 23900, 18.50),
  ($sv$BAS-SLV-S04-8_5MM-9IN$sv$, $sv$Cuban curb bracelet: 8.5 mm, 9 in$sv$, $sv${"Width": "8.5 mm", "Length": "9 in"}$sv$, 25900, 20.80),
  ($sv$BAS-SLV-S04-10_2MM-7IN$sv$, $sv$Cuban curb bracelet: 10.2 mm, 7 in$sv$, $sv${"Width": "10.2 mm", "Length": "7 in"}$sv$, 24900, 20.50),
  ($sv$BAS-SLV-S04-10_2MM-8IN$sv$, $sv$Cuban curb bracelet: 10.2 mm, 8 in$sv$, $sv${"Width": "10.2 mm", "Length": "8 in"}$sv$, 27900, 23.50),
  ($sv$BAS-SLV-S04-10_2MM-9IN$sv$, $sv$Cuban curb bracelet: 10.2 mm, 9 in$sv$, $sv${"Width": "10.2 mm", "Length": "9 in"}$sv$, 29900, 26.40)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S04$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/01.jpg$sv$, $sv$Sterling silver Cuban curb chain bracelet on olive canvas$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/02.jpg$sv$, $sv$Sterling silver Cuban curb chain bracelet worn on a man's wrist$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/03.jpg$sv$, $sv$Close-up of the Cuban curb links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Cuban curb chain bracelet$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S04/05.jpg$sv$, $sv$Sterling silver Cuban curb chain bracelet laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S04$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- S05 925 Sterling Silver Figaro Chain Necklace, 3+1 Faceted Links, 3.4 to 10.3mm, Men's: 30 variants (Width x Length), seal a87992c955eda25eee220b4a237f1ec1, md5(description) e24c4667535a11051de160dcf7c8e2ea, tags a8103b1d15a521a702a432d213a63588
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$32bfc677-9654-5732-b5b8-9010398da536$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S05$sv$, $sv$925 Sterling Silver Figaro Chain Necklace, 3+1 Faceted Links, 3.4 to 10.3mm, Men's$sv$, $sv$Solid 925 sterling silver Figaro chain necklace for men, made to order in your width and length: 3.4 to 10.3 mm wide, 18 to 26 inches.

Figaro repeats three short links and one long link, all flat and faceted, the classic pattern that reads clean at any width.

Widths and approximate weight (weight grows with length):
- 3.4 mm: about 7.9 g at 20 inches
- 4.6 mm: about 13.9 g at 20 inches
- 6.6 mm: about 26.1 g at 20 inches
- 7.2 mm: about 34.1 g at 20 inches
- 8.3 mm: about 39.0 g at 20 inches
- 10.3 mm: about 61.4 g at 20 inches

- Lengths: 18, 20, 22, 24, 26 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$figaro chain$sv$,$sv$mens silver chain$sv$,$sv$silver figaro chain$sv$,$sv$figaro necklace men$sv$,$sv$925 silver necklace$sv$,$sv$3 plus 1 chain$sv$,$sv$flat figaro links$sv$,$sv$faceted figaro$sv$,$sv$solid silver chain$sv$,$sv$sterling figaro$sv$,$sv$mens neck chain$sv$,$sv$classic figaro links$sv$,$sv$thick silver chain$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$]::text[], 'draft', 'USD',
  13900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/01.jpg$sv$, 5, 'necklace',
  $sv${"productType": "necklace", "listingProtocol": "chain_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S05", "name": "Figaro necklace", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "a87992c955eda25eee220b4a237f1ec1"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S05$sv$ or p.id = $sv$32bfc677-9654-5732-b5b8-9010398da536$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S05-3_4MM-18IN$sv$, $sv$Figaro necklace: 3.4 mm, 18 in$sv$, $sv${"Width": "3.4 mm", "Length": "18 in"}$sv$, 13900, 7.10),
  ($sv$BAS-SLV-S05-3_4MM-20IN$sv$, $sv$Figaro necklace: 3.4 mm, 20 in$sv$, $sv${"Width": "3.4 mm", "Length": "20 in"}$sv$, 14900, 7.90),
  ($sv$BAS-SLV-S05-3_4MM-22IN$sv$, $sv$Figaro necklace: 3.4 mm, 22 in$sv$, $sv${"Width": "3.4 mm", "Length": "22 in"}$sv$, 14900, 8.70),
  ($sv$BAS-SLV-S05-3_4MM-24IN$sv$, $sv$Figaro necklace: 3.4 mm, 24 in$sv$, $sv${"Width": "3.4 mm", "Length": "24 in"}$sv$, 15900, 9.50),
  ($sv$BAS-SLV-S05-3_4MM-26IN$sv$, $sv$Figaro necklace: 3.4 mm, 26 in$sv$, $sv${"Width": "3.4 mm", "Length": "26 in"}$sv$, 16900, 10.30),
  ($sv$BAS-SLV-S05-4_6MM-18IN$sv$, $sv$Figaro necklace: 4.6 mm, 18 in$sv$, $sv${"Width": "4.6 mm", "Length": "18 in"}$sv$, 17900, 12.50),
  ($sv$BAS-SLV-S05-4_6MM-20IN$sv$, $sv$Figaro necklace: 4.6 mm, 20 in$sv$, $sv${"Width": "4.6 mm", "Length": "20 in"}$sv$, 19900, 13.90),
  ($sv$BAS-SLV-S05-4_6MM-22IN$sv$, $sv$Figaro necklace: 4.6 mm, 22 in$sv$, $sv${"Width": "4.6 mm", "Length": "22 in"}$sv$, 20900, 15.30),
  ($sv$BAS-SLV-S05-4_6MM-24IN$sv$, $sv$Figaro necklace: 4.6 mm, 24 in$sv$, $sv${"Width": "4.6 mm", "Length": "24 in"}$sv$, 21900, 16.70),
  ($sv$BAS-SLV-S05-4_6MM-26IN$sv$, $sv$Figaro necklace: 4.6 mm, 26 in$sv$, $sv${"Width": "4.6 mm", "Length": "26 in"}$sv$, 22900, 18.10),
  ($sv$BAS-SLV-S05-6_6MM-18IN$sv$, $sv$Figaro necklace: 6.6 mm, 18 in$sv$, $sv${"Width": "6.6 mm", "Length": "18 in"}$sv$, 27900, 23.50),
  ($sv$BAS-SLV-S05-6_6MM-20IN$sv$, $sv$Figaro necklace: 6.6 mm, 20 in$sv$, $sv${"Width": "6.6 mm", "Length": "20 in"}$sv$, 29900, 26.10),
  ($sv$BAS-SLV-S05-6_6MM-22IN$sv$, $sv$Figaro necklace: 6.6 mm, 22 in$sv$, $sv${"Width": "6.6 mm", "Length": "22 in"}$sv$, 31900, 28.70),
  ($sv$BAS-SLV-S05-6_6MM-24IN$sv$, $sv$Figaro necklace: 6.6 mm, 24 in$sv$, $sv${"Width": "6.6 mm", "Length": "24 in"}$sv$, 34900, 31.30),
  ($sv$BAS-SLV-S05-6_6MM-26IN$sv$, $sv$Figaro necklace: 6.6 mm, 26 in$sv$, $sv${"Width": "6.6 mm", "Length": "26 in"}$sv$, 36900, 33.90),
  ($sv$BAS-SLV-S05-7_2MM-18IN$sv$, $sv$Figaro necklace: 7.2 mm, 18 in$sv$, $sv${"Width": "7.2 mm", "Length": "18 in"}$sv$, 33900, 30.70),
  ($sv$BAS-SLV-S05-7_2MM-20IN$sv$, $sv$Figaro necklace: 7.2 mm, 20 in$sv$, $sv${"Width": "7.2 mm", "Length": "20 in"}$sv$, 36900, 34.10),
  ($sv$BAS-SLV-S05-7_2MM-22IN$sv$, $sv$Figaro necklace: 7.2 mm, 22 in$sv$, $sv${"Width": "7.2 mm", "Length": "22 in"}$sv$, 39900, 37.50),
  ($sv$BAS-SLV-S05-7_2MM-24IN$sv$, $sv$Figaro necklace: 7.2 mm, 24 in$sv$, $sv${"Width": "7.2 mm", "Length": "24 in"}$sv$, 42900, 40.90),
  ($sv$BAS-SLV-S05-7_2MM-26IN$sv$, $sv$Figaro necklace: 7.2 mm, 26 in$sv$, $sv${"Width": "7.2 mm", "Length": "26 in"}$sv$, 45900, 44.30),
  ($sv$BAS-SLV-S05-8_3MM-18IN$sv$, $sv$Figaro necklace: 8.3 mm, 18 in$sv$, $sv${"Width": "8.3 mm", "Length": "18 in"}$sv$, 37900, 35.10),
  ($sv$BAS-SLV-S05-8_3MM-20IN$sv$, $sv$Figaro necklace: 8.3 mm, 20 in$sv$, $sv${"Width": "8.3 mm", "Length": "20 in"}$sv$, 40900, 39.00),
  ($sv$BAS-SLV-S05-8_3MM-22IN$sv$, $sv$Figaro necklace: 8.3 mm, 22 in$sv$, $sv${"Width": "8.3 mm", "Length": "22 in"}$sv$, 44900, 42.90),
  ($sv$BAS-SLV-S05-8_3MM-24IN$sv$, $sv$Figaro necklace: 8.3 mm, 24 in$sv$, $sv${"Width": "8.3 mm", "Length": "24 in"}$sv$, 47900, 46.80),
  ($sv$BAS-SLV-S05-8_3MM-26IN$sv$, $sv$Figaro necklace: 8.3 mm, 26 in$sv$, $sv${"Width": "8.3 mm", "Length": "26 in"}$sv$, 50900, 50.70),
  ($sv$BAS-SLV-S05-10_3MM-18IN$sv$, $sv$Figaro necklace: 10.3 mm, 18 in$sv$, $sv${"Width": "10.3 mm", "Length": "18 in"}$sv$, 54900, 55.30),
  ($sv$BAS-SLV-S05-10_3MM-20IN$sv$, $sv$Figaro necklace: 10.3 mm, 20 in$sv$, $sv${"Width": "10.3 mm", "Length": "20 in"}$sv$, 59900, 61.40),
  ($sv$BAS-SLV-S05-10_3MM-22IN$sv$, $sv$Figaro necklace: 10.3 mm, 22 in$sv$, $sv${"Width": "10.3 mm", "Length": "22 in"}$sv$, 65900, 67.60),
  ($sv$BAS-SLV-S05-10_3MM-24IN$sv$, $sv$Figaro necklace: 10.3 mm, 24 in$sv$, $sv${"Width": "10.3 mm", "Length": "24 in"}$sv$, 70900, 73.70),
  ($sv$BAS-SLV-S05-10_3MM-26IN$sv$, $sv$Figaro necklace: 10.3 mm, 26 in$sv$, $sv${"Width": "10.3 mm", "Length": "26 in"}$sv$, 75900, 79.90)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S05$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/01.jpg$sv$, $sv$Sterling silver Figaro chain necklace on pale grey concrete$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/02.jpg$sv$, $sv$Sterling silver Figaro chain necklace worn at the collarbone, clasp at the back$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/03.jpg$sv$, $sv$Close-up of the Figaro links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Figaro chain necklace$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S05/05.jpg$sv$, $sv$Sterling silver Figaro chain necklace laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S05$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

-- S06 925 Sterling Silver Figaro Bracelet, Flat 3+1 Link Chain, 3.4 to 10.3mm, Men's: 18 variants (Width x Length), seal aa5acbd4236c7ee52f3dae1f8fa47708, md5(description) 1af372fdd915bbacb96df33948a352f0, tags 1def413047d4b21433645dcd54aeae28
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $sv$8d0e67be-8399-55b2-84e9-2139be0e97a5$sv$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $sv$BAS-SLV-S06$sv$, $sv$925 Sterling Silver Figaro Bracelet, Flat 3+1 Link Chain, 3.4 to 10.3mm, Men's$sv$, $sv$Solid 925 sterling silver Figaro chain bracelet for men, made to order in your width and length: 3.4 to 10.3 mm wide, 7 to 9 inches.

Figaro repeats three short links and one long link, all flat and faceted, the classic pattern that reads clean at any width.

Widths and approximate weight (weight grows with length):
- 3.4 mm: about 3.2 g at 8 inches
- 4.6 mm: about 5.6 g at 8 inches
- 6.6 mm: about 10.4 g at 8 inches
- 7.2 mm: about 13.6 g at 8 inches
- 8.3 mm: about 15.6 g at 8 inches
- 10.3 mm: about 24.6 g at 8 inches

- Lengths: 7, 8, 9 inches, measured end to end with the clasp.
- Lobster clasp, stamped 925 on the tag plate.
- Solid links, not hollow, no stones.
- Made to order at our bench in New Jersey and shipped within 2 business days, free US shipping, gift box included.
- The styled images are design visualizations of the finished chain; the unedited photo shows the real chain.$sv$,
  ARRAY[$sv$figaro bracelet$sv$,$sv$mens silver bracelet$sv$,$sv$silver figaro links$sv$,$sv$figaro bracelet men$sv$,$sv$925 silver bracelet$sv$,$sv$3 plus 1 bracelet$sv$,$sv$flat figaro chain$sv$,$sv$faceted figaro$sv$,$sv$sterling bracelet$sv$,$sv$mens wrist chain$sv$,$sv$solid silver links$sv$,$sv$thick silver links$sv$,$sv$mens stack bracelet$sv$]::text[], ARRAY[$sv$925 sterling silver$sv$]::text[], 'draft', 'USD',
  9900, 20, true, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/01.jpg$sv$, 5, 'bracelet',
  $sv${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S06", "name": "Figaro bracelet", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "aa5acbd4236c7ee52f3dae1f8fa47708"}$sv$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $sv$BAS-SLV-S06$sv$ or p.id = $sv$8d0e67be-8399-55b2-84e9-2139be0e97a5$sv$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'supplier_catalog', true, 'USD'
from (values
  ($sv$BAS-SLV-S06-3_4MM-7IN$sv$, $sv$Figaro bracelet: 3.4 mm, 7 in$sv$, $sv${"Width": "3.4 mm", "Length": "7 in"}$sv$, 9900, 2.80),
  ($sv$BAS-SLV-S06-3_4MM-8IN$sv$, $sv$Figaro bracelet: 3.4 mm, 8 in$sv$, $sv${"Width": "3.4 mm", "Length": "8 in"}$sv$, 9900, 3.20),
  ($sv$BAS-SLV-S06-3_4MM-9IN$sv$, $sv$Figaro bracelet: 3.4 mm, 9 in$sv$, $sv${"Width": "3.4 mm", "Length": "9 in"}$sv$, 10900, 3.50),
  ($sv$BAS-SLV-S06-4_6MM-7IN$sv$, $sv$Figaro bracelet: 4.6 mm, 7 in$sv$, $sv${"Width": "4.6 mm", "Length": "7 in"}$sv$, 11900, 4.90),
  ($sv$BAS-SLV-S06-4_6MM-8IN$sv$, $sv$Figaro bracelet: 4.6 mm, 8 in$sv$, $sv${"Width": "4.6 mm", "Length": "8 in"}$sv$, 12900, 5.60),
  ($sv$BAS-SLV-S06-4_6MM-9IN$sv$, $sv$Figaro bracelet: 4.6 mm, 9 in$sv$, $sv${"Width": "4.6 mm", "Length": "9 in"}$sv$, 12900, 6.20),
  ($sv$BAS-SLV-S06-6_6MM-7IN$sv$, $sv$Figaro bracelet: 6.6 mm, 7 in$sv$, $sv${"Width": "6.6 mm", "Length": "7 in"}$sv$, 15900, 9.10),
  ($sv$BAS-SLV-S06-6_6MM-8IN$sv$, $sv$Figaro bracelet: 6.6 mm, 8 in$sv$, $sv${"Width": "6.6 mm", "Length": "8 in"}$sv$, 16900, 10.40),
  ($sv$BAS-SLV-S06-6_6MM-9IN$sv$, $sv$Figaro bracelet: 6.6 mm, 9 in$sv$, $sv${"Width": "6.6 mm", "Length": "9 in"}$sv$, 17900, 11.80),
  ($sv$BAS-SLV-S06-7_2MM-7IN$sv$, $sv$Figaro bracelet: 7.2 mm, 7 in$sv$, $sv${"Width": "7.2 mm", "Length": "7 in"}$sv$, 17900, 11.90),
  ($sv$BAS-SLV-S06-7_2MM-8IN$sv$, $sv$Figaro bracelet: 7.2 mm, 8 in$sv$, $sv${"Width": "7.2 mm", "Length": "8 in"}$sv$, 18900, 13.60),
  ($sv$BAS-SLV-S06-7_2MM-9IN$sv$, $sv$Figaro bracelet: 7.2 mm, 9 in$sv$, $sv${"Width": "7.2 mm", "Length": "9 in"}$sv$, 20900, 15.40),
  ($sv$BAS-SLV-S06-8_3MM-7IN$sv$, $sv$Figaro bracelet: 8.3 mm, 7 in$sv$, $sv${"Width": "8.3 mm", "Length": "7 in"}$sv$, 18900, 13.70),
  ($sv$BAS-SLV-S06-8_3MM-8IN$sv$, $sv$Figaro bracelet: 8.3 mm, 8 in$sv$, $sv${"Width": "8.3 mm", "Length": "8 in"}$sv$, 20900, 15.60),
  ($sv$BAS-SLV-S06-8_3MM-9IN$sv$, $sv$Figaro bracelet: 8.3 mm, 9 in$sv$, $sv${"Width": "8.3 mm", "Length": "9 in"}$sv$, 22900, 17.60),
  ($sv$BAS-SLV-S06-10_3MM-7IN$sv$, $sv$Figaro bracelet: 10.3 mm, 7 in$sv$, $sv${"Width": "10.3 mm", "Length": "7 in"}$sv$, 25900, 21.50),
  ($sv$BAS-SLV-S06-10_3MM-8IN$sv$, $sv$Figaro bracelet: 10.3 mm, 8 in$sv$, $sv${"Width": "10.3 mm", "Length": "8 in"}$sv$, 28900, 24.60),
  ($sv$BAS-SLV-S06-10_3MM-9IN$sv$, $sv$Figaro bracelet: 10.3 mm, 9 in$sv$, $sv${"Width": "10.3 mm", "Length": "9 in"}$sv$, 30900, 27.60)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S06$sv$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/01.jpg$sv$, $sv$Sterling silver Figaro chain bracelet on espresso leather$sv$),
  (1, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/02.jpg$sv$, $sv$Sterling silver Figaro chain bracelet worn on a man's wrist$sv$),
  (2, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/03.jpg$sv$, $sv$Close-up of the Figaro links in sterling silver$sv$),
  (3, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/04.jpg$sv$, $sv$Lobster clasp and tag plate stamped 925 on the Figaro chain bracelet$sv$),
  (4, $sv$https://amuletta.artifactstudio.info/artifact/silver/S06/05.jpg$sv$, $sv$Sterling silver Figaro chain bracelet laid flat, seen from above$sv$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $sv$BAS-SLV-S06$sv$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;

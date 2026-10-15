-- 0168_ophir_stellar.sql
-- Ophir Gold USA: The Stellar Line, 5 listings, 495 variants. Panel drafts only;
-- this migration does not write to Etsy and attaches NO images (none are made yet).
-- Source package: docs/ophir/stellar/ (catalog.py). Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Prices are ESTIMATES: 2 x maker cost with an uncalibrated stone price and geometric grams.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku).
begin;

-- E01 Stellar Curve Earrings — 9 variants (Karat x Metal Color)
--   variants: 9 / 2d5f0645629d9453739bb6d3133aeaf6
--   md5(description) = 932bc3aaf4c9417ad373f20b5e44b48b
--   md5(sku||'|'||array_to_string(tags, ',')) = 85ab5f6a891938ef67d82f55d223df47
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select $mo$1262ccdc-cb50-5110-b801-4c885f0a612d$mo$::uuid, 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', $mo$OPH-STL-E01$mo$, $mo$Stellar Curve Earrings, Solid Gold Long Drop with a Pave Diamond Knot, Modern Sculptural Ear Jacket, Gift for Her$mo$, $mo$One long gold curve and a slimmer pave curve crossing it, tied in a small diamond knot.

The thick curve is drawn out to a fine point and sweeps down along the jaw, so the pair reads as one clean line from the front and a sculpture from the side. The second curve is set with a single row of small white diamonds and crosses the first where the two tie.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold is unplated, a soft silvery grey.
Size: each earring is about 55 mm long and 9 mm across the knot.
Fitting: post and butterfly back, both in the same solid gold.

Each piece is made to order and ships free within the United States. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$gold drop earrings$mo$,$mo$diamond earrings$mo$,$mo$pave earrings$mo$,$mo$solid gold earrings$mo$,$mo$modern earrings$mo$,$mo$statement earrings$mo$,$mo$sculptural jewelry$mo$,$mo$long drop earrings$mo$,$mo$14k gold earrings$mo$,$mo$gift for her$mo$,$mo$minimalist earrings$mo$,$mo$curved earrings$mo$,$mo$star jewelry$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  168000, 20, true, 0, $mo$earrings$mo$,
  $mo${"productType": "earrings", "listingProtocol": "dangle_earrings", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "E01", "name": "Stellar Curve Earrings", "collection": "The Stellar Line", "enamel": [], "goldOnly": false, "dims": "55 mm drop, 9 mm across the knot", "variationAxes": ["Karat", "Metal Color"], "sourcePackage": "2026-10-15-ophir-stellar", "sourcePackagePath": "docs/ophir/stellar", "generatorScript": "docs/ophir/stellar/gen_migration.py", "grams14Ref": 5.44, "refPriceCents": 201000, "makerCost14KRefUsd": 1004.05, "stonesRef": 92, "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; necklace chain 130 USD at 18 in scaled by length and karat. Estimated parts: stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line); grams from geometry x 1.15 safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this design, has not weighed a sample, and the maker band list carries NO diamond line.", "Stones are costed at stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line). One maker number replaces this and reprices the whole line; the generator prints the sensitivity.", "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's (top + shank) / 2 averaging rule rather than a measured section.", "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no photographs."], "etsyDraftCreationAuthorized": false, "livePublicationAuthorized": false, "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."}, "variantSeal": "2d5f0645629d9453739bb6d3133aeaf6"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b'
  and (p.sku = $mo$OPH-STL-E01$mo$ or p.id = $mo$1262ccdc-cb50-5110-b801-4c885f0a612d$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$OPH-STL-E01-10KY$mo$, $mo$Stellar Curve Earrings: 10K, Yellow Gold$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold"}$mo$, 168000, 4.85),
  ($mo$OPH-STL-E01-10KW$mo$, $mo$Stellar Curve Earrings: 10K, White Gold$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold"}$mo$, 168000, 4.85),
  ($mo$OPH-STL-E01-10KR$mo$, $mo$Stellar Curve Earrings: 10K, Rose Gold$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold"}$mo$, 168000, 4.85),
  ($mo$OPH-STL-E01-14KY$mo$, $mo$Stellar Curve Earrings: 14K, Yellow Gold$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold"}$mo$, 201000, 5.44),
  ($mo$OPH-STL-E01-14KW$mo$, $mo$Stellar Curve Earrings: 14K, White Gold$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold"}$mo$, 201000, 5.44),
  ($mo$OPH-STL-E01-14KR$mo$, $mo$Stellar Curve Earrings: 14K, Rose Gold$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold"}$mo$, 201000, 5.44),
  ($mo$OPH-STL-E01-18KY$mo$, $mo$Stellar Curve Earrings: 18K, Yellow Gold$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold"}$mo$, 244000, 6.19),
  ($mo$OPH-STL-E01-18KW$mo$, $mo$Stellar Curve Earrings: 18K, White Gold$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold"}$mo$, 244000, 6.19),
  ($mo$OPH-STL-E01-18KR$mo$, $mo$Stellar Curve Earrings: 18K, Rose Gold$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold"}$mo$, 244000, 6.19)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b' and p.sku = $mo$OPH-STL-E01$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- N01 Stellar Drop Necklace — 27 variants (Karat x Metal Color x Chain Length)
--   variants: 27 / a988f8ad2ae5be2ee0be2503d2e9e25f
--   md5(description) = df82334ef70db5fb53178322af81e526
--   md5(sku||'|'||array_to_string(tags, ',')) = b33f7079f5a9de751f1ecdcd1e90491c
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select $mo$23b47166-0ac7-574d-a175-45533122498f$mo$::uuid, 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', $mo$OPH-STL-N01$mo$, $mo$Stellar Drop Necklace, Solid Gold Lariat with a Four Point Star and Teardrop, Layering Chain, Gift for Her$mo$, $mo$A gold line that crosses the collarbone, turns back on itself and drops a star below.

The chain gives way to one smooth gold bar that sweeps across and loops, with a four point star sitting where the loop closes. From the bottom of the loop a short length of the same chain carries a second, larger star and ends in a small polished teardrop.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold is unplated, a soft silvery grey.
Size: the centre bar spans about 60 mm and the drop falls about 45 mm below it.
Chain: 1.0 mm solid gold cable chain in the same gold, spring ring clasp.

Each piece is made to order and ships free within the United States. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$gold lariat necklace$mo$,$mo$star necklace$mo$,$mo$solid gold necklace$mo$,$mo$layering necklace$mo$,$mo$celestial jewelry$mo$,$mo$drop necklace$mo$,$mo$y necklace$mo$,$mo$14k gold necklace$mo$,$mo$dainty necklace$mo$,$mo$gift for her$mo$,$mo$modern necklace$mo$,$mo$teardrop necklace$mo$,$mo$star pendant$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  78000, 20, true, 0, $mo$necklace$mo$,
  $mo${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "N01", "name": "Stellar Drop Necklace", "collection": "The Stellar Line", "enamel": [], "goldOnly": false, "dims": "60 mm centre bar, 45 mm drop", "variationAxes": ["Karat", "Metal Color", "Chain Length"], "sourcePackage": "2026-10-15-ophir-stellar", "sourcePackagePath": "docs/ophir/stellar", "generatorScript": "docs/ophir/stellar/gen_migration.py", "grams14Ref": 4.47, "refPriceCents": 116000, "makerCost14KRefUsd": 577.35, "stonesRef": 0, "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; necklace chain 130 USD at 18 in scaled by length and karat. Estimated parts: stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line); grams from geometry x 1.15 safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this design, has not weighed a sample, and the maker band list carries NO diamond line.", "Stones are costed at stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line). One maker number replaces this and reprices the whole line; the generator prints the sensitivity.", "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's (top + shank) / 2 averaging rule rather than a measured section.", "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no photographs."], "etsyDraftCreationAuthorized": false, "livePublicationAuthorized": false, "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."}, "variantSeal": "a988f8ad2ae5be2ee0be2503d2e9e25f"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b'
  and (p.sku = $mo$OPH-STL-N01$mo$ or p.id = $mo$23b47166-0ac7-574d-a175-45533122498f$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$OPH-STL-N01-10KY-16IN$mo$, $mo$Stellar Drop Necklace: 10K, Yellow Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 78000, 3.99),
  ($mo$OPH-STL-N01-10KY-18IN$mo$, $mo$Stellar Drop Necklace: 10K, Yellow Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 80000, 3.99),
  ($mo$OPH-STL-N01-10KY-20IN$mo$, $mo$Stellar Drop Necklace: 10K, Yellow Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 82000, 3.99),
  ($mo$OPH-STL-N01-10KW-16IN$mo$, $mo$Stellar Drop Necklace: 10K, White Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 78000, 3.99),
  ($mo$OPH-STL-N01-10KW-18IN$mo$, $mo$Stellar Drop Necklace: 10K, White Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 80000, 3.99),
  ($mo$OPH-STL-N01-10KW-20IN$mo$, $mo$Stellar Drop Necklace: 10K, White Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 82000, 3.99),
  ($mo$OPH-STL-N01-10KR-16IN$mo$, $mo$Stellar Drop Necklace: 10K, Rose Gold, 16 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 78000, 3.99),
  ($mo$OPH-STL-N01-10KR-18IN$mo$, $mo$Stellar Drop Necklace: 10K, Rose Gold, 18 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 80000, 3.99),
  ($mo$OPH-STL-N01-10KR-20IN$mo$, $mo$Stellar Drop Necklace: 10K, Rose Gold, 20 inches$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 82000, 3.99),
  ($mo$OPH-STL-N01-14KY-16IN$mo$, $mo$Stellar Drop Necklace: 14K, Yellow Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 113000, 4.47),
  ($mo$OPH-STL-N01-14KY-18IN$mo$, $mo$Stellar Drop Necklace: 14K, Yellow Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 116000, 4.47),
  ($mo$OPH-STL-N01-14KY-20IN$mo$, $mo$Stellar Drop Necklace: 14K, Yellow Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 119000, 4.47),
  ($mo$OPH-STL-N01-14KW-16IN$mo$, $mo$Stellar Drop Necklace: 14K, White Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 113000, 4.47),
  ($mo$OPH-STL-N01-14KW-18IN$mo$, $mo$Stellar Drop Necklace: 14K, White Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 116000, 4.47),
  ($mo$OPH-STL-N01-14KW-20IN$mo$, $mo$Stellar Drop Necklace: 14K, White Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 119000, 4.47),
  ($mo$OPH-STL-N01-14KR-16IN$mo$, $mo$Stellar Drop Necklace: 14K, Rose Gold, 16 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 113000, 4.47),
  ($mo$OPH-STL-N01-14KR-18IN$mo$, $mo$Stellar Drop Necklace: 14K, Rose Gold, 18 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 116000, 4.47),
  ($mo$OPH-STL-N01-14KR-20IN$mo$, $mo$Stellar Drop Necklace: 14K, Rose Gold, 20 inches$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 119000, 4.47),
  ($mo$OPH-STL-N01-18KY-16IN$mo$, $mo$Stellar Drop Necklace: 18K, Yellow Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$mo$, 157000, 5.09),
  ($mo$OPH-STL-N01-18KY-18IN$mo$, $mo$Stellar Drop Necklace: 18K, Yellow Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$mo$, 161000, 5.09),
  ($mo$OPH-STL-N01-18KY-20IN$mo$, $mo$Stellar Drop Necklace: 18K, Yellow Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$mo$, 165000, 5.09),
  ($mo$OPH-STL-N01-18KW-16IN$mo$, $mo$Stellar Drop Necklace: 18K, White Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$mo$, 157000, 5.09),
  ($mo$OPH-STL-N01-18KW-18IN$mo$, $mo$Stellar Drop Necklace: 18K, White Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$mo$, 161000, 5.09),
  ($mo$OPH-STL-N01-18KW-20IN$mo$, $mo$Stellar Drop Necklace: 18K, White Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$mo$, 165000, 5.09),
  ($mo$OPH-STL-N01-18KR-16IN$mo$, $mo$Stellar Drop Necklace: 18K, Rose Gold, 16 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$mo$, 157000, 5.09),
  ($mo$OPH-STL-N01-18KR-18IN$mo$, $mo$Stellar Drop Necklace: 18K, Rose Gold, 18 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$mo$, 161000, 5.09),
  ($mo$OPH-STL-N01-18KR-20IN$mo$, $mo$Stellar Drop Necklace: 18K, Rose Gold, 20 inches$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$mo$, 165000, 5.09)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b' and p.sku = $mo$OPH-STL-N01$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- R01 Stellar Band Ring — 153 variants (Karat x Metal Color x Ring Size)
--   variants: 153 / 86c114286d31b57b1d24164d85ba4a4a
--   md5(description) = 650348b70b5f02a51871d8b4ff566e0b
--   md5(sku||'|'||array_to_string(tags, ',')) = 8d69c8123f2d0045f7be2b5a7cc7bb61
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select $mo$dc574ac5-87f0-583b-98a0-313665756746$mo$::uuid, 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', $mo$OPH-STL-R01$mo$, $mo$Stellar Band Ring, Solid Gold Wave with a Diamond Star and Pave Shank, Stacking Ring, Gift for Her$mo$, $mo$A slim gold band that rises in one wave, with a diamond set star at the crest.

The band does not sit flat: it lifts over the top of the finger and a four point star is set at the high point, holding one small white diamond. A single row of diamonds runs down one side of the shank from the star, so the sparkle follows the curve instead of ringing the whole band. It stacks flush against a plain band.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold is unplated, a soft silvery grey.
Size: the band is 1.8 mm wide and the star about 6 mm across.
Stones: one round brilliant white diamond in the star, with a bead set row down one shank.

Each piece is made to order and ships free within the United States. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$gold stacking ring$mo$,$mo$diamond star ring$mo$,$mo$pave ring$mo$,$mo$solid gold ring$mo$,$mo$celestial ring$mo$,$mo$dainty ring$mo$,$mo$14k gold ring$mo$,$mo$star ring$mo$,$mo$stackable ring$mo$,$mo$gift for her$mo$,$mo$minimalist ring$mo$,$mo$wave ring$mo$,$mo$thin gold ring$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  48000, 20, true, 0, $mo$ring$mo$,
  $mo${"productType": "ring", "listingProtocol": "stacking_ring", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "R01", "name": "Stellar Band Ring", "collection": "The Stellar Line", "enamel": [], "goldOnly": false, "dims": "1.8 mm band, 6 mm star", "variationAxes": ["Karat", "Metal Color", "Ring Size"], "sourcePackage": "2026-10-15-ophir-stellar", "sourcePackagePath": "docs/ophir/stellar", "generatorScript": "docs/ophir/stellar/gen_migration.py", "grams14Ref": 2.49, "refPriceCents": 70000, "makerCost14KRefUsd": 349.12, "stonesRef": 20, "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; necklace chain 130 USD at 18 in scaled by length and karat. Estimated parts: stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line); grams from geometry x 1.15 safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this design, has not weighed a sample, and the maker band list carries NO diamond line.", "Stones are costed at stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line). One maker number replaces this and reprices the whole line; the generator prints the sensitivity.", "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's (top + shank) / 2 averaging rule rather than a measured section.", "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no photographs."], "etsyDraftCreationAuthorized": false, "livePublicationAuthorized": false, "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."}, "variantSeal": "86c114286d31b57b1d24164d85ba4a4a"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b'
  and (p.sku = $mo$OPH-STL-R01$mo$ or p.id = $mo$dc574ac5-87f0-583b-98a0-313665756746$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$OPH-STL-R01-10KY-US4$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 48000, 1.97),
  ($mo$OPH-STL-R01-10KY-US4_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 50000, 2.02),
  ($mo$OPH-STL-R01-10KY-US5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 50000, 2.06),
  ($mo$OPH-STL-R01-10KY-US5_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 51000, 2.10),
  ($mo$OPH-STL-R01-10KY-US6$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 53000, 2.14),
  ($mo$OPH-STL-R01-10KY-US6_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 53000, 2.18),
  ($mo$OPH-STL-R01-10KY-US7$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 55000, 2.22),
  ($mo$OPH-STL-R01-10KY-US7_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 56000, 2.26),
  ($mo$OPH-STL-R01-10KY-US8$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 57000, 2.30),
  ($mo$OPH-STL-R01-10KY-US8_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 58000, 2.35),
  ($mo$OPH-STL-R01-10KY-US9$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 59000, 2.39),
  ($mo$OPH-STL-R01-10KY-US9_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 60000, 2.43),
  ($mo$OPH-STL-R01-10KY-US10$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 61000, 2.47),
  ($mo$OPH-STL-R01-10KY-US10_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 62000, 2.51),
  ($mo$OPH-STL-R01-10KY-US11$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 63000, 2.55),
  ($mo$OPH-STL-R01-10KY-US11_5$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 65000, 2.59),
  ($mo$OPH-STL-R01-10KY-US12$mo$, $mo$Stellar Band Ring: 10K, Yellow Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 65000, 2.64),
  ($mo$OPH-STL-R01-10KW-US4$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 48000, 1.97),
  ($mo$OPH-STL-R01-10KW-US4_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 50000, 2.02),
  ($mo$OPH-STL-R01-10KW-US5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 50000, 2.06),
  ($mo$OPH-STL-R01-10KW-US5_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 51000, 2.10),
  ($mo$OPH-STL-R01-10KW-US6$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 53000, 2.14),
  ($mo$OPH-STL-R01-10KW-US6_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 53000, 2.18),
  ($mo$OPH-STL-R01-10KW-US7$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 55000, 2.22),
  ($mo$OPH-STL-R01-10KW-US7_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 56000, 2.26),
  ($mo$OPH-STL-R01-10KW-US8$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 57000, 2.30),
  ($mo$OPH-STL-R01-10KW-US8_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 58000, 2.35),
  ($mo$OPH-STL-R01-10KW-US9$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 59000, 2.39),
  ($mo$OPH-STL-R01-10KW-US9_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 60000, 2.43),
  ($mo$OPH-STL-R01-10KW-US10$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 61000, 2.47),
  ($mo$OPH-STL-R01-10KW-US10_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 62000, 2.51),
  ($mo$OPH-STL-R01-10KW-US11$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 63000, 2.55),
  ($mo$OPH-STL-R01-10KW-US11_5$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 65000, 2.59),
  ($mo$OPH-STL-R01-10KW-US12$mo$, $mo$Stellar Band Ring: 10K, White Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 65000, 2.64),
  ($mo$OPH-STL-R01-10KR-US4$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 48000, 1.97),
  ($mo$OPH-STL-R01-10KR-US4_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 50000, 2.02),
  ($mo$OPH-STL-R01-10KR-US5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 50000, 2.06),
  ($mo$OPH-STL-R01-10KR-US5_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 51000, 2.10),
  ($mo$OPH-STL-R01-10KR-US6$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 53000, 2.14),
  ($mo$OPH-STL-R01-10KR-US6_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 53000, 2.18),
  ($mo$OPH-STL-R01-10KR-US7$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 55000, 2.22),
  ($mo$OPH-STL-R01-10KR-US7_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 56000, 2.26),
  ($mo$OPH-STL-R01-10KR-US8$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 57000, 2.30),
  ($mo$OPH-STL-R01-10KR-US8_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 58000, 2.35),
  ($mo$OPH-STL-R01-10KR-US9$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 59000, 2.39),
  ($mo$OPH-STL-R01-10KR-US9_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 60000, 2.43),
  ($mo$OPH-STL-R01-10KR-US10$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 61000, 2.47),
  ($mo$OPH-STL-R01-10KR-US10_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 62000, 2.51),
  ($mo$OPH-STL-R01-10KR-US11$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 63000, 2.55),
  ($mo$OPH-STL-R01-10KR-US11_5$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 65000, 2.59),
  ($mo$OPH-STL-R01-10KR-US12$mo$, $mo$Stellar Band Ring: 10K, Rose Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 65000, 2.64),
  ($mo$OPH-STL-R01-14KY-US4$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 62000, 2.21),
  ($mo$OPH-STL-R01-14KY-US4_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 64000, 2.26),
  ($mo$OPH-STL-R01-14KY-US5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 65000, 2.31),
  ($mo$OPH-STL-R01-14KY-US5_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 66000, 2.35),
  ($mo$OPH-STL-R01-14KY-US6$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 67000, 2.40),
  ($mo$OPH-STL-R01-14KY-US6_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 68000, 2.44),
  ($mo$OPH-STL-R01-14KY-US7$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 70000, 2.49),
  ($mo$OPH-STL-R01-14KY-US7_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 71000, 2.54),
  ($mo$OPH-STL-R01-14KY-US8$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 73000, 2.58),
  ($mo$OPH-STL-R01-14KY-US8_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 74000, 2.63),
  ($mo$OPH-STL-R01-14KY-US9$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 76000, 2.68),
  ($mo$OPH-STL-R01-14KY-US9_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 77000, 2.72),
  ($mo$OPH-STL-R01-14KY-US10$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 78000, 2.77),
  ($mo$OPH-STL-R01-14KY-US10_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 80000, 2.82),
  ($mo$OPH-STL-R01-14KY-US11$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 81000, 2.86),
  ($mo$OPH-STL-R01-14KY-US11_5$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 83000, 2.91),
  ($mo$OPH-STL-R01-14KY-US12$mo$, $mo$Stellar Band Ring: 14K, Yellow Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 84000, 2.95),
  ($mo$OPH-STL-R01-14KW-US4$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 62000, 2.21),
  ($mo$OPH-STL-R01-14KW-US4_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 64000, 2.26),
  ($mo$OPH-STL-R01-14KW-US5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 65000, 2.31),
  ($mo$OPH-STL-R01-14KW-US5_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 66000, 2.35),
  ($mo$OPH-STL-R01-14KW-US6$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 67000, 2.40),
  ($mo$OPH-STL-R01-14KW-US6_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 68000, 2.44),
  ($mo$OPH-STL-R01-14KW-US7$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 70000, 2.49),
  ($mo$OPH-STL-R01-14KW-US7_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 71000, 2.54),
  ($mo$OPH-STL-R01-14KW-US8$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 73000, 2.58),
  ($mo$OPH-STL-R01-14KW-US8_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 74000, 2.63),
  ($mo$OPH-STL-R01-14KW-US9$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 76000, 2.68),
  ($mo$OPH-STL-R01-14KW-US9_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 77000, 2.72),
  ($mo$OPH-STL-R01-14KW-US10$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 78000, 2.77),
  ($mo$OPH-STL-R01-14KW-US10_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 80000, 2.82),
  ($mo$OPH-STL-R01-14KW-US11$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 81000, 2.86),
  ($mo$OPH-STL-R01-14KW-US11_5$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 83000, 2.91),
  ($mo$OPH-STL-R01-14KW-US12$mo$, $mo$Stellar Band Ring: 14K, White Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 84000, 2.95),
  ($mo$OPH-STL-R01-14KR-US4$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 62000, 2.21),
  ($mo$OPH-STL-R01-14KR-US4_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 64000, 2.26),
  ($mo$OPH-STL-R01-14KR-US5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 65000, 2.31),
  ($mo$OPH-STL-R01-14KR-US5_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 66000, 2.35),
  ($mo$OPH-STL-R01-14KR-US6$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 67000, 2.40),
  ($mo$OPH-STL-R01-14KR-US6_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 68000, 2.44),
  ($mo$OPH-STL-R01-14KR-US7$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 70000, 2.49),
  ($mo$OPH-STL-R01-14KR-US7_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 71000, 2.54),
  ($mo$OPH-STL-R01-14KR-US8$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 73000, 2.58),
  ($mo$OPH-STL-R01-14KR-US8_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 74000, 2.63),
  ($mo$OPH-STL-R01-14KR-US9$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 76000, 2.68),
  ($mo$OPH-STL-R01-14KR-US9_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 77000, 2.72),
  ($mo$OPH-STL-R01-14KR-US10$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 78000, 2.77),
  ($mo$OPH-STL-R01-14KR-US10_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 80000, 2.82),
  ($mo$OPH-STL-R01-14KR-US11$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 81000, 2.86),
  ($mo$OPH-STL-R01-14KR-US11_5$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 83000, 2.91),
  ($mo$OPH-STL-R01-14KR-US12$mo$, $mo$Stellar Band Ring: 14K, Rose Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 84000, 2.95),
  ($mo$OPH-STL-R01-18KY-US4$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 79000, 2.52),
  ($mo$OPH-STL-R01-18KY-US4_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 81000, 2.57),
  ($mo$OPH-STL-R01-18KY-US5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 83000, 2.62),
  ($mo$OPH-STL-R01-18KY-US5_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 84000, 2.67),
  ($mo$OPH-STL-R01-18KY-US6$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 86000, 2.73),
  ($mo$OPH-STL-R01-18KY-US6_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 87000, 2.78),
  ($mo$OPH-STL-R01-18KY-US7$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 90000, 2.83),
  ($mo$OPH-STL-R01-18KY-US7_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 91000, 2.89),
  ($mo$OPH-STL-R01-18KY-US8$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 93000, 2.94),
  ($mo$OPH-STL-R01-18KY-US8_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 95000, 2.99),
  ($mo$OPH-STL-R01-18KY-US9$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 97000, 3.04),
  ($mo$OPH-STL-R01-18KY-US9_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 98000, 3.10),
  ($mo$OPH-STL-R01-18KY-US10$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 99000, 3.15),
  ($mo$OPH-STL-R01-18KY-US10_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 102000, 3.20),
  ($mo$OPH-STL-R01-18KY-US11$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 103000, 3.25),
  ($mo$OPH-STL-R01-18KY-US11_5$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 105000, 3.31),
  ($mo$OPH-STL-R01-18KY-US12$mo$, $mo$Stellar Band Ring: 18K, Yellow Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 107000, 3.36),
  ($mo$OPH-STL-R01-18KW-US4$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 79000, 2.52),
  ($mo$OPH-STL-R01-18KW-US4_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 81000, 2.57),
  ($mo$OPH-STL-R01-18KW-US5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 83000, 2.62),
  ($mo$OPH-STL-R01-18KW-US5_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 84000, 2.67),
  ($mo$OPH-STL-R01-18KW-US6$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 86000, 2.73),
  ($mo$OPH-STL-R01-18KW-US6_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 87000, 2.78),
  ($mo$OPH-STL-R01-18KW-US7$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 90000, 2.83),
  ($mo$OPH-STL-R01-18KW-US7_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 91000, 2.89),
  ($mo$OPH-STL-R01-18KW-US8$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 93000, 2.94),
  ($mo$OPH-STL-R01-18KW-US8_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 95000, 2.99),
  ($mo$OPH-STL-R01-18KW-US9$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 97000, 3.04),
  ($mo$OPH-STL-R01-18KW-US9_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 98000, 3.10),
  ($mo$OPH-STL-R01-18KW-US10$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 99000, 3.15),
  ($mo$OPH-STL-R01-18KW-US10_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 102000, 3.20),
  ($mo$OPH-STL-R01-18KW-US11$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 103000, 3.25),
  ($mo$OPH-STL-R01-18KW-US11_5$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 105000, 3.31),
  ($mo$OPH-STL-R01-18KW-US12$mo$, $mo$Stellar Band Ring: 18K, White Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 107000, 3.36),
  ($mo$OPH-STL-R01-18KR-US4$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 79000, 2.52),
  ($mo$OPH-STL-R01-18KR-US4_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 81000, 2.57),
  ($mo$OPH-STL-R01-18KR-US5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 83000, 2.62),
  ($mo$OPH-STL-R01-18KR-US5_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 84000, 2.67),
  ($mo$OPH-STL-R01-18KR-US6$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 86000, 2.73),
  ($mo$OPH-STL-R01-18KR-US6_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 87000, 2.78),
  ($mo$OPH-STL-R01-18KR-US7$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 90000, 2.83),
  ($mo$OPH-STL-R01-18KR-US7_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 91000, 2.89),
  ($mo$OPH-STL-R01-18KR-US8$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 93000, 2.94),
  ($mo$OPH-STL-R01-18KR-US8_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 95000, 2.99),
  ($mo$OPH-STL-R01-18KR-US9$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 97000, 3.04),
  ($mo$OPH-STL-R01-18KR-US9_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 98000, 3.10),
  ($mo$OPH-STL-R01-18KR-US10$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 99000, 3.15),
  ($mo$OPH-STL-R01-18KR-US10_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 102000, 3.20),
  ($mo$OPH-STL-R01-18KR-US11$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 103000, 3.25),
  ($mo$OPH-STL-R01-18KR-US11_5$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 105000, 3.31),
  ($mo$OPH-STL-R01-18KR-US12$mo$, $mo$Stellar Band Ring: 18K, Rose Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 107000, 3.36)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b' and p.sku = $mo$OPH-STL-R01$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- R02 Stellar Knot Ring — 153 variants (Karat x Metal Color x Ring Size)
--   variants: 153 / 3a352abd0dc461057d69190d17deb644
--   md5(description) = 944a1fa8a43c94106e0fbf6d5901aa33
--   md5(sku||'|'||array_to_string(tags, ',')) = c050f515764e0e1d0b9f136e2ab43c4f
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select $mo$6bb5bfcb-6da7-5517-b017-725e46691876$mo$::uuid, 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', $mo$OPH-STL-R02$mo$, $mo$Stellar Knot Ring, Solid Gold Crossover with Two Pave Diamond Bands, Open Knot Statement Ring, Gift for Her$mo$, $mo$Two slim diamond bands crossing over the finger in one open knot.

Each band sweeps round and passes over and under the other, so the knot stays open and you can see through it. Both are bead set along their whole length with small white diamonds, and the two join into a single shank under the finger, which keeps it comfortable to wear every day.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold is unplated, a soft silvery grey.
Size: the knot stands about 11 mm across the top, each band 1.6 mm wide.
Stones: round brilliant white diamonds bead set along both bands.

Each piece is made to order and ships free within the United States. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$diamond knot ring$mo$,$mo$crossover ring$mo$,$mo$pave diamond ring$mo$,$mo$solid gold ring$mo$,$mo$statement ring$mo$,$mo$two band ring$mo$,$mo$14k gold ring$mo$,$mo$infinity ring$mo$,$mo$gift for her$mo$,$mo$modern ring$mo$,$mo$x ring$mo$,$mo$gold diamond ring$mo$,$mo$celestial ring$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  118000, 20, true, 0, $mo$ring$mo$,
  $mo${"productType": "ring", "listingProtocol": "sculptural_ring", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "R02", "name": "Stellar Knot Ring", "collection": "The Stellar Line", "enamel": [], "goldOnly": false, "dims": "11 mm knot, two 1.6 mm bands", "variationAxes": ["Karat", "Metal Color", "Ring Size"], "sourcePackage": "2026-10-15-ophir-stellar", "sourcePackagePath": "docs/ophir/stellar", "generatorScript": "docs/ophir/stellar/gen_migration.py", "grams14Ref": 4.21, "refPriceCents": 163000, "makerCost14KRefUsd": 811.17, "stonesRef": 78, "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; necklace chain 130 USD at 18 in scaled by length and karat. Estimated parts: stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line); grams from geometry x 1.15 safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this design, has not weighed a sample, and the maker band list carries NO diamond line.", "Stones are costed at stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line). One maker number replaces this and reprices the whole line; the generator prints the sensitivity.", "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's (top + shank) / 2 averaging rule rather than a measured section.", "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no photographs."], "etsyDraftCreationAuthorized": false, "livePublicationAuthorized": false, "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."}, "variantSeal": "3a352abd0dc461057d69190d17deb644"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b'
  and (p.sku = $mo$OPH-STL-R02$mo$ or p.id = $mo$6bb5bfcb-6da7-5517-b017-725e46691876$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$OPH-STL-R02-10KY-US4$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 118000, 3.27),
  ($mo$OPH-STL-R02-10KY-US4_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 121000, 3.35),
  ($mo$OPH-STL-R02-10KY-US5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 124000, 3.43),
  ($mo$OPH-STL-R02-10KY-US5_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 127000, 3.51),
  ($mo$OPH-STL-R02-10KY-US6$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 130000, 3.60),
  ($mo$OPH-STL-R02-10KY-US6_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 133000, 3.68),
  ($mo$OPH-STL-R02-10KY-US7$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 137000, 3.76),
  ($mo$OPH-STL-R02-10KY-US7_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 139000, 3.84),
  ($mo$OPH-STL-R02-10KY-US8$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 142000, 3.92),
  ($mo$OPH-STL-R02-10KY-US8_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 145000, 4.00),
  ($mo$OPH-STL-R02-10KY-US9$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 149000, 4.08),
  ($mo$OPH-STL-R02-10KY-US9_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 152000, 4.16),
  ($mo$OPH-STL-R02-10KY-US10$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 155000, 4.24),
  ($mo$OPH-STL-R02-10KY-US10_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 157000, 4.32),
  ($mo$OPH-STL-R02-10KY-US11$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 161000, 4.40),
  ($mo$OPH-STL-R02-10KY-US11_5$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 164000, 4.48),
  ($mo$OPH-STL-R02-10KY-US12$mo$, $mo$Stellar Knot Ring: 10K, Yellow Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 167000, 4.57),
  ($mo$OPH-STL-R02-10KW-US4$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 118000, 3.27),
  ($mo$OPH-STL-R02-10KW-US4_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 121000, 3.35),
  ($mo$OPH-STL-R02-10KW-US5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 124000, 3.43),
  ($mo$OPH-STL-R02-10KW-US5_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 127000, 3.51),
  ($mo$OPH-STL-R02-10KW-US6$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 130000, 3.60),
  ($mo$OPH-STL-R02-10KW-US6_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 133000, 3.68),
  ($mo$OPH-STL-R02-10KW-US7$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 137000, 3.76),
  ($mo$OPH-STL-R02-10KW-US7_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 139000, 3.84),
  ($mo$OPH-STL-R02-10KW-US8$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 142000, 3.92),
  ($mo$OPH-STL-R02-10KW-US8_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 145000, 4.00),
  ($mo$OPH-STL-R02-10KW-US9$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 149000, 4.08),
  ($mo$OPH-STL-R02-10KW-US9_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 152000, 4.16),
  ($mo$OPH-STL-R02-10KW-US10$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 155000, 4.24),
  ($mo$OPH-STL-R02-10KW-US10_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 157000, 4.32),
  ($mo$OPH-STL-R02-10KW-US11$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 161000, 4.40),
  ($mo$OPH-STL-R02-10KW-US11_5$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 164000, 4.48),
  ($mo$OPH-STL-R02-10KW-US12$mo$, $mo$Stellar Knot Ring: 10K, White Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 167000, 4.57),
  ($mo$OPH-STL-R02-10KR-US4$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 118000, 3.27),
  ($mo$OPH-STL-R02-10KR-US4_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 121000, 3.35),
  ($mo$OPH-STL-R02-10KR-US5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 124000, 3.43),
  ($mo$OPH-STL-R02-10KR-US5_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 127000, 3.51),
  ($mo$OPH-STL-R02-10KR-US6$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 130000, 3.60),
  ($mo$OPH-STL-R02-10KR-US6_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 133000, 3.68),
  ($mo$OPH-STL-R02-10KR-US7$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 137000, 3.76),
  ($mo$OPH-STL-R02-10KR-US7_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 139000, 3.84),
  ($mo$OPH-STL-R02-10KR-US8$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 142000, 3.92),
  ($mo$OPH-STL-R02-10KR-US8_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 145000, 4.00),
  ($mo$OPH-STL-R02-10KR-US9$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 149000, 4.08),
  ($mo$OPH-STL-R02-10KR-US9_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 152000, 4.16),
  ($mo$OPH-STL-R02-10KR-US10$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 155000, 4.24),
  ($mo$OPH-STL-R02-10KR-US10_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 157000, 4.32),
  ($mo$OPH-STL-R02-10KR-US11$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 161000, 4.40),
  ($mo$OPH-STL-R02-10KR-US11_5$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 164000, 4.48),
  ($mo$OPH-STL-R02-10KR-US12$mo$, $mo$Stellar Knot Ring: 10K, Rose Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 167000, 4.57),
  ($mo$OPH-STL-R02-14KY-US4$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 141000, 3.67),
  ($mo$OPH-STL-R02-14KY-US4_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 145000, 3.76),
  ($mo$OPH-STL-R02-14KY-US5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 147000, 3.85),
  ($mo$OPH-STL-R02-14KY-US5_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 151000, 3.94),
  ($mo$OPH-STL-R02-14KY-US6$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 155000, 4.03),
  ($mo$OPH-STL-R02-14KY-US6_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 159000, 4.12),
  ($mo$OPH-STL-R02-14KY-US7$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 163000, 4.21),
  ($mo$OPH-STL-R02-14KY-US7_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 166000, 4.30),
  ($mo$OPH-STL-R02-14KY-US8$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 169000, 4.39),
  ($mo$OPH-STL-R02-14KY-US8_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 173000, 4.48),
  ($mo$OPH-STL-R02-14KY-US9$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 177000, 4.57),
  ($mo$OPH-STL-R02-14KY-US9_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 181000, 4.66),
  ($mo$OPH-STL-R02-14KY-US10$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 185000, 4.76),
  ($mo$OPH-STL-R02-14KY-US10_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 187000, 4.85),
  ($mo$OPH-STL-R02-14KY-US11$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 191000, 4.94),
  ($mo$OPH-STL-R02-14KY-US11_5$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 195000, 5.03),
  ($mo$OPH-STL-R02-14KY-US12$mo$, $mo$Stellar Knot Ring: 14K, Yellow Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 199000, 5.12),
  ($mo$OPH-STL-R02-14KW-US4$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 141000, 3.67),
  ($mo$OPH-STL-R02-14KW-US4_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 145000, 3.76),
  ($mo$OPH-STL-R02-14KW-US5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 147000, 3.85),
  ($mo$OPH-STL-R02-14KW-US5_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 151000, 3.94),
  ($mo$OPH-STL-R02-14KW-US6$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 155000, 4.03),
  ($mo$OPH-STL-R02-14KW-US6_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 159000, 4.12),
  ($mo$OPH-STL-R02-14KW-US7$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 163000, 4.21),
  ($mo$OPH-STL-R02-14KW-US7_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 166000, 4.30),
  ($mo$OPH-STL-R02-14KW-US8$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 169000, 4.39),
  ($mo$OPH-STL-R02-14KW-US8_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 173000, 4.48),
  ($mo$OPH-STL-R02-14KW-US9$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 177000, 4.57),
  ($mo$OPH-STL-R02-14KW-US9_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 181000, 4.66),
  ($mo$OPH-STL-R02-14KW-US10$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 185000, 4.76),
  ($mo$OPH-STL-R02-14KW-US10_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 187000, 4.85),
  ($mo$OPH-STL-R02-14KW-US11$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 191000, 4.94),
  ($mo$OPH-STL-R02-14KW-US11_5$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 195000, 5.03),
  ($mo$OPH-STL-R02-14KW-US12$mo$, $mo$Stellar Knot Ring: 14K, White Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 199000, 5.12),
  ($mo$OPH-STL-R02-14KR-US4$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 141000, 3.67),
  ($mo$OPH-STL-R02-14KR-US4_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 145000, 3.76),
  ($mo$OPH-STL-R02-14KR-US5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 147000, 3.85),
  ($mo$OPH-STL-R02-14KR-US5_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 151000, 3.94),
  ($mo$OPH-STL-R02-14KR-US6$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 155000, 4.03),
  ($mo$OPH-STL-R02-14KR-US6_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 159000, 4.12),
  ($mo$OPH-STL-R02-14KR-US7$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 163000, 4.21),
  ($mo$OPH-STL-R02-14KR-US7_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 166000, 4.30),
  ($mo$OPH-STL-R02-14KR-US8$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 169000, 4.39),
  ($mo$OPH-STL-R02-14KR-US8_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 173000, 4.48),
  ($mo$OPH-STL-R02-14KR-US9$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 177000, 4.57),
  ($mo$OPH-STL-R02-14KR-US9_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 181000, 4.66),
  ($mo$OPH-STL-R02-14KR-US10$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 185000, 4.76),
  ($mo$OPH-STL-R02-14KR-US10_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 187000, 4.85),
  ($mo$OPH-STL-R02-14KR-US11$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 191000, 4.94),
  ($mo$OPH-STL-R02-14KR-US11_5$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 195000, 5.03),
  ($mo$OPH-STL-R02-14KR-US12$mo$, $mo$Stellar Knot Ring: 14K, Rose Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 199000, 5.12),
  ($mo$OPH-STL-R02-18KY-US4$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 169000, 4.17),
  ($mo$OPH-STL-R02-18KY-US4_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 174000, 4.27),
  ($mo$OPH-STL-R02-18KY-US5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 177000, 4.38),
  ($mo$OPH-STL-R02-18KY-US5_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 182000, 4.48),
  ($mo$OPH-STL-R02-18KY-US6$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 186000, 4.58),
  ($mo$OPH-STL-R02-18KY-US6_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 191000, 4.69),
  ($mo$OPH-STL-R02-18KY-US7$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 196000, 4.79),
  ($mo$OPH-STL-R02-18KY-US7_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 199000, 4.89),
  ($mo$OPH-STL-R02-18KY-US8$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 204000, 4.99),
  ($mo$OPH-STL-R02-18KY-US8_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 208000, 5.10),
  ($mo$OPH-STL-R02-18KY-US9$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 213000, 5.20),
  ($mo$OPH-STL-R02-18KY-US9_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 217000, 5.30),
  ($mo$OPH-STL-R02-18KY-US10$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 222000, 5.41),
  ($mo$OPH-STL-R02-18KY-US10_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 225000, 5.51),
  ($mo$OPH-STL-R02-18KY-US11$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 230000, 5.61),
  ($mo$OPH-STL-R02-18KY-US11_5$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 234000, 5.72),
  ($mo$OPH-STL-R02-18KY-US12$mo$, $mo$Stellar Knot Ring: 18K, Yellow Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 239000, 5.82),
  ($mo$OPH-STL-R02-18KW-US4$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 169000, 4.17),
  ($mo$OPH-STL-R02-18KW-US4_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 174000, 4.27),
  ($mo$OPH-STL-R02-18KW-US5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 177000, 4.38),
  ($mo$OPH-STL-R02-18KW-US5_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 182000, 4.48),
  ($mo$OPH-STL-R02-18KW-US6$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 186000, 4.58),
  ($mo$OPH-STL-R02-18KW-US6_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 191000, 4.69),
  ($mo$OPH-STL-R02-18KW-US7$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 196000, 4.79),
  ($mo$OPH-STL-R02-18KW-US7_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 199000, 4.89),
  ($mo$OPH-STL-R02-18KW-US8$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 204000, 4.99),
  ($mo$OPH-STL-R02-18KW-US8_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 208000, 5.10),
  ($mo$OPH-STL-R02-18KW-US9$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 213000, 5.20),
  ($mo$OPH-STL-R02-18KW-US9_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 217000, 5.30),
  ($mo$OPH-STL-R02-18KW-US10$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 222000, 5.41),
  ($mo$OPH-STL-R02-18KW-US10_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 225000, 5.51),
  ($mo$OPH-STL-R02-18KW-US11$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 230000, 5.61),
  ($mo$OPH-STL-R02-18KW-US11_5$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 234000, 5.72),
  ($mo$OPH-STL-R02-18KW-US12$mo$, $mo$Stellar Knot Ring: 18K, White Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 239000, 5.82),
  ($mo$OPH-STL-R02-18KR-US4$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 169000, 4.17),
  ($mo$OPH-STL-R02-18KR-US4_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 174000, 4.27),
  ($mo$OPH-STL-R02-18KR-US5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 177000, 4.38),
  ($mo$OPH-STL-R02-18KR-US5_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 182000, 4.48),
  ($mo$OPH-STL-R02-18KR-US6$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 186000, 4.58),
  ($mo$OPH-STL-R02-18KR-US6_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 191000, 4.69),
  ($mo$OPH-STL-R02-18KR-US7$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 196000, 4.79),
  ($mo$OPH-STL-R02-18KR-US7_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 199000, 4.89),
  ($mo$OPH-STL-R02-18KR-US8$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 204000, 4.99),
  ($mo$OPH-STL-R02-18KR-US8_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 208000, 5.10),
  ($mo$OPH-STL-R02-18KR-US9$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 213000, 5.20),
  ($mo$OPH-STL-R02-18KR-US9_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 217000, 5.30),
  ($mo$OPH-STL-R02-18KR-US10$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 222000, 5.41),
  ($mo$OPH-STL-R02-18KR-US10_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 225000, 5.51),
  ($mo$OPH-STL-R02-18KR-US11$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 230000, 5.61),
  ($mo$OPH-STL-R02-18KR-US11_5$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 234000, 5.72),
  ($mo$OPH-STL-R02-18KR-US12$mo$, $mo$Stellar Knot Ring: 18K, Rose Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 239000, 5.82)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b' and p.sku = $mo$OPH-STL-R02$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- R03 Stellar Signet Ring — 153 variants (Karat x Metal Color x Ring Size)
--   variants: 153 / a40ff9ae294b46cd43654b79836a04d8
--   md5(description) = 6b5458f7cdbe68d7e5f25c0276aa9516
--   md5(sku||'|'||array_to_string(tags, ',')) = 1c85704ba7b028ff74b076c48d488df8
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select $mo$43234d76-1e8e-5843-b574-17758a40e125$mo$::uuid, 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', $mo$OPH-STL-R03$mo$, $mo$Stellar Signet Ring, Bold Solid Gold Sculptural Face with a Diamond Star, Wide Statement Signet, Gift for Her$mo$, $mo$A bold signet whose face is a sweep of polished gold with one diamond star cut into it.

The face is not a flat plate. It curves and folds, rising out of a shank that narrows and widens again, so the whole ring reads as one poured form. A four point star is set into the sweep and holds a single white diamond. It is solid gold throughout, with no hollow back.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold is unplated, a soft silvery grey.
Size: the face is about 16 mm across and the shank narrows to 2.5 mm.
Stones: one round brilliant white diamond set in the star.

Each piece is made to order and ships free within the United States. Add a gift message at checkout and it ships with the piece.

Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$mo$,
  ARRAY[$mo$gold signet ring$mo$,$mo$bold statement ring$mo$,$mo$sculptural ring$mo$,$mo$solid gold ring$mo$,$mo$wide signet ring$mo$,$mo$diamond signet$mo$,$mo$14k gold ring$mo$,$mo$chunky gold ring$mo$,$mo$star ring$mo$,$mo$gift for her$mo$,$mo$molten gold ring$mo$,$mo$modern signet$mo$,$mo$celestial ring$mo$]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  179000, 20, true, 0, $mo$ring$mo$,
  $mo${"productType": "ring", "listingProtocol": "sculptural_ring", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "R03", "name": "Stellar Signet Ring", "collection": "The Stellar Line", "enamel": [], "goldOnly": false, "dims": "16 mm face, 2.5 mm shank", "variationAxes": ["Karat", "Metal Color", "Ring Size"], "sourcePackage": "2026-10-15-ophir-stellar", "sourcePackagePath": "docs/ophir/stellar", "generatorScript": "docs/ophir/stellar/gen_migration.py", "grams14Ref": 14.76, "refPriceCents": 297000, "makerCost14KRefUsd": 1480.68, "stonesRef": 1, "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"goldSpotUsdPerOzt": 4178.2, "goldQuoteSource": "gold-api.com", "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS", "methodology": "price = ceil(2 x maker cost / 10) x 10. 14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; necklace chain 130 USD at 18 in scaled by length and karat. Estimated parts: stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line); grams from geometry x 1.15 safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section."}, "approval": {"blockers": ["ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this design, has not weighed a sample, and the maker band list carries NO diamond line.", "Stones are costed at stone 5.00 USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line). One maker number replaces this and reprices the whole line; the generator prints the sensitivity.", "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's (top + shank) / 2 averaging rule rather than a measured section.", "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no photographs."], "etsyDraftCreationAuthorized": false, "livePublicationAuthorized": false, "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."}, "variantSeal": "a40ff9ae294b46cd43654b79836a04d8"}$mo$::jsonb
where not exists (select 1 from public.products p where p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b'
  and (p.sku = $mo$OPH-STL-R03$mo$ or p.id = $mo$43234d76-1e8e-5843-b574-17758a40e125$mo$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($mo$OPH-STL-R03-10KY-US4$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 179000, 11.46),
  ($mo$OPH-STL-R03-10KY-US4_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 183000, 11.75),
  ($mo$OPH-STL-R03-10KY-US5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 188000, 12.03),
  ($mo$OPH-STL-R03-10KY-US5_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 192000, 12.31),
  ($mo$OPH-STL-R03-10KY-US6$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 197000, 12.60),
  ($mo$OPH-STL-R03-10KY-US6_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 201000, 12.88),
  ($mo$OPH-STL-R03-10KY-US7$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 205000, 13.16),
  ($mo$OPH-STL-R03-10KY-US7_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 210000, 13.45),
  ($mo$OPH-STL-R03-10KY-US8$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 214000, 13.73),
  ($mo$OPH-STL-R03-10KY-US8_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 219000, 14.01),
  ($mo$OPH-STL-R03-10KY-US9$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 223000, 14.30),
  ($mo$OPH-STL-R03-10KY-US9_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 227000, 14.58),
  ($mo$OPH-STL-R03-10KY-US10$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 232000, 14.86),
  ($mo$OPH-STL-R03-10KY-US10_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 236000, 15.15),
  ($mo$OPH-STL-R03-10KY-US11$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 240000, 15.43),
  ($mo$OPH-STL-R03-10KY-US11_5$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 245000, 15.71),
  ($mo$OPH-STL-R03-10KY-US12$mo$, $mo$Stellar Signet Ring: 10K, Yellow Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 249000, 16.00),
  ($mo$OPH-STL-R03-10KW-US4$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 179000, 11.46),
  ($mo$OPH-STL-R03-10KW-US4_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 183000, 11.75),
  ($mo$OPH-STL-R03-10KW-US5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 188000, 12.03),
  ($mo$OPH-STL-R03-10KW-US5_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 192000, 12.31),
  ($mo$OPH-STL-R03-10KW-US6$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 197000, 12.60),
  ($mo$OPH-STL-R03-10KW-US6_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 201000, 12.88),
  ($mo$OPH-STL-R03-10KW-US7$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 205000, 13.16),
  ($mo$OPH-STL-R03-10KW-US7_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 210000, 13.45),
  ($mo$OPH-STL-R03-10KW-US8$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 214000, 13.73),
  ($mo$OPH-STL-R03-10KW-US8_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 219000, 14.01),
  ($mo$OPH-STL-R03-10KW-US9$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 223000, 14.30),
  ($mo$OPH-STL-R03-10KW-US9_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 227000, 14.58),
  ($mo$OPH-STL-R03-10KW-US10$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 232000, 14.86),
  ($mo$OPH-STL-R03-10KW-US10_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 236000, 15.15),
  ($mo$OPH-STL-R03-10KW-US11$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 240000, 15.43),
  ($mo$OPH-STL-R03-10KW-US11_5$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 245000, 15.71),
  ($mo$OPH-STL-R03-10KW-US12$mo$, $mo$Stellar Signet Ring: 10K, White Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 249000, 16.00),
  ($mo$OPH-STL-R03-10KR-US4$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 4$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 179000, 11.46),
  ($mo$OPH-STL-R03-10KR-US4_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 4.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 183000, 11.75),
  ($mo$OPH-STL-R03-10KR-US5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 188000, 12.03),
  ($mo$OPH-STL-R03-10KR-US5_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 5.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 192000, 12.31),
  ($mo$OPH-STL-R03-10KR-US6$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 6$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 197000, 12.60),
  ($mo$OPH-STL-R03-10KR-US6_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 6.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 201000, 12.88),
  ($mo$OPH-STL-R03-10KR-US7$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 7$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 205000, 13.16),
  ($mo$OPH-STL-R03-10KR-US7_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 7.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 210000, 13.45),
  ($mo$OPH-STL-R03-10KR-US8$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 8$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 214000, 13.73),
  ($mo$OPH-STL-R03-10KR-US8_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 8.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 219000, 14.01),
  ($mo$OPH-STL-R03-10KR-US9$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 9$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 223000, 14.30),
  ($mo$OPH-STL-R03-10KR-US9_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 9.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 227000, 14.58),
  ($mo$OPH-STL-R03-10KR-US10$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 10$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 232000, 14.86),
  ($mo$OPH-STL-R03-10KR-US10_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 10.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 236000, 15.15),
  ($mo$OPH-STL-R03-10KR-US11$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 11$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 240000, 15.43),
  ($mo$OPH-STL-R03-10KR-US11_5$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 11.5$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 245000, 15.71),
  ($mo$OPH-STL-R03-10KR-US12$mo$, $mo$Stellar Signet Ring: 10K, Rose Gold, US 12$mo$, $mo${"Karat": "10K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 249000, 16.00),
  ($mo$OPH-STL-R03-14KY-US4$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 259000, 12.85),
  ($mo$OPH-STL-R03-14KY-US4_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 265000, 13.17),
  ($mo$OPH-STL-R03-14KY-US5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 271000, 13.49),
  ($mo$OPH-STL-R03-14KY-US5_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 278000, 13.80),
  ($mo$OPH-STL-R03-14KY-US6$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 284000, 14.12),
  ($mo$OPH-STL-R03-14KY-US6_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 290000, 14.44),
  ($mo$OPH-STL-R03-14KY-US7$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 297000, 14.76),
  ($mo$OPH-STL-R03-14KY-US7_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 303000, 15.07),
  ($mo$OPH-STL-R03-14KY-US8$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 309000, 15.39),
  ($mo$OPH-STL-R03-14KY-US8_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 316000, 15.71),
  ($mo$OPH-STL-R03-14KY-US9$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 322000, 16.03),
  ($mo$OPH-STL-R03-14KY-US9_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 328000, 16.34),
  ($mo$OPH-STL-R03-14KY-US10$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 335000, 16.66),
  ($mo$OPH-STL-R03-14KY-US10_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 341000, 16.98),
  ($mo$OPH-STL-R03-14KY-US11$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 347000, 17.30),
  ($mo$OPH-STL-R03-14KY-US11_5$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 354000, 17.62),
  ($mo$OPH-STL-R03-14KY-US12$mo$, $mo$Stellar Signet Ring: 14K, Yellow Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 360000, 17.93),
  ($mo$OPH-STL-R03-14KW-US4$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 259000, 12.85),
  ($mo$OPH-STL-R03-14KW-US4_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 265000, 13.17),
  ($mo$OPH-STL-R03-14KW-US5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 271000, 13.49),
  ($mo$OPH-STL-R03-14KW-US5_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 278000, 13.80),
  ($mo$OPH-STL-R03-14KW-US6$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 284000, 14.12),
  ($mo$OPH-STL-R03-14KW-US6_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 290000, 14.44),
  ($mo$OPH-STL-R03-14KW-US7$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 297000, 14.76),
  ($mo$OPH-STL-R03-14KW-US7_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 303000, 15.07),
  ($mo$OPH-STL-R03-14KW-US8$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 309000, 15.39),
  ($mo$OPH-STL-R03-14KW-US8_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 316000, 15.71),
  ($mo$OPH-STL-R03-14KW-US9$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 322000, 16.03),
  ($mo$OPH-STL-R03-14KW-US9_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 328000, 16.34),
  ($mo$OPH-STL-R03-14KW-US10$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 335000, 16.66),
  ($mo$OPH-STL-R03-14KW-US10_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 341000, 16.98),
  ($mo$OPH-STL-R03-14KW-US11$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 347000, 17.30),
  ($mo$OPH-STL-R03-14KW-US11_5$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 354000, 17.62),
  ($mo$OPH-STL-R03-14KW-US12$mo$, $mo$Stellar Signet Ring: 14K, White Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 360000, 17.93),
  ($mo$OPH-STL-R03-14KR-US4$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 4$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 259000, 12.85),
  ($mo$OPH-STL-R03-14KR-US4_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 4.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 265000, 13.17),
  ($mo$OPH-STL-R03-14KR-US5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 271000, 13.49),
  ($mo$OPH-STL-R03-14KR-US5_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 5.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 278000, 13.80),
  ($mo$OPH-STL-R03-14KR-US6$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 6$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 284000, 14.12),
  ($mo$OPH-STL-R03-14KR-US6_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 6.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 290000, 14.44),
  ($mo$OPH-STL-R03-14KR-US7$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 7$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 297000, 14.76),
  ($mo$OPH-STL-R03-14KR-US7_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 7.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 303000, 15.07),
  ($mo$OPH-STL-R03-14KR-US8$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 8$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 309000, 15.39),
  ($mo$OPH-STL-R03-14KR-US8_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 8.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 316000, 15.71),
  ($mo$OPH-STL-R03-14KR-US9$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 9$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 322000, 16.03),
  ($mo$OPH-STL-R03-14KR-US9_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 9.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 328000, 16.34),
  ($mo$OPH-STL-R03-14KR-US10$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 10$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 335000, 16.66),
  ($mo$OPH-STL-R03-14KR-US10_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 10.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 341000, 16.98),
  ($mo$OPH-STL-R03-14KR-US11$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 11$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 347000, 17.30),
  ($mo$OPH-STL-R03-14KR-US11_5$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 11.5$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 354000, 17.62),
  ($mo$OPH-STL-R03-14KR-US12$mo$, $mo$Stellar Signet Ring: 14K, Rose Gold, US 12$mo$, $mo${"Karat": "14K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 360000, 17.93),
  ($mo$OPH-STL-R03-18KY-US4$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4"}$mo$, 359000, 14.61),
  ($mo$OPH-STL-R03-18KY-US4_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 4.5"}$mo$, 367000, 14.97),
  ($mo$OPH-STL-R03-18KY-US5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5"}$mo$, 376000, 15.33),
  ($mo$OPH-STL-R03-18KY-US5_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 5.5"}$mo$, 385000, 15.70),
  ($mo$OPH-STL-R03-18KY-US6$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6"}$mo$, 394000, 16.06),
  ($mo$OPH-STL-R03-18KY-US6_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 6.5"}$mo$, 403000, 16.42),
  ($mo$OPH-STL-R03-18KY-US7$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7"}$mo$, 411000, 16.78),
  ($mo$OPH-STL-R03-18KY-US7_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 7.5"}$mo$, 420000, 17.14),
  ($mo$OPH-STL-R03-18KY-US8$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8"}$mo$, 429000, 17.50),
  ($mo$OPH-STL-R03-18KY-US8_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 8.5"}$mo$, 438000, 17.86),
  ($mo$OPH-STL-R03-18KY-US9$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9"}$mo$, 447000, 18.22),
  ($mo$OPH-STL-R03-18KY-US9_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 9.5"}$mo$, 456000, 18.58),
  ($mo$OPH-STL-R03-18KY-US10$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10"}$mo$, 464000, 18.95),
  ($mo$OPH-STL-R03-18KY-US10_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 10.5"}$mo$, 473000, 19.31),
  ($mo$OPH-STL-R03-18KY-US11$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11"}$mo$, 482000, 19.67),
  ($mo$OPH-STL-R03-18KY-US11_5$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 11.5"}$mo$, 491000, 20.03),
  ($mo$OPH-STL-R03-18KY-US12$mo$, $mo$Stellar Signet Ring: 18K, Yellow Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Yellow Gold", "Ring Size": "US 12"}$mo$, 500000, 20.39),
  ($mo$OPH-STL-R03-18KW-US4$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4"}$mo$, 359000, 14.61),
  ($mo$OPH-STL-R03-18KW-US4_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 4.5"}$mo$, 367000, 14.97),
  ($mo$OPH-STL-R03-18KW-US5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5"}$mo$, 376000, 15.33),
  ($mo$OPH-STL-R03-18KW-US5_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 5.5"}$mo$, 385000, 15.70),
  ($mo$OPH-STL-R03-18KW-US6$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6"}$mo$, 394000, 16.06),
  ($mo$OPH-STL-R03-18KW-US6_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 6.5"}$mo$, 403000, 16.42),
  ($mo$OPH-STL-R03-18KW-US7$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7"}$mo$, 411000, 16.78),
  ($mo$OPH-STL-R03-18KW-US7_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 7.5"}$mo$, 420000, 17.14),
  ($mo$OPH-STL-R03-18KW-US8$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8"}$mo$, 429000, 17.50),
  ($mo$OPH-STL-R03-18KW-US8_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 8.5"}$mo$, 438000, 17.86),
  ($mo$OPH-STL-R03-18KW-US9$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9"}$mo$, 447000, 18.22),
  ($mo$OPH-STL-R03-18KW-US9_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 9.5"}$mo$, 456000, 18.58),
  ($mo$OPH-STL-R03-18KW-US10$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10"}$mo$, 464000, 18.95),
  ($mo$OPH-STL-R03-18KW-US10_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 10.5"}$mo$, 473000, 19.31),
  ($mo$OPH-STL-R03-18KW-US11$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11"}$mo$, 482000, 19.67),
  ($mo$OPH-STL-R03-18KW-US11_5$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 11.5"}$mo$, 491000, 20.03),
  ($mo$OPH-STL-R03-18KW-US12$mo$, $mo$Stellar Signet Ring: 18K, White Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "White Gold", "Ring Size": "US 12"}$mo$, 500000, 20.39),
  ($mo$OPH-STL-R03-18KR-US4$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 4$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4"}$mo$, 359000, 14.61),
  ($mo$OPH-STL-R03-18KR-US4_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 4.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 4.5"}$mo$, 367000, 14.97),
  ($mo$OPH-STL-R03-18KR-US5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5"}$mo$, 376000, 15.33),
  ($mo$OPH-STL-R03-18KR-US5_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 5.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 5.5"}$mo$, 385000, 15.70),
  ($mo$OPH-STL-R03-18KR-US6$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 6$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6"}$mo$, 394000, 16.06),
  ($mo$OPH-STL-R03-18KR-US6_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 6.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 6.5"}$mo$, 403000, 16.42),
  ($mo$OPH-STL-R03-18KR-US7$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 7$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7"}$mo$, 411000, 16.78),
  ($mo$OPH-STL-R03-18KR-US7_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 7.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 7.5"}$mo$, 420000, 17.14),
  ($mo$OPH-STL-R03-18KR-US8$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 8$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8"}$mo$, 429000, 17.50),
  ($mo$OPH-STL-R03-18KR-US8_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 8.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 8.5"}$mo$, 438000, 17.86),
  ($mo$OPH-STL-R03-18KR-US9$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 9$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9"}$mo$, 447000, 18.22),
  ($mo$OPH-STL-R03-18KR-US9_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 9.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 9.5"}$mo$, 456000, 18.58),
  ($mo$OPH-STL-R03-18KR-US10$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 10$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10"}$mo$, 464000, 18.95),
  ($mo$OPH-STL-R03-18KR-US10_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 10.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 10.5"}$mo$, 473000, 19.31),
  ($mo$OPH-STL-R03-18KR-US11$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 11$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11"}$mo$, 482000, 19.67),
  ($mo$OPH-STL-R03-18KR-US11_5$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 11.5$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 11.5"}$mo$, 491000, 20.03),
  ($mo$OPH-STL-R03-18KR-US12$mo$, $mo$Stellar Signet Ring: 18K, Rose Gold, US 12$mo$, $mo${"Karat": "18K", "Metal Color": "Rose Gold", "Ring Size": "US 12"}$mo$, 500000, 20.39)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = 'b7658ac4-7fb4-4fcb-836f-401efc3d9e5b' and p.sku = $mo$OPH-STL-R03$mo$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

commit;

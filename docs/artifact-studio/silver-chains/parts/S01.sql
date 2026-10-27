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
commit;

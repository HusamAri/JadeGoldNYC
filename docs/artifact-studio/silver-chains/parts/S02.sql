begin;
-- S02 925 Sterling Silver Franco Bracelet, Rhodium Plated Chain, 2.2 to 5.2mm, Men's: 18 variants (Width x Length), seal 3cd9059183417ac5bc400d2d6baef8e9, md5(description) f69b31924ecd54e9cc55ad30e4e1af5f, tags aa722a8b73db4745c2600bb4e141779d
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
  $sv${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S02", "name": "Franco bracelet", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "3cd9059183417ac5bc400d2d6baef8e9"}$sv$::jsonb
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
  ($sv$BAS-SLV-S02-3MM-9IN$sv$, $sv$Franco bracelet: 3 mm, 9 in$sv$, $sv${"Width": "3 mm", "Length": "9 in"}$sv$, 16900, 10.90),
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
  ($sv$BAS-SLV-S02-5_2MM-9IN$sv$, $sv$Franco bracelet: 5.2 mm, 9 in$sv$, $sv${"Width": "5.2 mm", "Length": "9 in"}$sv$, 35900, 32.70)
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
commit;

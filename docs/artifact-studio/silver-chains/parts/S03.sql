begin;
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
commit;

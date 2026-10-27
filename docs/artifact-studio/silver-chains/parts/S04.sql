begin;
-- S04 925 Sterling Silver Cuban Link Bracelet, Flat Curb Chain, 3.3 to 10.2mm, Men's: 18 variants (Width x Length), seal eb5ba3e9f2448fd3f33e12e6a0d5dffb, md5(description) 53dc8aa7a891f4dffad4176d80c182b4, tags cc98d3d4657835e897338ed1e350725b
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
  $sv${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "S04", "name": "Cuban curb bracelet", "collection": "Sterling Silver Chains", "variationAxes": ["Width", "Length"], "metal": "925 sterling silver", "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"}, "sourcePackage": "2026-10-27-artifact-silver-chains", "sourcePackagePath": "docs/artifact-studio/silver-chains", "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py", "weightSource": "supplier_catalog", "missingHero": false, "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9", "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price", "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.", "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."}, "variantSeal": "eb5ba3e9f2448fd3f33e12e6a0d5dffb"}$sv$::jsonb
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
  ($sv$BAS-SLV-S04-6_5MM-9IN$sv$, $sv$Cuban curb bracelet: 6.5 mm, 9 in$sv$, $sv${"Width": "6.5 mm", "Length": "9 in"}$sv$, 17900, 12.60),
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
commit;

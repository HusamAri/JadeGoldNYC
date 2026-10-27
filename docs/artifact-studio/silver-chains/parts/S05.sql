begin;
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
commit;

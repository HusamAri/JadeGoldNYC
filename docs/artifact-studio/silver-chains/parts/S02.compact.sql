begin;
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


insert into public.product_variants (org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency)
select p.org_id, 'BAS-SLV-S02-' || replace(trim_scale(w.width)::text, '.', '_') || 'MM-' || l.len || 'IN', p.id,
  'Franco bracelet: ' || trim_scale(w.width) || ' mm, ' || l.len || ' in',
  jsonb_build_object('Width', trim_scale(w.width) || ' mm', 'Length', l.len || ' in'),
  ((ceil(((50 + 6.0 * w.g18 * l.len / 18) / 0.70 + 1) / 10) * 10 - 1) * 100)::int, 20,
  round(w.g18 * l.len / 18, 1), 'supplier_catalog', true, 'USD'
from (values (2.2,12.9),(3.0,21.7),(3.4,28.3),(4.1,41.1),(4.8,56.0),(5.2,65.3)) w(width, g18) cross join (values (7),(8),(9)) l(len)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S02' and p.etsy_listing_id is null
on conflict (org_id, sku) do nothing;
insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/artifact/silver/S02/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg', 'url', g.alt, g.pos
from (values (0,$sv$Sterling silver Franco chain bracelet on indigo denim$sv$),(1,$sv$Sterling silver Franco chain bracelet worn on a man's wrist$sv$),(2,$sv$Close-up of the Franco links in sterling silver$sv$),(3,$sv$Lobster clasp and tag plate stamped 925 on the Franco chain bracelet$sv$),(4,$sv$Sterling silver Franco chain bracelet laid flat, seen from above$sv$)) g(pos, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S02' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/artifact/silver/S02/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg');
commit;
select md5(string_agg(line, E'\n' order by line collate "C")) seal, count(*) n from (
  select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
  from public.product_variants v join public.products p on p.id = v.product_id where p.sku = 'BAS-SLV-S02') s;

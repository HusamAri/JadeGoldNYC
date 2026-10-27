begin;
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


insert into public.product_variants (org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency)
select p.org_id, 'BAS-SLV-S01-' || replace(trim_scale(w.width)::text, '.', '_') || 'MM-' || l.len || 'IN', p.id,
  'Franco necklace: ' || trim_scale(w.width) || ' mm, ' || l.len || ' in',
  jsonb_build_object('Width', trim_scale(w.width) || ' mm', 'Length', l.len || ' in'),
  ((ceil(((50 + 6.0 * w.g18 * l.len / 18) / 0.70 + 1) / 10) * 10 - 1) * 100)::int, 20,
  round(w.g18 * l.len / 18, 1), 'supplier_catalog', true, 'USD'
from (values (2.2,12.9),(3.0,21.7),(3.4,28.3),(4.1,41.1),(4.8,56.0),(5.2,65.3)) w(width, g18) cross join (values (18),(20),(22),(24),(26)) l(len)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S01' and p.etsy_listing_id is null
on conflict (org_id, sku) do nothing;
insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/artifact/silver/S01/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg', 'url', g.alt, g.pos
from (values (0,$sv$Sterling silver Franco chain necklace on slate$sv$),(1,$sv$Sterling silver Franco chain necklace worn at the collarbone, clasp at the back$sv$),(2,$sv$Close-up of the Franco links in sterling silver$sv$),(3,$sv$Lobster clasp and tag plate stamped 925 on the Franco chain necklace$sv$),(4,$sv$Sterling silver Franco chain necklace laid flat, seen from above$sv$)) g(pos, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S01' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/artifact/silver/S01/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg');
commit;
select md5(string_agg(line, E'\n' order by line collate "C")) seal, count(*) n from (
  select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
  from public.product_variants v join public.products p on p.id = v.product_id where p.sku = 'BAS-SLV-S01') s;

begin;
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


insert into public.product_variants (org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency)
select p.org_id, 'BAS-SLV-S05-' || replace(trim_scale(w.width)::text, '.', '_') || 'MM-' || l.len || 'IN', p.id,
  'Figaro necklace: ' || trim_scale(w.width) || ' mm, ' || l.len || ' in',
  jsonb_build_object('Width', trim_scale(w.width) || ' mm', 'Length', l.len || ' in'),
  ((ceil(((50 + 6.0 * w.g18 * l.len / 18) / 0.70 + 1) / 10) * 10 - 1) * 100)::int, 20,
  round(w.g18 * l.len / 18, 1), 'supplier_catalog', true, 'USD'
from (values (3.4,7.1),(4.6,12.5),(6.6,23.5),(7.2,30.7),(8.3,35.1),(10.3,55.3)) w(width, g18) cross join (values (18),(20),(22),(24),(26)) l(len)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S05' and p.etsy_listing_id is null
on conflict (org_id, sku) do nothing;
insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, 'https://amuletta.artifactstudio.info/artifact/silver/S05/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg', 'url', g.alt, g.pos
from (values (0,$sv$Sterling silver Figaro chain necklace on pale grey concrete$sv$),(1,$sv$Sterling silver Figaro chain necklace worn at the collarbone, clasp at the back$sv$),(2,$sv$Close-up of the Figaro links in sterling silver$sv$),(3,$sv$Lobster clasp and tag plate stamped 925 on the Figaro chain necklace$sv$),(4,$sv$Sterling silver Figaro chain necklace laid flat, seen from above$sv$)) g(pos, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = 'BAS-SLV-S05' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = 'https://amuletta.artifactstudio.info/artifact/silver/S05/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg');
commit;
select md5(string_agg(line, E'\n' order by line collate "C")) seal, count(*) n from (
  select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
  from public.product_variants v join public.products p on p.id = v.product_id where p.sku = 'BAS-SLV-S05') s;

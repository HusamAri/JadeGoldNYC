begin;
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

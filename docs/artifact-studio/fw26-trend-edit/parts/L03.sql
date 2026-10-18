begin;
-- L03 Fibula: 9 variants (Karat x Metal Color), seal ab0e15339f035ae6b5831ec08cf76339, md5(description) 2a379b3a74e4fba18887b877e648bea3, tags 459cbfcff5e826ea5d5c9655ea908901
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$40bed1e0-455e-5846-90de-83ef89cc9100$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L03$fw$, $fw$Solid Gold Shawl Pin, Hand Forged Fibula Cape Clasp for Capelets, Scarves and Cardigans, Ancient Style Heirloom Sweater Pin$fw$, $fw$Before buttons, there was the fibula: one length of metal coiled into a spring, bent into a bow and finished with a catch. Ours is forged from a single piece of solid gold wire, so there is no solder joint to fail, and it closes a capelet, a shawl, a scarf or an open cardigan with a shape people have trusted for three thousand years.

- The fibula measures 38 mm long with a 1.3 mm pin; the bow is hammered flat to 2.5 mm, and the double-coil spring keeps tension so the pin stays closed in knits and woven fabrics.
- Forged and work-hardened by hand at our bench, which is why the surface carries soft hammer facets rather than a mirror polish. No two are identical.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Solid and stamped, nothing plated or filled.
- Wear it high on a capelet for an evening out, through a scarf on a coat, or as a sweater pin at the collarbone. It does the work of a brooch without the weight of one, and it is opera inspired in the oldest sense: dressing with intent.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. If the pin tip ever dulls on heavy wool, a few strokes on a fine emery board restore it. Avoid very loose, open weaves, where any pin can slip.
- A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$shawl pin$fw$,$fw$gold shawl pin$fw$,$fw$cape clasp$fw$,$fw$capelet pin$fw$,$fw$fibula brooch$fw$,$fw$sweater pin$fw$,$fw$scarf pin gold$fw$,$fw$hand forged jewelry$fw$,$fw$heirloom jewelry$fw$,$fw$cloak pin$fw$,$fw$cardigan clip$fw$,$fw$opera inspired$fw$,$fw$solid gold brooch$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  66579, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/01.jpg$fw$, 5, 'other',
  $fw${"productType": "other", "listingProtocol": "shawl_pin", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L03", "name": "Fibula", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Accessories > Pins & Clips > Shawl Pins", "section": "Brooches & Pins (new section)", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Anniversary", "Recipient": "Women", "Style": "Historical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Operatic Drama (capelets +47%)", "secondary": "Mark of the Maker (hand forged)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.9, "pieces": 1, "adders": 100, "adders_detail": "forging and work-hardening 80 + catch forming 20", "base14": 710}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ab0e15339f035ae6b5831ec08cf76339"}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L03$fw$ or p.id = $fw$40bed1e0-455e-5846-90de-83ef89cc9100$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L03-10K-Y$fw$, $fw$Fibula: 10K, Yellow Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold"}$fw$, 66579, 2.59),
  ($fw$BAS-FW26-L03-10K-W$fw$, $fw$Fibula: 10K, White Gold$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold"}$fw$, 66579, 2.59),
  ($fw$BAS-FW26-L03-10K-R$fw$, $fw$Fibula: 10K, Rose Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold"}$fw$, 66579, 2.59),
  ($fw$BAS-FW26-L03-14K-Y$fw$, $fw$Fibula: 14K, Yellow Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold"}$fw$, 89815, 2.90),
  ($fw$BAS-FW26-L03-14K-W$fw$, $fw$Fibula: 14K, White Gold$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold"}$fw$, 89815, 2.90),
  ($fw$BAS-FW26-L03-14K-R$fw$, $fw$Fibula: 14K, Rose Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold"}$fw$, 89815, 2.90),
  ($fw$BAS-FW26-L03-18K-Y$fw$, $fw$Fibula: 18K, Yellow Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold"}$fw$, 117658, 3.30),
  ($fw$BAS-FW26-L03-18K-W$fw$, $fw$Fibula: 18K, White Gold$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold"}$fw$, 117658, 3.30),
  ($fw$BAS-FW26-L03-18K-R$fw$, $fw$Fibula: 18K, Rose Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold"}$fw$, 117658, 3.30)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L03$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/01.jpg$fw$, $fw$Fibula cloak pin in hand forged solid gold fastening camel cashmere$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/02.jpg$fw$, $fw$Fibula closing a cable knit cardigan$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/03.jpg$fw$, $fw$Close-up of the hammered bow and the coiled spring$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/04.jpg$fw$, $fw$Two fibulae, one closed and one open, showing how it fastens$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L03/05.jpg$fw$, $fw$Fibula in yellow, white and rose gold (colour visualization)$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L03$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

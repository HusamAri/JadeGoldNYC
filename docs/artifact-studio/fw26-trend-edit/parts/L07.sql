begin;
-- L07 Thaw Hoops: 6 variants (Karat x Metal Color), seal b4d2c2b245ff35e33d3b6b790e423f09, md5(description) 3abcd0a811271a88e7c96948ad3c3f9b, tags cccc9d3080e1c2553e2a4df3cc3c9a0e
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$b4785256-6350-500a-b2a8-c5907e4a5341$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L07$fw$, $fw$Molten Gold Hoop Earrings, Hand Textured Two Tone Solid Gold Hoops with White Gold Tip, Sculptural Huggie Hoops, Winter Gift for Her$fw$, $fw$The Thaw Hoops continue our Thaw cuff: solid gold taken to the edge of melting so the surface pools and ripples, then stopped, with one tip finished in contrasting white gold like the last ice on a river. They are small enough for every day and textured enough to catch candlelight across a table.

- Each hoop measures 15 mm across in 1.6 mm wire, with a post and a solid gold butterfly back, so the pair sits lightly and stays put.
- The molten surface is made by hand with a torch, one hoop at a time; then the white gold tip is soldered and polished. The pair is matched by eye, and the ripples differ slightly from left to right. That is the handmade part, and we would not sand it away.
- Choose solid 10K, 14K or 18K gold; the body comes in yellow or rose, the tip in white. Everything is solid and stamped, nothing plated or filled.
- Wear them alone, or as the second hoop in a stack. They sit well with velvet in December and with a T-shirt in June.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Gold does not tarnish. Warm water with a drop of dish soap and a soft brush clears the texture of any residue.
- A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$molten gold hoops$fw$,$fw$textured gold hoops$fw$,$fw$two tone hoops$fw$,$fw$solid gold hoops$fw$,$fw$huggie hoop earrings$fw$,$fw$organic gold hoops$fw$,$fw$sculptural earrings$fw$,$fw$hand textured hoops$fw$,$fw$small gold hoops$fw$,$fw$white gold tip$fw$,$fw$handmade gold hoops$fw$,$fw$gift for her gold$fw$,$fw$winter earrings$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$White gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  68454, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/01.jpg$fw$, 5, 'earrings',
  $fw${"productType": "earring", "listingProtocol": "hoop_earrings", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L07", "name": "Thaw Hoops", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Jewelry > Earrings > Hoop Earrings", "section": "Earrings", "attributes": {"Primary color": "Gold", "Secondary color": "Silver", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "3 to 5 business days", "trend": {"anchor": "Mark of the Maker (visible process, texture)", "secondary": "Operatic Drama (dressing up, candlelight)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.5, "pieces": 1, "adders": 160, "adders_detail": "torch texturing 80 + two-tone tips 60 + posts and backs 20 (pair priced as one piece with heavier labor)", "base14": 730}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "b4d2c2b245ff35e33d3b6b790e423f09"}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L07$fw$ or p.id = $fw$b4785256-6350-500a-b2a8-c5907e4a5341$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L07-10K-YW$fw$, $fw$Thaw Hoops: 10K, Yellow/White Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow/White Gold"}$fw$, 68454, 2.23),
  ($fw$BAS-FW26-L07-10K-RW$fw$, $fw$Thaw Hoops: 10K, Rose/White Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Rose/White Gold"}$fw$, 68454, 2.23),
  ($fw$BAS-FW26-L07-14K-YW$fw$, $fw$Thaw Hoops: 14K, Yellow/White Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow/White Gold"}$fw$, 92345, 2.50),
  ($fw$BAS-FW26-L07-14K-RW$fw$, $fw$Thaw Hoops: 14K, Rose/White Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Rose/White Gold"}$fw$, 92345, 2.50),
  ($fw$BAS-FW26-L07-18K-YW$fw$, $fw$Thaw Hoops: 18K, Yellow/White Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow/White Gold"}$fw$, 120972, 2.84),
  ($fw$BAS-FW26-L07-18K-RW$fw$, $fw$Thaw Hoops: 18K, Rose/White Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Rose/White Gold"}$fw$, 120972, 2.84)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L07$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/01.jpg$fw$, $fw$Thaw Hoops in rippled solid gold with white gold tips$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/02.jpg$fw$, $fw$Thaw Hoop worn in the earlobe$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/03.jpg$fw$, $fw$Close-up of the molten surface and the white gold tips$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/04.jpg$fw$, $fw$Yellow/White Gold and Rose/White Gold pairs (colour visualization)$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L07/05.jpg$fw$, $fw$Back of a Thaw Hoop with the post and butterfly back$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L07$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

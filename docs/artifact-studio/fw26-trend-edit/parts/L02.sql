begin;
-- L02 Ishtar Rosette: 36 variants (Karat x Metal Color x Chain), seal ec6d422acbe168635108d783b8034811, md5(description) 9d83620476694be5febcb4b9228db818, tags 52636331d0474a6bce16dc961beed1e6
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$0acb3447-8a0f-5112-964e-a66c2fcc63a0$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L02$fw$, $fw$Rosette Brooch in Solid Gold with Garnet, Convertible Brooch and Pendant, Vintage Style Heirloom Jewelry, Opera Inspired Gift for Her$fw$, $fw$An eight-petal rosette, the star of Ishtar that appears on Mesopotamian seals and gates, carved as an openwork brooch in solid gold and set with a deep red garnet at its center. A hidden tube behind the top petal takes a chain, so the same piece pins to a velvet lapel or a capelet one night and hangs as a pendant the next.

- The rosette measures 22 mm across and 1.2 mm thick, cast from our own hand-carved master and finished by hand so the edges stay crisp and the back is as clean as the front.
- The garnet is a 5 mm cabochon in a closed bezel; under warm light its color sits between wine and ember.
- Brooch fittings are solid gold: a pin stem, a joint and a safety catch that rolls over so the pin cannot open on its own.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Add a 1.2 mm cable chain in 16, 18 or 20 inches if you want to wear it as a pendant from day one.
- It is made for the season of dressing up: a vintage style brooch for an evening coat, an opera night or a holiday table, and it stays in rotation long after.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Garnet is hard enough for daily wear. Keep the piece away from knocks and clean it with a soft cloth. A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$gold brooch$fw$,$fw$solid gold brooch$fw$,$fw$garnet brooch$fw$,$fw$vintage style brooch$fw$,$fw$brooch pendant$fw$,$fw$convertible brooch$fw$,$fw$heirloom jewelry$fw$,$fw$opera inspired$fw$,$fw$rosette brooch$fw$,$fw$star of ishtar$fw$,$fw$mesopotamian jewelry$fw$,$fw$capelet brooch$fw$,$fw$gift for her gold$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Garnet$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  72205, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/01.jpg$fw$, 5, 'brooch',
  $fw${"productType": "brooch", "listingProtocol": "brooch", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L02", "name": "Ishtar Rosette", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color", "Chain"], "category": "Accessories > Pins & Clips > Brooches", "section": "Brooches & Pins (new section)", "attributes": {"Primary color": "Gold", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Anniversary", "Recipient": "Women", "Style": "Historical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Operatic Drama (vintage jewelry +75%, ornate brooches)", "secondary": "Merrymaxxing (gemstone)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 3.2, "pieces": 1, "adders": 130, "adders_detail": "garnet and bezel 30 + brooch fittings 60 + openwork finishing 40; chain add-on priced separately", "base14": 770}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ec6d422acbe168635108d783b8034811"}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L02$fw$ or p.id = $fw$0acb3447-8a0f-5112-964e-a66c2fcc63a0$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L02-10K-Y-N$fw$, $fw$Ishtar Rosette: 10K, Yellow Gold, None$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain": "None"}$fw$, 72205, 2.85),
  ($fw$BAS-FW26-L02-10K-Y-16$fw$, $fw$Ishtar Rosette: 10K, Yellow Gold, 16 in$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain": "16 in"}$fw$, 86271, 2.85),
  ($fw$BAS-FW26-L02-10K-Y-18$fw$, $fw$Ishtar Rosette: 10K, Yellow Gold, 18 in$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain": "18 in"}$fw$, 88801, 2.85),
  ($fw$BAS-FW26-L02-10K-Y-20$fw$, $fw$Ishtar Rosette: 10K, Yellow Gold, 20 in$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain": "20 in"}$fw$, 91331, 2.85),
  ($fw$BAS-FW26-L02-10K-W-N$fw$, $fw$Ishtar Rosette: 10K, White Gold, None$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain": "None"}$fw$, 72205, 2.85),
  ($fw$BAS-FW26-L02-10K-W-16$fw$, $fw$Ishtar Rosette: 10K, White Gold, 16 in$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain": "16 in"}$fw$, 86271, 2.85),
  ($fw$BAS-FW26-L02-10K-W-18$fw$, $fw$Ishtar Rosette: 10K, White Gold, 18 in$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain": "18 in"}$fw$, 88801, 2.85),
  ($fw$BAS-FW26-L02-10K-W-20$fw$, $fw$Ishtar Rosette: 10K, White Gold, 20 in$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain": "20 in"}$fw$, 91331, 2.85),
  ($fw$BAS-FW26-L02-10K-R-N$fw$, $fw$Ishtar Rosette: 10K, Rose Gold, None$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain": "None"}$fw$, 72205, 2.85),
  ($fw$BAS-FW26-L02-10K-R-16$fw$, $fw$Ishtar Rosette: 10K, Rose Gold, 16 in$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain": "16 in"}$fw$, 86271, 2.85),
  ($fw$BAS-FW26-L02-10K-R-18$fw$, $fw$Ishtar Rosette: 10K, Rose Gold, 18 in$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain": "18 in"}$fw$, 88801, 2.85),
  ($fw$BAS-FW26-L02-10K-R-20$fw$, $fw$Ishtar Rosette: 10K, Rose Gold, 20 in$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain": "20 in"}$fw$, 91331, 2.85),
  ($fw$BAS-FW26-L02-14K-Y-N$fw$, $fw$Ishtar Rosette: 14K, Yellow Gold, None$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain": "None"}$fw$, 97405, 3.20),
  ($fw$BAS-FW26-L02-14K-Y-16$fw$, $fw$Ishtar Rosette: 14K, Yellow Gold, 16 in$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain": "16 in"}$fw$, 116380, 3.20),
  ($fw$BAS-FW26-L02-14K-Y-18$fw$, $fw$Ishtar Rosette: 14K, Yellow Gold, 18 in$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain": "18 in"}$fw$, 118910, 3.20),
  ($fw$BAS-FW26-L02-14K-Y-20$fw$, $fw$Ishtar Rosette: 14K, Yellow Gold, 20 in$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain": "20 in"}$fw$, 122705, 3.20),
  ($fw$BAS-FW26-L02-14K-W-N$fw$, $fw$Ishtar Rosette: 14K, White Gold, None$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain": "None"}$fw$, 97405, 3.20),
  ($fw$BAS-FW26-L02-14K-W-16$fw$, $fw$Ishtar Rosette: 14K, White Gold, 16 in$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain": "16 in"}$fw$, 116380, 3.20),
  ($fw$BAS-FW26-L02-14K-W-18$fw$, $fw$Ishtar Rosette: 14K, White Gold, 18 in$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain": "18 in"}$fw$, 118910, 3.20),
  ($fw$BAS-FW26-L02-14K-W-20$fw$, $fw$Ishtar Rosette: 14K, White Gold, 20 in$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain": "20 in"}$fw$, 122705, 3.20),
  ($fw$BAS-FW26-L02-14K-R-N$fw$, $fw$Ishtar Rosette: 14K, Rose Gold, None$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain": "None"}$fw$, 97405, 3.20),
  ($fw$BAS-FW26-L02-14K-R-16$fw$, $fw$Ishtar Rosette: 14K, Rose Gold, 16 in$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain": "16 in"}$fw$, 116380, 3.20),
  ($fw$BAS-FW26-L02-14K-R-18$fw$, $fw$Ishtar Rosette: 14K, Rose Gold, 18 in$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain": "18 in"}$fw$, 118910, 3.20),
  ($fw$BAS-FW26-L02-14K-R-20$fw$, $fw$Ishtar Rosette: 14K, Rose Gold, 20 in$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain": "20 in"}$fw$, 122705, 3.20),
  ($fw$BAS-FW26-L02-18K-Y-N$fw$, $fw$Ishtar Rosette: 18K, Yellow Gold, None$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain": "None"}$fw$, 127601, 3.64),
  ($fw$BAS-FW26-L02-18K-Y-16$fw$, $fw$Ishtar Rosette: 18K, Yellow Gold, 16 in$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain": "16 in"}$fw$, 152458, 3.64),
  ($fw$BAS-FW26-L02-18K-Y-18$fw$, $fw$Ishtar Rosette: 18K, Yellow Gold, 18 in$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain": "18 in"}$fw$, 157518, 3.64),
  ($fw$BAS-FW26-L02-18K-Y-20$fw$, $fw$Ishtar Rosette: 18K, Yellow Gold, 20 in$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain": "20 in"}$fw$, 162578, 3.64),
  ($fw$BAS-FW26-L02-18K-W-N$fw$, $fw$Ishtar Rosette: 18K, White Gold, None$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain": "None"}$fw$, 127601, 3.64),
  ($fw$BAS-FW26-L02-18K-W-16$fw$, $fw$Ishtar Rosette: 18K, White Gold, 16 in$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain": "16 in"}$fw$, 152458, 3.64),
  ($fw$BAS-FW26-L02-18K-W-18$fw$, $fw$Ishtar Rosette: 18K, White Gold, 18 in$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain": "18 in"}$fw$, 157518, 3.64),
  ($fw$BAS-FW26-L02-18K-W-20$fw$, $fw$Ishtar Rosette: 18K, White Gold, 20 in$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain": "20 in"}$fw$, 162578, 3.64),
  ($fw$BAS-FW26-L02-18K-R-N$fw$, $fw$Ishtar Rosette: 18K, Rose Gold, None$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain": "None"}$fw$, 127601, 3.64),
  ($fw$BAS-FW26-L02-18K-R-16$fw$, $fw$Ishtar Rosette: 18K, Rose Gold, 16 in$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain": "16 in"}$fw$, 152458, 3.64),
  ($fw$BAS-FW26-L02-18K-R-18$fw$, $fw$Ishtar Rosette: 18K, Rose Gold, 18 in$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain": "18 in"}$fw$, 157518, 3.64),
  ($fw$BAS-FW26-L02-18K-R-20$fw$, $fw$Ishtar Rosette: 18K, Rose Gold, 20 in$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain": "20 in"}$fw$, 162578, 3.64)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L02$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/01.jpg$fw$, $fw$Ishtar Rosette brooch in solid gold with a garnet center, pinned to green velvet$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/02.jpg$fw$, $fw$Ishtar Rosette worn as a pendant on a fine chain$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/03.jpg$fw$, $fw$Close-up of the garnet cabochon and the openwork petals$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/04.jpg$fw$, $fw$Back of the brooch with the pin, safety catch and hidden tube bail$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L02/05.jpg$fw$, $fw$Ishtar Rosette in yellow, white and rose gold (colour visualization)$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L02$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

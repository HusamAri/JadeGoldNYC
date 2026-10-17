-- 0171_artifact_fw26_trend_edit.sql
-- by Artifact Studio Jewelry: FW26 Trend Edit, 10 listings, 282 variants, no images yet. Panel drafts only;
-- this migration does not write to Etsy. Source: docs/artifact-studio/fw26-trend-edit/ (build_listings.py).
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku) under a
-- product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): 282 variants / fc12f228e903216ae566cbfcc204c0e2
--   (md5 of sku|axis values|price_cents|grams over all ten products, order by line collate "C")
begin;

-- L01 Seal Pin: 9 variants (Karat x Metal Color), seal 8af2742b9040f051ae9973c47a9cdb12, md5(description) 0bed3f857fb8a3815dd2528bbab239b6, tags 9675bcb92d78f229d14333a403f6690a
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$6e08bfa2-8d52-5176-a086-5f37f694a164$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L01$fw$, $fw$Men's Lapel Pin in Solid Gold, Fluted Cylinder Seal Stick Pin with Engraved Initials, Heirloom Suit and Tuxedo Pin, Gift for Him$fw$, $fw$A lapel pin for men who dress for the occasion. The Seal Pin takes its form from the Mesopotamian cylinder seal, the small carved cylinder people once wore on a cord as both ornament and signature. Here it is a fluted solid gold cylinder, 14 mm long, on a stick pin with a solid gold clutch, and the flat end cap is engraved with your initials so the signature idea still holds.

- The cylinder measures 14 x 3.5 mm with twelve flutes, cast from our own hand-carved master and finished by hand; the pin is 45 mm long and sits flat behind a lapel, a scarf or a knit.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Everything is solid and stamped, nothing plated or filled.
- Personalization: up to three initials engraved on the end cap in a plain serif. Type them exactly as you want them cut, or leave the field blank for a plain cap.
- Wear it on a tuxedo lapel for a holiday party or an evening at the opera, or on a coat lapel on an ordinary Tuesday. It reads as heirloom jewelry, not as a novelty pin.
- Made to order at our bench in New Jersey in 5 to 7 business days, then shipped free within the US with a solid gold clutch back and a gift box.
- Gold does not tarnish. If the flutes collect dust, a soft brush and warm soapy water bring the shine back.
- A gift message can be added at checkout. Please check the spelling at checkout; engraved pieces are made specifically for you.$fw$,
  ARRAY[$fw$mens lapel pin$fw$,$fw$gold lapel pin$fw$,$fw$solid gold brooch$fw$,$fw$mens brooch$fw$,$fw$stick pin for men$fw$,$fw$tuxedo lapel pin$fw$,$fw$groomsmen gift gold$fw$,$fw$heirloom jewelry$fw$,$fw$engraved lapel pin$fw$,$fw$cylinder seal$fw$,$fw$wedding lapel pin$fw$,$fw$gift for him gold$fw$,$fw$opera inspired$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  58608, 20, true, null, 0, 'other',
  $fw${"productType": "other", "listingProtocol": "stick_pin", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L01", "name": "Seal Pin", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Accessories > Pins & Clips > Hat Pins & Stick Pins", "section": "Brooches & Pins (new section; also tag the listing in For Him via title and tags)", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Wedding", "Recipient": "Men", "Style": "Classic"}, "processing": "5 to 7 business days", "trend": {"anchor": "Operatic Drama (men's brooches +70%, vintage jewelry +75%)", "secondary": "Family Reimagined (personalized gift)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.4, "pieces": 1, "adders": 65, "adders_detail": "engraving 25 + solid gold pin and clutch 40", "base14": 625}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "8af2742b9040f051ae9973c47a9cdb12", "personalizationQuestions": [{"question_type": "text_input", "question_text": "End cap initials (optional)", "instructions": "Up to 3 initials for the end cap, typed exactly as you want them cut (e.g. H.A. or HEA). Blank means no engraving.", "required": false, "max_allowed_characters": 5}]}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L01$fw$ or p.id = $fw$6e08bfa2-8d52-5176-a086-5f37f694a164$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L01-10K-Y$fw$, $fw$Seal Pin: 10K, Yellow Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold"}$fw$, 58608, 2.14),
  ($fw$BAS-FW26-L01-10K-W$fw$, $fw$Seal Pin: 10K, White Gold$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold"}$fw$, 58608, 2.14),
  ($fw$BAS-FW26-L01-10K-R$fw$, $fw$Seal Pin: 10K, Rose Gold$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold"}$fw$, 58608, 2.14),
  ($fw$BAS-FW26-L01-14K-Y$fw$, $fw$Seal Pin: 14K, Yellow Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold"}$fw$, 79062, 2.40),
  ($fw$BAS-FW26-L01-14K-W$fw$, $fw$Seal Pin: 14K, White Gold$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold"}$fw$, 79062, 2.40),
  ($fw$BAS-FW26-L01-14K-R$fw$, $fw$Seal Pin: 14K, Rose Gold$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold"}$fw$, 79062, 2.40),
  ($fw$BAS-FW26-L01-18K-Y$fw$, $fw$Seal Pin: 18K, Yellow Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold"}$fw$, 103572, 2.73),
  ($fw$BAS-FW26-L01-18K-W$fw$, $fw$Seal Pin: 18K, White Gold$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold"}$fw$, 103572, 2.73),
  ($fw$BAS-FW26-L01-18K-R$fw$, $fw$Seal Pin: 18K, Rose Gold$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold"}$fw$, 103572, 2.73)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L01$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L02 Ishtar Rosette: 36 variants (Karat x Metal Color x Chain), seal ec6d422acbe168635108d783b8034811, md5(description) 524d237e1ea46bb76c23a3f4861c3974, tags 52636331d0474a6bce16dc961beed1e6
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
- Garnet is hard enough for daily wear. Keep the piece away from knocks and clean it with a soft cloth. A gift message can be added at checkout.$fw$,
  ARRAY[$fw$gold brooch$fw$,$fw$solid gold brooch$fw$,$fw$garnet brooch$fw$,$fw$vintage style brooch$fw$,$fw$brooch pendant$fw$,$fw$convertible brooch$fw$,$fw$heirloom jewelry$fw$,$fw$opera inspired$fw$,$fw$rosette brooch$fw$,$fw$star of ishtar$fw$,$fw$mesopotamian jewelry$fw$,$fw$capelet brooch$fw$,$fw$gift for her gold$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Garnet$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  72205, 20, true, null, 0, 'brooch',
  $fw${"productType": "brooch", "listingProtocol": "brooch", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L02", "name": "Ishtar Rosette", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color", "Chain"], "category": "Accessories > Pins & Clips > Brooches", "section": "Brooches & Pins (new section)", "attributes": {"Primary color": "Gold", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Anniversary", "Recipient": "Women", "Style": "Historical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Operatic Drama (vintage jewelry +75%, ornate brooches)", "secondary": "Merrymaxxing (gemstone)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 3.2, "pieces": 1, "adders": 130, "adders_detail": "garnet and bezel 30 + brooch fittings 60 + openwork finishing 40; chain add-on priced separately", "base14": 770}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ec6d422acbe168635108d783b8034811"}$fw$::jsonb
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

-- L03 Fibula: 9 variants (Karat x Metal Color), seal ab0e15339f035ae6b5831ec08cf76339, md5(description) e7b814354e2a8f99769ae62e39a9e7ab, tags 459cbfcff5e826ea5d5c9655ea908901
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
- A gift message can be added at checkout.$fw$,
  ARRAY[$fw$shawl pin$fw$,$fw$gold shawl pin$fw$,$fw$cape clasp$fw$,$fw$capelet pin$fw$,$fw$fibula brooch$fw$,$fw$sweater pin$fw$,$fw$scarf pin gold$fw$,$fw$hand forged jewelry$fw$,$fw$heirloom jewelry$fw$,$fw$cloak pin$fw$,$fw$cardigan clip$fw$,$fw$opera inspired$fw$,$fw$solid gold brooch$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  66579, 20, true, null, 0, 'other',
  $fw${"productType": "other", "listingProtocol": "shawl_pin", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L03", "name": "Fibula", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Accessories > Pins & Clips > Shawl Pins", "section": "Brooches & Pins (new section)", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Anniversary", "Recipient": "Women", "Style": "Historical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Operatic Drama (capelets +47%)", "secondary": "Mark of the Maker (hand forged)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.9, "pieces": 1, "adders": 100, "adders_detail": "forging and work-hardening 80 + catch forming 20", "base14": 710}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ab0e15339f035ae6b5831ec08cf76339"}$fw$::jsonb
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

-- L04 Ur Band: 78 variants (Karat x Ring Size x Palette), seal 7efaedb2bee4170dc6392646717c0d75, md5(description) 4e56e41257c6375bd1211c2dffe56555, tags 2c58deea192490021834dc91a165f9a4
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$1421c06b-2198-569b-b54f-3571979a3305$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L04$fw$, $fw$Mosaic Enamel Ring in Solid Gold, Lapis Blue Red and White Kiln Fired Band, Bold Color Statement Ring, Maximalist Stacking Band$fw$, $fw$The Standard of Ur, a 4,500-year-old box from a Sumerian tomb, is inlaid in exactly three materials: lapis lazuli, red limestone and white shell. The Ur Band borrows that palette and nothing else. Twelve cells run around a solid gold band, each filled by hand with kiln-fired vitreous enamel in lapis blue, cranberry red and shell white, then stoned flush and polished so the gold walls between them read as fine lines.

- The band is 3.5 mm wide and 1.4 mm thick with a rounded comfort fit inside; the cells are 0.4 mm deep, so the enamel sits protected within the gold.
- Enamel is glass fused to gold at around 800 C, fired cell by cell. Small variations in tone from one firing to the next are the mark of the hand, not a fault.
- Yellow gold only, because the warm walls are part of the palette. Choose solid 10K, 14K or 18K and your US size from 4 to 10 in half sizes. Wider bands fit tighter, so if you sit between sizes, go up.
- Palette: Ur (lapis, red, white) for the original, or Festival (cobalt, cranberry, emerald, saffron and pink) when you want the full maximalist stack.
- One Ur Band is a quiet accent of bold color. Two or three stacked with plain gold bands is the mood of this season, and it still works in July.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.$fw$,
  ARRAY[$fw$enamel ring$fw$,$fw$mosaic ring$fw$,$fw$bold color ring$fw$,$fw$maximalist ring$fw$,$fw$statement ring gold$fw$,$fw$stacking ring enamel$fw$,$fw$colorful gold ring$fw$,$fw$kiln fired enamel$fw$,$fw$solid gold band ring$fw$,$fw$lapis blue ring$fw$,$fw$whimsical ring$fw$,$fw$hand enameled ring$fw$,$fw$sumerian jewelry$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  68454, 20, true, null, 0, 'ring',
  $fw${"productType": "ring", "listingProtocol": "ring_band", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L04", "name": "Ur Band", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Ring Size", "Palette"], "category": "Jewelry > Rings > Bands", "section": "Rings", "attributes": {"Primary color": "Blue", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Whimsical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Merrymaxxing (bold color, whimsy +110%)", "secondary": "Mark of the Maker (fired cell by cell by hand)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.9, "pieces": 1, "adders": 120, "adders_detail": "12 cells, 3 to 5 colors, multiple firings and flush stoning", "base14": 730}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "7efaedb2bee4170dc6392646717c0d75"}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L04$fw$ or p.id = $fw$1421c06b-2198-569b-b54f-3571979a3305$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L04-10K-4-UR$fw$, $fw$Ur Band: 10K, US 4, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 4", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-4-FE$fw$, $fw$Ur Band: 10K, US 4, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 4", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-4_5-UR$fw$, $fw$Ur Band: 10K, US 4.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 4.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-4_5-FE$fw$, $fw$Ur Band: 10K, US 4.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 4.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-5-UR$fw$, $fw$Ur Band: 10K, US 5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-5-FE$fw$, $fw$Ur Band: 10K, US 5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-5_5-UR$fw$, $fw$Ur Band: 10K, US 5.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 5.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-5_5-FE$fw$, $fw$Ur Band: 10K, US 5.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 5.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-6-UR$fw$, $fw$Ur Band: 10K, US 6, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 6", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-6-FE$fw$, $fw$Ur Band: 10K, US 6, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 6", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-6_5-UR$fw$, $fw$Ur Band: 10K, US 6.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 6.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-6_5-FE$fw$, $fw$Ur Band: 10K, US 6.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 6.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-7-UR$fw$, $fw$Ur Band: 10K, US 7, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 7", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-7-FE$fw$, $fw$Ur Band: 10K, US 7, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 7", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-7_5-UR$fw$, $fw$Ur Band: 10K, US 7.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 7.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-7_5-FE$fw$, $fw$Ur Band: 10K, US 7.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 7.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-8-UR$fw$, $fw$Ur Band: 10K, US 8, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 8", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-8-FE$fw$, $fw$Ur Band: 10K, US 8, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 8", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-8_5-UR$fw$, $fw$Ur Band: 10K, US 8.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 8.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-8_5-FE$fw$, $fw$Ur Band: 10K, US 8.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 8.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-9-UR$fw$, $fw$Ur Band: 10K, US 9, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 9", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-9-FE$fw$, $fw$Ur Band: 10K, US 9, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 9", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-9_5-UR$fw$, $fw$Ur Band: 10K, US 9.5, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 9.5", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-9_5-FE$fw$, $fw$Ur Band: 10K, US 9.5, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 9.5", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-10-UR$fw$, $fw$Ur Band: 10K, US 10, Ur$fw$, $fw${"Karat": "10K", "Ring Size": "US 10", "Palette": "Ur"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-10K-10-FE$fw$, $fw$Ur Band: 10K, US 10, Festival$fw$, $fw${"Karat": "10K", "Ring Size": "US 10", "Palette": "Festival"}$fw$, 68454, 2.59),
  ($fw$BAS-FW26-L04-14K-4-UR$fw$, $fw$Ur Band: 14K, US 4, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 4", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-4-FE$fw$, $fw$Ur Band: 14K, US 4, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 4", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-4_5-UR$fw$, $fw$Ur Band: 14K, US 4.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 4.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-4_5-FE$fw$, $fw$Ur Band: 14K, US 4.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 4.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-5-UR$fw$, $fw$Ur Band: 14K, US 5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-5-FE$fw$, $fw$Ur Band: 14K, US 5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-5_5-UR$fw$, $fw$Ur Band: 14K, US 5.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 5.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-5_5-FE$fw$, $fw$Ur Band: 14K, US 5.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 5.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-6-UR$fw$, $fw$Ur Band: 14K, US 6, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 6", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-6-FE$fw$, $fw$Ur Band: 14K, US 6, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 6", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-6_5-UR$fw$, $fw$Ur Band: 14K, US 6.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 6.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-6_5-FE$fw$, $fw$Ur Band: 14K, US 6.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 6.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-7-UR$fw$, $fw$Ur Band: 14K, US 7, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 7", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-7-FE$fw$, $fw$Ur Band: 14K, US 7, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 7", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-7_5-UR$fw$, $fw$Ur Band: 14K, US 7.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 7.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-7_5-FE$fw$, $fw$Ur Band: 14K, US 7.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 7.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-8-UR$fw$, $fw$Ur Band: 14K, US 8, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 8", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-8-FE$fw$, $fw$Ur Band: 14K, US 8, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 8", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-8_5-UR$fw$, $fw$Ur Band: 14K, US 8.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 8.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-8_5-FE$fw$, $fw$Ur Band: 14K, US 8.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 8.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-9-UR$fw$, $fw$Ur Band: 14K, US 9, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 9", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-9-FE$fw$, $fw$Ur Band: 14K, US 9, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 9", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-9_5-UR$fw$, $fw$Ur Band: 14K, US 9.5, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 9.5", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-9_5-FE$fw$, $fw$Ur Band: 14K, US 9.5, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 9.5", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-10-UR$fw$, $fw$Ur Band: 14K, US 10, Ur$fw$, $fw${"Karat": "14K", "Ring Size": "US 10", "Palette": "Ur"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-14K-10-FE$fw$, $fw$Ur Band: 14K, US 10, Festival$fw$, $fw${"Karat": "14K", "Ring Size": "US 10", "Palette": "Festival"}$fw$, 92345, 2.90),
  ($fw$BAS-FW26-L04-18K-4-UR$fw$, $fw$Ur Band: 18K, US 4, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 4", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-4-FE$fw$, $fw$Ur Band: 18K, US 4, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 4", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-4_5-UR$fw$, $fw$Ur Band: 18K, US 4.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 4.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-4_5-FE$fw$, $fw$Ur Band: 18K, US 4.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 4.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-5-UR$fw$, $fw$Ur Band: 18K, US 5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-5-FE$fw$, $fw$Ur Band: 18K, US 5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-5_5-UR$fw$, $fw$Ur Band: 18K, US 5.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 5.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-5_5-FE$fw$, $fw$Ur Band: 18K, US 5.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 5.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-6-UR$fw$, $fw$Ur Band: 18K, US 6, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 6", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-6-FE$fw$, $fw$Ur Band: 18K, US 6, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 6", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-6_5-UR$fw$, $fw$Ur Band: 18K, US 6.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 6.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-6_5-FE$fw$, $fw$Ur Band: 18K, US 6.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 6.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-7-UR$fw$, $fw$Ur Band: 18K, US 7, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 7", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-7-FE$fw$, $fw$Ur Band: 18K, US 7, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 7", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-7_5-UR$fw$, $fw$Ur Band: 18K, US 7.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 7.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-7_5-FE$fw$, $fw$Ur Band: 18K, US 7.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 7.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-8-UR$fw$, $fw$Ur Band: 18K, US 8, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 8", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-8-FE$fw$, $fw$Ur Band: 18K, US 8, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 8", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-8_5-UR$fw$, $fw$Ur Band: 18K, US 8.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 8.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-8_5-FE$fw$, $fw$Ur Band: 18K, US 8.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 8.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-9-UR$fw$, $fw$Ur Band: 18K, US 9, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 9", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-9-FE$fw$, $fw$Ur Band: 18K, US 9, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 9", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-9_5-UR$fw$, $fw$Ur Band: 18K, US 9.5, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 9.5", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-9_5-FE$fw$, $fw$Ur Band: 18K, US 9.5, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 9.5", "Palette": "Festival"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-10-UR$fw$, $fw$Ur Band: 18K, US 10, Ur$fw$, $fw${"Karat": "18K", "Ring Size": "US 10", "Palette": "Ur"}$fw$, 120972, 3.30),
  ($fw$BAS-FW26-L04-18K-10-FE$fw$, $fw$Ur Band: 18K, US 10, Festival$fw$, $fw${"Karat": "18K", "Ring Size": "US 10", "Palette": "Festival"}$fw$, 120972, 3.30)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L04$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L05 Nar (Pomegranate): 27 variants (Karat x Metal Color x Chain Length), seal 11bddff1d6061782deacd26ac6944ac4, md5(description) c7bf02fab63234bbc1a7d144f6ca96ef, tags f826f101c5875dcc987c6538c257ba02
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$35f66f38-e77e-5afc-a598-df9184e2ad90$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L05$fw$, $fw$Pomegranate Necklace in Solid Gold, Cranberry Enamel Pendant with Garnet Seeds, Bold Color Charm Necklace, Abundance Gift, Christmas Jewelry$fw$, $fw$The pomegranate has meant abundance, luck and a full house from Mesopotamia to Anatolia for as long as people have been carving it. Ours is a 12 mm solid gold fruit with a crown, its skin in cranberry red kiln-fired enamel and a split that opens onto three garnets set as seeds. The word garnet comes from granatum, the Latin for pomegranate, so the gemstones are not decoration; they are the point.

- The pendant measures 12 x 10 mm plus the crown, cast with an open back so it stays light on the chain, and hangs from a fixed loop that keeps it facing forward.
- Three 1.3 mm garnets are bead set into the split by hand; the enamel is fired in a recessed cell with a polished gold rim.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a 1.2 mm solid gold cable chain with spring ring clasp in 16, 18 or 20 inches.
- It is a bold color piece that happens to be festive, which makes it an easy gift for a new home, a host, a friend who feeds everyone, or yourself, which is allowed.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth.
- A gift message can be added at checkout.$fw$,
  ARRAY[$fw$pomegranate necklace$fw$,$fw$pomegranate jewelry$fw$,$fw$garnet necklace gold$fw$,$fw$enamel pendant gold$fw$,$fw$bold color necklace$fw$,$fw$solid gold charm$fw$,$fw$abundance gift$fw$,$fw$hostess gift gold$fw$,$fw$new home gift gold$fw$,$fw$anatolian jewelry$fw$,$fw$whimsical necklace$fw$,$fw$red enamel necklace$fw$,$fw$christmas necklace$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$Garnet$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  64703, 20, true, null, 0, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L05", "name": "Nar (Pomegranate)", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color", "Chain Length"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Red", "Secondary color": "Gold", "Holiday": "Christmas", "Occasion": "Housewarming", "Recipient": "Women", "Style": "Whimsical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Merrymaxxing (gemstones, bold color, whimsy)", "secondary": "Family Reimagined (gift for a household, a host, a friend)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 3.0, "pieces": 1, "adders": 70, "adders_detail": "three garnets bead set 45 + enamel cell 25; 16 in chain included in the grams", "base14": 690}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "11bddff1d6061782deacd26ac6944ac4"}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L05$fw$ or p.id = $fw$35f66f38-e77e-5afc-a598-df9184e2ad90$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L05-10K-Y-16$fw$, $fw$Nar (Pomegranate): 10K, Yellow Gold, 16 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$fw$, 64703, 2.68),
  ($fw$BAS-FW26-L05-10K-Y-18$fw$, $fw$Nar (Pomegranate): 10K, Yellow Gold, 18 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$fw$, 67233, 2.68),
  ($fw$BAS-FW26-L05-10K-Y-20$fw$, $fw$Nar (Pomegranate): 10K, Yellow Gold, 20 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$fw$, 69763, 2.68),
  ($fw$BAS-FW26-L05-10K-W-16$fw$, $fw$Nar (Pomegranate): 10K, White Gold, 16 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$fw$, 64703, 2.68),
  ($fw$BAS-FW26-L05-10K-W-18$fw$, $fw$Nar (Pomegranate): 10K, White Gold, 18 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$fw$, 67233, 2.68),
  ($fw$BAS-FW26-L05-10K-W-20$fw$, $fw$Nar (Pomegranate): 10K, White Gold, 20 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$fw$, 69763, 2.68),
  ($fw$BAS-FW26-L05-10K-R-16$fw$, $fw$Nar (Pomegranate): 10K, Rose Gold, 16 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$fw$, 64703, 2.68),
  ($fw$BAS-FW26-L05-10K-R-18$fw$, $fw$Nar (Pomegranate): 10K, Rose Gold, 18 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$fw$, 67233, 2.68),
  ($fw$BAS-FW26-L05-10K-R-20$fw$, $fw$Nar (Pomegranate): 10K, Rose Gold, 20 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$fw$, 69763, 2.68),
  ($fw$BAS-FW26-L05-14K-Y-16$fw$, $fw$Nar (Pomegranate): 14K, Yellow Gold, 16 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$fw$, 87285, 3.00),
  ($fw$BAS-FW26-L05-14K-Y-18$fw$, $fw$Nar (Pomegranate): 14K, Yellow Gold, 18 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$fw$, 89815, 3.00),
  ($fw$BAS-FW26-L05-14K-Y-20$fw$, $fw$Nar (Pomegranate): 14K, Yellow Gold, 20 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$fw$, 93610, 3.00),
  ($fw$BAS-FW26-L05-14K-W-16$fw$, $fw$Nar (Pomegranate): 14K, White Gold, 16 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$fw$, 87285, 3.00),
  ($fw$BAS-FW26-L05-14K-W-18$fw$, $fw$Nar (Pomegranate): 14K, White Gold, 18 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$fw$, 89815, 3.00),
  ($fw$BAS-FW26-L05-14K-W-20$fw$, $fw$Nar (Pomegranate): 14K, White Gold, 20 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$fw$, 93610, 3.00),
  ($fw$BAS-FW26-L05-14K-R-16$fw$, $fw$Nar (Pomegranate): 14K, Rose Gold, 16 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$fw$, 87285, 3.00),
  ($fw$BAS-FW26-L05-14K-R-18$fw$, $fw$Nar (Pomegranate): 14K, Rose Gold, 18 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$fw$, 89815, 3.00),
  ($fw$BAS-FW26-L05-14K-R-20$fw$, $fw$Nar (Pomegranate): 14K, Rose Gold, 20 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$fw$, 93610, 3.00),
  ($fw$BAS-FW26-L05-18K-Y-16$fw$, $fw$Nar (Pomegranate): 18K, Yellow Gold, 16 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "16 inches"}$fw$, 114343, 3.41),
  ($fw$BAS-FW26-L05-18K-Y-18$fw$, $fw$Nar (Pomegranate): 18K, Yellow Gold, 18 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "18 inches"}$fw$, 119403, 3.41),
  ($fw$BAS-FW26-L05-18K-Y-20$fw$, $fw$Nar (Pomegranate): 18K, Yellow Gold, 20 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Chain Length": "20 inches"}$fw$, 124463, 3.41),
  ($fw$BAS-FW26-L05-18K-W-16$fw$, $fw$Nar (Pomegranate): 18K, White Gold, 16 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "16 inches"}$fw$, 114343, 3.41),
  ($fw$BAS-FW26-L05-18K-W-18$fw$, $fw$Nar (Pomegranate): 18K, White Gold, 18 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "18 inches"}$fw$, 119403, 3.41),
  ($fw$BAS-FW26-L05-18K-W-20$fw$, $fw$Nar (Pomegranate): 18K, White Gold, 20 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Chain Length": "20 inches"}$fw$, 124463, 3.41),
  ($fw$BAS-FW26-L05-18K-R-16$fw$, $fw$Nar (Pomegranate): 18K, Rose Gold, 16 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "16 inches"}$fw$, 114343, 3.41),
  ($fw$BAS-FW26-L05-18K-R-18$fw$, $fw$Nar (Pomegranate): 18K, Rose Gold, 18 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "18 inches"}$fw$, 119403, 3.41),
  ($fw$BAS-FW26-L05-18K-R-20$fw$, $fw$Nar (Pomegranate): 18K, Rose Gold, 20 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Chain Length": "20 inches"}$fw$, 124463, 3.41)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L05$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L06 Wedge: 36 variants (Karat x Chain Length x Sign), seal fea12bdc61ba108d84709e7261bc6f0f, md5(description) b8e905d75d8f57b722b44dba51a7d89a, tags 71367d2c5532db7f1c80ce3b5ed0764f
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$b560938e-6639-5744-9043-51e7345275f4$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L06$fw$, $fw$Cuneiform Necklace Hand Stamped in Solid Gold, Personalized Bar Pendant with Engraved Initials, Sumerian Sign for Life, Heart, Home or Star$fw$, $fw$Some of the first writing in the world was made by pressing a reed into wet clay. The marks became wedges, and the wedges became cuneiform. The Wedge pendant is a small bar of solid gold struck by hand with the same wedge shapes, one sign at a time, so every stroke is slightly deeper or lighter than the next. You choose the sign; the back is engraved with your initials or a date.

- The bar measures 16 x 5 mm and 1 mm thick, rolled from solid gold sheet, annealed and hand stamped with three sizes of wedge punch. The surface is brushed, the edges softly rounded.
- Four Sumerian signs to choose from: TI (life), SHA (heart), E (home) and AN (star, sky). The listing photos show each sign next to its meaning.
- Personalization: up to 8 characters engraved on the back, initials, a year or a short word, typed exactly as you want them cut.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches.
- Because each bar is struck by hand, spacing and depth vary a little from piece to piece. That variation is the point of the design, and it is why no two Wedges match.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish; a soft cloth keeps the brushed finish even. A gift message can be added at checkout.$fw$,
  ARRAY[$fw$cuneiform necklace$fw$,$fw$cuneiform jewelry$fw$,$fw$hand stamped pendant$fw$,$fw$personalized bar$fw$,$fw$engraved bar pendant$fw$,$fw$sumerian necklace$fw$,$fw$mesopotamian jewelry$fw$,$fw$gold bar necklace$fw$,$fw$initial necklace$fw$,$fw$handmade pendant$fw$,$fw$ancient script$fw$,$fw$gift for her gold$fw$,$fw$meaningful necklace$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  59077, 20, true, null, 0, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L06", "name": "Wedge", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Chain Length", "Sign"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Graduation", "Recipient": "Unisex adults", "Style": "Historical"}, "processing": "5 to 7 business days", "trend": {"anchor": "Mark of the Maker (hand-stamped marks; hand painted items +280%)", "secondary": "Family Reimagined (personalized gifts +1,400%)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.55, "pieces": 1, "adders": 55, "adders_detail": "hand stamping 30 + back engraving 25; 16 in chain included in the grams", "base14": 630}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "fea12bdc61ba108d84709e7261bc6f0f", "personalizationQuestions": [{"question_type": "text_input", "question_text": "Engraving on the back (optional)", "instructions": "Up to 8 characters for the back: initials, a year or a short word, typed as you want them cut. Blank: plain back.", "required": false, "max_allowed_characters": 8}]}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L06$fw$ or p.id = $fw$b560938e-6639-5744-9043-51e7345275f4$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L06-10K-16-TI$fw$, $fw$Wedge: 10K, 16 inches, TI (life)$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Sign": "TI (life)"}$fw$, 59077, 2.27),
  ($fw$BAS-FW26-L06-10K-16-SHA$fw$, $fw$Wedge: 10K, 16 inches, SHA (heart)$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Sign": "SHA (heart)"}$fw$, 59077, 2.27),
  ($fw$BAS-FW26-L06-10K-16-E$fw$, $fw$Wedge: 10K, 16 inches, E (home)$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Sign": "E (home)"}$fw$, 59077, 2.27),
  ($fw$BAS-FW26-L06-10K-16-AN$fw$, $fw$Wedge: 10K, 16 inches, AN (star, sky)$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Sign": "AN (star, sky)"}$fw$, 59077, 2.27),
  ($fw$BAS-FW26-L06-10K-18-TI$fw$, $fw$Wedge: 10K, 18 inches, TI (life)$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Sign": "TI (life)"}$fw$, 61607, 2.27),
  ($fw$BAS-FW26-L06-10K-18-SHA$fw$, $fw$Wedge: 10K, 18 inches, SHA (heart)$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Sign": "SHA (heart)"}$fw$, 61607, 2.27),
  ($fw$BAS-FW26-L06-10K-18-E$fw$, $fw$Wedge: 10K, 18 inches, E (home)$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Sign": "E (home)"}$fw$, 61607, 2.27),
  ($fw$BAS-FW26-L06-10K-18-AN$fw$, $fw$Wedge: 10K, 18 inches, AN (star, sky)$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Sign": "AN (star, sky)"}$fw$, 61607, 2.27),
  ($fw$BAS-FW26-L06-10K-20-TI$fw$, $fw$Wedge: 10K, 20 inches, TI (life)$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Sign": "TI (life)"}$fw$, 64137, 2.27),
  ($fw$BAS-FW26-L06-10K-20-SHA$fw$, $fw$Wedge: 10K, 20 inches, SHA (heart)$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Sign": "SHA (heart)"}$fw$, 64137, 2.27),
  ($fw$BAS-FW26-L06-10K-20-E$fw$, $fw$Wedge: 10K, 20 inches, E (home)$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Sign": "E (home)"}$fw$, 64137, 2.27),
  ($fw$BAS-FW26-L06-10K-20-AN$fw$, $fw$Wedge: 10K, 20 inches, AN (star, sky)$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Sign": "AN (star, sky)"}$fw$, 64137, 2.27),
  ($fw$BAS-FW26-L06-14K-16-TI$fw$, $fw$Wedge: 14K, 16 inches, TI (life)$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Sign": "TI (life)"}$fw$, 79695, 2.55),
  ($fw$BAS-FW26-L06-14K-16-SHA$fw$, $fw$Wedge: 14K, 16 inches, SHA (heart)$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Sign": "SHA (heart)"}$fw$, 79695, 2.55),
  ($fw$BAS-FW26-L06-14K-16-E$fw$, $fw$Wedge: 14K, 16 inches, E (home)$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Sign": "E (home)"}$fw$, 79695, 2.55),
  ($fw$BAS-FW26-L06-14K-16-AN$fw$, $fw$Wedge: 14K, 16 inches, AN (star, sky)$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Sign": "AN (star, sky)"}$fw$, 79695, 2.55),
  ($fw$BAS-FW26-L06-14K-18-TI$fw$, $fw$Wedge: 14K, 18 inches, TI (life)$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Sign": "TI (life)"}$fw$, 82225, 2.55),
  ($fw$BAS-FW26-L06-14K-18-SHA$fw$, $fw$Wedge: 14K, 18 inches, SHA (heart)$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Sign": "SHA (heart)"}$fw$, 82225, 2.55),
  ($fw$BAS-FW26-L06-14K-18-E$fw$, $fw$Wedge: 14K, 18 inches, E (home)$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Sign": "E (home)"}$fw$, 82225, 2.55),
  ($fw$BAS-FW26-L06-14K-18-AN$fw$, $fw$Wedge: 14K, 18 inches, AN (star, sky)$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Sign": "AN (star, sky)"}$fw$, 82225, 2.55),
  ($fw$BAS-FW26-L06-14K-20-TI$fw$, $fw$Wedge: 14K, 20 inches, TI (life)$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Sign": "TI (life)"}$fw$, 86020, 2.55),
  ($fw$BAS-FW26-L06-14K-20-SHA$fw$, $fw$Wedge: 14K, 20 inches, SHA (heart)$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Sign": "SHA (heart)"}$fw$, 86020, 2.55),
  ($fw$BAS-FW26-L06-14K-20-E$fw$, $fw$Wedge: 14K, 20 inches, E (home)$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Sign": "E (home)"}$fw$, 86020, 2.55),
  ($fw$BAS-FW26-L06-14K-20-AN$fw$, $fw$Wedge: 14K, 20 inches, AN (star, sky)$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Sign": "AN (star, sky)"}$fw$, 86020, 2.55),
  ($fw$BAS-FW26-L06-18K-16-TI$fw$, $fw$Wedge: 18K, 16 inches, TI (life)$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Sign": "TI (life)"}$fw$, 104400, 2.90),
  ($fw$BAS-FW26-L06-18K-16-SHA$fw$, $fw$Wedge: 18K, 16 inches, SHA (heart)$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Sign": "SHA (heart)"}$fw$, 104400, 2.90),
  ($fw$BAS-FW26-L06-18K-16-E$fw$, $fw$Wedge: 18K, 16 inches, E (home)$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Sign": "E (home)"}$fw$, 104400, 2.90),
  ($fw$BAS-FW26-L06-18K-16-AN$fw$, $fw$Wedge: 18K, 16 inches, AN (star, sky)$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Sign": "AN (star, sky)"}$fw$, 104400, 2.90),
  ($fw$BAS-FW26-L06-18K-18-TI$fw$, $fw$Wedge: 18K, 18 inches, TI (life)$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Sign": "TI (life)"}$fw$, 109460, 2.90),
  ($fw$BAS-FW26-L06-18K-18-SHA$fw$, $fw$Wedge: 18K, 18 inches, SHA (heart)$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Sign": "SHA (heart)"}$fw$, 109460, 2.90),
  ($fw$BAS-FW26-L06-18K-18-E$fw$, $fw$Wedge: 18K, 18 inches, E (home)$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Sign": "E (home)"}$fw$, 109460, 2.90),
  ($fw$BAS-FW26-L06-18K-18-AN$fw$, $fw$Wedge: 18K, 18 inches, AN (star, sky)$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Sign": "AN (star, sky)"}$fw$, 109460, 2.90),
  ($fw$BAS-FW26-L06-18K-20-TI$fw$, $fw$Wedge: 18K, 20 inches, TI (life)$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Sign": "TI (life)"}$fw$, 114520, 2.90),
  ($fw$BAS-FW26-L06-18K-20-SHA$fw$, $fw$Wedge: 18K, 20 inches, SHA (heart)$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Sign": "SHA (heart)"}$fw$, 114520, 2.90),
  ($fw$BAS-FW26-L06-18K-20-E$fw$, $fw$Wedge: 18K, 20 inches, E (home)$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Sign": "E (home)"}$fw$, 114520, 2.90),
  ($fw$BAS-FW26-L06-18K-20-AN$fw$, $fw$Wedge: 18K, 20 inches, AN (star, sky)$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Sign": "AN (star, sky)"}$fw$, 114520, 2.90)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L06$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L07 Thaw Hoops: 6 variants (Karat x Metal Color), seal b4d2c2b245ff35e33d3b6b790e423f09, md5(description) 1c32d9cb8fcf1345cf6ba85356957edd, tags cccc9d3080e1c2553e2a4df3cc3c9a0e
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
- A gift message can be added at checkout.$fw$,
  ARRAY[$fw$molten gold hoops$fw$,$fw$textured gold hoops$fw$,$fw$two tone hoops$fw$,$fw$solid gold hoops$fw$,$fw$huggie hoop earrings$fw$,$fw$organic gold hoops$fw$,$fw$sculptural earrings$fw$,$fw$hand textured hoops$fw$,$fw$small gold hoops$fw$,$fw$white gold tip$fw$,$fw$handmade gold hoops$fw$,$fw$gift for her gold$fw$,$fw$winter earrings$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$White gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  68454, 20, true, null, 0, 'earrings',
  $fw${"productType": "earring", "listingProtocol": "hoop_earrings", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L07", "name": "Thaw Hoops", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Jewelry > Earrings > Hoop Earrings", "section": "Earrings", "attributes": {"Primary color": "Gold", "Secondary color": "Silver", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "3 to 5 business days", "trend": {"anchor": "Mark of the Maker (visible process, texture)", "secondary": "Operatic Drama (dressing up, candlelight)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.5, "pieces": 1, "adders": 160, "adders_detail": "torch texturing 80 + two-tone tips 60 + posts and backs 20 (pair priced as one piece with heavier labor)", "base14": 730}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "b4d2c2b245ff35e33d3b6b790e423f09"}$fw$::jsonb
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

-- L08 Split Infinity: 18 variants (Set x Karat x Metal Color), seal ae7dd607f3b91f0e56896b27a48eec18, md5(description) c940d3543bccb2c949e04bfc55478b08, tags 1824608bad31cfab5cf56d2169eaa901
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$2d59f0e4-9ce0-59d6-b0cb-e7da17bc5377$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L08$fw$, $fw$Friendship Necklace Set of 2 or 3 in Solid Gold, Split Infinity Matching Pendants with Engraved Initials, Best Friend Gift, Friendsmas Gift$fw$, $fw$One infinity loop, cut along a soft wave into two or three pieces, each on its own chain. Apart, each pendant is a small gold curve that reads as abstract. Side by side, they close back into the loop. It is a matching set for the people who are family by choice: best friends, sisters, a couple, a trio who has shared a group chat for a decade.

- The complete infinity measures 16 x 8 mm in 1.3 mm solid gold; each piece has its own bail and hangs on a 1.2 mm cable chain with spring ring clasp.
- Choose a set of 2 or 3. Each pendant can carry one engraved initial on the back, so write them in the order you want them matched to the pieces, left to right.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Chains ship at 18 inches; if your friends want 16 or 20, note it next to each initial in the personalization field and we will cut each chain accordingly.
- The pieces are cast from one master and finished together as a set, so the break lines meet cleanly when the pendants are placed side by side.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. Each pendant arrives in its own gift box, so the set can be given in three places on the same night.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Gold does not tarnish. A soft cloth keeps it bright. A gift message can be added at checkout.$fw$,
  ARRAY[$fw$friendship necklace$fw$,$fw$best friend necklace$fw$,$fw$matching necklaces$fw$,$fw$friend group gift$fw$,$fw$friendsmas gift$fw$,$fw$set of 3 necklaces$fw$,$fw$infinity necklace$fw$,$fw$sister necklace set$fw$,$fw$couples necklace set$fw$,$fw$personalized gift$fw$,$fw$chosen family gift$fw$,$fw$bff necklace gold$fw$,$fw$initial necklace set$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  102213, 20, true, null, 0, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L08", "name": "Split Infinity", "collection": "FW26 Trend Edit", "variationAxes": ["Set", "Karat", "Metal Color"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "5 to 7 business days", "trend": {"anchor": "Family Reimagined (personalized friend gifts +1,400%, Friendsmas +37%)", "secondary": "brand pillar: infinity"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 4.0, "pieces": 2, "adders": 50, "adders_detail": "set of 2: two make-floors + two engravings 50", "base14": 1090}, "set_options": {"2 pendants": {"grams14": 4.0, "pieces": 2, "adders": 50, "base14": 1090}, "3 pendants": {"grams14": 5.9, "pieces": 3, "adders": 75, "base14": 1625, "brief_prices": {"10K": [1523.81, 1066.67], "14K": [2055.62, 1438.93], "18K": [2692.87, 1885.01]}}}, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ae7dd607f3b91f0e56896b27a48eec18", "personalizationQuestions": [{"question_type": "text_input", "question_text": "Initials, one per pendant (optional)", "instructions": "One initial per pendant, left to right (e.g. H / E / C). Add a chain length per pendant if needed (e.g. H 16 / E 18).", "required": false, "max_allowed_characters": 40}]}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L08$fw$ or p.id = $fw$2d59f0e4-9ce0-59d6-b0cb-e7da17bc5377$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L08-2P-10K-Y$fw$, $fw$Split Infinity: 2 pendants, 10K, Yellow Gold$fw$, $fw${"Set": "2 pendants", "Karat": "10K", "Metal Color": "Yellow Gold"}$fw$, 102213, 3.57),
  ($fw$BAS-FW26-L08-2P-10K-W$fw$, $fw$Split Infinity: 2 pendants, 10K, White Gold$fw$, $fw${"Set": "2 pendants", "Karat": "10K", "Metal Color": "White Gold"}$fw$, 102213, 3.57),
  ($fw$BAS-FW26-L08-2P-10K-R$fw$, $fw$Split Infinity: 2 pendants, 10K, Rose Gold$fw$, $fw${"Set": "2 pendants", "Karat": "10K", "Metal Color": "Rose Gold"}$fw$, 102213, 3.57),
  ($fw$BAS-FW26-L08-2P-14K-Y$fw$, $fw$Split Infinity: 2 pendants, 14K, Yellow Gold$fw$, $fw${"Set": "2 pendants", "Karat": "14K", "Metal Color": "Yellow Gold"}$fw$, 137885, 4.00),
  ($fw$BAS-FW26-L08-2P-14K-W$fw$, $fw$Split Infinity: 2 pendants, 14K, White Gold$fw$, $fw${"Set": "2 pendants", "Karat": "14K", "Metal Color": "White Gold"}$fw$, 137885, 4.00),
  ($fw$BAS-FW26-L08-2P-14K-R$fw$, $fw$Split Infinity: 2 pendants, 14K, Rose Gold$fw$, $fw${"Set": "2 pendants", "Karat": "14K", "Metal Color": "Rose Gold"}$fw$, 137885, 4.00),
  ($fw$BAS-FW26-L08-2P-18K-Y$fw$, $fw$Split Infinity: 2 pendants, 18K, Yellow Gold$fw$, $fw${"Set": "2 pendants", "Karat": "18K", "Metal Color": "Yellow Gold"}$fw$, 180629, 4.55),
  ($fw$BAS-FW26-L08-2P-18K-W$fw$, $fw$Split Infinity: 2 pendants, 18K, White Gold$fw$, $fw${"Set": "2 pendants", "Karat": "18K", "Metal Color": "White Gold"}$fw$, 180629, 4.55),
  ($fw$BAS-FW26-L08-2P-18K-R$fw$, $fw$Split Infinity: 2 pendants, 18K, Rose Gold$fw$, $fw${"Set": "2 pendants", "Karat": "18K", "Metal Color": "Rose Gold"}$fw$, 180629, 4.55),
  ($fw$BAS-FW26-L08-3P-10K-Y$fw$, $fw$Split Infinity: 3 pendants, 10K, Yellow Gold$fw$, $fw${"Set": "3 pendants", "Karat": "10K", "Metal Color": "Yellow Gold"}$fw$, 152381, 5.26),
  ($fw$BAS-FW26-L08-3P-10K-W$fw$, $fw$Split Infinity: 3 pendants, 10K, White Gold$fw$, $fw${"Set": "3 pendants", "Karat": "10K", "Metal Color": "White Gold"}$fw$, 152381, 5.26),
  ($fw$BAS-FW26-L08-3P-10K-R$fw$, $fw$Split Infinity: 3 pendants, 10K, Rose Gold$fw$, $fw${"Set": "3 pendants", "Karat": "10K", "Metal Color": "Rose Gold"}$fw$, 152381, 5.26),
  ($fw$BAS-FW26-L08-3P-14K-Y$fw$, $fw$Split Infinity: 3 pendants, 14K, Yellow Gold$fw$, $fw${"Set": "3 pendants", "Karat": "14K", "Metal Color": "Yellow Gold"}$fw$, 205562, 5.90),
  ($fw$BAS-FW26-L08-3P-14K-W$fw$, $fw$Split Infinity: 3 pendants, 14K, White Gold$fw$, $fw${"Set": "3 pendants", "Karat": "14K", "Metal Color": "White Gold"}$fw$, 205562, 5.90),
  ($fw$BAS-FW26-L08-3P-14K-R$fw$, $fw$Split Infinity: 3 pendants, 14K, Rose Gold$fw$, $fw${"Set": "3 pendants", "Karat": "14K", "Metal Color": "Rose Gold"}$fw$, 205562, 5.90),
  ($fw$BAS-FW26-L08-3P-18K-Y$fw$, $fw$Split Infinity: 3 pendants, 18K, Yellow Gold$fw$, $fw${"Set": "3 pendants", "Karat": "18K", "Metal Color": "Yellow Gold"}$fw$, 269287, 6.71),
  ($fw$BAS-FW26-L08-3P-18K-W$fw$, $fw$Split Infinity: 3 pendants, 18K, White Gold$fw$, $fw${"Set": "3 pendants", "Karat": "18K", "Metal Color": "White Gold"}$fw$, 269287, 6.71),
  ($fw$BAS-FW26-L08-3P-18K-R$fw$, $fw$Split Infinity: 3 pendants, 18K, Rose Gold$fw$, $fw${"Set": "3 pendants", "Karat": "18K", "Metal Color": "Rose Gold"}$fw$, 269287, 6.71)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L08$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L09 Paw Seal: 36 variants (Karat x Chain Length x Paw Finish), seal 58f61477b96f6c3b0cf42525bdc9b2a7, md5(description) 54b46edff45ae2bf93c081d7f7f5ee25, tags 9d6688ec866d6ed13fe3c5cf57cd9312
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$07f74af4-71f6-51a7-bfbc-dfc55579bb4a$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L09$fw$, $fw$Pet Paw Print Necklace in Solid Gold, Hand Engraved Paw Seal Pendant with Pet Name, Custom Dog Mom or Cat Mom Gift, Pet Memorial Jewelry$fw$, $fw$A seal is the mark a thing leaves behind. The Paw Seal is a 10 mm solid gold disc with a paw pressed into its face as an intaglio, cut by hand below the surface the way a signet is cut, so it catches shadow rather than shine. The back carries your pet's name. Choose a plain gold paw, or have the intaglio filled with kiln-fired enamel in cobalt, cranberry or black.

- The disc measures 10 mm across and 1.2 mm thick with a fixed bail; the paw is engraved by hand, and the two styles, dog and cat, are shown in the listing photos.
- Personalization: your pet's name on the back, up to 10 characters, and the choice of dog or cat paw. Add a year if you are marking a life.
- Yellow gold as standard; message us for white or rose. Choose solid 10K, 14K or 18K with a 1.2 mm cable chain and spring ring clasp in 16, 18 or 20 inches. Message us for the bracelet version on a 6.5, 7 or 7.5 inch chain.
- A personalized gift for a dog mom, a cat dad, a puppy's first Christmas, or in memory of a pet whose paw print is still on the car window.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping, gift box included. Please check the spelling at checkout; engraved pieces are made specifically for you.
- If you choose enamel, it is glass fused to gold and can chip from a hard knock; a soft cloth is all it needs. Gold itself does not tarnish.
- A gift message can be added at checkout.$fw$,
  ARRAY[$fw$paw print necklace$fw$,$fw$dog mom necklace$fw$,$fw$cat mom gift gold$fw$,$fw$custom pet gift$fw$,$fw$pet memorial jewelry$fw$,$fw$pet name necklace$fw$,$fw$solid gold paw print$fw$,$fw$dog lover gift gold$fw$,$fw$cat lover necklace$fw$,$fw$paw print jewelry$fw$,$fw$hand engraved charm$fw$,$fw$dog dad gift$fw$,$fw$signet style pendant$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  60484, 20, true, null, 0, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L09", "name": "Paw Seal", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Chain Length", "Paw Finish"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Gold", "Secondary color": "Blue", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "5 to 7 business days", "trend": {"anchor": "Family Reimagined (pet gifting searches doubled; custom pet gift)", "secondary": "Mark of the Maker (hand engraved)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.5, "pieces": 1, "adders": 75, "adders_detail": "intaglio hand engraving 50 + name engraving 25; enamel fill offered at the same price; 16 in chain included in the grams", "base14": 645}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "58f61477b96f6c3b0cf42525bdc9b2a7", "personalizationQuestions": [{"question_type": "text_input", "question_text": "Pet name and paw style", "instructions": "Pet name for the back (up to 10 characters), then dog or cat for the paw. Example: Biber / dog. A year may follow.", "required": true, "max_allowed_characters": 24}]}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L09$fw$ or p.id = $fw$07f74af4-71f6-51a7-bfbc-dfc55579bb4a$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L09-10K-16-PG$fw$, $fw$Paw Seal: 10K, 16 inches, Plain gold$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Paw Finish": "Plain gold"}$fw$, 60484, 2.23),
  ($fw$BAS-FW26-L09-10K-16-CO$fw$, $fw$Paw Seal: 10K, 16 inches, Cobalt enamel$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Paw Finish": "Cobalt enamel"}$fw$, 60484, 2.23),
  ($fw$BAS-FW26-L09-10K-16-CR$fw$, $fw$Paw Seal: 10K, 16 inches, Cranberry enamel$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Paw Finish": "Cranberry enamel"}$fw$, 60484, 2.23),
  ($fw$BAS-FW26-L09-10K-16-BK$fw$, $fw$Paw Seal: 10K, 16 inches, Black enamel$fw$, $fw${"Karat": "10K", "Chain Length": "16 inches", "Paw Finish": "Black enamel"}$fw$, 60484, 2.23),
  ($fw$BAS-FW26-L09-10K-18-PG$fw$, $fw$Paw Seal: 10K, 18 inches, Plain gold$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Paw Finish": "Plain gold"}$fw$, 63014, 2.23),
  ($fw$BAS-FW26-L09-10K-18-CO$fw$, $fw$Paw Seal: 10K, 18 inches, Cobalt enamel$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Paw Finish": "Cobalt enamel"}$fw$, 63014, 2.23),
  ($fw$BAS-FW26-L09-10K-18-CR$fw$, $fw$Paw Seal: 10K, 18 inches, Cranberry enamel$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Paw Finish": "Cranberry enamel"}$fw$, 63014, 2.23),
  ($fw$BAS-FW26-L09-10K-18-BK$fw$, $fw$Paw Seal: 10K, 18 inches, Black enamel$fw$, $fw${"Karat": "10K", "Chain Length": "18 inches", "Paw Finish": "Black enamel"}$fw$, 63014, 2.23),
  ($fw$BAS-FW26-L09-10K-20-PG$fw$, $fw$Paw Seal: 10K, 20 inches, Plain gold$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Paw Finish": "Plain gold"}$fw$, 65544, 2.23),
  ($fw$BAS-FW26-L09-10K-20-CO$fw$, $fw$Paw Seal: 10K, 20 inches, Cobalt enamel$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Paw Finish": "Cobalt enamel"}$fw$, 65544, 2.23),
  ($fw$BAS-FW26-L09-10K-20-CR$fw$, $fw$Paw Seal: 10K, 20 inches, Cranberry enamel$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Paw Finish": "Cranberry enamel"}$fw$, 65544, 2.23),
  ($fw$BAS-FW26-L09-10K-20-BK$fw$, $fw$Paw Seal: 10K, 20 inches, Black enamel$fw$, $fw${"Karat": "10K", "Chain Length": "20 inches", "Paw Finish": "Black enamel"}$fw$, 65544, 2.23),
  ($fw$BAS-FW26-L09-14K-16-PG$fw$, $fw$Paw Seal: 14K, 16 inches, Plain gold$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Paw Finish": "Plain gold"}$fw$, 81592, 2.50),
  ($fw$BAS-FW26-L09-14K-16-CO$fw$, $fw$Paw Seal: 14K, 16 inches, Cobalt enamel$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Paw Finish": "Cobalt enamel"}$fw$, 81592, 2.50),
  ($fw$BAS-FW26-L09-14K-16-CR$fw$, $fw$Paw Seal: 14K, 16 inches, Cranberry enamel$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Paw Finish": "Cranberry enamel"}$fw$, 81592, 2.50),
  ($fw$BAS-FW26-L09-14K-16-BK$fw$, $fw$Paw Seal: 14K, 16 inches, Black enamel$fw$, $fw${"Karat": "14K", "Chain Length": "16 inches", "Paw Finish": "Black enamel"}$fw$, 81592, 2.50),
  ($fw$BAS-FW26-L09-14K-18-PG$fw$, $fw$Paw Seal: 14K, 18 inches, Plain gold$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Paw Finish": "Plain gold"}$fw$, 84122, 2.50),
  ($fw$BAS-FW26-L09-14K-18-CO$fw$, $fw$Paw Seal: 14K, 18 inches, Cobalt enamel$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Paw Finish": "Cobalt enamel"}$fw$, 84122, 2.50),
  ($fw$BAS-FW26-L09-14K-18-CR$fw$, $fw$Paw Seal: 14K, 18 inches, Cranberry enamel$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Paw Finish": "Cranberry enamel"}$fw$, 84122, 2.50),
  ($fw$BAS-FW26-L09-14K-18-BK$fw$, $fw$Paw Seal: 14K, 18 inches, Black enamel$fw$, $fw${"Karat": "14K", "Chain Length": "18 inches", "Paw Finish": "Black enamel"}$fw$, 84122, 2.50),
  ($fw$BAS-FW26-L09-14K-20-PG$fw$, $fw$Paw Seal: 14K, 20 inches, Plain gold$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Paw Finish": "Plain gold"}$fw$, 87917, 2.50),
  ($fw$BAS-FW26-L09-14K-20-CO$fw$, $fw$Paw Seal: 14K, 20 inches, Cobalt enamel$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Paw Finish": "Cobalt enamel"}$fw$, 87917, 2.50),
  ($fw$BAS-FW26-L09-14K-20-CR$fw$, $fw$Paw Seal: 14K, 20 inches, Cranberry enamel$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Paw Finish": "Cranberry enamel"}$fw$, 87917, 2.50),
  ($fw$BAS-FW26-L09-14K-20-BK$fw$, $fw$Paw Seal: 14K, 20 inches, Black enamel$fw$, $fw${"Karat": "14K", "Chain Length": "20 inches", "Paw Finish": "Black enamel"}$fw$, 87917, 2.50),
  ($fw$BAS-FW26-L09-18K-16-PG$fw$, $fw$Paw Seal: 18K, 16 inches, Plain gold$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Paw Finish": "Plain gold"}$fw$, 106886, 2.84),
  ($fw$BAS-FW26-L09-18K-16-CO$fw$, $fw$Paw Seal: 18K, 16 inches, Cobalt enamel$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Paw Finish": "Cobalt enamel"}$fw$, 106886, 2.84),
  ($fw$BAS-FW26-L09-18K-16-CR$fw$, $fw$Paw Seal: 18K, 16 inches, Cranberry enamel$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Paw Finish": "Cranberry enamel"}$fw$, 106886, 2.84),
  ($fw$BAS-FW26-L09-18K-16-BK$fw$, $fw$Paw Seal: 18K, 16 inches, Black enamel$fw$, $fw${"Karat": "18K", "Chain Length": "16 inches", "Paw Finish": "Black enamel"}$fw$, 106886, 2.84),
  ($fw$BAS-FW26-L09-18K-18-PG$fw$, $fw$Paw Seal: 18K, 18 inches, Plain gold$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Paw Finish": "Plain gold"}$fw$, 111946, 2.84),
  ($fw$BAS-FW26-L09-18K-18-CO$fw$, $fw$Paw Seal: 18K, 18 inches, Cobalt enamel$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Paw Finish": "Cobalt enamel"}$fw$, 111946, 2.84),
  ($fw$BAS-FW26-L09-18K-18-CR$fw$, $fw$Paw Seal: 18K, 18 inches, Cranberry enamel$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Paw Finish": "Cranberry enamel"}$fw$, 111946, 2.84),
  ($fw$BAS-FW26-L09-18K-18-BK$fw$, $fw$Paw Seal: 18K, 18 inches, Black enamel$fw$, $fw${"Karat": "18K", "Chain Length": "18 inches", "Paw Finish": "Black enamel"}$fw$, 111946, 2.84),
  ($fw$BAS-FW26-L09-18K-20-PG$fw$, $fw$Paw Seal: 18K, 20 inches, Plain gold$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Paw Finish": "Plain gold"}$fw$, 117006, 2.84),
  ($fw$BAS-FW26-L09-18K-20-CO$fw$, $fw$Paw Seal: 18K, 20 inches, Cobalt enamel$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Paw Finish": "Cobalt enamel"}$fw$, 117006, 2.84),
  ($fw$BAS-FW26-L09-18K-20-CR$fw$, $fw$Paw Seal: 18K, 20 inches, Cranberry enamel$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Paw Finish": "Cranberry enamel"}$fw$, 117006, 2.84),
  ($fw$BAS-FW26-L09-18K-20-BK$fw$, $fw$Paw Seal: 18K, 20 inches, Black enamel$fw$, $fw${"Karat": "18K", "Chain Length": "20 inches", "Paw Finish": "Black enamel"}$fw$, 117006, 2.84)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L09$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

-- L10 Twin Eye: 27 variants (Karat x Metal Color x Length), seal 4561246ab97307059caf16f6a2b33604, md5(description) 0a532b2c0eaf8a0a912e46494f3fd168, tags 7fd196eda4a3f7251bdebbcc7bb2b87c
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select $fw$8624b18d-adeb-539f-b920-afbfc1598d6b$fw$::uuid, '2c254edf-2119-4079-b09e-dc672e32c1f9', $fw$BAS-FW26-L10$fw$, $fw$Matching Evil Eye Bracelet Set of 2 in Solid Gold, Twin Eye Friendship Bracelets with Cobalt Enamel and Engraved Initials, Best Friend Gift$fw$, $fw$Two bracelets that make one eye. The first carries the almond outline in open solid gold wire; the second carries the iris, a 4 mm gold dome with a cobalt blue kiln-fired enamel center. Each is a quiet bracelet alone. Held wrist to wrist, they complete the eye that has watched over this part of the world for five thousand years. One for you, one for the friend, sister or partner you would call first.

- The almond measures 9 x 5 mm in 0.9 mm wire; the iris dome is 4 mm. Both sit as connectors in a 1.2 mm solid gold cable chain with spring ring clasp and a small gold tag at the clasp.
- Personalization: one initial engraved on each tag, written in the order almond, then iris. Leave the field blank if you prefer them plain.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a length of 6.5, 7 or 7.5 inches for the set. If you need two different lengths, write both in the personalization field.
- The enamel is fired by hand in a recessed cell with a polished gold rim, in the same cobalt as our Evil Eye collection, so the set stacks with it.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. The two bracelets arrive in separate gift boxes.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.$fw$,
  ARRAY[$fw$evil eye bracelets$fw$,$fw$matching bracelets$fw$,$fw$friendship bracelets$fw$,$fw$best friend bracelet$fw$,$fw$sister bracelet set$fw$,$fw$couples bracelet set$fw$,$fw$friend group gift$fw$,$fw$friendsmas gift$fw$,$fw$nazar bracelet gold$fw$,$fw$cobalt enamel eye$fw$,$fw$solid gold evil eye$fw$,$fw$set of 2 bracelets$fw$,$fw$initial bracelet set$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  84865, 20, true, null, 0, 'bracelet',
  $fw${"productType": "bracelet", "listingProtocol": "chain_bracelet", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L10", "name": "Twin Eye", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color", "Length"], "category": "Jewelry > Bracelets > Chain & Link Bracelets", "section": "Bracelets (cross-link from Evil Eye via tags)", "attributes": {"Primary color": "Gold", "Secondary color": "Blue", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "5 to 7 business days", "trend": {"anchor": "Family Reimagined (friend gifts +1,400%, matching sets)", "secondary": "Merrymaxxing (cobalt enamel); brand pillar: the eye"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": true, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 1.9, "pieces": 2, "adders": 75, "adders_detail": "two make-floors + enamel cell 25 + two tag engravings 50", "base14": 905}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "4561246ab97307059caf16f6a2b33604", "personalizationQuestions": [{"question_type": "text_input", "question_text": "Initials for the two tags (optional)", "instructions": "Two initials, almond bracelet first, then iris (e.g. H / C). Add a second length if wrists differ (e.g. H 6.5 / C 7).", "required": false, "max_allowed_characters": 40}]}$fw$::jsonb
where not exists (select 1 from public.products p where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9'
  and (p.sku = $fw$BAS-FW26-L10$fw$ or p.id = $fw$8624b18d-adeb-539f-b920-afbfc1598d6b$fw$::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
  ($fw$BAS-FW26-L10-10K-Y-6_5$fw$, $fw$Twin Eye: 10K, Yellow Gold, 6.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Length": "6.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-Y-7$fw$, $fw$Twin Eye: 10K, Yellow Gold, 7 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Length": "7 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-Y-7_5$fw$, $fw$Twin Eye: 10K, Yellow Gold, 7.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Yellow Gold", "Length": "7.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-W-6_5$fw$, $fw$Twin Eye: 10K, White Gold, 6.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Length": "6.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-W-7$fw$, $fw$Twin Eye: 10K, White Gold, 7 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Length": "7 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-W-7_5$fw$, $fw$Twin Eye: 10K, White Gold, 7.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "White Gold", "Length": "7.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-R-6_5$fw$, $fw$Twin Eye: 10K, Rose Gold, 6.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Length": "6.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-R-7$fw$, $fw$Twin Eye: 10K, Rose Gold, 7 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Length": "7 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-10K-R-7_5$fw$, $fw$Twin Eye: 10K, Rose Gold, 7.5 inches$fw$, $fw${"Karat": "10K", "Metal Color": "Rose Gold", "Length": "7.5 inches"}$fw$, 84865, 1.69),
  ($fw$BAS-FW26-L10-14K-Y-6_5$fw$, $fw$Twin Eye: 14K, Yellow Gold, 6.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Length": "6.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-Y-7$fw$, $fw$Twin Eye: 14K, Yellow Gold, 7 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Length": "7 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-Y-7_5$fw$, $fw$Twin Eye: 14K, Yellow Gold, 7.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Yellow Gold", "Length": "7.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-W-6_5$fw$, $fw$Twin Eye: 14K, White Gold, 6.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Length": "6.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-W-7$fw$, $fw$Twin Eye: 14K, White Gold, 7 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Length": "7 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-W-7_5$fw$, $fw$Twin Eye: 14K, White Gold, 7.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "White Gold", "Length": "7.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-R-6_5$fw$, $fw$Twin Eye: 14K, Rose Gold, 6.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Length": "6.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-R-7$fw$, $fw$Twin Eye: 14K, Rose Gold, 7 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Length": "7 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-14K-R-7_5$fw$, $fw$Twin Eye: 14K, Rose Gold, 7.5 inches$fw$, $fw${"Karat": "14K", "Metal Color": "Rose Gold", "Length": "7.5 inches"}$fw$, 114482, 1.90),
  ($fw$BAS-FW26-L10-18K-Y-6_5$fw$, $fw$Twin Eye: 18K, Yellow Gold, 6.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Length": "6.5 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-Y-7$fw$, $fw$Twin Eye: 18K, Yellow Gold, 7 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Length": "7 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-Y-7_5$fw$, $fw$Twin Eye: 18K, Yellow Gold, 7.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Yellow Gold", "Length": "7.5 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-W-6_5$fw$, $fw$Twin Eye: 18K, White Gold, 6.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Length": "6.5 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-W-7$fw$, $fw$Twin Eye: 18K, White Gold, 7 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Length": "7 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-W-7_5$fw$, $fw$Twin Eye: 18K, White Gold, 7.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "White Gold", "Length": "7.5 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-R-6_5$fw$, $fw$Twin Eye: 18K, Rose Gold, 6.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Length": "6.5 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-R-7$fw$, $fw$Twin Eye: 18K, Rose Gold, 7 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Length": "7 inches"}$fw$, 149972, 2.16),
  ($fw$BAS-FW26-L10-18K-R-7_5$fw$, $fw$Twin Eye: 18K, Rose Gold, 7.5 inches$fw$, $fw${"Karat": "18K", "Metal Color": "Rose Gold", "Length": "7.5 inches"}$fw$, 149972, 2.16)
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L10$fw$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

commit;

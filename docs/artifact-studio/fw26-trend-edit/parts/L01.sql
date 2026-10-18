begin;
-- L01 Seal Pin: 9 variants (Karat x Metal Color), seal 8af2742b9040f051ae9973c47a9cdb12, md5(description) 432861b75e221d58994520894d3f8f9b, tags 9675bcb92d78f229d14333a403f6690a
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
- A gift message can be added at checkout. Please check the spelling at checkout; engraved pieces are made specifically for you.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$mens lapel pin$fw$,$fw$gold lapel pin$fw$,$fw$solid gold brooch$fw$,$fw$mens brooch$fw$,$fw$stick pin for men$fw$,$fw$tuxedo lapel pin$fw$,$fw$groomsmen gift gold$fw$,$fw$heirloom jewelry$fw$,$fw$engraved lapel pin$fw$,$fw$cylinder seal$fw$,$fw$wedding lapel pin$fw$,$fw$gift for him gold$fw$,$fw$opera inspired$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  58608, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/01.jpg$fw$, 5, 'other',
  $fw${"productType": "other", "listingProtocol": "stick_pin", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L01", "name": "Seal Pin", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color"], "category": "Accessories > Pins & Clips > Hat Pins & Stick Pins", "section": "Brooches & Pins (new section; also tag the listing in For Him via title and tags)", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Wedding", "Recipient": "Men", "Style": "Classic"}, "processing": "5 to 7 business days", "trend": {"anchor": "Operatic Drama (men's brooches +70%, vintage jewelry +75%)", "secondary": "Family Reimagined (personalized gift)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.4, "pieces": 1, "adders": 65, "adders_detail": "engraving 25 + solid gold pin and clutch 40", "base14": 625}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "8af2742b9040f051ae9973c47a9cdb12", "personalizationQuestions": [{"question_type": "text_input", "question_text": "End cap initials (optional)", "instructions": "Up to 3 initials for the end cap, typed exactly as you want them cut (e.g. H.A. or HEA). Blank means no engraving.", "required": false, "max_allowed_characters": 5}]}$fw$::jsonb
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

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/01.jpg$fw$, $fw$Seal Pin, a fluted solid gold cylinder stick pin, on black velvet$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/02.jpg$fw$, $fw$Seal Pin worn on the lapel of a grey wool jacket$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/03.jpg$fw$, $fw$Close-up of the twelve flutes and the plain polished end cap$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/04.jpg$fw$, $fw$Seal Pin in yellow, white and rose gold (colour visualization)$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L01/05.jpg$fw$, $fw$Seal Pin resting on an open palm for scale$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L01$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

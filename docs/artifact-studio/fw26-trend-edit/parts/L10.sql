begin;
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

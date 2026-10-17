begin;
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
commit;

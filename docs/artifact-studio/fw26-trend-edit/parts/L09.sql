begin;
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
commit;

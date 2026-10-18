begin;
-- L08 Split Infinity: 18 variants (Set x Karat x Metal Color), seal ae7dd607f3b91f0e56896b27a48eec18, md5(description) 0cac0efaa64168db67724e03bbda845b, tags 1824608bad31cfab5cf56d2169eaa901
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
- Gold does not tarnish. A soft cloth keeps it bright. A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$friendship necklace$fw$,$fw$best friend necklace$fw$,$fw$matching necklaces$fw$,$fw$friend group gift$fw$,$fw$friendsmas gift$fw$,$fw$set of 3 necklaces$fw$,$fw$infinity necklace$fw$,$fw$sister necklace set$fw$,$fw$couples necklace set$fw$,$fw$personalized gift$fw$,$fw$chosen family gift$fw$,$fw$bff necklace gold$fw$,$fw$initial necklace set$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  102213, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/01.jpg$fw$, 5, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": true, "modelId": "L08", "name": "Split Infinity", "collection": "FW26 Trend Edit", "variationAxes": ["Set", "Karat", "Metal Color"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Minimalist"}, "processing": "5 to 7 business days", "trend": {"anchor": "Family Reimagined (personalized friend gifts +1,400%, Friendsmas +37%)", "secondary": "brand pillar: infinity"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 4.0, "pieces": 2, "adders": 50, "adders_detail": "set of 2: two make-floors + two engravings 50", "base14": 1090}, "set_options": {"2 pendants": {"grams14": 4.0, "pieces": 2, "adders": 50, "base14": 1090}, "3 pendants": {"grams14": 5.9, "pieces": 3, "adders": 75, "base14": 1625, "brief_prices": {"10K": [1523.81, 1066.67], "14K": [2055.62, 1438.93], "18K": [2692.87, 1885.01]}}}, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "ae7dd607f3b91f0e56896b27a48eec18", "personalizationQuestions": [{"question_type": "text_input", "question_text": "Initials, one per pendant (optional)", "instructions": "One initial per pendant, left to right (e.g. H / E / C). Add a chain length per pendant if needed (e.g. H 16 / E 18).", "required": false, "max_allowed_characters": 40}]}$fw$::jsonb
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

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/01.jpg$fw$, $fw$Split Infinity: three solid gold pendants that close into one infinity loop$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/02.jpg$fw$, $fw$Three friends at a cafe table with the set between them$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/03.jpg$fw$, $fw$The three pieces apart, each on its own chain$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/04.jpg$fw$, $fw$Close-up of a wavy seam between two pieces$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L08/05.jpg$fw$, $fw$Split Infinity in yellow, white and rose gold (colour visualization)$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L08$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

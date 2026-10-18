begin;
-- L05 Nar (Pomegranate): 27 variants (Karat x Metal Color x Chain Length), seal 11bddff1d6061782deacd26ac6944ac4, md5(description) 68d8efd4d94cb79f354cc8714408b10e, tags f826f101c5875dcc987c6538c257ba02
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
- A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$pomegranate necklace$fw$,$fw$pomegranate jewelry$fw$,$fw$garnet necklace gold$fw$,$fw$enamel pendant gold$fw$,$fw$bold color necklace$fw$,$fw$solid gold charm$fw$,$fw$abundance gift$fw$,$fw$hostess gift gold$fw$,$fw$new home gift gold$fw$,$fw$anatolian jewelry$fw$,$fw$whimsical necklace$fw$,$fw$red enamel necklace$fw$,$fw$christmas necklace$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$Garnet$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  64703, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/01.jpg$fw$, 5, 'necklace',
  $fw${"productType": "necklace", "listingProtocol": "pendant_necklace", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L05", "name": "Nar (Pomegranate)", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Metal Color", "Chain Length"], "category": "Jewelry > Necklaces > Pendant Necklaces", "section": "Necklaces", "attributes": {"Primary color": "Red", "Secondary color": "Gold", "Holiday": "Christmas", "Occasion": "Housewarming", "Recipient": "Women", "Style": "Whimsical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Merrymaxxing (gemstones, bold color, whimsy)", "secondary": "Family Reimagined (gift for a household, a host, a friend)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 3.0, "pieces": 1, "adders": 70, "adders_detail": "three garnets bead set 45 + enamel cell 25; 16 in chain included in the grams", "base14": 690}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "11bddff1d6061782deacd26ac6944ac4"}$fw$::jsonb
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

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/01.jpg$fw$, $fw$Nar pomegranate pendant in solid gold with cranberry enamel and garnet seeds$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/02.jpg$fw$, $fw$Nar pendant worn over a black turtleneck$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/03.jpg$fw$, $fw$Close-up of the enamel skin and the three garnet seeds$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/04.jpg$fw$, $fw$Nar pendant in yellow, white and rose gold (colour visualization)$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L05/05.jpg$fw$, $fw$Nar pendant on a holiday table with pomegranates$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L05$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

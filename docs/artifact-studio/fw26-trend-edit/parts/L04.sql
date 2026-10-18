begin;
-- L04 Ur Band: 78 variants (Karat x Ring Size x Palette), seal 7efaedb2bee4170dc6392646717c0d75, md5(description) 5268f4edcc15f54a463d9418ee52eb9b, tags 2c58deea192490021834dc91a165f9a4
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
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.
- The product images are design visualizations of the finished piece, not photographs of a cast sample, and the multi-metal images are colour visualizations of the same design; the handmade piece may vary slightly.$fw$,
  ARRAY[$fw$enamel ring$fw$,$fw$mosaic ring$fw$,$fw$bold color ring$fw$,$fw$maximalist ring$fw$,$fw$statement ring gold$fw$,$fw$stacking ring enamel$fw$,$fw$colorful gold ring$fw$,$fw$kiln fired enamel$fw$,$fw$solid gold band ring$fw$,$fw$lapis blue ring$fw$,$fw$whimsical ring$fw$,$fw$hand enameled ring$fw$,$fw$sumerian jewelry$fw$]::text[], ARRAY[$fw$Solid gold$fw$,$fw$Vitreous enamel$fw$,$fw$14K gold$fw$,$fw$10K gold$fw$,$fw$18K gold$fw$]::text[], 'draft', 'USD',
  68454, 20, true, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/01.jpg$fw$, 5, 'ring',
  $fw${"productType": "ring", "listingProtocol": "ring_band", "protocolVersion": "etsy-listing-v1", "offersPersonalization": false, "modelId": "L04", "name": "Ur Band", "collection": "FW26 Trend Edit", "variationAxes": ["Karat", "Ring Size", "Palette"], "category": "Jewelry > Rings > Bands", "section": "Rings", "attributes": {"Primary color": "Blue", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Birthday", "Recipient": "Women", "Style": "Whimsical"}, "processing": "3 to 5 business days", "trend": {"anchor": "Merrymaxxing (bold color, whimsy +110%)", "secondary": "Mark of the Maker (fired cell by cell by hand)"}, "sourcePackage": "2026-10-17-artifact-fw26-trend-edit", "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit", "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py", "weightSource": "geometry_estimate", "missingHero": false, "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70", "basis": {"grams14": 2.9, "pieces": 1, "adders": 120, "adders_detail": "12 cells, 3 to 5 colors, multiple firings and flush stoning", "base14": 730}, "set_options": null, "status": "ESTIMATE_BRIEF_FW26", "panelPriceIs": "Etsy list price (base x 1.265)"}, "approval": {"blockers": ["Images are design visualizations (Higgsfield, images/jobs.json); photograph the cast piece per photography/photo-plan.md and replace them.", "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md)."], "etsyDraftCreationAuthorized": true, "livePublicationAuthorized": false, "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."}, "variantSeal": "7efaedb2bee4170dc6392646717c0d75"}$fw$::jsonb
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

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
  (0, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/01.jpg$fw$, $fw$Ur Band, a solid gold ring with lapis, cranberry and shell white enamel cells$fw$),
  (1, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/02.jpg$fw$, $fw$Ur Band worn on the ring finger, stacked with a plain band$fw$),
  (2, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/03.jpg$fw$, $fw$The Ur palette and the Festival palette side by side$fw$),
  (3, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/04.jpg$fw$, $fw$Close-up of three flush enamel cells and the gold walls between them$fw$),
  (4, $fw$https://amuletta.artifactstudio.info/artifact/fw26/L04/05.jpg$fw$, $fw$Ur Band among lapis, carnelian and a sea shell$fw$)
) g(pos, url, alt)
join public.products p on p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku = $fw$BAS-FW26-L04$fw$ and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
commit;

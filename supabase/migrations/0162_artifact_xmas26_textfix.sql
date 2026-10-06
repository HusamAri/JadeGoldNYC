-- 0162_artifact_xmas26_textfix.sql
-- Christmas 2026: listing text brought to the approved images (B07, R09).
-- Generator: docs/artifact-studio/xmas26/gen_textfix_migration.py. DO NOT EDIT BY HAND. Panel only.
-- Seal (run after apply):
--   select md5(string_agg(sku||'|'||md5(description), E'\n' order by sku collate "C")) from products
--   where org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and sku like 'BAS-XM-%';
--   expected: e64e33ef02139bc1c667eb2bfc94a3e8
begin;
update public.products set description = $tf$A mistletoe sprig in sage green and white enamel, set at the centre of a fine solid gold chain.

Three leaves and four white berries lying flat on the top of the wrist, the quietest piece in the family.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose.
Enamel: kiln-fired vitreous enamel in mistletoe sage and snow white, set flush in recessed cells with polished gold rims.
Size: sprig 10 x 6 mm.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$tf$
where org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and sku = 'BAS-XM-B07' and etsy_listing_id is null and description = $tf$A mistletoe sprig in sage green and white enamel, set at the centre of a fine solid gold chain.

Two leaves and three white berries lying flat on the top of the wrist, the quietest piece in the family.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose.
Enamel: kiln-fired vitreous enamel in mistletoe sage and snow white, set flush in recessed cells with polished gold rims.
Size: sprig 10 x 6 mm.
Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$tf$;
update public.products set description = $tf$A poinsettia in bright red enamel with a beaded gold centre, on a solid gold band.

The Christmas flower drawn simply: pointed petals, each with a gold vein, around a cluster of tiny gold beads.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose.
Enamel: kiln-fired vitreous enamel in poinsettia red, set flush in recessed cells with polished gold rims.
Size: flower 9 mm.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$tf$
where org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and sku = 'BAS-XM-R09' and etsy_listing_id is null and description = $tf$A five-petal poinsettia in bright red enamel with a beaded gold centre, on a solid gold band.

The Christmas flower drawn simply: five pointed petals, each with a gold vein, around a cluster of tiny gold beads.

Metal: solid 10K, 14K or 18K gold in yellow, white or rose.
Enamel: kiln-fired vitreous enamel in poinsettia red, set flush in recessed cells with polished gold rims.
Size: flower 9 mm.
Ring size: US 3 to 16, whole and half sizes.

Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.

Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.

The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$tf$;
commit;

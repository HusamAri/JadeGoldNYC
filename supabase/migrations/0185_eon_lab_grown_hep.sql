-- 0185_eon_lab_grown_hep.sql
-- EON lab-grown 05 (EON-HEP): 14K, 1,5 × 1,5 mm bant, üst yarıda tek sıra ~1,3 mm round taş, paylaşımlı mikro tırnak
-- (US 4 19 → US 8½ 23 → US 16 30 taş). Taş seçimi Etsy kişiselleştirme açılır listesi: 20 taş (sahibin tablosu),
-- varsayılan Lab Grown Diamond; listing_metadata.personalizationQuestions. Metal Color × Ring Size US 4-16 yarım
-- bedenler (75 varyant), ring_band. Tek fiyat $1.050 (alıcı %25 vitrinle $787,50), her beden ve her taş.
-- Maliyet US 8½ $341 (1,91 g × $100 + 23 × (lab $2,52 + takma $4)); en kötü Offsite kârı en düşük US 16: lab +$138,
-- en pahalı taş ($5/taş) +$63. Takma beden başına varyant taş maliyetinde, products.setting_fee_cents 0.
-- Kanıt: docs/eon/lab-grown/2026-11-11-half-eternity-pave-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/05-half-eternity-pave/. Üretici: scripts/eon/gen_lab_grown_hep_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-HEP-%';
--   beklenen: 54bb79369f3ccc574c28f829c9ede406
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-HEP', $ww$14K Gold Lab Grown Diamond Half Eternity Band, Micro Pave, Choose Your Stone, 1.5mm$ww$,
  $ww$A slim solid 14K gold band, about 1.5 mm wide, with one row of small round stones across the top half, each held by tiny shared prongs so the stones sit close together in a continuous line of light. Choose lab grown diamonds, as shown in the photos, or any of 19 other stones, from moissanite and lab created sapphire to amethyst and cultured pearl. Every stone is the same price.

YOUR RING
Solid 14K gold in yellow, white or rose, polished all over. The band is about 1.5 mm wide and 1.5 mm thick. The stones run around the top half of the ring: about 23 round stones of about 1.3 mm in US 8.5, a few more in larger sizes and a few fewer in smaller ones, so the row always fills the half that shows. The lower half is plain polished gold. About 1.7 grams in US 8.5. The price is for one ring in your selected metal color, size and stone; all stones are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes.
3. Stone: choose one from the Stone list; every stone in your ring will be that stone.
One price for every size and every stone.

THE STONE CHOICES
Lab Grown Diamond: colorless laboratory-grown diamonds, the stone in the photos, with the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants.
Moissanite: a laboratory-created gem of silicon carbide, harder than sapphire, with strong rainbow fire.
Natural salt and pepper diamonds: white and grey stones with natural dark and light inclusions, so every ring looks a little different.
Natural black diamonds: natural diamonds treated to an even, deep black; the color treatment is permanent.
Lab Created Sapphire, Lab Created Ruby, Lab Created Emerald and Created Alexandrite: laboratory-created gems with the same chemistry and crystal structure as the natural stones, in a clear, even color. Alexandrite changes color, teal green in daylight and raspberry purple under warm indoor light.
Amethyst, Aquamarine, Blue Topaz, Morganite, Pink Tourmaline and Tanzanite: natural gemstones. Aquamarine, morganite and tanzanite are routinely heated and blue topaz is irradiated to set their color; these treatments are permanent and standard in the trade.
Opal, Moonstone, Rose Quartz, Turquoise, Black Onyx and Cultured Pearl: natural opal, moonstone and rose quartz; natural turquoise, stabilized; natural onyx, dyed black (permanent); cultured freshwater seed pearls. Opal, moonstone, turquoise and pearl are softer than the other choices and can scratch or chip with knocks, so they suit a ring worn with care.
Natural stones and cultured pearls vary a little in color and pattern from ring to ring.

THE SETTING
Each stone sits in its own seat along the top of the band, held by tiny prongs shared between neighboring stones. The stones stop at the sides, so the plain lower half stays smooth between your fingers.

SIZING AND RESIZING
Made to order in your size. A jeweler can usually resize the plain lower half by about half a size; the row of stones stays as made. Message us before ordering if you are between sizes.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and ultrasonic cleaners, which can loosen small stones and harm opal, turquoise and pearl. Remove the ring before heavy work, sport or swimming.$ww$,
  ARRAY[$ww$half eternity band$ww$,$ww$lab grown diamond$ww$,$ww$micro pave band$ww$,$ww$stackable gold ring$ww$,$ww$thin gold band$ww$,$ww$dainty gold ring$ww$,$ww$eternity ring$ww$,$ww$gemstone band$ww$,$ww$moissanite band$ww$,$ww$sapphire band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$,$ww$14k gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$,$ww$Moissanite$ww$,$ww$Lab created gemstones$ww$,$ww$Natural gemstones$ww$,$ww$Cultured pearl$ww$]::text[], 'draft', 'USD',
  105000, 20, true, null, 0, 'ring',
  'round', 'lab', 23, 0, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-11-eon-lab-grown-hep","sourcePackagePath":"docs/eon/lab-grown/05-half-eternity-pave","generatorScript":"scripts/eon/gen_lab_grown_hep_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/685259244/classic-natural-diamond-wedding-band18k","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":true,"personalizationQuestions":[{"question_type":"dropdown","question_text":"Stone","required":true,"options":[{"label":"Lab Grown Diamond"},{"label":"Moissanite"},{"label":"Salt Pepper Diamond"},{"label":"Black Diamond"},{"label":"Lab Created Sapphire"},{"label":"Lab Created Ruby"},{"label":"Lab Created Emerald"},{"label":"Created Alexandrite"},{"label":"Amethyst"},{"label":"Aquamarine"},{"label":"Blue Topaz"},{"label":"Morganite"},{"label":"Pink Tourmaline"},{"label":"Tanzanite"},{"label":"Opal"},{"label":"Moonstone"},{"label":"Rose Quartz"},{"label":"Turquoise"},{"label":"Black Onyx"},{"label":"Cultured Pearl"}]}],"stone":{"origin":"lab","shape":"round","count":23,"countBySize":"half the outer circumference / 1.45 mm pitch (stone 1.3 mm + shared prong about 0.15 mm), rounded: US 4 19, US 6 21, US 8.5 23, US 12 26, US 16 30 (products.stone_count holds the US 8.5 count)","sizeMm":"1.3","caratEach":0.009,"totalCarat":0.21,"perSizeStoneFields":true,"caratNote":"1.3 mm round brilliant is about 0.009 ct (standard round chart), so about 0.21 ct at US 8.5 and 0.17-0.27 ct across US 4-16; product_variants.stone_carat carries the per-size figure (numeric(5,2)). Carat weight is NOT stated in public text until the maker confirms the stone size and count.","colorClarity":null,"settingFeeCents":0,"settingPerStoneCents":400,"castingFeeCents":0,"defaultStoneCentsEach":252,"capStoneCentsEach":500,"stoneCostCentsEstimate":14996,"stoneCostNote":"No maker quote for this design. Stones: the maker's only known lab rate is 280 USD/ct (Model 2 baguette), so a 1.3 mm lab grown diamond (0.009 ct) is 2.52 USD; the price covers the costliest choice at 5.00 USD a stone (natural salt and pepper diamond up to about 555 USD/ct, tanzanite about 4 USD), all uncalibrated. Setting: 4 USD a stone, the maker's DSP note ('taş takma $4', 2.4 mm stones; not calibrated for 1.3 mm micro prongs). Because the stone count changes with the size, the setting is folded into each variant's stone_cost_cents (count x (2.52 + 4.00) USD for the default lab grown diamond; 14996 cents at US 8.5) and products.setting_fee_cents is 0, so the panel's variant_stone_cost view sees the right figure in every size."},"stoneChoices":[{"label":"Lab Grown Diamond","chartName":"Diamond","origin":"lab","centsEach":252,"note":"default; the stone in the photos"},{"label":"Moissanite","chartName":"Moissanite","origin":"lab","centsEach":100,"note":"laboratory-created silicon carbide; the label needs no qualifier because no natural gem moissanite is sold, the description says laboratory-created"},{"label":"Salt Pepper Diamond","chartName":"Salt and Pepper Diamond","origin":"natural","centsEach":450,"note":"'Salt & Pepper Diamond' is 21 characters (Etsy dropdown limit 20); unqualified 'diamond' means natural under FTC 16 CFR 23.12, and the description says natural"},{"label":"Black Diamond","chartName":"Black Diamond","origin":"natural","treatment":"color-treated, permanent","centsEach":200},{"label":"Lab Created Sapphire","chartName":"Sapphire","origin":"lab","centsEach":100},{"label":"Lab Created Ruby","chartName":"Ruby","origin":"lab","centsEach":100},{"label":"Lab Created Emerald","chartName":"Emerald","origin":"lab","centsEach":200},{"label":"Created Alexandrite","chartName":"Alexandrite","origin":"lab","centsEach":200,"note":"'Lab Created Alexandrite' is 23 characters; 'created' is the trade's laboratory-created term (FTC 23.23: '[manufacturer]-created' or a word of like meaning); natural alexandrite melee costs several thousand USD a carat"},{"label":"Amethyst","chartName":"Amethyst","origin":"natural","centsEach":75},{"label":"Aquamarine","chartName":"Aquamarine","origin":"natural","treatment":"routinely heated","centsEach":300},{"label":"Blue Topaz","chartName":"Topaz","origin":"natural","treatment":"irradiated, permanent","centsEach":75},{"label":"Morganite","chartName":"Morganite","origin":"natural","treatment":"routinely heated","centsEach":300},{"label":"Pink Tourmaline","chartName":"Tourmaline","origin":"natural","centsEach":300},{"label":"Tanzanite","chartName":"Tanzanite","origin":"natural","treatment":"routinely heated","centsEach":400},{"label":"Opal","chartName":"Opal","origin":"natural","soft":true,"centsEach":300},{"label":"Moonstone","chartName":"Moonstone","origin":"natural","soft":true,"centsEach":150},{"label":"Rose Quartz","chartName":"Rose quartz","origin":"natural","centsEach":50},{"label":"Turquoise","chartName":"Turquoise","origin":"natural","treatment":"stabilized","soft":true,"centsEach":100},{"label":"Black Onyx","chartName":"Black Onyx","origin":"natural","treatment":"dyed, permanent","centsEach":50},{"label":"Cultured Pearl","chartName":"Pearl","origin":"cultured","soft":true,"centsEach":100}],"band":{"widthMm":1.5,"thicknessMm":1.5,"karat":"14K","profile":"slim round-edged band, polished all over","finish":"high polish everywhere, inside included","stones":"one row of round stones about 1.3 mm across the top half of the ring, held by tiny prongs shared between neighbouring stones (a fine line of gold beads along both edges of the row); the row stops at the sides and the lower half is plain polished gold"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5) on the full 1.5 x 1.5 mm section: 1.91 g at US 8.5. The stone seats remove about 0.3 g and the rounded edges more; the shared prongs add a little back. Public text says 'about 1.7 grams' (the reduced figure); the cost keeps the full section as a buffer. The reference claims about 1.49 g for 1.35 x 1.35 mm.","anchorUs":8.5,"anchorGrams":1.91,"publicGrams":1.7,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6/HS5): 14K band = grams x 100 USD (gold + labor), stones and a 4 USD setting per stone on top. US 8.5 with lab grown diamonds: 1.91 g x 100 = 191.06 + 23 x (2.52 + 4.00) = 149.96 -> 341.02","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":371.02,"multiplier":1.55,"engineUsd":575,"engineListUsdAtAnchor":770,"storePromotionRate":0.25,"listUsd":1050,"buyerUsd":788,"onePriceAllSizes":true,"onePriceAllStones":true,"everySizeFloorListUsd":{"labGrownDiamond":925,"costliestStone":1035},"worstOffsiteProfitBySizeUsd":{"labGrownDiamond":{"US4":302,"US8.5":241,"US13":180,"US16":138},"costliestStone":{"US4":255,"US8.5":184,"US13":113,"US16":63}},"at35PercentSale":"lab grown diamond stays above 43 USD in every size; with the costliest stone US 14 breaks even and US 15-16 lose 15-32 USD at the worst Offsite fee","spotUsdPerOzt":4003.7,"spotDate":"2026-11-11","marketAnchors":["Reference NyFineJewelry (Etsy 685259244, 5.0 stars, 320 reviews; 1.35 x 1.35 mm, about 0.184 ctw): 14K buyer price after 25% off moissanite 336.75 USD, lab grown about 373.50, natural about 473.75; 10K moissanite 266.25; 18K natural 570.00 (read 2026-11-11)","EON lab-grown line: DSP 2.75 mm half eternity 900 USD buyer; HS5 5 mm hammered four-star 1,350 USD buyer"],"methodology":"docs/eon/lab-grown/price_model.py hep; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 1.5 mm); the stone choice is a listing-level personalization dropdown (listing_metadata.personalizationQuestions, read by lib/etsy/create-listing.ts personalizationFor), not a variation, because Etsy personalization cannot change the price and 20 stones x 75 variants exceeds the 400-product limit"},"approval":{"authority":"Owner 2026-11-11 (question card): list 1,050 USD -> 25% sale -> 787.50 USD, one price for every size and every stone; the stone mapping as proposed (lab grown diamond as the default; lab created sapphire, ruby and emerald and created alexandrite; natural salt and pepper and black diamonds, the black colour-treated; the other stones natural, the pearl cultured; labels FTC-qualified); scope 14K, 3 colours, US 4-16 with half sizes (75 variants); gallery: generate the 9 AI frames from images/PROMPTS-REVIEW.md, hero first and checked against the reference, plus the typeset stone chart (frame 10).","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (1.91 g x 100 USD at US 8.5) + 23 stones x (2.52 lab grown + 4.00 setting); the price covers 5.00 USD a stone for the costliest choice; all estimates","Maker to confirm: all 20 stones in about 1.3 mm and settable in shared micro prongs (opal, moonstone, turquoise, black onyx and cultured pearl are usually cabochons or beads, pearl needs a peg or cup), the stone count by size (half the band, 19-30 stones, or one fixed count), lab grown diamond colour/clarity grade, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"54bb79369f3ccc574c28f829c9ede406"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HEP'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-HEP-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  105000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  s.stone_carat,
  s.stone_cost,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',1.56,0.17,12388),
    (4.5,'4.5',1.60,0.18,13040),
    (5.0,'5',1.64,0.18,13040),
    (5.5,'5.5',1.68,0.19,13692),
    (6.0,'6',1.72,0.19,13692),
    (6.5,'6.5',1.76,0.20,14344),
    (7.0,'7',1.79,0.20,14344),
    (7.5,'7.5',1.83,0.20,14344),
    (8.0,'8',1.87,0.21,14996),
    (8.5,'8.5',1.91,0.21,14996),
    (9.0,'9',1.95,0.22,15648),
    (9.5,'9.5',1.99,0.22,15648),
    (10.0,'10',2.03,0.22,16300),
    (10.5,'10.5',2.07,0.22,16300),
    (11.0,'11',2.10,0.23,16952),
    (11.5,'11.5',2.14,0.23,16952),
    (12.0,'12',2.18,0.23,16952),
    (12.5,'12.5',2.22,0.24,17604),
    (13.0,'13',2.26,0.24,17604),
    (13.5,'13.5',2.30,0.25,18256),
    (14.0,'14',2.34,0.25,18256),
    (14.5,'14.5',2.37,0.26,18908),
    (15.0,'15',2.41,0.26,18908),
    (15.5,'15.5',2.45,0.26,18908),
    (16.0,'16',2.49,0.27,19560)) as s(size, label, grams, stone_carat, stone_cost)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HEP'
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  stone_carat = excluded.stone_carat,
  stone_cost_cents = excluded.stone_cost_cents,
  stone_cost_source = excluded.stone_cost_source,
  updated_at = now();

commit;

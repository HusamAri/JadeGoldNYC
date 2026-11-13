-- 0189_eon_lab_grown_pc9.sql
-- EON lab-grown 06 (EON-PC9): 14K, 3,0 × 1,8 mm bant, üstte iki ince cilalı ray arasında tek kanal, içinde dokuz 2 mm
-- prenses lab-grown taş kenar kenara (~18 mm sıra, iki ucu düz duvar, her bedende 9 taş). Metal Color × Ring Size US 4-16
-- yarım bedenler (75 varyant), ring_band. Tek fiyat $1.500 (alıcı %25 vitrinle $1.125), her beden.
-- Maliyet US 8½ $674,55 (4,59 g × $100 + taş $126 + kanal takma $90); en kötü Offsite kârı en düşük US 16 +$74.
-- Referans 25karats.com WB9262 (doğal GH/VS, 0,45 ct, ~2,9 g, $1.669). Kanıt: docs/eon/lab-grown/2026-11-13-princess-channel-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/06-princess-channel/. Üretici: scripts/eon/gen_lab_grown_pc_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-PC9-%';
--   beklenen: 26fcaf93e593bfceaa0bd5a26ae6ca6d
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-PC9', $ww$14K Gold Lab Grown Diamond Band, Nine Princess Cut Stones, Channel Set, 3mm$ww$,
  $ww$A solid 14K gold band, 3 mm wide, with nine princess cut lab grown diamonds set side by side in a channel across the top. The square stones sit edge to edge between two slim polished rails, so the row reads as one continuous line of light with crisp corners, and the rest of the band is plain polished gold.

YOUR RING
Solid 14K gold in yellow, white or rose. Flat-topped profile about 3 mm wide and 1.8 mm thick, polished all over, inside and out. Nine princess cut lab grown diamonds, about 2 mm square each, are channel set in a single straight row across the top of the band: the row is about 18 mm long and ends at a flat polished wall of gold at each end. About 4 grams in US 8.5. The price is for one ring in your selected metal color and size; all nine lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A princess cut is a square brilliant cut: its facets return light from a square outline, so stones set edge to edge form an unbroken line.

THE CHANNEL SETTING
Each stone sits in a channel cut along the top of the band, held along both sides by the gold rails and at the two ends of the row by the end walls. There are no prongs, so nothing stands proud to catch on clothing or gloves.

SIZING AND RESIZING
Made to order in your size. Message us before ordering if you are between sizes. A jeweler can usually resize the band by about half a size through the plain gold at the back, away from the stones.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$princess cut band$ww$,$ww$princess cut ring$ww$,$ww$channel set band$ww$,$ww$channel set ring$ww$,$ww$nine stone band$ww$,$ww$stackable gold ring$ww$,$ww$14k gold band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$,$ww$yellow gold band$ww$,$ww$3mm gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  150000, 20, true, null, 0, 'ring',
  'princess', 'lab', 9, 1000, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-13-eon-lab-grown-pc9","sourcePackagePath":"docs/eon/lab-grown/06-princess-channel","generatorScript":"scripts/eon/gen_lab_grown_pc_migration.mjs","sourceReferenceUrl":"https://www.25karats.com/classic-9-stone-princes-cut-diamond-anniversary-band-1-2-ct-t-w?variant_id=41473-14K-White-Gold","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"princess","count":9,"sizeMm":"2.0","totalCarat":0.45,"caratNote":"Design stones 9 x 2.0 mm square princess cut, about 0.05 ct each (the reference states 0.05 ct / 2x2 mm each, 0.45 ct t.w., natural GH/VS), channel set edge to edge in one straight row across the top; the count does not change with size. Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"castingFeeCents":0,"stoneCostCentsEstimate":12600,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 9 x 0.05 ct = 126 USD. Channel setting 10 USD a stone = the maker's Model 2 baguette (channel) fee; the DSP note's 4 USD was for prong setting; uncalibrated. Panel cost view (variant_stone_cost) sees stones 126 + settings 9 x 10 (products.setting_fee_cents 1000) = 216."},"band":{"widthMm":3,"thicknessMm":1.8,"karat":"14K","profile":"flat top with one channel between two slim polished rails; a flat polished wall closes each end of the row; plain polished shank","finish":"high polish all over, inside and out","row":"nine 2 mm square princess cut stones edge to edge in one straight row about 18 mm long across the top front of the band; the same nine stones at every size"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 3 x 1.8 mm section; the channel (18 x 2 x 1.4 mm) removes about 0.68 g, kept in the cost as a buffer for the channel work. Public text says 'about 4 grams in US 8.5' (4.59 - 0.68 = 3.91 g).","anchorUs":8.5,"anchorGrams":4.59,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6): 14K band = grams x 100 USD (gold + labor), stones and settings on top. US 8.5: 4.59 g x 100 = 458.55 + nine stones 126 + nine channel settings 90 = 674.55","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":704.55,"multiplier":1.55,"engineUsd":1092,"engineListUsdAtAnchor":1460,"storePromotionRate":0.25,"listUsd":1500,"buyerUsd":1125,"onePriceAllSizes":true,"everySizeFloorListUsd":1465,"worstOffsiteProfitBySizeUsd":{"US4":297,"US8.5":213,"US12":148,"US16":74},"at35PercentSale":"US 4-12 stay above zero at the worst Offsite fee (US 12 +12); US 14 loses about 25 USD and US 16 about 62","spotUsdPerOzt":3887.87,"spotDate":"2026-11-13","marketAnchors":["Reference 25karats WB9262 (natural diamonds GH/VS, 0.45 ct t.w., 14K white): 1,669 USD, read 2026-11-13","Allurez 'princess cut channel set lab grown diamond ring in 14K white gold 1/2 ct': nine princess lab-grown stones, F-G / VS1, 14K white channel, 1,033 USD on sale from a 2,506 USD list (search snippet 2026-11-13)","Blue Nile 'channel set princess cut lab grown diamond ring in 14K, 1/2 ct tw': 19 smaller stones, 1,220 USD, 732 USD at 40% off (search snippet 2026-11-13)","EON lab-grown line: DSP 1,200 -> 900; HEP 1,050 -> 787.50; HS5 and FR6 1,800 -> 1,350; VB6 2,665 -> 1,999"],"methodology":"docs/eon/lab-grown/price_model.py pc; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 3 mm)"},"approval":{"authority":"Owner 2026-11-13 (question card): list 1,500 USD -> 25% sale -> 1,125 USD, one price for every size; scope 14K, 3 colours, US 4-16 with half sizes (75 variants); band 3.0 x 1.8 mm (thickness to be confirmed by the maker); gallery: 9 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked against the reference, plus the locally typeset spec card (frame 10).","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (4.59 g x 100 USD at US 8.5) + nine stones 126 + nine channel settings 90, all estimates","Maker to confirm: minimum thickness for a 2 mm princess channel (design 1.8 mm; the reference is about 1.6 mm with a comfort fit), comfort fit or flat inside, the nine-stone row (about 18 mm) at every size and how far the band can be resized through the plain back, stone colour/clarity grade, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"26fcaf93e593bfceaa0bd5a26ae6ca6d"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PC9'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-PC9-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  150000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  0.45,
  12600,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',3.75),
    (4.5,'4.5',3.84),
    (5.0,'5',3.94),
    (5.5,'5.5',4.03),
    (6.0,'6',4.12),
    (6.5,'6.5',4.21),
    (7.0,'7',4.31),
    (7.5,'7.5',4.40),
    (8.0,'8',4.49),
    (8.5,'8.5',4.59),
    (9.0,'9',4.68),
    (9.5,'9.5',4.77),
    (10.0,'10',4.86),
    (10.5,'10.5',4.96),
    (11.0,'11',5.05),
    (11.5,'11.5',5.14),
    (12.0,'12',5.23),
    (12.5,'12.5',5.33),
    (13.0,'13',5.42),
    (13.5,'13.5',5.51),
    (14.0,'14',5.61),
    (14.5,'14.5',5.70),
    (15.0,'15',5.79),
    (15.5,'15.5',5.88),
    (16.0,'16',5.98)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PC9'
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

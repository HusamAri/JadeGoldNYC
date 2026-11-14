-- 0193_eon_lab_grown_pear2.sql
-- EON lab-grown 08 (EON-PEAR2): 14K toi et moi, 1,8 × 1,6 mm ince bant, üstte yan yana iki armut lab-grown taş (8 × 6 mm
-- ve 5 × 3,5 mm), uçları zıt yönde, her biri üç tırnaklı alçak sepette. Metal Color × Ring Size US 4-16 yarım bedenler
-- (75 varyant), sculptural_ring (Jewelry > Rings). Tek fiyat $1.450 (alıcı %25 vitrinle $1.088), her beden.
-- Maliyet US 8½ $646,16 (3,45 g × $100 + taşlar $261,60 + iki tırnak takma $40); en kötü Offsite kârı en düşük US 16 +$133.
-- Referans Etsy 1522527544 (moissanite, 14K satış $537). Kanıt: docs/eon/lab-grown/2026-11-14-double-pear-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/08-double-pear/. Üretici: scripts/eon/gen_lab_grown_pear_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-PEAR2-%';
--   beklenen: f6db68fcc34f248c9054a194f5a67ed7
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-PEAR2', $ww$14K Gold Lab Grown Diamond Toi et Moi Ring, Two Pear Cut Stones$ww$,
  $ww$A solid 14K gold toi et moi ring with two pear cut lab grown diamonds set side by side, a larger stone and a smaller one with their points facing opposite ways. A slim polished band keeps the attention on the two stones.

YOUR RING
Solid 14K gold in yellow, white or rose. A slim band about 1.8 mm wide and 1.6 mm thick, polished all over. Two pear cut lab grown diamonds sit side by side on top: one about 8 x 6 mm and one about 5 x 3.5 mm, their points facing opposite ways and their sides almost touching. Each stone is held by three claw prongs, one guarding its point and two at its rounded end. About 3.5 grams in US 8.5. The price is for one ring in your selected metal color and size; both lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A pear cut is a brilliant cut with one rounded end and one point, so each stone ends in a fine tip of light.

THE PRONG SETTING
Each stone sits in its own low basket of gold and is held by three claw prongs. The prong at the point covers the tip, the most delicate part of a pear cut stone. Have the prongs checked by a jeweler once a year.

SIZING AND RESIZING
Made to order in your size. Message us before ordering if you are between sizes. A jeweler can usually resize the band by about half a size through the plain gold at the back, away from the stones.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$toi et moi ring$ww$,$ww$pear toi et moi$ww$,$ww$two stone ring$ww$,$ww$pear cut ring$ww$,$ww$double pear ring$ww$,$ww$you and me ring$ww$,$ww$pear engagement ring$ww$,$ww$14k gold ring$ww$,$ww$yellow gold ring$ww$,$ww$white gold ring$ww$,$ww$rose gold ring$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  145000, 20, true, null, 0, 'ring',
  'pear', 'lab', 2, 2000, 0,
  $ww${"productType":"ring","listingProtocol":"sculptural_ring","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-14-eon-lab-grown-pear2","sourcePackagePath":"docs/eon/lab-grown/08-double-pear","generatorScript":"scripts/eon/gen_lab_grown_pear_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/1522527544/155-tc-double-pear-cut-two-stone-ring","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"pear","count":2,"sizeMm":"8x6 + 5x3.5","totalCarat":1.22,"caratNote":"Design stones: one 8 x 6 mm pear (about 1.0 ct at standard depth) and one 5 x 3.5 mm pear (about 0.22 ct), lab-grown diamonds; the reference sells moissanite and states '1.25 CT' + '0.30 CT' (1.55 TC). Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":2000,"castingFeeCents":0,"stoneCostCentsEstimate":26160,"stoneCostNote":"No maker quote for this design. The maker's single-stone scale (per stone): 1 ct 200 USD (2 ct 400, 3 ct 700); the 0.22 ct pear at the maker's only known small-stone lab rate 280 USD/ct = 61.60 USD; total 261.60 USD. Claw-prong setting 20 USD a stone, not calibrated (known fees: 4 USD shared micro-prong, 10 USD baguette)."},"band":{"widthMm":1.8,"thicknessMm":1.6,"karat":"14K","profile":"slim plain band with softly rounded edges, about 1.8 mm wide (the reference states 1.8 mm at the bottom); thickness 1.6 mm is the design value, not stated by the reference","finish":"high polish all over, inside and out","setting":"two low gold baskets side by side on top of the band, each with three claw prongs (one at the point, two at the rounded end)","stones":"an 8 x 6 mm pear and a 5 x 3.5 mm pear side by side across the top, points facing opposite ways, sides almost touching"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 1.8 x 1.6 mm section (the real profile is rounded, so this is a buffer) + 1.0 g for the two baskets and six claw prongs (8x6 basket about 0.6 g, 5x3.5 about 0.3 g, rounded up; not calibrated). Public text says 'about 3.5 grams in US 8.5'.","anchorUs":8.5,"anchorGrams":3.45,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6): 14K grams x 100 USD (gold + labor), stones and settings on top. US 8.5: 3.45 g x 100 = 344.56 + stones 261.60 + two claw settings 40 = 646.16","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":676.16,"multiplier":1.55,"engineUsd":1048,"engineListUsdAtAnchor":1400,"storePromotionRate":0.25,"listUsd":1450,"buyerUsd":1088,"onePriceAllSizes":true,"everySizeFloorListUsd":1330,"worstOffsiteProfitBySizeUsd":{"US4":252,"US8.5":208,"US12":173,"US16":133},"at35PercentSale":"every size stays at or above zero at the worst Offsite fee (US 16 +2); at 1,400 USD US 14-16 would lose up to 27 USD","marketAnchors":"lab-grown toi et moi 1 to 1.25 ct t.w., 14K, 2026-11-14 web search snapshot: Simon 1 1/4 ct pear 786.49 USD (sale, reg 1,572.98); Ross-Simons 1.00 ct t.w. pear bypass 1,015.75 USD (sale); RareCarat 1.00 ct oval + pear 1,200 USD; Leo Hamel 1.00 ct pear + oval 1,495 USD (from 1,725); James Allen pave toi et moi with a 1.00 ct pear 1,925 USD (page also showed 1,254); Allurez 8 x 6 mm 1.00 ct pear + round (2.00 ct t.w.) 2,288 USD. Reference (moissanite, not comparable stone) 537.11 USD. Sources: docs/eon/lab-grown/2026-11-14-double-pear-pricing.md."},"classification":{"protocol":"sculptural_ring","taxonomy":"Jewelry > Rings","basis":"A toi et moi ring is not a band (ring_band is Bands 1232) and needs no Width axis; sculptural_ring is the live ring protocol on plain Jewelry > Rings (52 products, 50 on Etsy, 2026-11-14). An Engagement Rings or Multi-Stone Rings node would need a new protocol (code + live taxonomy read + deploy)."},"approval":{"authority":"Owner 2026-11-14 (reply '1a,2a,3a' to the decision card): 1a = list 1,450 USD -> 25% sale 1,087.50, one price for every size; scope 14K, Metal Color Yellow/White/Rose x Ring Size US 4-16 with half sizes (75 variants); 1.8 x 1.6 mm band, 8 x 6 mm + 5 x 3.5 mm lab grown pears, sculptural_ring; 2a = gallery: 9 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked side by side against the reference crops, then the other 8, plus the locally typeset spec card, about 20-26 credits, cap 40; 3a = no carat weight in public text until the maker confirms the stones.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Photos come from a separate gallery migration (README section 08); until it is applied the draft has no photos","Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (3.45 g x 100 USD at US 8.5, baskets estimated) + stones 261.60 (1 ct at the maker's single-stone scale, 0.22 ct at 280 USD/ct) + two claw settings 40, all estimates","Maker to confirm: stone sizes and carat (design 8 x 6 mm + 5 x 3.5 mm pear, about 1.0 + 0.22 ct), stone color/clarity grade, band thickness (design 1.8 x 1.6 mm), basket and prong weight, setting fee, how far the band can be resized, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"f6db68fcc34f248c9054a194f5a67ed7"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PEAR2'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-PEAR2-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  145000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  1.22,
  26160,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',3.00),
    (4.5,'4.5',3.05),
    (5.0,'5',3.10),
    (5.5,'5.5',3.15),
    (6.0,'6',3.20),
    (6.5,'6.5',3.25),
    (7.0,'7',3.30),
    (7.5,'7.5',3.35),
    (8.0,'8',3.40),
    (8.5,'8.5',3.45),
    (9.0,'9',3.50),
    (9.5,'9.5',3.54),
    (10.0,'10',3.59),
    (10.5,'10.5',3.64),
    (11.0,'11',3.69),
    (11.5,'11.5',3.74),
    (12.0,'12',3.79),
    (12.5,'12.5',3.84),
    (13.0,'13',3.89),
    (13.5,'13.5',3.94),
    (14.0,'14',3.99),
    (14.5,'14.5',4.04),
    (15.0,'15',4.09),
    (15.5,'15.5',4.14),
    (16.0,'16',4.19)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-PEAR2'
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

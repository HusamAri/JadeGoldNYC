-- 0182_eon_lab_grown_hs5.sql
-- EON lab-grown 04: 14K Hammered Star band, 5 mm × 1,5 mm, bütün dış yüz iç içe yuvarlak dövme izleri, iki kenarda
-- dar cilalı kenar; önde ~79° arayla iki ~1,5 mm round lab-grown taş, her biri sekiz uçlu oyma yıldızın ortasında.
-- Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat $1.800
-- (sahip kararı 2026-11-10; alıcı %25 vitrinle $1.350). Üretici teklifi YOK: liste gramı
-- 5 × 1,5 mm (US 8½ 6,37 g) × $100 + taş $20 + takma $20 + ışın $20 + dövme $30 = $727;
-- kanıt: docs/eon/lab-grown/2026-11-10-hammered-star-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/04-hammered-star/. Üretici: scripts/eon/gen_lab_grown_hs_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-HS5-%';
--   beklenen: 84001e3e3e8310a04d5a86f7249c6fd3
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-HS5', $ww$14K Gold Lab Grown Diamond Band, Hammered with Two Star Set Stones, 5mm$ww$,
  $ww$A solid 14K gold band, 5 mm wide, hammered all over and set with two small lab grown diamonds, each at the heart of an engraved eight-point star. The hammer marks break the light into many small reflections, and the two stars sit a short way apart on the front of the band, so both rest on top of your finger when you wear it.

YOUR RING
Solid 14K gold in yellow, white or rose. Flat profile about 5 mm wide and 1.5 mm thick, with a narrow polished edge along both rims and a polished inside. The outer face is covered in overlapping round hammer marks with a soft satin sheen. Two round brilliant lab grown diamonds, about 1.5 mm each, are star set on the front: each sits level with the surface at the center of a star cut into the gold, with four long rays and four short ones. About 6 grams in US 8.5. The price is for one ring in your selected metal color and size; both lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A round brilliant cut is faceted to return as much light as possible, so even a small stone gives a bright, crisp flash.

THE STAR SETTING
Each stone sits in a seat cut into the band and is held by tiny beads of gold raised around its edge; the star's rays are then cut into the surface around it. The top of the stone stays level with the gold, so nothing stands proud to catch on clothing or gloves.

THE HAMMERED FINISH
The hammer marks are part of the gold itself, so they soften with wear rather than wearing away, and small everyday scratches blend into the texture.

SIZING AND RESIZING
Made to order in your size. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes. With both stones on the front, a jeweler can usually resize the band by about one size; the hammer marks at the back may need to be redone.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$star set ring$ww$,$ww$celestial ring$ww$,$ww$hammered gold band$ww$,$ww$hammered gold ring$ww$,$ww$textured gold band$ww$,$ww$mens gold band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$,$ww$14k gold band$ww$,$ww$solid gold band$ww$,$ww$5mm gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  180000, 20, true, null, 0, 'ring',
  'round', 'lab', 2, 1000, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-10-eon-lab-grown-hs5","sourcePackagePath":"docs/eon/lab-grown/04-hammered-star","generatorScript":"scripts/eon/gen_lab_grown_hs_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/4581494716/celestial-hammered-moissanite-ring-925","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"round","count":2,"sizeMm":"1.5","totalCarat":0.026,"caratNote":"Design stones 2 x 1.5 mm round brilliant, about 0.013 ct each (standard round chart), matching the reference photos. The reference claims 2.3 mm each (0.08 ctw DEW), which its own photos do not show and which would not sit safely in a 1.5 mm wall (stone depth about 1.4 mm). Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"engravingFeeCentsEach":1000,"textureFeeCents":3000,"castingFeeCents":0,"stoneCostCentsEstimate":2000,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 2 x 0.013 ct = 7.28 USD; booked at 10 USD a stone (uncalibrated). Setting 10 USD a stone = the maker's Model 2 flush setting fee; star rays 10 USD a stone and hammer texture 30 USD a ring, both uncalibrated."},"band":{"widthMm":5,"thicknessMm":1.5,"karat":"14K","profile":"flat face covered in overlapping round hammer marks, a narrow polished edge along both rims","finish":"hammered face with a soft satin sheen (fine grain radiating inside each mark); high polish rims, star rays and inside","stars":"two eight-point stars (four long rays along and across the band, four short diagonal rays), each centred on one stone, on the front of the band, symmetric about its centre, about 79 degrees apart (about 15 mm centre to centre along the outside at US 8.5)"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 5 x 1.5 mm section; the hammer marks remove about 5% (about 0.32 g at US 8.5), kept in the cost as a buffer for the hammering. Public text says 'about 6 grams' (the lower, reduced figure).","anchorUs":8.5,"anchorGrams":6.37,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6): 14K band = grams x 100 USD (gold + labor), stones, settings, star rays and texture on top. US 8.5: 6.37 g x 100 = 636.88 + stones 20 + settings 20 + star rays 20 + texture 30 = 726.88","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":756.88,"multiplier":1.55,"engineUsd":1173,"engineListUsdAtAnchor":1565,"storePromotionRate":0.25,"listUsd":1800,"buyerUsd":1350,"onePriceAllSizes":true,"everySizeFloorListUsd":1625,"worstOffsiteProfitBySizeUsd":{"US4":480,"US8.5":364,"US13":249,"US16":171},"at35PercentSale":"every size stays above zero at the worst Offsite fee (US 16 +8 USD)","spotUsdPerOzt":4023.5,"spotDate":"2026-11-10","marketAnchors":["Reference BRIARLORE (Etsy 4581494716, 925 silver + moissanite, San Marino CA): 175.81 USD, no gold option listed, read 2026-11-10","EON's own '14K Gold Hammered Wedding Band, Beveled Edges, Comfort Fit, 4-8mm' (Etsy 4565377715): 5 mm US 8.5 list 2,005 USD (5.43 g) -> 1,503.75 at 25% off; 0 sales (panel sale_items 2026-11-10)","EON's '10K Gold Hammered Wedding Band, Milgrain Edge, Comfort Fit' (Etsy 4543442596): 4 sales 2026-08-07 to 2026-10-09, average unit 1,047.50 USD (5-6 mm, US 7-8.5)","Brilliant Earth 'Polished 5mm Starburst Diamond Wedding Band' 14K yellow (BE2D928): 5.0 mm, 12 round natural diamonds (min 0.051 ctw), 2,290 USD, read 2026-11-10","Blue Nile 14K yellow 4 mm comfort-fit hammered band 950 USD; Icing on the Ring 14K 6 mm hammered 895-1,150 USD; Allurez 'shooting star' 14K white 0.15 ct 1,954 USD on sale (search snippets 2026-11-10)"],"methodology":"docs/eon/lab-grown/price_model.py hs; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 5 mm)"},"approval":{"authority":"Owner 2026-11-10 (question card): list 1,800 USD -> 25% sale -> 1,350 USD, one price for every size; scope 14K, 3 colours, US 4-16 with half sizes (75 variants); gallery: generate all 10 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked against the reference.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (6.37 g x 100 USD at US 8.5) + two stones 20 + two star settings 40 + hammer texture 30, all estimates","Maker to confirm: stone size for a star setting in a 1.5 mm wall (design 1.5 mm, about 0.013 ct each; the reference claims 2.3 mm), spacing of the two stars (design about 15 mm centre to centre at US 8.5, symmetric about the front), stone colour/clarity grade, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"84001e3e3e8310a04d5a86f7249c6fd3"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-HS5-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  180000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  0.026,
  2000,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',5.21),
    (4.5,'4.5',5.34),
    (5.0,'5',5.47),
    (5.5,'5.5',5.60),
    (6.0,'6',5.72),
    (6.5,'6.5',5.85),
    (7.0,'7',5.98),
    (7.5,'7.5',6.11),
    (8.0,'8',6.24),
    (8.5,'8.5',6.37),
    (9.0,'9',6.50),
    (9.5,'9.5',6.63),
    (10.0,'10',6.75),
    (10.5,'10.5',6.88),
    (11.0,'11',7.01),
    (11.5,'11.5',7.14),
    (12.0,'12',7.27),
    (12.5,'12.5',7.40),
    (13.0,'13',7.53),
    (13.5,'13.5',7.66),
    (14.0,'14',7.79),
    (14.5,'14.5',7.91),
    (15.0,'15',8.04),
    (15.5,'15.5',8.17),
    (16.0,'16',8.30)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-HS5'
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

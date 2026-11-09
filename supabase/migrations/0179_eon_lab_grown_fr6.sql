-- 0179_eon_lab_grown_fr6.sql
-- EON lab-grown 03: 14K Flush Round band, 6 mm × 1,5 mm, fırçalanmış yüz, iki cilalı faset kenar, tek cilalı
-- kanal (merkez dışı, ~3:2) ve kanalın üstüne flush (gypsy) oturan ~2,0 mm round lab-grown taş.
-- Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat $1.800
-- (sahip kararı 2026-11-08; alıcı %25 vitrinle $1.350). Üretici teklifi YOK: liste gramı 6 × 1,5 mm
-- (US 8½ 7,64 g) × $100 + taş $20 + takma $10 = $794; kanıt: docs/eon/lab-grown/2026-11-08-flush-round-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/03-flush-round/. Üretici: scripts/eon/gen_lab_grown_fr_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-FR6-%';
--   beklenen: 2f1eccd3a9bc2d9344ed06818a43456f
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-FR6', $ww$14K Gold Lab Grown Diamond Band, Flush Set Round, 6mm Brushed with Polished Groove$ww$,
  $ww$A solid 14K gold band, 6 mm wide, with one round lab grown diamond set flush on a fine polished groove. The outer face is brushed to a soft satin finish between two high-polish beveled edges, and the inside is polished smooth. The stone sits level with the surface, so nothing stands proud to catch on clothing or gloves.

YOUR RING
Solid 14K gold in yellow, white or rose. Flat profile about 6 mm wide and 1.5 mm thick, with a narrow polished bevel along each edge. One thin polished groove runs all the way around, slightly off center. One round brilliant lab grown diamond, about 2 mm, set flush on the groove in a fine polished rim. About 7 grams in US 8.5. The price is for one ring in your selected metal color and size; the lab grown diamond is included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMOND
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A round brilliant cut is faceted to return as much light as possible, so even a small stone gives a bright, crisp flash.

THE FLUSH SETTING
In a flush setting, also called a gypsy setting, the stone sits in a seat cut into the band and a fine rim of gold holds its edge. Its top is level with the surface, so it is protected on every side.

SIZING AND RESIZING
Made to order in your size. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes. With a single stone at the front, a jeweler can usually resize the band by about one size.

THE BRUSHED FINISH
The satin surface softens with daily wear and gains a gentle patina; a jeweler can brush it again to look new. The polished bevels and groove give the band a bright outline.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$flush set ring$ww$,$ww$gypsy set ring$ww$,$ww$single stone band$ww$,$ww$mens gold band$ww$,$ww$white gold band$ww$,$ww$14k gold band$ww$,$ww$solid gold band$ww$,$ww$brushed gold band$ww$,$ww$beveled gold band$ww$,$ww$6mm gold band$ww$,$ww$rose gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  180000, 20, true, null, 0, 'ring',
  'round', 'lab', 1, 1000, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-08-eon-lab-grown-fr6","sourcePackagePath":"docs/eon/lab-grown/03-flush-round","generatorScript":"scripts/eon/gen_lab_grown_fr_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/4512052520/round-cut-moissanite-diamond-mens","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"round","count":1,"sizeMm":"2.0","totalCarat":0.03,"caratNote":"Design stone 2.0 mm round brilliant, about 0.03 ct (standard round chart), matching the reference photos. The reference claims 0.10 ct (3 mm), which would not sit flush in a 1.5 mm wall (stone depth about 1.8 mm). Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"castingFeeCents":0,"stoneCostCentsEstimate":2000,"stoneCostNote":"No maker quote for this design. The maker's only known lab rate is 280 USD/ct (Model 2 baguette): 0.03 ct = 8.40 USD; booked at 20 USD for one small stone (uncalibrated). Setting 10 USD = the maker's Model 2 flush setting fee per stone."},"band":{"widthMm":6,"thicknessMm":1.5,"karat":"14K","profile":"flat face, a narrow polished bevel on each edge, one thin polished groove slightly off center (about 3 : 2)","finish":"brushed satin face; high polish bevels, groove, stone rim and inside"},"gram":{"model":"maker's 14K band list (docs/artifact-studio/maker_cost.py list_g14 = width x (0.836 + 0.0515 x US) x thickness / 1.5), full rectangular 6 x 1.5 mm section; bevels and groove remove about 5% (about 0.38 g at US 8.5), kept in the cost as a buffer for the finishing work. Public text says 'about 7 grams' (the lower, reduced figure).","anchorUs":8.5,"anchorGrams":7.64,"weightSource":"estimated"},"pricing":{"makerQuote":null,"costBasis":"maker convention (same maker as EON-VB6): 14K band = grams x 100 USD (gold + labor), stone and setting on top. US 8.5: 7.64 g x 100 = 764.25 + stone 20 + setting 10 = 794.25","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":824.25,"multiplier":1.55,"engineUsd":1278,"engineListUsdAtAnchor":1705,"storePromotionRate":0.25,"listUsd":1800,"buyerUsd":1350,"onePriceAllSizes":true,"everySizeFloorListUsd":1780,"worstOffsiteProfitBySizeUsd":{"US4":436,"US8.5":297,"US13":158,"US16":65},"at35PercentSale":"US 13 and up fall below zero at the worst Offsite fee; the price is set for the 25% sale running in November (orders 2026-11-05/06: 25% and 15%; 35% last seen 2026-10-28)","spotUsdPerOzt":4072.1,"spotDate":"2026-11-08","marketAnchors":["Reference AarsanJewels (Etsy 4512052520, moissanite, India): 14K 800.91 USD after 25% off (1,067.88 before), read 2026-11-08","JAXXON Modern Classic Diamond Solitaire Band 6mm, solid 14K, one 0.10 ct lab-grown flush set, polished, 5-9 g: 1,199 USD ('traditional retail' 1,800), read 2026-11-08","Dreamstone Mens Single Diamond Wedding Band, 14K white gold, 6 mm (SKU), 1/15 ct lab-grown F/VS2: 1,400 USD, read 2026-11-08","Virabyani bezel set single diamond mens band, 14K, lab-grown E-F/VS: 1,241 USD on sale from 1,773 (search snippet 2026-11-08)"],"methodology":"docs/eon/lab-grown/price_model.py fr; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 6 mm)"},"approval":{"authority":"Owner 2026-11-08 (question card): list 1,800 USD -> 25% sale -> 1,350 USD, one price for every size; scope 14K, 3 colours, US 4-16 with half sizes (75 variants); gallery: generate all 10 frames from the prompt sheet (images/PROMPTS-REVIEW.md), hero first and checked against the reference.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","No maker quote for this design: cost is the maker's band list (7.64 g x 100 USD at US 8.5) + stone 20 + setting 10, all estimates","Maker to confirm: largest round that sits flush in a 1.5 mm wall (design 2.0 mm, about 0.03 ct), stone colour/clarity grade, white gold rhodium plating, preparation time, price per size","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"2f1eccd3a9bc2d9344ed06818a43456f"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-FR6'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-FR6-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  180000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  0.03,
  2000,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',6.25),
    (4.5,'4.5',6.41),
    (5.0,'5',6.56),
    (5.5,'5.5',6.72),
    (6.0,'6',6.87),
    (6.5,'6.5',7.02),
    (7.0,'7',7.18),
    (7.5,'7.5',7.33),
    (8.0,'8',7.49),
    (8.5,'8.5',7.64),
    (9.0,'9',7.80),
    (9.5,'9.5',7.95),
    (10.0,'10',8.11),
    (10.5,'10.5',8.26),
    (11.0,'11',8.41),
    (11.5,'11.5',8.57),
    (12.0,'12',8.72),
    (12.5,'12.5',8.88),
    (13.0,'13',9.03),
    (13.5,'13.5',9.19),
    (14.0,'14',9.34),
    (14.5,'14.5',9.50),
    (15.0,'15',9.65),
    (15.5,'15.5',9.81),
    (16.0,'16',9.96)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-FR6'
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

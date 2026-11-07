-- 0176_eon_lab_grown_vb6.sql
-- EON lab-grown 02: 14K Vertical Baguette band, 6 mm × 2,2 mm, fırçalanmış dış / cilalı iç, tek dikey
-- (bandın enine) 6 × 2 mm lab-grown baget, kenardan kenara ve yüzeyle aynı hizada.
-- Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat $2.665
-- (sahip kararı 2026-11-07; alıcı %25 vitrinle $1.999). Maliyet okuması B: 11,5 g × $100 (altın + işçilik)
-- + taş 0,35 ct × $280 + takma $10 = $1.258 (US 8½); kanıt: docs/eon/lab-grown/2026-11-07-vertical-baguette-pricing.md.
-- Kaynak paket: docs/eon/lab-grown/02-vertical-baguette/. Üretici: scripts/eon/gen_lab_grown_vb_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-VB6-%';
--   beklenen: 5af23988109992c54d50bb2de6cfd385
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-VB6', $ww$14K Gold Lab Grown Diamond Band, Vertical Baguette, 6mm Brushed Finish$ww$,
  $ww$A solid 14K gold band, 6 mm wide, with one lab grown diamond baguette set vertically across its width. The outside has a soft brushed satin finish and the inside is polished smooth. The baguette sits flush with the surface, so nothing stands proud to catch on clothing or gloves, and the 2.2 mm wall gives the band a solid, substantial feel.

YOUR RING
Solid 14K gold in yellow, white or rose. Flat profile with squared edges, about 6 mm wide and 2.2 mm thick, brushed outside and polished inside. One lab grown diamond baguette, about 6 x 2 mm, step cut, set flush across the full width of the band. About 11.5 grams in US 8.5. The price is for one ring in your selected metal color and size; the lab grown diamond is included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 16, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMOND
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. A baguette is a step cut: long, parallel facets that reflect light in clean, bright lines rather than a scattered sparkle.

SIZING AND RESIZING
Made to order in your size. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes. With a single stone at the front, a jeweler can usually resize the band by about one size.

THE BRUSHED FINISH
The satin surface softens with daily wear and gains a gentle patina; a jeweler can brush it again to look new.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$vertical baguette$ww$,$ww$baguette band$ww$,$ww$baguette ring$ww$,$ww$lab grown baguette$ww$,$ww$mens gold band$ww$,$ww$white gold band$ww$,$ww$14k gold band$ww$,$ww$solid gold band$ww$,$ww$brushed gold band$ww$,$ww$6mm gold band$ww$,$ww$rose gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  266500, 20, true, null, 0, 'ring',
  'baguette', 'lab', 1, 1000, 0,
  $ww${"productType":"ring","listingProtocol":"ring_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-07-eon-lab-grown-vb6","sourcePackagePath":"docs/eon/lab-grown/02-vertical-baguette","generatorScript":"scripts/eon/gen_lab_grown_vb_migration.mjs","sourceReferenceUrl":"https://www.etsy.com/listing/4405323901/vertical-4x2-mm-baguette-cut-moissanite","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"baguette","count":1,"sizeMm":"6 x 2","totalCarat":0.35,"caratNote":"Maker's note says 0.35 ct for 6 x 2 mm; a 6 x 2 mm straight baguette usually weighs about 0.15-0.20 ct. Carat weight is NOT stated in public text until the maker confirms.","colorClarity":null,"settingFeeCents":1000,"castingFeeCents":0,"stoneCostCentsEstimate":9800,"stoneCostNote":"Maker: stone 280 USD per carat x 0.35 ct = 98 USD; setting 10 USD."},"band":{"widthMm":6,"thicknessMm":2.2,"karat":"14K","profile":"flat, squared edges","finish":"brushed satin outside, high polish inside"},"gram":{"model":"maker's band-list size curve (docs/artifact-studio/maker_cost.py list_g14 shape 0.836 + 0.0515 x US) anchored at the maker's own 11.5 g for US 8.5","anchorUs":8.5,"anchorGrams":11.5,"listFormulaAtAnchor":11.21,"weightSource":"estimated"},"pricing":{"makerNoteVerbatim":"6 mm için Baguette. Minimum 2.20 mm thickness. Minimum 6 mm. 0.35 ct 6×2 taş ölçüsü. 8½ size 11,5 gram. taş fiyat 280$ 1 ct. 1150$. taş takma 10$","makerWhatsApp":["abi bizim ki 6mm","liste de 2 numara da hesabi yaziyor"],"readingUsed":"B: 11.5 g x 100 USD/g = 1,150 (gold + labor, the maker's 14K band-list convention) + stone 98 + setting 10 = 1,258 at US 8.5","readingAlternative":"A: 1,150 all-in -> list 2,440 / buyer 1,830","packagingUsd":8,"shippingUsd":22,"landedUsdAtAnchor":1288,"multiplier":1.55,"engineUsd":1996,"storePromotionRate":0.25,"listUsd":2665,"buyerUsd":1999,"onePriceAllSizes":true,"worstOffsiteProfitBySizeUsd":{"US4":630,"US8.5":420,"US13":211,"US16":72},"at35PercentSale":"US 13 and up fall below zero at the worst Offsite fee; the price is set for the 25% sale running in November (orders 2026-11-05/06: 25% and 15%; 35% last seen 2026-10-28)","spotUsdPerOzt":4072.1,"spotDate":"2026-11-07","marketAnchors":["JAXXON Beveled Diamond Baguette Band 6mm, solid 14K, one 0.10 ct lab-grown baguette, 6-10 g: 1,299 USD (read 2026-11-07)","VRAI Brushed Baguette Band, 4.5 x 2.03 mm, one 0.10 ct lab-grown baguette, channel set: 14K rose 1,450 USD (search snippet), platinum 1,955 USD (read 2026-11-07)"],"methodology":"docs/eon/lab-grown/price_model.py vb; formula lib/pricing-engine/eon-cost.ts 457-472"},"classification":{"protocol":"ring_band","taxonomy":"Jewelry > Rings > Bands (1232)","basis":"Owner 2026-11-04 for the lab-grown line (EON-DSP: 'bu wedding band değil'); ring_band is live in prod, needs no Width axis (width is fixed at 6 mm)"},"approval":{"authority":"Owner 2026-11-07 (question card): list 2,665 USD -> 25% sale -> 1,999 USD, one price for every size; scope 14K, 3 colours, US 4-16 with half sizes (75 variants); gallery 10 frames, amber + teal light, approved; EON-DSP price kept until the maker answers the stone/setting question.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":true,"livePublicationAuthorized":false,"blockers":["Etsy activation needs at least one unedited photo of the physical piece (draft allowed)","Maker to confirm: are the stone (0.35 ct x 280 USD) and setting (10 USD) on top of the 1,150 USD (11.5 g x 100 USD)?","Maker to confirm: stone weight for 6 x 2 mm (note 0.35 ct; typical 0.15-0.20 ct), colour/clarity grade","Maker to confirm: price per size (cost is per gram, 9.4 g at US 4 to 15.0 g at US 16), white gold rhodium plating, preparation time","No shop section for lab grown pieces yet","Spanish translation not written"]},"variantSeal":"5af23988109992c54d50bb2de6cfd385"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-VB6'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-VB6-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  266500,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  0.35,
  9800,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',9.41),
    (4.5,'4.5',9.64),
    (5.0,'5',9.87),
    (5.5,'5.5',10.11),
    (6.0,'6',10.34),
    (6.5,'6.5',10.57),
    (7.0,'7',10.80),
    (7.5,'7.5',11.04),
    (8.0,'8',11.27),
    (8.5,'8.5',11.50),
    (9.0,'9',11.73),
    (9.5,'9.5',11.96),
    (10.0,'10',12.20),
    (10.5,'10.5',12.43),
    (11.0,'11',12.66),
    (11.5,'11.5',12.89),
    (12.0,'12',13.13),
    (12.5,'12.5',13.36),
    (13.0,'13',13.59),
    (13.5,'13.5',13.82),
    (14.0,'14',14.06),
    (14.5,'14.5',14.29),
    (15.0,'15',14.52),
    (15.5,'15.5',14.75),
    (16.0,'16',14.99)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-VB6'
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

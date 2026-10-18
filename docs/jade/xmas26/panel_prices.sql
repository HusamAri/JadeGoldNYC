-- Jade Gold NYC · Noel 2026 · 40 taslağın tahmini fiyatları (panel), üretici: panel_prices.py
-- plan xmas26-v1-disc30 · indirim %30 · hedef marj %25
-- spot 4166.1 (gold-api.com 2026-10-18T18:58Z) · $/g {'10K': 8336, '14K': 10600, '18K': 12810}
-- beklenen mühür (sku-karat:liste:gram, sku sırası): 3326763ef5809c2ad0b7d502b60f0f43 · liste toplamı 9277600 cent / 120 varyant
--
-- ÖN KOŞUL (uygulamadan önce koş; 40 / 120 / 0 / 0 beklenir, aksi hâlde DUR):
--   select count(distinct p.id), count(v.id), count(v.price_cents), count(p.price_cents)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.sku like 'JGN-X26-%' and p.status = 'draft'
--     and p.etsy_listing_id is null and p.archived_at is null
--     and v.properties->>'Gold Karat' in ('10K','14K','18K');
--
-- GERİ OKUMA (uygulamadan sonra; mühür yukarıdakiyle birebir tutmalı):
--   select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku)),
--          sum(v.price_cents), count(*)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
with common as (select '{"version": "xmas26-v1-disc30", "status": "ESTIMATE", "currency": "USD", "priceIs": "lowest variant (10K); 14K is the design price", "discountPercent": 30, "targetMargin": 0.25, "engine": "lib/jade/pricing.ts", "source": "docs/jade/xmas26/catalog.json", "karatRule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design", "spotUsdPerOzt": 4166.1, "spotSource": "gold-api.com 2026-10-18T18:58Z", "costPerGram14kCents": 10600, "rateCentsPerGram": {"10K": 8336, "14K": 10600, "18K": 12810}, "densityRatio": {"10K": 0.892, "14K": 1.0, "18K": 1.137}, "authorizedOn": "2026-10-18", "authorizedBy": "owner: ''tahmini fiyatları gir, mağazada %30 indirim var, bu halde bile kârlı olmalı''"}'::jsonb as plan),
t(code, p10, g10, c10, d10, m10, p14, g14, c14, d14, m14, p18, g18, c18, d18, m18) as (values
('B1', 57500, 3.08, 26325, 40250, 0.2503, 81300, 3.45, 37220, 56910, 0.2505, 111000, 3.92, 50865, 77700, 0.25),
('B2', 56200, 3.01, 25741, 39340, 0.25, 79400, 3.37, 36372, 55580, 0.2501, 108500, 3.83, 49712, 75950, 0.2501),
('B3', 54800, 2.93, 25074, 38360, 0.2507, 77600, 3.29, 35524, 54320, 0.2506, 106000, 3.74, 48559, 74200, 0.2502),
('B4', 61200, 3.28, 27992, 42840, 0.251, 86600, 3.68, 39658, 60620, 0.2504, 118300, 4.18, 54196, 82810, 0.2502),
('B5', 58800, 3.15, 26908, 41160, 0.2507, 83100, 3.53, 38068, 58170, 0.2501, 113600, 4.01, 52018, 79520, 0.2505),
('B6', 61300, 3.29, 28075, 42910, 0.2501, 86800, 3.69, 39764, 60760, 0.2501, 118900, 4.2, 54452, 83230, 0.2505),
('B7', 60600, 3.25, 27742, 42420, 0.2504, 85700, 3.64, 39234, 59990, 0.2506, 117200, 4.14, 53683, 82040, 0.2503),
('B8', 58600, 3.14, 26825, 41020, 0.2504, 82900, 3.52, 37962, 58030, 0.2504, 113300, 4.0, 51890, 79310, 0.2504),
('B9', 56600, 3.03, 25908, 39620, 0.2505, 80100, 3.4, 36690, 56070, 0.2502, 109600, 3.87, 50225, 76720, 0.25),
('B10', 56800, 3.04, 25991, 39760, 0.2507, 80400, 3.41, 36796, 56280, 0.2508, 109900, 3.88, 50353, 76930, 0.2501),
('N1', 67500, 3.63, 30910, 47250, 0.2503, 95600, 4.07, 43792, 66920, 0.2502, 130900, 4.63, 59960, 91630, 0.2504),
('N2', 68100, 3.66, 31160, 47670, 0.2508, 96300, 4.1, 44110, 67410, 0.2503, 131700, 4.66, 60345, 92190, 0.2502),
('N3', 66600, 3.58, 30493, 46620, 0.2504, 94200, 4.01, 43156, 65940, 0.2501, 128900, 4.56, 59064, 90230, 0.2501),
('N4', 66100, 3.55, 30243, 46270, 0.2508, 93500, 3.98, 42838, 65450, 0.2501, 128100, 4.53, 58679, 89670, 0.2503),
('N5', 68800, 3.7, 31493, 48160, 0.2506, 97500, 4.15, 44640, 68250, 0.2506, 133400, 4.72, 61113, 93380, 0.2503),
('N6', 66400, 3.57, 30410, 46480, 0.2502, 94000, 4.0, 43050, 65800, 0.2504, 128600, 4.55, 58936, 90020, 0.25),
('N7', 67200, 3.61, 30743, 47040, 0.2509, 95200, 4.05, 43580, 66640, 0.2507, 130000, 4.6, 59576, 91000, 0.25),
('N8', 61500, 3.3, 28159, 43050, 0.2503, 87100, 3.7, 39870, 60970, 0.2507, 119100, 4.21, 54580, 83370, 0.25),
('N9', 64600, 3.47, 29576, 45220, 0.2504, 91500, 3.89, 41884, 64050, 0.2507, 125000, 4.42, 57270, 87500, 0.2502),
('N10', 63500, 3.41, 29076, 44450, 0.2503, 89800, 3.82, 41142, 62860, 0.2501, 122800, 4.34, 56245, 85960, 0.2504),
('E1', 26600, 1.38, 12154, 18620, 0.2509, 37400, 1.55, 17080, 26180, 0.2516, 50700, 1.76, 23196, 35490, 0.2507),
('E2', 28800, 1.5, 13154, 20160, 0.2513, 40400, 1.68, 18458, 28280, 0.2514, 54900, 1.91, 25117, 38430, 0.2508),
('E3', 29000, 1.51, 13237, 20300, 0.2517, 40600, 1.69, 18564, 28420, 0.2509, 55200, 1.92, 25245, 38640, 0.251),
('E4', 27500, 1.43, 12570, 19250, 0.2507, 38500, 1.6, 17610, 26950, 0.2506, 52400, 1.82, 23964, 36680, 0.251),
('E5', 24800, 1.28, 11320, 17360, 0.2515, 34600, 1.43, 15808, 24220, 0.2513, 47100, 1.63, 21530, 32970, 0.2512),
('E6', 29000, 1.51, 13237, 20300, 0.2517, 40600, 1.69, 18564, 28420, 0.2509, 55200, 1.92, 25245, 38640, 0.251),
('E7', 28800, 1.5, 13154, 20160, 0.2513, 40400, 1.68, 18458, 28280, 0.2514, 54900, 1.91, 25117, 38430, 0.2508),
('E8', 28200, 1.47, 12904, 19740, 0.25, 39700, 1.65, 18140, 27790, 0.2513, 54000, 1.88, 24733, 37800, 0.25),
('E9', 27300, 1.42, 12487, 19110, 0.2503, 38300, 1.59, 17504, 26810, 0.2512, 52100, 1.81, 23836, 36470, 0.2507),
('E10', 28400, 1.48, 12987, 19880, 0.2505, 39900, 1.66, 18246, 27930, 0.2508, 54300, 1.89, 24861, 38010, 0.2503),
('P1', 55500, 2.97, 25408, 38850, 0.2504, 78500, 3.33, 35948, 54950, 0.2504, 107400, 3.79, 49200, 75180, 0.2502),
('P2', 65200, 3.5, 29826, 45640, 0.2509, 92100, 3.92, 42202, 64470, 0.25, 126100, 4.46, 57783, 88270, 0.2501),
('P3', 61700, 3.31, 28242, 43190, 0.2505, 87300, 3.71, 39976, 61110, 0.2504, 119400, 4.22, 54708, 83580, 0.2501),
('P4', 61500, 3.3, 28159, 43050, 0.2503, 87100, 3.7, 39870, 60970, 0.2507, 119100, 4.21, 54580, 83370, 0.25),
('P5', 68100, 3.66, 31160, 47670, 0.2508, 96300, 4.1, 44110, 67410, 0.2503, 131700, 4.66, 60345, 92190, 0.2502),
('P6', 62200, 3.34, 28492, 43540, 0.25, 88000, 3.74, 40294, 61600, 0.2505, 120300, 4.25, 55092, 84210, 0.2505),
('P7', 60400, 3.24, 27659, 42280, 0.2502, 85400, 3.63, 39128, 59780, 0.25, 116900, 4.13, 53555, 81830, 0.2502),
('P8', 58800, 3.15, 26908, 41160, 0.2507, 83100, 3.53, 38068, 58170, 0.2501, 113600, 4.01, 52018, 79520, 0.2505),
('P9', 56100, 3.0, 25658, 39270, 0.251, 79200, 3.36, 36266, 55440, 0.2504, 108200, 3.82, 49584, 75740, 0.25),
('P10', 65000, 3.49, 29743, 45500, 0.2508, 91900, 3.91, 42096, 64330, 0.2502, 125800, 4.45, 57654, 88060, 0.25)
), v_upd as (
  update product_variants v
     set price_cents = case v.properties->>'Gold Karat' when '10K' then t.p10 when '14K' then t.p14 else t.p18 end,
         weight_grams = case v.properties->>'Gold Karat' when '10K' then t.g10 when '14K' then t.g14 else t.g18 end,
         weight_source = 'xmas26 estimate: 14K gold grams from catalog.json × alloy density (10K ×0.892, 18K ×1.137); not weighed'
    from products p, t
   where p.id = v.product_id and p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.sku = 'JGN-X26-' || t.code
     and p.status = 'draft' and p.etsy_listing_id is null and p.archived_at is null
     and v.properties->>'Gold Karat' in ('10K', '14K', '18K')
  returning v.id
), p_upd as (
  update products p
     set price_cents = t.p10,
         listing_metadata = coalesce(p.listing_metadata, '{}'::jsonb)
           || jsonb_build_object('retailPricePlan', common.plan
                || jsonb_build_object('priceCents', t.p10, 'karats', jsonb_build_object('10K', jsonb_build_object('grams', t.g10, 'costCents', t.c10, 'listCents', t.p10, 'paidCents', t.d10, 'margin', t.m10), '14K', jsonb_build_object('grams', t.g14, 'costCents', t.c14, 'listCents', t.p14, 'paidCents', t.d14, 'margin', t.m14), '18K', jsonb_build_object('grams', t.g18, 'costCents', t.c18, 'listCents', t.p18, 'paidCents', t.d18, 'margin', t.m18))))
           || jsonb_build_object('approval', coalesce(p.listing_metadata->'approval', '{}'::jsonb)
                || jsonb_build_object('priceReadyForEtsy', true, 'livePublicationAuthorized', false,
                                      'pricePlanVersion', 'xmas26-v1-disc30'))
    from t, common
   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.sku = 'JGN-X26-' || t.code
     and p.status = 'draft' and p.etsy_listing_id is null and p.archived_at is null
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;

-- Jade Gold NYC · Noel 2026 · 40 taslağın tahmini fiyatları (panel), üretici: panel_prices.py
-- plan xmas26-v2-disc30-m50 · indirim %30 · hedef marj %50
-- spot 4166.1 (gold-api.com 2026-10-18T18:58Z) · $/g {'10K': 8336, '14K': 10600, '18K': 12810}
-- beklenen mühür (sku-karat:liste:gram, sku sırası): 828475ae91f2b6fe2ee9b7497eac967c · liste toplamı 15001300 cent / 120 varyant
--
-- ÖN KOŞUL (uygulamadan önce koş; 40 / 120 / 40 / 0 beklenir, aksi hâlde DUR — "zaten koşmuş mu?" kapısı):
--   select count(distinct p.id), count(v.id),
--          count(distinct p.id) filter (where p.listing_metadata->'retailPricePlan'->>'version' = 'xmas26-v1-disc30'),
--          count(distinct p.id) filter (where p.listing_metadata->'retailPricePlan'->>'version' = 'xmas26-v2-disc30-m50')
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
with common as (select '{"version": "xmas26-v2-disc30-m50", "status": "ESTIMATE", "currency": "USD", "priceIs": "lowest variant (10K); 14K is the design price", "discountPercent": 30, "targetMargin": 0.5, "engine": "lib/jade/pricing.ts", "source": "docs/jade/xmas26/catalog.json", "karatRule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design", "spotUsdPerOzt": 4166.1, "spotSource": "gold-api.com 2026-10-18T18:58Z", "costPerGram14kCents": 10600, "rateCentsPerGram": {"10K": 8336, "14K": 10600, "18K": 12810}, "densityRatio": {"10K": 0.892, "14K": 1.0, "18K": 1.137}, "authorizedOn": "2026-10-18", "authorizedBy": "owner 2026-10-18: ''tahmini fiyatları gir, mağazada %30 indirim var, bu halde bile kârlı olmalı'' + ''fiyatların kar marjını %50 olarak belirle''"}'::jsonb as plan),
t(code, p10, g10, c10, d10, m10, p14, g14, c14, d14, m14, p18, g18, c18, d18, m18) as (values
('B1', 93000, 3.08, 26325, 65100, 0.5002, 131400, 3.45, 37220, 91980, 0.5001, 179600, 3.92, 50865, 125720, 0.5002),
('B2', 90900, 3.01, 25741, 63630, 0.5001, 128400, 3.37, 36372, 89880, 0.5, 175500, 3.83, 49712, 122850, 0.5001),
('B3', 88600, 2.93, 25074, 62020, 0.5003, 125400, 3.29, 35524, 87780, 0.5, 171400, 3.74, 48559, 119980, 0.5001),
('B4', 98900, 3.28, 27992, 69230, 0.5003, 140000, 3.68, 39658, 98000, 0.5001, 191300, 4.18, 54196, 133910, 0.5001),
('B5', 95100, 3.15, 26908, 66570, 0.5004, 134400, 3.53, 38068, 94080, 0.5001, 183600, 4.01, 52018, 128520, 0.5001),
('B6', 99200, 3.29, 28075, 69440, 0.5003, 140400, 3.69, 39764, 98280, 0.5001, 192200, 4.2, 54452, 134540, 0.5001),
('B7', 98000, 3.25, 27742, 68600, 0.5002, 138500, 3.64, 39234, 96950, 0.5001, 189500, 4.14, 53683, 132650, 0.5001),
('B8', 94800, 3.14, 26825, 66360, 0.5004, 134000, 3.52, 37962, 93800, 0.5, 183200, 4.0, 51890, 128240, 0.5002),
('B9', 91500, 3.03, 25908, 64050, 0.5001, 129600, 3.4, 36690, 90720, 0.5003, 177300, 3.87, 50225, 124110, 0.5001),
('B10', 91800, 3.04, 25991, 64260, 0.5001, 129900, 3.41, 36796, 90930, 0.5001, 177800, 3.88, 50353, 124460, 0.5002),
('N1', 109200, 3.63, 30910, 76440, 0.5003, 154600, 4.07, 43792, 108220, 0.5001, 211600, 4.63, 59960, 148120, 0.5),
('N2', 110100, 3.66, 31160, 77070, 0.5004, 155700, 4.1, 44110, 108990, 0.5001, 213000, 4.66, 60345, 149100, 0.5001),
('N3', 107700, 3.58, 30493, 75390, 0.5002, 152400, 4.01, 43156, 106680, 0.5002, 208500, 4.56, 59064, 145950, 0.5001),
('N4', 106800, 3.55, 30243, 74760, 0.5001, 151200, 3.98, 42838, 105840, 0.5, 207100, 4.53, 58679, 144970, 0.5001),
('N5', 111200, 3.7, 31493, 77840, 0.5001, 157600, 4.15, 44640, 110320, 0.5001, 215700, 4.72, 61113, 150990, 0.5001),
('N6', 107400, 3.57, 30410, 75180, 0.5002, 152000, 4.0, 43050, 106400, 0.5002, 208000, 4.55, 58936, 145600, 0.5),
('N7', 108600, 3.61, 30743, 76020, 0.5003, 153900, 4.05, 43580, 107730, 0.5002, 210300, 4.6, 59576, 147210, 0.5001),
('N8', 99500, 3.3, 28159, 69650, 0.5003, 140800, 3.7, 39870, 98560, 0.5002, 192700, 4.21, 54580, 134890, 0.5002),
('N9', 104500, 3.47, 29576, 73150, 0.5003, 147900, 3.89, 41884, 103530, 0.5002, 202100, 4.42, 57270, 141470, 0.5),
('N10', 102700, 3.41, 29076, 71890, 0.5002, 145300, 3.82, 41142, 101710, 0.5003, 198500, 4.34, 56245, 138950, 0.5),
('E1', 43000, 1.38, 12154, 30100, 0.5004, 60400, 1.55, 17080, 42280, 0.5004, 82000, 1.76, 23196, 57400, 0.5005),
('E2', 46500, 1.5, 13154, 32550, 0.5001, 65200, 1.68, 18458, 45640, 0.5, 88700, 1.91, 25117, 62090, 0.5001),
('E3', 46800, 1.51, 13237, 32760, 0.5002, 65600, 1.69, 18564, 45920, 0.5002, 89200, 1.92, 25245, 62440, 0.5003),
('E4', 44500, 1.43, 12570, 31150, 0.5007, 62300, 1.6, 17610, 43610, 0.5006, 84700, 1.82, 23964, 59290, 0.5004),
('E5', 40100, 1.28, 11320, 28070, 0.5008, 55900, 1.43, 15808, 39130, 0.5004, 76100, 1.63, 21530, 53270, 0.5004),
('E6', 46800, 1.51, 13237, 32760, 0.5002, 65600, 1.69, 18564, 45920, 0.5002, 89200, 1.92, 25245, 62440, 0.5003),
('E7', 46500, 1.5, 13154, 32550, 0.5001, 65200, 1.68, 18458, 45640, 0.5, 88700, 1.91, 25117, 62090, 0.5001),
('E8', 45700, 1.47, 12904, 31990, 0.5008, 64100, 1.65, 18140, 44870, 0.5002, 87400, 1.88, 24733, 61180, 0.5003),
('E9', 44200, 1.42, 12487, 30940, 0.5006, 61900, 1.59, 17504, 43330, 0.5005, 84200, 1.81, 23836, 58940, 0.5002),
('E10', 45900, 1.48, 12987, 32130, 0.5, 64500, 1.66, 18246, 45150, 0.5003, 87800, 1.89, 24861, 61460, 0.5001),
('P1', 89800, 2.97, 25408, 62860, 0.5004, 126900, 3.33, 35948, 88830, 0.5, 173700, 3.79, 49200, 121590, 0.5002),
('P2', 105300, 3.5, 29826, 73710, 0.5, 149000, 3.92, 42202, 104300, 0.5001, 204000, 4.46, 57783, 142800, 0.5002),
('P3', 99800, 3.31, 28242, 69860, 0.5004, 141100, 3.71, 39976, 98770, 0.5, 193100, 4.22, 54708, 135170, 0.5001),
('P4', 99500, 3.3, 28159, 69650, 0.5003, 140800, 3.7, 39870, 98560, 0.5002, 192700, 4.21, 54580, 134890, 0.5002),
('P5', 110100, 3.66, 31160, 77070, 0.5004, 155700, 4.1, 44110, 108990, 0.5001, 213000, 4.66, 60345, 149100, 0.5001),
('P6', 100600, 3.34, 28492, 70420, 0.5, 142300, 3.74, 40294, 99610, 0.5002, 194500, 4.25, 55092, 136150, 0.5002),
('P7', 97700, 3.24, 27659, 68390, 0.5002, 138200, 3.63, 39128, 96740, 0.5003, 189000, 4.13, 53555, 132300, 0.5),
('P8', 95100, 3.15, 26908, 66570, 0.5004, 134400, 3.53, 38068, 94080, 0.5001, 183600, 4.01, 52018, 128520, 0.5001),
('P9', 90600, 3.0, 25658, 63420, 0.5, 128100, 3.36, 36266, 89670, 0.5003, 175000, 3.82, 49584, 122500, 0.5),
('P10', 105100, 3.49, 29743, 73570, 0.5004, 148600, 3.91, 42096, 104020, 0.5001, 203500, 4.45, 57654, 142450, 0.5001)
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
                                      'pricePlanVersion', 'xmas26-v2-disc30-m50'))
    from t, common
   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.sku = 'JGN-X26-' || t.code
     and p.status = 'draft' and p.etsy_listing_id is null and p.archived_at is null
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;

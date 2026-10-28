-- Jade Gold NYC · Noel 2026 · üretici teklifi gelen 25 taslağın fiyatı (panel), üretici: panel_prices.py
-- plan xmas26-v3-quote-disc30-m50 · indirim %30 · hedef marj %50
-- teklif spotu 4054.1 (gold-api.com 2026-10-28T09:54Z) · $/g {'10K': 8397, '14K': 10600, '18K': 12751} · zincir karat oranı {'10K': 0.7066, '14K': 1.0, '18K': 1.3677}
-- teklifli: B1 B2 B3 B4 B5 B6 B7 B8 B9 B10 N1 N2 N3 N4 N5 E1 E2 E3 E4 E5 E6 E7 E8 E9 E10 · teklifsiz (v2 kalır): N6 N7 N8 N9 N10 P1 P2 P3 P4 P5 P6 P7 P8 P9 P10
-- beklenen mühür SONRA (120 varyant, sku-karat:liste:gram, sku sırası): 67f246863b3b4dcaf8d749a8d1107b8e · liste toplamı 20015000 cent
-- beklenen mühür ÖNCE (v2, canlı 2026-10-18 ve 2026-10-28): 828475ae91f2b6fe2ee9b7497eac967c · toplam 15001300 cent
--
-- ÖN KOŞUL (uygulamadan önce koş; 40 / 120 / 40 / 0 / 828475ae91f2b6fe2ee9b7497eac967c beklenir, aksi hâlde DUR — "zaten koşmuş mu?" kapısı):
--   with p as (select p.id, p.listing_metadata->'retailPricePlan'->>'version' ver from products p
--              where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
--                and p.status = 'draft' and p.archived_at is null)
--   select count(distinct p.id), count(v.id),
--          count(distinct p.id) filter (where p.ver = 'xmas26-v2-disc30-m50'),
--          count(distinct p.id) filter (where p.ver = 'xmas26-v3-quote-disc30-m50'),
--          md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku))
--   from p join product_variants v on v.product_id = p.id
--   where v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
--
-- GERİ OKUMA (uygulamadan sonra; mühür yukarıdaki SONRA mührüyle birebir tutmalı):
--   select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku)),
--          sum(v.price_cents), count(*)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
--     and v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
with common as (select '{"version": "xmas26-v3-quote-disc30-m50", "status": "MAKER_QUOTE", "currency": "USD", "priceIs": "lowest variant (10K); 14K is the design price", "discountPercent": 30, "targetMargin": 0.5, "engine": "lib/jade/pricing.ts", "source": "docs/jade/xmas26/catalog.json + work/maker_quotes.json", "rule": "cost = body grams × density × $/g + chain × karat ratio + assembly/enamel/stone/posts/lock + shipping + packaging; the all-in 14K $/g was not quoted and stays 106", "karatRule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design", "spotUsdPerOzt": 4054.1, "spotSource": "gold-api.com 2026-10-28T09:54Z", "costPerGram14kCents": 10600, "rateCentsPerGram": {"10K": 8397, "14K": 10600, "18K": 12751}, "chainKaratRatio": {"10K": 0.7066, "14K": 1.0, "18K": 1.3677}, "densityRatio": {"10K": 0.892, "14K": 1.0, "18K": 1.137}, "weightsNote": "variant weight_grams unchanged (v2 total-gold estimate); the maker quoted body grams without the chain", "authorizedOn": "2026-10-28", "authorizedBy": "owner 2026-10-28: ''Ürünlerin maliyet hesapları geldi, bunlara göre satış fiyatlarını hesapla'' (discount 30 % + margin 50 % rule of 2026-10-18 carried)"}'::jsonb as plan),
t(code, p10, g10, a10, h10, c10, d10, m10, p14, g14, a14, h14, c14, d14, m14, p18, g18, a18, h18, c18, d18, m18, fx, quote, e10, e14, e18) as (values
('B1', 134500, 1.34, 11252, 21198, 38100, 94150, 0.5001, 182000, 1.5, 15900, 30000, 51550, 127400, 0.5002, 241700, 1.71, 21804, 41032, 68486, 169190, 0.5001, 5000, '{"text": "1.5 gr , 300 zincir, 50 clean assamble stone", "bodyGrams14k": 1.5, "linesUsd": {"chain": 300, "assembly": 50}}'::jsonb, 93000, 131400, 179600),
('B2', 123500, 2.23, 18725, 10599, 34974, 86450, 0.5002, 166500, 2.5, 26500, 15000, 47150, 116550, 0.5002, 220200, 2.84, 36213, 20516, 62379, 154140, 0.5001, 5000, '{"text": "2,5 gr 150 chain 50 clean asamble", "bodyGrams14k": 2.5, "linesUsd": {"chain": 150, "assembly": 50}}'::jsonb, 90900, 128400, 175500),
('B3', 145700, 1.78, 14947, 17665, 41262, 101990, 0.5002, 193600, 2.0, 21200, 25000, 54850, 135520, 0.5001, 253400, 2.27, 28945, 34193, 71788, 177380, 0.5001, 8000, '{"text": "2gr, 50 assamble tas, 30 enemal , 250 chain", "bodyGrams14k": 2.0, "linesUsd": {"chain": 250, "assembly": 50, "enamel": 30}}'::jsonb, 88600, 125400, 171400),
('B4', 140300, 1.78, 14947, 14132, 39729, 98210, 0.5002, 183000, 2.0, 21200, 20000, 51850, 128100, 0.5, 236300, 2.27, 28945, 27355, 66950, 165410, 0.5001, 10000, '{"text": "2gr, 200 chain , 50 assamble , 50 enemal", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 50}}'::jsonb, 98900, 140000, 191300),
('B5', 147600, 1.78, 14947, 21198, 41795, 103320, 0.5002, 200700, 2.0, 21200, 30000, 56850, 140490, 0.5002, 266900, 2.27, 28945, 41032, 75627, 186830, 0.5001, 5000, '{"text": "2 gr, 50 clean assamble stone, 300 chain", "bodyGrams14k": 2.0, "linesUsd": {"chain": 300, "assembly": 50}}'::jsonb, 95100, 134400, 183600),
('B6', 145700, 1.78, 14947, 17665, 41262, 101990, 0.5002, 193600, 2.0, 21200, 25000, 54850, 135520, 0.5001, 253400, 2.27, 28945, 34193, 71788, 177380, 0.5001, 8000, '{"text": "2 gr, 50 clean, 30 enemal, 250 chain", "bodyGrams14k": 2.0, "linesUsd": {"chain": 250, "assembly": 50, "enamel": 30}}'::jsonb, 99200, 140400, 192200),
('B7', 136000, 2.23, 18725, 14132, 38507, 95200, 0.5003, 184100, 2.5, 26500, 20000, 52150, 128870, 0.5001, 244300, 2.84, 36213, 27355, 69218, 171010, 0.5001, 5000, '{"text": "2,5 gr, 50 assamble, 20 chain", "bodyGrams14k": 2.5, "linesUsd": {"chain": 200, "assembly": 50}, "flag": "chain written as ''20''; every other chain line is 150-300 and this piece has the same 16.5 cm Franco chain as B1-B6, so 20 is read as a typo for 200. Priced at 200; at 20 the 14K list would be 1300 instead of 1900. CONFIRM with the maker."}'::jsonb, 98000, 138500, 189500),
('B8', 133200, 1.78, 14947, 14132, 37729, 93240, 0.5001, 176000, 2.0, 21200, 20000, 49850, 123200, 0.5002, 229200, 2.27, 28945, 27355, 64950, 160440, 0.5, 8000, '{"text": "2 gr, 50, 30, 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 30}, "note": "unlabelled numbers read in the order of his B6 message: assembly, enamel, chain"}'::jsonb, 94800, 134000, 183200),
('B9', 133200, 1.78, 14947, 14132, 37729, 93240, 0.5001, 176000, 2.0, 21200, 20000, 49850, 123200, 0.5002, 229200, 2.27, 28945, 27355, 64950, 160440, 0.5, 8000, '{"text": "ayni", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 30}, "same_as": "B8"}'::jsonb, 91500, 129600, 177300),
('B10', 133200, 1.78, 14947, 14132, 37729, 93240, 0.5001, 176000, 2.0, 21200, 20000, 49850, 123200, 0.5002, 229200, 2.27, 28945, 27355, 64950, 160440, 0.5, 8000, '{"text": "ayni", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 30}, "same_as": "B8"}'::jsonb, 91800, 129900, 177800),
('N1', 122600, 1.78, 14947, 14132, 34729, 85820, 0.5, 165400, 2.0, 21200, 20000, 46850, 115780, 0.5001, 218700, 2.27, 28945, 27355, 61950, 153090, 0.5002, 5000, '{"text": "2 GRAM 50 200 CAHIN", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50}}'::jsonb, 109200, 154600, 211600),
('N2', 145700, 1.78, 14947, 17665, 41262, 101990, 0.5002, 193600, 2.0, 21200, 25000, 54850, 135520, 0.5001, 253400, 2.27, 28945, 34193, 71788, 177380, 0.5001, 8000, '{"text": "2GR 50 30 250", "bodyGrams14k": 2.0, "linesUsd": {"chain": 250, "assembly": 50, "other": 30}, "note": "middle number sits in the enamel position; the catalog lists N2 without enamel (4 stones), kept as a quoted extra"}'::jsonb, 110100, 155700, 213000),
('N3', 140300, 1.78, 14947, 14132, 39729, 98210, 0.5002, 183000, 2.0, 21200, 20000, 51850, 128100, 0.5, 236300, 2.27, 28945, 27355, 66950, 165410, 0.5001, 10000, '{"text": "2 GR 50 50 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 50}}'::jsonb, 107700, 152400, 208500),
('N4', 126200, 1.78, 14947, 14132, 35729, 88340, 0.5003, 168900, 2.0, 21200, 20000, 47850, 118230, 0.5001, 222200, 2.27, 28945, 27355, 62950, 155540, 0.5001, 6000, '{"text": "2 GR 50 10 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "other": 10}, "note": "middle number sits in the enamel position; the catalog lists N4 without enamel (3 stones), kept as a quoted extra"}'::jsonb, 106800, 151200, 207100),
('N5', 122600, 1.78, 14947, 14132, 34729, 85820, 0.5, 165400, 2.0, 21200, 20000, 46850, 115780, 0.5001, 218700, 2.27, 28945, 27355, 61950, 153090, 0.5002, 5000, '{"text": "2 GR 50 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50}}'::jsonb, 111200, 157600, 215700),
('E1', 121400, 2.23, 18725, 0, 34375, 84980, 0.5002, 148800, 2.5, 26500, 0, 42150, 104160, 0.5001, 183100, 2.84, 36213, 0, 51863, 128170, 0.5002, 15000, '{"text": "2,5 gr 100 push post 50", "bodyGrams14k": 2.5, "linesUsd": {"assembly": 50, "post": 100}}'::jsonb, 43000, 60400, 82000),
('E2', 121400, 2.23, 18725, 0, 34375, 84980, 0.5002, 148800, 2.5, 26500, 0, 42150, 104160, 0.5001, 183100, 2.84, 36213, 0, 51863, 128170, 0.5002, 15000, '{"text": "ayni", "bodyGrams14k": 2.5, "linesUsd": {"assembly": 50, "post": 100}, "same_as": "E1"}'::jsonb, 46500, 65200, 88700),
('E3', 139000, 2.23, 18725, 0, 39375, 97300, 0.5001, 166500, 2.5, 26500, 0, 47150, 116550, 0.5002, 200700, 2.84, 36213, 0, 56863, 140490, 0.5001, 20000, '{"text": "ayni plus 50 anemal", "bodyGrams14k": 2.5, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}, "same_as": "E1"}'::jsonb, 46800, 65600, 89200),
('E4', 108100, 1.78, 14947, 0, 30597, 75670, 0.5003, 130100, 2.0, 21200, 0, 36850, 91070, 0.5001, 157400, 2.27, 28945, 0, 44595, 110180, 0.5, 15000, '{"text": "2 GR, 50 + 100", "bodyGrams14k": 2.0, "linesUsd": {"assembly": 50, "post": 100}, "note": "50 + 100 read as the earring pattern of E1: assembly 50, push posts 100"}'::jsonb, 44500, 62300, 84700),
('E5', 143300, 1.78, 14947, 0, 40597, 100310, 0.5, 165400, 2.0, 21200, 0, 46850, 115780, 0.5001, 192700, 2.27, 28945, 0, 54595, 134890, 0.5001, 25000, '{"text": "BU 2 GR 50 EXTRA 200 KILIT MEKANOIZMASI", "bodyGrams14k": 2.0, "linesUsd": {"assembly": 50, "lock": 200}}'::jsonb, 40100, 55900, 76100),
('E6', 152400, 2.68, 22504, 0, 43154, 106680, 0.5002, 185100, 3.0, 31800, 0, 52450, 129570, 0.5, 226300, 3.41, 43481, 0, 64131, 158410, 0.5, 20000, '{"text": "3 GR 50 CLEANING 100 PUSH POST 50ENAMAL", "bodyGrams14k": 3.0, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}}'::jsonb, 46800, 65600, 89200),
('E7', 152400, 2.68, 22504, 0, 43154, 106680, 0.5002, 185100, 3.0, 31800, 0, 52450, 129570, 0.5, 226300, 3.41, 43481, 0, 64131, 158410, 0.5, 20000, '{"text": "AYNISI", "bodyGrams14k": 3.0, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}, "same_as": "E6"}'::jsonb, 46500, 65200, 88700),
('E8', 152400, 2.68, 22504, 0, 43154, 106680, 0.5002, 185100, 3.0, 31800, 0, 52450, 129570, 0.5, 226300, 3.41, 43481, 0, 64131, 158410, 0.5, 20000, '{"text": "BUNU ANLAMADIM KOLYEUCUMU KUPE MI, KUPE ISE AYNI", "bodyGrams14k": 3.0, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}, "same_as": "E6", "note": "he asked whether the lantern is a pendant or an earring; it is the Berry Lantern Stud (E8), so his ''if earring, same'' applies"}'::jsonb, 45700, 64100, 87400),
('E9', 152400, 2.68, 22504, 0, 43154, 106680, 0.5002, 185100, 3.0, 31800, 0, 52450, 129570, 0.5, 226300, 3.41, 43481, 0, 64131, 158410, 0.5, 20000, '{"text": "AYNI", "bodyGrams14k": 3.0, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}, "same_as": "E6"}'::jsonb, 44200, 61900, 84200),
('E10', 152400, 2.68, 22504, 0, 43154, 106680, 0.5002, 185100, 3.0, 31800, 0, 52450, 129570, 0.5, 226300, 3.41, 43481, 0, 64131, 158410, 0.5, 20000, '{"text": "AYNI", "bodyGrams14k": 3.0, "linesUsd": {"assembly": 50, "enamel": 50, "post": 100}, "same_as": "E6"}'::jsonb, 45900, 64500, 87800)
), v_upd as (
  update product_variants v
     set price_cents = case v.properties->>'Gold Karat' when '10K' then t.p10 when '14K' then t.p14 else t.p18 end
    from products p, t
   where p.id = v.product_id and p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c'
     and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
     and p.status = 'draft' and p.archived_at is null
     and v.properties->>'Gold Karat' in ('10K', '14K', '18K')
     and v.sku = 'JGN-X26-' || t.code || '-' || (v.properties->>'Gold Karat')
  returning v.id
), p_upd as (
  update products p
     set price_cents = t.p10,
         listing_metadata = coalesce(p.listing_metadata, '{}'::jsonb)
           || jsonb_build_object('retailPricePlan', common.plan
                || jsonb_build_object('priceCents', t.p10, 'quote', t.quote,
                                      'estimateV2ListCents', jsonb_build_object('10K', t.e10, '14K', t.e14, '18K', t.e18),
                                      'karats', jsonb_build_object('10K', jsonb_build_object('bodyGrams', t.g10, 'goldCents', t.a10, 'chainCents', t.h10, 'fixedCents', t.fx, 'costCents', t.c10, 'listCents', t.p10, 'paidCents', t.d10, 'margin', t.m10), '14K', jsonb_build_object('bodyGrams', t.g14, 'goldCents', t.a14, 'chainCents', t.h14, 'fixedCents', t.fx, 'costCents', t.c14, 'listCents', t.p14, 'paidCents', t.d14, 'margin', t.m14), '18K', jsonb_build_object('bodyGrams', t.g18, 'goldCents', t.a18, 'chainCents', t.h18, 'fixedCents', t.fx, 'costCents', t.c18, 'listCents', t.p18, 'paidCents', t.d18, 'margin', t.m18))))
           || jsonb_build_object('approval', coalesce(p.listing_metadata->'approval', '{}'::jsonb)
                || jsonb_build_object('priceReadyForEtsy', true, 'livePublicationAuthorized', false,
                                      'pricePlanVersion', 'xmas26-v3-quote-disc30-m50'))
    from t, common
   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
     and p.status = 'draft' and p.archived_at is null
     and exists (select 1 from product_variants v where v.product_id = p.id and v.sku = 'JGN-X26-' || t.code || '-14K')
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;

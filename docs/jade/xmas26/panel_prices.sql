-- Jade Gold NYC · Noel 2026 · üretici teklifi gelen 5 taslağın fiyatı (panel), üretici: panel_prices.py
-- plan xmas26-v4-quote-disc30-m50 · indirim %30 · hedef marj %50
-- teklif spotu 4054.1 (gold-api.com 2026-10-28T09:54Z) · $/g {'10K': 8397, '14K': 10600, '18K': 12751} · zincir karat oranı {'10K': 0.7066, '14K': 1.0, '18K': 1.3677}
-- bu koşu (xmas26-v4-quote-disc30-m50): N6 N7 N8 N9 N10 · dokunulmayan: B1 B2 B3 B4 B5 B6 B7 B8 B9 B10 E1 E2 E3 E4 E5 E6 E7 E8 E9 E10 N1 N2 N3 N4 N5 P1 P2 P3 P4 P5 P6 P7 P8 P9 P10
-- beklenen mühür SONRA (120 varyant, sku-karat:liste:gram, sku sırası): 6e399dc9007b2705d5574363cbef0ffd · liste toplamı 20548700 cent
-- beklenen mühür ÖNCE (canlı, bu koşudan önce): 67f246863b3b4dcaf8d749a8d1107b8e · toplam 20015000 cent
--
-- ÖN KOŞUL (uygulamadan önce koş; plan sayıları {'xmas26-v2-disc30-m50': 10, 'xmas26-v3-quote-disc30-m50': 25, 'xmas26-v4-quote-disc30-m50': 0} ile
--   yani bu koşunun planı 0, önceki planlar {'xmas26-v2-disc30-m50': 10, 'xmas26-v3-quote-disc30-m50': 25}, ve mühür 67f246863b3b4dcaf8d749a8d1107b8e
--   beklenir; aksi hâlde DUR — "zaten koşmuş mu?" kapısı):
--   with p as (select p.id, p.listing_metadata->'retailPricePlan'->>'version' ver from products p
--              where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
--                and p.status = 'draft' and p.archived_at is null)
--   select count(distinct p.id), count(v.id),
--          jsonb_object_agg(ver, n) from (select ver, count(*) n from p group by ver) x,
--          (select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku))
--             from p join product_variants v on v.product_id = p.id
--            where v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K')) s;
--
-- GERİ OKUMA (uygulamadan sonra; mühür yukarıdaki SONRA mührüyle birebir tutmalı):
--   select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku)),
--          sum(v.price_cents), count(*)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
--     and v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
with common as (select '{"version": "xmas26-v4-quote-disc30-m50", "status": "MAKER_QUOTE", "currency": "USD", "priceIs": "lowest variant (10K); 14K is the design price", "discountPercent": 30, "targetMargin": 0.5, "engine": "lib/jade/pricing.ts", "source": "docs/jade/xmas26/catalog.json + work/maker_quotes.json", "rule": "cost = body grams × density × $/g + chain × karat ratio + assembly/enamel/stone/posts/lock + shipping + packaging; the all-in 14K $/g was not quoted and stays 106", "karatRule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design", "spotUsdPerOzt": 4054.1, "spotSource": "gold-api.com 2026-10-28T09:54Z", "costPerGram14kCents": 10600, "rateCentsPerGram": {"10K": 8397, "14K": 10600, "18K": 12751}, "chainKaratRatio": {"10K": 0.7066, "14K": 1.0, "18K": 1.3677}, "densityRatio": {"10K": 0.892, "14K": 1.0, "18K": 1.137}, "weightsNote": "variant weight_grams unchanged (v2 total-gold estimate); the maker quoted body grams without the chain", "authorizedOn": "2026-10-28", "authorizedBy": "owner 2026-10-28: ''Ürünlerin maliyet hesapları geldi, bunlara göre satış fiyatlarını hesapla'' (discount 30 % + margin 50 % rule of 2026-10-18 carried)"}'::jsonb as plan),
t(code, p10, g10, a10, h10, c10, d10, m10, p14, g14, a14, h14, c14, d14, m14, p18, g18, a18, h18, c18, d18, m18, fx, quote, e10, e14, e18) as (values
('N6', 127200, 1.34, 11252, 14132, 36034, 89040, 0.5, 164300, 1.5, 15900, 20000, 46550, 115010, 0.5, 211100, 1.71, 21804, 27355, 59809, 147770, 0.5001, 10000, '{"text": "1,5 GR 50 50 200", "bodyGrams14k": 1.5, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 50}}'::jsonb, 107400, 152000, 208000),
('N7', 122600, 1.78, 14947, 14132, 34729, 85820, 0.5, 165400, 2.0, 21200, 20000, 46850, 115780, 0.5001, 218700, 2.27, 28945, 27355, 61950, 153090, 0.5002, 5000, '{"text": "2 GR 50 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50}}'::jsonb, 108600, 153900, 210300),
('N8', 122600, 1.78, 14947, 14132, 34729, 85820, 0.5, 165400, 2.0, 21200, 20000, 46850, 115780, 0.5001, 218700, 2.27, 28945, 27355, 61950, 153090, 0.5002, 5000, '{"text": "2GR 50 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50}}'::jsonb, 99500, 140800, 192700),
('N9', 180000, 3.12, 26199, 14132, 50981, 126000, 0.5002, 239100, 3.5, 37100, 20000, 67750, 167370, 0.5001, 313200, 3.98, 50749, 27355, 88754, 219240, 0.5001, 10000, '{"text": "3,5 GR 50 50 200", "bodyGrams14k": 3.5, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 50}}'::jsonb, 104500, 147900, 202100),
('N10', 140300, 1.78, 14947, 14132, 39729, 98210, 0.5002, 183000, 2.0, 21200, 20000, 51850, 128100, 0.5, 236300, 2.27, 28945, 27355, 66950, 165410, 0.5001, 10000, '{"text": "2 GR 50 50 200", "bodyGrams14k": 2.0, "linesUsd": {"chain": 200, "assembly": 50, "enamel": 50}}'::jsonb, 102700, 145300, 198500)
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
                                      'pricePlanVersion', 'xmas26-v4-quote-disc30-m50'))
    from t, common
   where p.org_id = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c' and p.listing_metadata->>'import_batch' like 'jade-xmas26%'
     and p.status = 'draft' and p.archived_at is null
     and exists (select 1 from product_variants v where v.product_id = p.id and v.sku = 'JGN-X26-' || t.code || '-14K')
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;

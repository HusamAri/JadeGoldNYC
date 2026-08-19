-- 0146 — EON düz (Dome & Flat) işçilik tabanı $30 → $38 + canlı fiyat göçü.
-- ---------------------------------------------------------------------------
-- 0144/0145'in kardeşi. Orada EL-İŞİ taban $40 → $74 kalibre edilmişti; bu
-- migration DÜZ tabanı gerçek faturaya çeker.
--
-- Ölçüm (docs/eon/tamsan-cost-calibration.md "Ek: 5. fatura"): 11 satır /
-- 5 Tamsan faturası. Zımni işçilik = tutar − melt×1,07 (motorun fire payı
-- metalde olduğu için işçilik kalemi o kadar küçülür):
--   - Düz (Dome & Flat), 6 satır: medyan **$38** — motor $30 taşıyordu.
--   - Süslü (Diamond Cut), 5 satır: medyan $73 — motorun $74'ü DOĞRULANDI,
--     değişiklik gerekmedi.
--
-- İşçilik altın fiyatının yüzdesi DEĞİLDİR: işçilik/melt oranı %21-88 arasında
-- savruluyor. Metal spota birebir endeksli (tedarikçi faturasına kendi altın
-- tabanını basıyor: $4372,40 → $4438,80), işçilik ise parça başına — düzde
-- gerçekten sabit (işçilik-gram korelasyonu r=0,23), süslüde boyutla artıyor
-- (r=0,97) ama $74 ölçülen aralıkta dengede.
--
-- Kullanıcı onayı: 2026-08-18. Etsy sonucu: 4.565 varyant / 25 aktif listing,
-- ops price-sync ile canary + 2 parça → 25/25 synced, read-back kalan fark 0.
-- Vitrin etkisi varyant başına +$15…+$25 (ortalama +$18,6); zarar riski yok
-- (mevcut $30 tabanı da melt üstündeydi) — maliyet-gerçeği düzeltmesi.
--
-- Elle-kurulmuş (taban-uyumsuz) satırlara ve el-işi ($74) satırlara
-- DOKUNULMAZ: koşul yalnız fiyatı $30 formülüyle birebir üretilen satırı seçer.
-- Idempotent: koşulmuş durumda 0 satır etkilenir. Kabul kapısı kalan p30'u sınar.

begin;

update pricing_config c
set labor_usd = 38, updated_at = now()
from organizations o
where o.id = c.org_id and o.name = 'EON'
  and c.labor_usd is distinct from 38;

with f as (
  select v.id, v.price_cents,
    substring(v.sku from '-R-(\d{2})')::int as karat,
    nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric as w,
    v.weight_grams::float as g
  from products p
  join product_variants v on v.product_id = p.id
  join organizations o on o.id = p.org_id
  where o.name = 'EON' and p.status = 'active'
    and v.sku ~ '-R-(10|14|18)\d{2}-'
    and v.weight_grams > 0 and v.price_cents > 0
), calc as (
  select id, price_cents,
    (ceil(floor((( (4399.90/31.1034768)
        * (case karat when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * g * 1.07 + 30 + 8 + 22)
      * (case when w >= 8 then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int as p30,
    (ceil(floor((( (4399.90/31.1034768)
        * (case karat when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * g * 1.07 + 38 + 8 + 22)
      * (case when w >= 8 then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int as p38
  from f
)
update product_variants v
set price_cents = c.p38, updated_at = now()
from calc c
where v.id = c.id and c.price_cents = c.p30 and c.p30 <> c.p38;

do $gate$
declare
  v_kalan int;
  v_config int;
begin
  select count(*) into v_kalan
  from products p
  join product_variants v on v.product_id = p.id
  join organizations o on o.id = p.org_id
  where o.name = 'EON' and p.status = 'active'
    and v.sku ~ '-R-(10|14|18)\d{2}-'
    and v.weight_grams > 0 and v.price_cents > 0
    and v.price_cents = (ceil(floor(
      (( (4399.90/31.1034768)
        * (case substring(v.sku from '-R-(\d{2})')::int
             when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * v.weight_grams * 1.07 + 30 + 8 + 22 )
      * (case when nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int
    and v.price_cents <> (ceil(floor(
      (( (4399.90/31.1034768)
        * (case substring(v.sku from '-R-(\d{2})')::int
             when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * v.weight_grams * 1.07 + 38 + 8 + 22 )
      * (case when nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int;

  select count(*) into v_config
  from pricing_config c join organizations o on o.id = c.org_id
  where o.name = 'EON' and c.labor_usd <> 38;

  if v_kalan <> 0 then
    raise exception '0146: % satır hâlâ $30 tabanında', v_kalan;
  end if;
  if v_config <> 0 then
    raise exception '0146: pricing_config düz işçilik tabanı 38 değil';
  end if;
end
$gate$;

commit;

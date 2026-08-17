-- 0144 — EON el-işi işçilik tabanı $40 → $74 + Greek Key draft fiyat düzeltmesi.
-- ---------------------------------------------------------------------------
-- Neden: kullanıcı Greek Key (aile 08) fiyatlarını "çok düşük" diye işaretledi
-- (2026-08-17). Ölçüm fiyatların KATALOGLA tutarlı olduğunu, kök nedenin ise
-- fiyat formülündeki işçilik girdisi olduğunu gösterdi: config el-işi $40
-- taşıyordu, Tamsan fatura kalibrasyonu süslü parçayı $74 gösteriyor
-- (docs/eon/tamsan-cost-calibration.md). Yani formül doğru, GİRDİ gerçeğin
-- yaklaşık yarısıydı. Kullanıcı kararı: taban $74, kapsam TÜM el-işi aileler.
--
-- Bu migration'ın canlıya uygulanan iki adımı:
--   1. pricing_config.labor_handfinished_usd: 40 → 74 (EON org).
--   2. Greek Key ailesinin 7 formül-uyumlu listing'i (GLD/RSG × 10-14-18K +
--      WHG 10K; 1.750 varyant) $74 tabanıyla yeniden fiyatlandı — motor
--      formülüyle BİT-UYUMLU (gold-index.ts eonListCents birebir: ara
--      roundHalfUp + ceil(motor×4/15)×5 + troy 31.1034768; ilk basımdaki
--      basitleştirilmiş formül 115 satırda 5$ hücre kaymasına düşmüştü,
--      ikinci geçişte düzeltildi ve TS harness 40/40 doğruladı).
--
-- BİLEREK HARİÇ: WHG-R-1408 ve WHG-R-1808 (14K/18K beyaz Greek). Bu iki
-- listing'in mevcut fiyatları hiçbir işçilik kademesiyle üretilemiyor ve $74
-- formülünün de ÜSTÜNDE (formüle çekmek 1408'de 250/250, 1808'de 186/250
-- satırı DÜŞÜRÜRDÜ). İşçilik tabanı orada fazlasıyla karşılandığı ve talep
-- "yükseltme" olduğu için dokunulmadı; tutarsızlık ayrı karar bekliyor.
--
-- CANLI aktif kataloğun $40-tabanlı 1.741 el-işi varyantı (8 listing) bu
-- migration'la DEĞİŞMEZ — onların göçü gold-reprice koşusundadır
-- (lib/pricing/gold-reprice-run.ts `hedefKademe`: $40 tespit edilen satır
-- $74 ile yeniden üretilir), çünkü canlı fiyat Etsy'ye basım + read-back
-- ile birlikte değişmelidir, yalnız DB'de değil.
--
-- Idempotent: her iki adım da koşulmuş durumu no-op geçer.

begin;

update pricing_config c
set labor_handfinished_usd = 74, updated_at = now()
from organizations o
where o.id = c.org_id and o.name = 'EON'
  and c.labor_handfinished_usd is distinct from 74;

update product_variants v
set price_cents = sub.motor_cents, updated_at = now()
from (
  select v2.id,
    (ceil(floor(
      (( (4399.90/31.1034768)
        * (case substring(v2.sku from '-R-(\d{2})')::int
             when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * v2.weight_grams * 1.07 + 74 + 8 + 22 )
      * (case when nullif(substring(v2.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5
    ) * 4 / 15.0) * 5 * 100)::int as motor_cents
  from products p
  join product_variants v2 on v2.product_id = p.id
  join organizations o on o.id = p.org_id
  where o.name = 'EON'
    and p.sku in ('GLD-R-1008','GLD-R-1408','GLD-R-1808',
                  'RSG-R-1008','RSG-R-1408','RSG-R-1808','WHG-R-1008')
    and v2.weight_grams > 0
) sub
where v.id = sub.id and v.price_cents <> sub.motor_cents;

-- Kabul kapısı: 7 listing'in tüm varyantları motor formülüyle bit-uyumlu
-- olmalı; değilse migration BAŞARISIZ olur (sessiz geçmez).
do $gate$
declare
  v_uyumsuz int;
  v_config int;
begin
  select count(*) into v_uyumsuz
  from products p
  join product_variants v on v.product_id = p.id
  join organizations o on o.id = p.org_id
  where o.name = 'EON'
    and p.sku in ('GLD-R-1008','GLD-R-1408','GLD-R-1808',
                  'RSG-R-1008','RSG-R-1408','RSG-R-1808','WHG-R-1008')
    and v.weight_grams > 0
    and v.price_cents <> (ceil(floor(
      (( (4399.90/31.1034768)
        * (case substring(v.sku from '-R-(\d{2})')::int
             when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * v.weight_grams * 1.07 + 74 + 8 + 22 )
      * (case when nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5
    ) * 4 / 15.0) * 5 * 100)::int;

  select count(*) into v_config
  from pricing_config c join organizations o on o.id = c.org_id
  where o.name = 'EON' and c.labor_handfinished_usd <> 74;

  if v_uyumsuz <> 0 then
    raise exception '0144: % varyant motor formülüyle uyumsuz kaldı', v_uyumsuz;
  end if;
  if v_config <> 0 then
    raise exception '0144: pricing_config el-işi tabanı 74 değil';
  end if;
end
$gate$;

commit;

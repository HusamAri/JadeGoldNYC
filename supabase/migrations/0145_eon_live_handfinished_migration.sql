-- 0145 — EON canlı el-işi ailelerin işçilik göçü: $40-tabanlı fiyatlar $74'e.
-- ---------------------------------------------------------------------------
-- 0144'ün devamı (kullanıcı kararı 2026-08-17: taban $74, kapsam TÜM el-işi
-- aileler; koşu onayı 2026-08-18). 0144 Greek draft'larını fiyatlamıştı; bu
-- migration CANLI kataloğun $40-tabanlı el-işi satırlarını göçürür:
-- 6 milgrain + 2 two-tone listing, 1.741 varyant, ort +$81.
--
-- Yol notu: göç ilk planda gold-reprice koşusuyla yapılacaktı
-- (gold-reprice-run.ts `hedefKademe` bunun için eklendi ve durur — sonraki
-- spot koşuları $40 artığı yakalarsa yine göçürür). Ops rotası yalnız
-- CRON_SECRET kabul ettiği ve bu oturumun ona erişimi olmadığı için eşdeğer
-- kanıtlı yol kullanıldı: DB'de motor formülüyle (bit-uyumlu) göç + ops
-- price-sync ile Etsy basımı. Etsy sonucu (2026-08-18): canary 4539493533
-- 228 offering synced; batch 7 listing synced; 8/8'de read-back kalan fark 0;
-- toplam 1.741 offering. Elle-kurulmuş (taban-uyumsuz) satırlar ve $30 düz
-- satırlar bilerek DEĞİŞMEDİ — price-sync onları "unchanged" geçti.
--
-- Idempotent: yalnız price = p40(satır) olan satırlar güncellenir; koşulmuş
-- durumda 0 satır etkilenir. Kabul kapısı kalan p40 sayısını sınar.

begin;

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
        * g * 1.07 + 40 + 8 + 22)
      * (case when w >= 8 then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int as p40,
    (ceil(floor((( (4399.90/31.1034768)
        * (case karat when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * g * 1.07 + 74 + 8 + 22)
      * (case when w >= 8 then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int as p74
  from f
)
update product_variants v
set price_cents = c.p74, updated_at = now()
from calc c
where v.id = c.id and c.price_cents = c.p40 and c.p40 <> c.p74;

do $gate$
declare
  v_kalan int;
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
        * v.weight_grams * 1.07 + 40 + 8 + 22 )
      * (case when nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int
    and v.price_cents <> (ceil(floor(
      (( (4399.90/31.1034768)
        * (case substring(v.sku from '-R-(\d{2})')::int
             when 10 then 0.417 when 14 then 0.583 else 0.75 end)
        * v.weight_grams * 1.07 + 74 + 8 + 22 )
      * (case when nullif(substring(v.sku from '-(\d+(?:\.\d+)?)MM'),'')::numeric >= 8
              then 2.0 else 1.55 end)) + 0.5) * 4 / 15.0) * 5 * 100)::int;

  if v_kalan <> 0 then
    raise exception '0145: % satır hâlâ $40 tabanında', v_kalan;
  end if;
end
$gate$;

commit;

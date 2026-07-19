-- ============================================================
-- EON ONAY PAKETİ v2 — 2026-07-16 (yayın-yargı loop kararı: 9/9 READY)
-- Supabase Dashboard > SQL Editor'a TAMAMINI yapıştır, tek seferde çalıştır.
-- İçerik: quick-win tag setleri + açıklama ekleri + ONAYLANDI damgası
--         + archived_at düzeltmesi + 0097 (EBITDA) + 0098 (audit) migration.
-- Tümü idempotent: ikinci kez çalıştırmak zarar vermez.
-- ============================================================

begin;

-- ── 1) QUICK-WIN TAG SETLERİ (9 READY; motor-doğrulanmış 13'lük tam setler) ──
-- Niyet: 'anniversary' klonu 9/9 çıkar (Occasion attribute'u aramada tag gibi
-- eşleşir), mm sorgu kapsaması (3-7mm dağıtıldı), 10K/gravür kimliği, kardeş ayrışması.
update products set tags = array['comfort fit band', 'domed wedding band', '4mm wedding band', 'yellow gold band', 'half round ring', 'classic wedding ring', '14k gold ring', 'engraved gold ring', 'mens comfort fit', 'heirloom jewelry', 'solid 14k gold', 'mens wedding jewelry', 'unisex comfort fit']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 01 %';
update products set tags = array['14k white gold band', 'comfort fit band', 'domed wedding band', '5mm gold band', 'half round ring', 'classic wedding ring', '14k gold ring', 'engraved gold ring', 'mens comfort fit', 'heirloom jewelry', 'mens wedding jewelry', 'unisex comfort fit', 'domed half round']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 02 %';
update products set tags = array['rose gold band', 'comfort fit band', 'domed wedding band', 'heirloom band', '3mm gold ring', 'classic wedding ring', '14k gold ring', 'engraved gold ring', 'mens comfort fit', 'heirloom jewelry', 'womens comfort fit', 'domed half round', 'personalized jewelry']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 03 %';
update products set tags = array['comfort fit band', 'domed comfort fit', 'half round band', '10k solid gold', 'domed wedding ring', 'mens wedding ring', '7mm gold ring', 'promise ring', '10k wedding band', '10k gold jewelry', 'free engraving', 'unisex comfort fit', 'yellow gold band']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 04 %';
update products set tags = array['comfort fit band', 'domed comfort fit', 'half round band', '10k solid gold', 'domed wedding ring', 'mens wedding ring', 'promise ring', '10k white gold ring', '10k gold jewelry', 'free engraving', 'unisex comfort fit', 'white gold band', '5mm wedding band']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 05 %';
update products set tags = array['comfort fit band', 'domed comfort fit', 'half round band', '10k solid gold', 'domed wedding ring', 'mens wedding ring', 'promise ring', '10k rose gold ring', '10k gold jewelry', 'free engraving', 'unisex comfort fit', 'rose gold band', '6mm wedding band']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 06 %';
update products set tags = array['milgrain band', 'beaded edge ring', 'vintage stacking', 'dainty stacking ring', 'vintage wedding ring', 'heirloom ring', 'milgrain jewelry', 'dainty 14k jewelry', 'vintage bridal', 'yellow gold band', '2mm wedding band', 'thin wedding band', 'free engraving']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 13 %';
update products set tags = array['milgrain band', 'beaded edge ring', 'vintage stacking', 'dainty stacking ring', 'vintage wedding ring', 'heirloom ring', 'milgrain jewelry', 'dainty 14k jewelry', 'vintage bridal', 'white gold band', '2mm gold band', 'thin gold band', 'free engraving']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 14 %';
update products set tags = array['milgrain band', 'beaded edge ring', 'vintage stacking', 'dainty stacking ring', 'vintage wedding ring', 'heirloom ring', 'milgrain jewelry', 'dainty 14k jewelry', 'vintage bridal', 'rose gold band', 'milgrain band 14k', 'beaded gold band', 'free engraving']::text[] where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 15 %';

-- ── 2) AÇIKLAMA EKLERİ (THE DETAILS sonuna; footer eşleşme anahtarı bozulmaz) ──
-- Rakamlar varyant tablosundan: 14k 3mm≈3.6g / 7mm≈8.4g / 6mm $1,015;
-- 10k 3.2g / 7.4g / $670 (hepsi US 4-6.5 bandı). Idempotent ('Stamped' bekçisi).
update products set description = replace(description, E'\n\n---\n[EON 01 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.6 g and a 7mm around 8.4 g of solid 14k, so a 6mm begins near $1,015.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 01 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 01 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 02 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.6 g and a 7mm around 8.4 g of solid 14k, so a 6mm begins near $1,015.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 02 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 02 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 03 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.6 g and a 7mm around 8.4 g of solid 14k, so a 6mm begins near $1,015.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 03 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 03 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 04 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.2 g and a 7mm around 7.4 g of solid 10k, so a 6mm begins near $670.\n- Stamped 10k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 04 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 04 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 05 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.2 g and a 7mm around 7.4 g of solid 10k, so a 6mm begins near $670.\n- Stamped 10k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 05 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 05 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 06 ', E'\n- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.2 g and a 7mm around 7.4 g of solid 10k, so a 6mm begins near $670.\n- Stamped 10k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 06 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 06 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 13 ', E'\n- Priced by ring size: the price shown covers sizes 4-6.5, and the dropdown shows your exact price before you order.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 13 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 13 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 14 ', E'\n- Priced by ring size: the price shown covers sizes 4-6.5, and the dropdown shows your exact price before you order.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 14 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 14 %' and description not like '%Stamped 1_k inside%';
update products set description = replace(description, E'\n\n---\n[EON 15 ', E'\n- Priced by ring size: the price shown covers sizes 4-6.5, and the dropdown shows your exact price before you order.\n- Stamped 14k inside the band.\n- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.\n\n---\n[EON 15 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 15 %' and description not like '%Stamped 1_k inside%';

-- ── 3) 04/06 sarkan karşılaştırma tıraşı ('The same' → bağımsız cümle) ──
update products set description = replace(description, 'The same domed profile in solid 10k', 'A smooth domed profile in solid 10k') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and (description like '%[EON 04 %' or description like '%[EON 06 %');

-- ── 4) ONAYLANDI DAMGASI — '[EON NN · ' öneki KORUNUR ki push script'in
--       stripInternalTrailer regex'i (\n---\n\[EON ) ve tüm LIKE anahtarları yaşasın ──
update products set description = replace(description, '[EON 01 · ', '[EON 01 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 01 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 02 · ', '[EON 02 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 02 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 03 · ', '[EON 03 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 03 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 04 · ', '[EON 04 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 04 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 05 · ', '[EON 05 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 05 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 06 · ', '[EON 06 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 06 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 13 · ', '[EON 13 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 13 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 14 · ', '[EON 14 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 14 %' and description not like '%ONAYLANDI%';
update products set description = replace(description, '[EON 15 · ', '[EON 15 · ONAYLANDI 2026-07-16 · ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 15 %' and description not like '%ONAYLANDI%';

-- ── 5) Arşiv düzeltmesi (retro-audit bulgusu: 10 eski taslak archived_at NULL) ──
update products set archived_at = now() where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'archived' and archived_at is null;

-- ── 6) OPSİYONEL — beyaz altın cümlesi (02/05/14): partner cevabına göre AÇ ──
-- Rodyumsuz (doğal sıcak-beyaz) ise alttaki 3 satırın başındaki '-- ' kaldır;
-- rodyumluysa YAZMA (açıklamadaki 'never plated' iddiasıyla çelişir — önce metin kararı).
-- update products set description = replace(description, E'\n\n---\n[EON 02 ', E'\n- Our white gold is left unplated: a naturally warm white that never needs re-dipping.\n\n---\n[EON 02 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 02 %' and description not like '%unplated%';
-- update products set description = replace(description, E'\n\n---\n[EON 05 ', E'\n- Our white gold is left unplated: a naturally warm white that never needs re-dipping.\n\n---\n[EON 05 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 05 %' and description not like '%unplated%';
-- update products set description = replace(description, E'\n\n---\n[EON 14 ', E'\n- Our white gold is left unplated: a naturally warm white that never needs re-dipping.\n\n---\n[EON 14 ') where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON 14 %' and description not like '%unplated%';

commit;

-- ── 7) 0097 — İşletme kârı (EBITDA) migration (henüz uygulanmadıysa) ──
-- 0097 — İşletme kârı (EBITDA yaklaşığı): sabit/değişken kategori ayrımı + aylık RPC
--
-- Fiyat motoru sipariş-başı katkı marjını korur; ama işletmenin gerçekten para
-- kazanıp kazanmadığı SABİT giderler düşülünce belli olur (EBITDA ≈ işletme
-- kârı; bu ölçekte faiz/vergi/amortisman ihmal edilebilir). Bunun için:
--
-- 1) `cost_categories.is_fixed` — sınıflandırma KATEGORİDE taşınır (0088
--    default_bearer deseni; dışarıda string-key eşleme haritası kurulmaz).
--    Varsayılanlar: reklam / yol_ulasim / diger = sabit (satış adedinden
--    bağımsız aylık gider); malzeme / kargo / etsy_ucretleri / iscilik /
--    paketleme = değişken (sipariş başına akar). Yeni kategori default FALSE
--    (değişken) düşer — katkıyı olduğundan düşük gösterir, kârı ŞİŞİRMEZ
--    (temkinli taraf).
--
-- 2) `operating_profit_monthly` RPC — ay bazında: gelir (0094 semantiği:
--    coalesce(grand_total, item_total, 0), iptaller hariç), sipariş adedi,
--    değişken/sabit/kategorisiz maliyet toplamları. Katkı marjı, EBITDA ve
--    başa-baş adedi UI'da türetilir. Farklı kurlar TEK sayıya toplanmaz —
--    yalnız USD satırları girer; USD-dışı kayıt sayısı ayrıca döner ki kart
--    sessizce eksik toplamasın, uyarı göstersin.

alter table public.cost_categories
  add column if not exists is_fixed boolean not null default false;

comment on column public.cost_categories.is_fixed is
  'true = sabit gider (satış adedinden bağımsız; EBITDA/başa-baş hesabında sabit blok). false = değişken (sipariş başına akan).';

update public.cost_categories
  set is_fixed = true
  where key in ('reklam', 'yol_ulasim', 'diger');

create or replace function public.operating_profit_monthly(
  p_org uuid,
  p_months int default 6
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with months as (
    select date_trunc('month', current_date)::date
           - (interval '1 month' * m) as month_start
    from generate_series(0, greatest(coalesce(p_months, 6), 1) - 1) as m
  ),
  rev as (
    select date_trunc('month', s.order_date::date)::date as month_start,
           sum(coalesce(s.grand_total_cents, s.item_total_cents, 0)) as revenue_cents,
           count(*) as orders
    from public.sales s
    where s.org_id = p_org
      and s.org_id = public.current_org_id()
      and coalesce(s.status, '') <> 'cancelled'
      and s.currency = 'USD'
    group by 1
  ),
  cst as (
    select date_trunc('month', c.cost_date)::date as month_start,
           coalesce(sum(c.amount_cents) filter (where cc.is_fixed), 0) as fixed_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is not null and not cc.is_fixed), 0) as variable_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is null), 0) as uncategorized_cents
    from public.costs c
    left join public.cost_categories cc on cc.id = c.category_id
    where c.org_id = p_org
      and c.org_id = public.current_org_id()
      and c.currency = 'USD'
    group by 1
  ),
  fx as (
    -- USD-dışı kayıt var mı? (Toplama girmez; kart uyarı göstersin.)
    select
      (select count(*) from public.sales s
        where s.org_id = p_org and s.org_id = public.current_org_id()
          and s.currency <> 'USD') as sales_non_usd,
      (select count(*) from public.costs c
        where c.org_id = p_org and c.org_id = public.current_org_id()
          and c.currency <> 'USD') as costs_non_usd
  )
  select jsonb_build_object(
    'months', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m.month_start, 'YYYY-MM'),
        'revenue_cents', coalesce(r.revenue_cents, 0),
        'orders', coalesce(r.orders, 0),
        'variable_cents', coalesce(k.variable_cents, 0),
        'fixed_cents', coalesce(k.fixed_cents, 0),
        'uncategorized_cents', coalesce(k.uncategorized_cents, 0)
      ) order by m.month_start)
      from months m
      left join rev r on r.month_start = m.month_start::date
      left join cst k on k.month_start = m.month_start::date
    ),
    'sales_non_usd', (select sales_non_usd from fx),
    'costs_non_usd', (select costs_non_usd from fx)
  )
$$;

-- ── 8) 0098 — competitor_watch audit trigger (idempotent sarmalandı) ──
drop trigger if exists audit on public.competitor_watch;
create trigger audit
  after insert or update or delete on public.competitor_watch
  for each row execute function public.audit_trigger();

-- ── 9) DOĞRULAMA (çalıştır, sonuçları kontrol et) ──
-- 9a. 9 listing: 13 tag + ONAYLANDI + eklenen bloklar yerinde mi?
select substring(description from '\[EON (\d\d) ') as no,
       array_length(tags, 1) as tag_sayisi,
       description like '%ONAYLANDI%' as onaylandi,
       description like '%Stamped 1_k inside%' as damga_cumlesi,
       description like '%exchanges are covered%' as iade_cumlesi
from products
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft' and description like '%[EON %'
order by 1;

-- 9b. tag tekrar / uzunluk bekçisi (0 satır beklenir):
select p.id, t, count(*)
from products p, unnest(p.tags) as t
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.status = 'draft' and p.description like '%[EON %'
group by p.id, t having count(*) > 1 or max(length(t)) > 20;

-- 9c. 'anniversary' klonu 9 READY'de kalmadı mı? (0 beklenir):
select count(*) from products
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and status = 'draft'
  and ('anniversary gift' = any(tags) or 'anniversary ring' = any(tags))
  and substring(description from '\[EON (\d\d) ') in
      ('01', '02', '03', '04', '05', '06', '13', '14', '15');

-- 9d. Milgrain gram doğrulaması (13-15 PUBLISH kapısı — rapor §4):
select p.title, pv.sku, pv.price_cents/100.0 as usd, pv.weight_grams
from product_variants pv join products p on p.id = pv.product_id
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
  and (p.description like '%[EON 13 %' or p.description like '%[EON 14 %' or p.description like '%[EON 15 %')
order by p.title, pv.sku;

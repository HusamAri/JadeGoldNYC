-- 0181 · accounting_checks düzeltmeleri ve üç yeni kontrol (2026-11-09)
-- (Canlıya 2026-11-09'da MCP ile "0179_accounting_checks_fixes" adıyla uygulandı; main'de 0179 ve 0180 EON-FR6'ya ait olduğu için dosya
-- 0181'e taşındı. Fonksiyon gövdesi ve comment satırı canlıyla bayt bayt aynı kalsın diye değişmedi: içlerindeki "0179" bu dosyadır.)
-- 0178 canlıya çıktıktan sonra senaryo matrisinin çürütücüleri, ardından bu dosyanın taslağını sınayan üç bağımsız göz
-- (veri, SQL ve güvenlik, muhasebe) şu kusurları buldu; her biri canlı veriyle ölçüldü:
--   K1 ledger_balance_break: kapanışı entry_id ile seçiyordu, aynı saniyede
--      çok satır olunca sahte kritik (Jade son 91 gün: 13 gün). Taslaktaki
--      "herhangi aday çifti" kuralı ise kayıp satırı maskeliyordu (EON her gün).
--      Zincir ucu artık çoklu küme farkıyla seçilir; uç tekil değilse o
--      saniyenin adayları denenir. Sağlam veride sahte kırılma 0.
--   K3 refund_status_mismatch: yalnız aynı saniye vergi köprüsüne bakıyordu.
--      Vergi iadesi 1 sn sonra yazılan sipariş artık sayılır (EON 3 yerine 4,
--      Jade 5 değişmedi); vergili siparişte tek başına işlem ücreti iadesi bir
--      ücret kredisidir, iade sayılmaz (Jade 4062133504).
--   K5 cancelled_order_cogs: is_shipped NULL'u "kargolanmadı" sayıyordu.
--      Kanıt pozitif aranır ve tahsil edilmiş siparişte yalnız aranabildiği
--      dönemde sayılır. Jade 813 sipariş ve $413.506,76 yerine 516 sipariş ve
--      $280.517,60 (319'u hiç tahsil edilmedi, $162.391,17); kanıt aranamayan
--      dönemdeki 225 sipariş ($98.964,40) ve kargolu 74 iptal sayılmaz.
--      İpucu tutarın İşletme Karı kartının 6 aylık penceresine düşen kısmını
--      ayrıca söyler (Jade $8.785,66).
--   K7 ledger_cost_drift ve diğer ipuçları: Uyarı Merkezi detail göstermez;
--      ipucu artık ayları, tarihleri ve tutarları metnin içinde söyler.
--   K8 ads_spend_unmeasured: ledger d+1 kayması ve son CSV gününün yarım olması
--      birlikte modellenir (son CSV gününde CSV'de görünmeyen harcama ölçülmemiş).
--   sale_shipments: 0174'ün kısmi tekil indeksi senkron upsert'ünü her seferinde
--      42P10 ile düşürüyordu (tablo 0 satır). Tam tekil indeksle değişti.
-- Yeni: K12 ledger_stale (önemli), K13 postage_double_count (kritik; Jade
--      ShipStation postajı $12.277,26 çift), K14 cogs_source_conflict (kritik;
--      EON 10 kalem, $2.297,32). etsy_connection okunmaz (RLS açık, politika
--      yok): K12 yalnız ledger, satış ve mağaza fotoğrafı verisine bakar.
-- Dönüş tipi aynı; Uyarı Merkezi (lib/db/queries/alerts.ts) anahtardan
-- bağımsız çalıştığı için kod değişikliği gerekmez.
-- Belge: docs/muhasebe/senaryo-matrisi.md

-- ─────────────────────────────────────────────────────────────────────────
-- 1) sale_shipments tekil indeksi
-- ─────────────────────────────────────────────────────────────────────────
-- 0174 kısmi bir tekil indeks kurmuştu (where receipt_shipping_id is not null).
-- Senkronun PostgREST upsert'ü ON CONFLICT (receipt_shipping_id) bu indeksi
-- çıkaramıyor ve her yazım 42P10 ile düşüyordu; hata yalnız loglanıyordu ve
-- tablo 5 org'da 0 satır kaldı. Tam tekil indeks NULL'ları yine ayrı sayar
-- (lib/etsy/sync.ts NULL kimliği zaten süzüyor). Tablo boş, indeks anında kurulur.
drop index if exists public.sale_shipments_receipt_shipping_uq;
create unique index if not exists sale_shipments_receipt_shipping_uq
  on public.sale_shipments (receipt_shipping_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Para biçimi yardımcısı: uyarı metinlerinde tutar ($12.277,26)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.accounting_fmt_cents(p_cents bigint, p_currency text)
returns text
language sql
immutable
set search_path = public
as $$
  select case when p_cents is null then '-'
    else (case when p_cents < 0 then '-' else '' end)
      || (case when coalesce(p_currency, 'USD') = 'USD' then '$' else '' end)
      || translate(to_char(abs(p_cents) / 100.0, 'FM999,999,999,990.00'), ',.', '.,')
      || (case when coalesce(p_currency, 'USD') = 'USD' then '' else ' ' || p_currency end)
  end
$$;

revoke all on function public.accounting_fmt_cents(bigint, text) from public, anon;
grant execute on function public.accounting_fmt_cents(bigint, text) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) accounting_checks(p_org): 14 kontrol
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.accounting_checks(p_org uuid)
returns table (
  check_key text,
  severity text,
  ok boolean,
  title text,
  hint text,
  count_n bigint,
  amount_cents bigint,
  currency text,
  href text,
  action_label text,
  detail jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  with
  cur as (
    select coalesce(
      (select o.default_currency from public.organizations o where o.id = p_org),
      'USD') as currency
  ),

  -- K1 · Ledger bakiye zinciri: açılış + Σ tutar = Etsy'nin son bakiyesi.
  -- Arada senkronlanmamış satır varsa eşitlik bozulur. 0179: aynı saniyede
  -- yazılan satırların sırası API'den gelmez ve entry_id sırası Etsy'nin
  -- bakiye sırası değildir (0178'in "son satır" seçimi Jade'in son 91 gününün
  -- 13'ünde sağlam veride sahte kırılma verirdi). Zincirin ucu çoklu küme
  -- farkıyla seçilir: ilk saniyede başka bir satırın sonucu olmayan önceki
  -- bakiye açılıştır, son saniyede başka bir satırın başlangıcı olmayan bakiye
  -- kapanıştır. Uç tekil değilse (saniye içinde döngü) o saniyenin tüm adayları
  -- denenir.
  k1_cur as materialized (
    select le.currency,
      count(*) as rows_n,
      sum(le.amount_cents) as total,
      min(le.created_timestamp) as first_ts,
      max(le.created_timestamp) as last_ts
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.amount_cents is not null
      and le.balance_cents is not null
    group by le.currency
  ),
  k1_edge as materialized (
    select c.currency,
      array_agg(le.balance_cents - le.amount_cents) filter (where le.created_timestamp = c.first_ts) as pre_f,
      array_agg(le.balance_cents) filter (where le.created_timestamp = c.first_ts) as bal_f,
      array_agg(le.balance_cents - le.amount_cents) filter (where le.created_timestamp = c.last_ts) as pre_l,
      array_agg(le.balance_cents) filter (where le.created_timestamp = c.last_ts) as bal_l
    from k1_cur c
    join public.etsy_ledger_entries le
      on le.org_id = p_org
     and le.currency is not distinct from c.currency
     and le.created_timestamp in (c.first_ts, c.last_ts)
     and le.amount_cents is not null
     and le.balance_cents is not null
    group by c.currency
  ),
  k1_ends as (
    select e.currency, e.pre_f, e.bal_l,
      array(select unnest(e.pre_f) except all select unnest(e.bal_f)) as o1,
      array(select unnest(e.bal_l) except all select unnest(e.pre_l)) as c1
    from k1_edge e
  ),
  k1_eval as (
    select c.currency, c.rows_n, c.total, x.openings, x.closings,
      (cardinality(n.o1) = 1 and cardinality(n.c1) = 1) as unique_ends,
      (select min(abs(cl - op - c.total))
         from unnest(x.openings) as op
         cross join unnest(x.closings) as cl) as min_diff
    from k1_cur c
    join k1_ends n on n.currency is not distinct from c.currency
    cross join lateral (
      select
        case when cardinality(n.o1) = 1 then n.o1
             else array(select distinct unnest(n.pre_f)) end as openings,
        case when cardinality(n.c1) = 1 then n.c1
             else array(select distinct unnest(n.bal_l)) end as closings
    ) x
  ),
  k1 as (
    select
      count(*) filter (where min_diff <> 0) as n_bad,
      coalesce(sum(min_diff) filter (where min_diff <> 0), 0)::bigint as amt,
      coalesce(sum(rows_n), 0)::bigint as rows_n,
      coalesce(jsonb_agg(jsonb_build_object(
        'currency', currency, 'rows', rows_n, 'sum_cents', total,
        'opening_candidates', to_jsonb(openings),
        'closing_candidates', to_jsonb(closings),
        'unique_chain_ends', unique_ends,
        'diff_cents', min_diff)), '[]'::jsonb) as detail
    from k1_eval
  ),

  -- K2 · İade tutarı okunmamış iadeli siparişler (geri doldurma kuyruğu).
  k2 as (
    select count(*)::bigint as n,
      coalesce(sum(s.grand_total_cents), 0)::bigint as amt,
      jsonb_build_object(
        'refunded', count(*) filter (where s.status = 'refunded'),
        'partially_refunded', count(*) filter (where s.status = 'partially_refunded'),
        'oldest_order', min(s.order_date)::date) as detail
    from public.sales s
    where s.org_id = p_org
      and s.status in ('refunded', 'partially_refunded')
      and s.refunds_synced_at is null
      and s.order_date < now() - interval '2 days'
  ),

  -- K3 · Ledger iadesi ile panel çelişiyor. Tutar köprüsü: REFUND_GROSS ile
  -- aynı saniyede yazılan TEK sales_tax_refund (reference = receipt id).
  -- 0179: statü sinyali tek kaynaklı değil. Köprüye ek olarak siparişin herhangi
  -- bir sales_tax_refund satırı (vergi satırı REFUND_GROSS'tan 1 sn sonra
  -- yazılabiliyor: EON 4145285871) ve VERGİSİZ siparişte kalemin
  -- transaction_refund satırı iade sayılır. Vergili siparişte tek başına
  -- transaction_refund bir ücret kredisidir, iade değildir (Jade 4062133504:
  -- $2,15 kredi, iade yok). İadesi geri alınan receipt bu iki sinyalden
  -- dışlanır. Köprüsüz tutar tahmini: transaction_refund / 0,065 + vergi
  -- iadesi + shipping_transaction_refund / 0,065 (köprülü 1.657 Jade iadesinde
  -- medyan oran 1,0000).
  rg as materialized (
    select le.created_timestamp, -le.amount_cents as amt
    from public.etsy_ledger_entries le
    where le.org_id = p_org and le.ledger_type = 'REFUND_GROSS'
  ),
  rv as materialized (
    select le.created_timestamp, le.amount_cents as amt
    from public.etsy_ledger_entries le
    where le.org_id = p_org and le.ledger_type = 'REFUND_REVERSAL_GROSS'
  ),
  tx_ref as materialized (
    select le.created_timestamp, le.reference_id::bigint as receipt, le.ledger_type
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type in ('sales_tax_refund', 'REFUND_REVERSAL_SALES_TAX')
      and le.reference_id ~ '^[0-9]+$'
  ),
  tx_one as (
    select t.ledger_type, t.created_timestamp, min(t.receipt) as receipt
    from tx_ref t
    group by t.ledger_type, t.created_timestamp
    having count(distinct t.receipt) = 1
  ),
  bridged as (
    select receipt, sum(amt)::bigint as ledger_refund
    from (
      select o.receipt, r.amt
      from rg r join tx_one o
        on o.created_timestamp = r.created_timestamp and o.ledger_type = 'sales_tax_refund'
      union all
      select o.receipt, -v.amt
      from rv v join tx_one o
        on o.created_timestamp = v.created_timestamp and o.ledger_type = 'REFUND_REVERSAL_SALES_TAX'
    ) x
    group by receipt
  ),
  rcpt_ref as materialized (
    select le.reference_id::bigint as receipt,
      sum(le.amount_cents) filter (where le.ledger_type = 'sales_tax_refund')::bigint as tax_ref,
      sum(le.amount_cents) filter (where le.ledger_type = 'shipping_transaction_refund')::bigint as ship_tr,
      bool_or(le.ledger_type = 'sales_tax_refund') as has_tax_refund,
      bool_or(le.ledger_type = 'REFUND_REVERSAL_SALES_TAX') as reversed
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type in ('sales_tax_refund', 'REFUND_REVERSAL_SALES_TAX', 'shipping_transaction_refund')
      and le.reference_id ~ '^[0-9]+$'
    group by 1
  ),
  tr_rows as materialized (
    select le.reference_id::bigint as tx_id, le.amount_cents
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type = 'transaction_refund'
      and le.reference_id ~ '^[0-9]+$'
  ),
  tr_sale as materialized (
    select si.sale_id, sum(t.amount_cents)::bigint as tr_cents
    from tr_rows t
    join public.sale_items si on si.etsy_transaction_id = t.tx_id and si.org_id = p_org
    group by si.sale_id
  ),
  k3_cand as (
    select s.id, s.etsy_receipt_id, s.status, s.refunds_synced_at,
      coalesce(s.refunded_cents, 0) as panel_refund,
      coalesce(s.tax_cents, 0) + coalesce(s.vat_cents, 0) as order_tax,
      b.ledger_refund, ts.tr_cents, rr.tax_ref, rr.ship_tr,
      coalesce(rr.has_tax_refund, false) as has_tax_refund,
      coalesce(rr.reversed, false) as reversed
    from public.sales s
    left join bridged b on b.receipt = s.etsy_receipt_id
    left join tr_sale ts on ts.sale_id = s.id
    left join rcpt_ref rr on rr.receipt = s.etsy_receipt_id
    where s.org_id = p_org
      and (b.receipt is not null or ts.sale_id is not null or rr.has_tax_refund)
  ),
  k3_rows as (
    select c.*,
      (c.status in ('completed', 'paid', 'processing')
        and (coalesce(c.ledger_refund, 0) > 0
             or (not c.reversed
                 and (c.has_tax_refund or (c.tr_cents is not null and c.order_tax = 0))))) as stale_status,
      (c.refunds_synced_at is not null
        and coalesce(c.ledger_refund, 0) > 0
        and abs(c.ledger_refund - c.panel_refund) > 100) as amount_mismatch,
      coalesce(c.ledger_refund,
        round(coalesce(c.tr_cents, 0) / 0.065 + coalesce(c.tax_ref, 0)
              + coalesce(c.ship_tr, 0) / 0.065)::bigint) as ledger_est
    from k3_cand c
  ),
  k3 as (
    select
      count(*) filter (where stale_status or amount_mismatch)::bigint as n,
      coalesce(sum(abs(ledger_est - panel_refund))
        filter (where stale_status or amount_mismatch), 0)::bigint as amt,
      jsonb_build_object(
        'status_stale', count(*) filter (where stale_status),
        'status_stale_unbridged', count(*) filter (where stale_status and ledger_refund is null),
        'amount_mismatch', count(*) filter (where amount_mismatch),
        'amount_estimated_orders', count(*) filter (where (stale_status or amount_mismatch)
                                                    and ledger_refund is null),
        'taxed_fee_credit_only', count(*) filter (where status in ('completed', 'paid', 'processing')
                                                  and ledger_refund is null and not has_tax_refund
                                                  and tr_cents is not null and order_tax > 0),
        'reversed_excluded', count(*) filter (where reversed and status in ('completed', 'paid', 'processing')
                                               and coalesce(ledger_refund, 0) <= 0),
        'receipts', coalesce(to_jsonb((array_agg(etsy_receipt_id order by etsy_receipt_id)
                              filter (where stale_status or amount_mismatch))[1:100]), '[]'::jsonb),
        'bridged_refunds', (select count(*) from rg r join tx_one o
                              on o.created_timestamp = r.created_timestamp and o.ledger_type = 'sales_tax_refund'),
        'refund_rows', (select count(*) from rg)) as detail
    from k3_rows
  ),

  -- K4 · Siparişe ait ledger ücretleri = Σ sales.etsy_fees_cents.
  k4_types as (
    select le.ledger_type, sum(-le.amount_cents)::bigint as cents
    from public.etsy_ledger_entries le
    join public.etsy_ledger_type_classes d on d.ledger_type = le.ledger_type and d.order_fee
    where le.org_id = p_org and le.amount_cents is not null
    group by le.ledger_type
  ),
  k4_sales as (
    select coalesce(sum(s.etsy_fees_cents), 0)::bigint as order_fees,
      count(*) filter (where s.etsy_payment_id is null
                        and s.status in ('completed', 'paid', 'processing')
                        and s.order_date < now() - interval '7 days')::bigint as no_payment_id
    from public.sales s
    where s.org_id = p_org
  ),
  k4 as (
    select
      coalesce((select sum(cents) from k4_types), 0)::bigint as ledger_fees,
      ks.order_fees,
      coalesce((select sum(cents) from k4_types), 0)::bigint - ks.order_fees as gap,
      ks.no_payment_id,
      coalesce((select jsonb_object_agg(ledger_type, cents) from k4_types), '{}'::jsonb) as by_type
    from k4_sales ks
  ),

  -- K5 · İptal edilmiş ve KARGOLANDIĞINA DAİR KANIT OLMAYAN siparişe yazılmış
  -- satış maliyeti (COGS). 0179: sales.is_shipped ve sale_items.shipped_at yalnız
  -- 0174'ten sonra okunan receipt'te dolu, bu yüzden NULL "kargolanmadı"
  -- sayılmaz. Kanıt pozitif aranır: is_shipped, shipped_at, Etsy kargo kaydı
  -- (sale_shipments; 0179 tekil indeks düzeltmesiyle dolmaya başlar) ya da
  -- iptal edilmemiş ShipStation gönderisi (order_number = receipt id).
  -- Sayılan (hayalet): hiç tahsil edilmemiş sipariş (transaction ledger satırı
  -- yok) her dönemde; tahsil edilmiş sipariş yalnız kanıtın aranabildiği yerde
  -- (ShipStation gönderi penceresi ya da Etsy'den kargo bilgisiyle okunmuş
  -- receipt). Pencere dışındaki tahsil edilip kargo kanıtı olmayan iptal
  -- "bilinmiyor" kovasına gider, sayılmaz. Kargolu iptal sayılmaz; ürün geri
  -- döndüyse iade ve geri kazanım kalemde girilir.
  k5_cost as materialized (
    select s.id as sale_id, s.etsy_receipt_id, s.order_date,
      (coalesce(s.is_shipped, false) or s.shipped_at is not null) as own_ship,
      (s.is_shipped is not null) as ship_read,
      c.source,
      sum(c.amount_cents)::bigint as cents,
      coalesce(sum(c.amount_cents) filter (
        where c.cost_date >= (date_trunc('month', current_date) - interval '5 months')::date), 0)::bigint as cents_6m
    from public.costs c
    left join public.sale_items si on si.id = c.sale_item_id
    join public.sales s on s.id = coalesce(c.sale_id, si.sale_id)
    where c.org_id = p_org
      and s.org_id = p_org
      and s.status = 'cancelled'
      and c.currency = (select currency from cur)
      and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging')
           or (c.cost_kind is null and c.source = 'gold_auto'))
    group by s.id, s.etsy_receipt_id, s.order_date, s.is_shipped, s.shipped_at, c.source
  ),
  k5_sale as materialized (
    select sale_id, etsy_receipt_id, min(order_date) as order_date,
      bool_or(own_ship) as own_ship, bool_or(ship_read) as ship_read,
      sum(cents)::bigint as cents, sum(cents_6m)::bigint as cents_6m
    from k5_cost
    group by sale_id, etsy_receipt_id
  ),
  k5_items as materialized (
    select si.sale_id, si.etsy_transaction_id, si.shipped_at, si.returned_at, si.recovered_cents
    from public.sale_items si
    where si.org_id = p_org
      and si.sale_id in (select sale_id from k5_sale)
  ),
  k5_tx as materialized (
    select le.reference_id::bigint as tx_id, le.ledger_type
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type in ('transaction', 'transaction_refund')
      and le.reference_id ~ '^[0-9]+$'
  ),
  k5_flags as (
    select i.sale_id,
      bool_or(t.ledger_type = 'transaction') as charged,
      bool_or(t.ledger_type = 'transaction_refund') as refunded
    from k5_items i
    join k5_tx t on t.tx_id = i.etsy_transaction_id
    group by i.sale_id
  ),
  k5_ss as materialized (
    select distinct sh.order_number::bigint as receipt
    from public.shipstation_shipments sh
    where sh.org_id = p_org
      and not coalesce(sh.voided, false)
      and sh.order_number ~ '^[0-9]+$'
  ),
  k5_cov as materialized (
    select min(coalesce(sh.ship_date, sh.create_date)) as first_ship,
      max(coalesce(sh.ship_date, sh.create_date)) as last_ship
    from public.shipstation_shipments sh
    where sh.org_id = p_org and not coalesce(sh.voided, false)
  ),
  k5_eval as (
    select k.sale_id, k.cents, k.cents_6m,
      (k.own_ship
        or exists (select 1 from k5_items i where i.sale_id = k.sale_id and i.shipped_at is not null)
        or exists (select 1 from public.sale_shipments sh where sh.org_id = p_org and sh.sale_id = k.sale_id)
        or x.receipt is not null) as shipped,
      coalesce(f.charged, false) as charged,
      coalesce(f.refunded, false) as refunded,
      (k.ship_read
        or coalesce(k.order_date >= cv.first_ship - interval '7 days' and k.order_date <= cv.last_ship, false)) as evidence_ok,
      exists (select 1 from k5_items i where i.sale_id = k.sale_id
              and (i.returned_at is not null or coalesce(i.recovered_cents, 0) > 0)) as recovered
    from k5_sale k
    cross join k5_cov cv
    left join k5_flags f on f.sale_id = k.sale_id
    left join k5_ss x on x.receipt = k.etsy_receipt_id
  ),
  k5_cls as (
    select e.*,
      (not e.shipped and (not e.charged or e.evidence_ok)) as phantom,
      (not e.shipped and e.charged and not e.evidence_ok) as unknown_ship
    from k5_eval e
  ),
  k5 as (
    select count(*) filter (where phantom)::bigint as n,
      coalesce(sum(cents) filter (where phantom), 0)::bigint as amt,
      coalesce(sum(cents_6m) filter (where phantom), 0)::bigint as amt_6m,
      count(*) filter (where phantom and not charged)::bigint as never_n,
      coalesce(sum(cents) filter (where phantom and not charged), 0)::bigint as never_c,
      count(*) filter (where phantom and charged)::bigint as charged_n,
      coalesce(sum(cents) filter (where phantom and charged), 0)::bigint as charged_c,
      count(*) filter (where unknown_ship)::bigint as unknown_n,
      coalesce(sum(cents) filter (where unknown_ship), 0)::bigint as unknown_c,
      jsonb_build_object(
        'never_charged', jsonb_build_object(
          'orders', count(*) filter (where phantom and not charged),
          'cents', coalesce(sum(cents) filter (where phantom and not charged), 0)),
        'charged_refunded', jsonb_build_object(
          'orders', count(*) filter (where phantom and charged and refunded),
          'cents', coalesce(sum(cents) filter (where phantom and charged and refunded), 0)),
        'charged_not_refunded', jsonb_build_object(
          'orders', count(*) filter (where phantom and charged and not refunded),
          'cents', coalesce(sum(cents) filter (where phantom and charged and not refunded), 0)),
        'unknown_shipping', jsonb_build_object(
          'orders', count(*) filter (where unknown_ship),
          'cents', coalesce(sum(cents) filter (where unknown_ship), 0)),
        'shipped_excluded', jsonb_build_object(
          'orders', count(*) filter (where shipped),
          'cents', coalesce(sum(cents) filter (where shipped), 0)),
        'shipped_unrecovered', jsonb_build_object(
          'orders', count(*) filter (where shipped and not recovered),
          'cents', coalesce(sum(cents) filter (where shipped and not recovered), 0)),
        'last_6m_cents', coalesce(sum(cents_6m) filter (where phantom), 0),
        'shipstation_window', (select jsonb_build_object('from', cv.first_ship, 'to', cv.last_ship) from k5_cov cv),
        'by_source', coalesce((
          select jsonb_object_agg(x.source, x.cents) from (
            select kc.source, sum(kc.cents)::bigint as cents
            from k5_cost kc
            join k5_cls e on e.sale_id = kc.sale_id
            where e.phantom
            group by kc.source) x), '{}'::jsonb)) as detail
    from k5_cls
  ),

  -- K6 · Sözlükte olmayan ledger türü.
  k6_u as (
    select le.ledger_type, count(*)::bigint as rows_n,
      sum(le.amount_cents)::bigint as net, max(le.entry_date)::date as last_seen
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and not exists (select 1 from public.etsy_ledger_type_classes d where d.ledger_type = le.ledger_type)
    group by le.ledger_type
  ),
  k6 as (
    select count(*)::bigint as n, coalesce(sum(abs(net)), 0)::bigint as amt,
      coalesce(jsonb_agg(jsonb_build_object('ledger_type', ledger_type, 'rows', rows_n,
        'net_cents', net, 'last_seen', last_seen) order by rows_n desc), '[]'::jsonb) as detail
    from k6_u
  ),

  -- K7 · Ledger gideri (ücret, reklam, kargo, abonelik) ile panele yazılan
  -- 'etsy_ledger' gider satırları, son 12 tam ay, ay ay.
  k7_months as (
    select generate_series(
      date_trunc('month', now()) - interval '12 months',
      date_trunc('month', now()) - interval '1 month',
      interval '1 month')::date as m
  ),
  k7_led as (
    select date_trunc('month', le.entry_date)::date as m, sum(-le.amount_cents)::bigint as cents
    from public.etsy_ledger_entries le
    join public.etsy_ledger_type_classes d on d.ledger_type = le.ledger_type
    where le.org_id = p_org
      and d.accounting_class in ('ucret', 'reklam', 'kargo', 'abonelik')
      and le.entry_date >= date_trunc('month', now()) - interval '12 months'
      and le.entry_date < date_trunc('month', now())
    group by 1
  ),
  k7_cost as (
    select date_trunc('month', c.cost_date)::date as m, sum(c.amount_cents)::bigint as cents
    from public.costs c
    where c.org_id = p_org and c.source = 'etsy_ledger'
      and c.cost_date >= (date_trunc('month', now()) - interval '12 months')::date
      and c.cost_date < date_trunc('month', now())::date
    group by 1
  ),
  k7_diff as (
    select mo.m, coalesce(l.cents, 0) as ledger_cents, coalesce(c.cents, 0) as panel_cents,
      coalesce(l.cents, 0) - coalesce(c.cents, 0) as diff
    from k7_months mo
    left join k7_led l on l.m = mo.m
    left join k7_cost c on c.m = mo.m
  ),
  k7 as (
    select count(*) filter (where abs(diff) > 100)::bigint as n,
      coalesce(sum(abs(diff)) filter (where abs(diff) > 100), 0)::bigint as amt,
      coalesce(string_agg(to_char(m, 'YYYY-MM') || ' ' || public.accounting_fmt_cents(diff, (select currency from cur)), ', ' order by m)
        filter (where abs(diff) > 100), '') as months_txt,
      coalesce(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'),
        'ledger_cents', ledger_cents, 'panel_cents', panel_cents, 'diff_cents', diff)
        order by m) filter (where abs(diff) > 100), '[]'::jsonb) as detail
    from k7_diff
  ),

  -- K8 · Etsy Ads harcaması sürüyor ama performans verisi (Ads CSV) eski.
  -- 0179: Etsy bir günün harcamasını ertesi gün (UTC) ledger'a yazar; ledger
  -- günü d+1 = CSV günü d (Jade 203/208, EON 71/71 gün birebir). Son CSV günü
  -- CSV'nin indirildiği gün olduğu için yarımdır: o günün ledger satırının
  -- CSV'de görünmeyen kısmı ölçülmemiş sayılır (Jade 2026-07-26: CSV $22,65,
  -- ledger $100,00).
  k8_csv as (
    select max(a.stat_date) as last_csv
    from public.ad_daily_stats a
    where a.org_id = p_org and a.source = 'etsy_ads_csv'
  ),
  k8_lastday as (
    select coalesce(sum(a.spend_cents), 0)::bigint as csv_cents
    from public.ad_daily_stats a
    join k8_csv kc on a.stat_date = kc.last_csv
    where a.org_id = p_org and a.source = 'etsy_ads_csv'
  ),
  k8 as (
    select kc.last_csv,
      max((le.entry_date at time zone 'UTC')::date) as last_spend,
      max((le.entry_date at time zone 'UTC')::date) - 1 as last_spend_day,
      (coalesce(sum(-le.amount_cents) filter (
         where (le.entry_date at time zone 'UTC')::date - 1
               > coalesce(kc.last_csv, date '1900-01-01')), 0)
       + greatest(0, coalesce(sum(-le.amount_cents) filter (
         where (le.entry_date at time zone 'UTC')::date - 1 = kc.last_csv), 0)
         - (select csv_cents from k8_lastday)))::bigint as amt
    from k8_csv kc
    left join public.etsy_ledger_entries le
      on le.org_id = p_org and le.ledger_type in ('prolist', 'prolist_refund')
    group by kc.last_csv
  ),

  -- K9 · ShipStation senkronu hata veriyor ya da 3 günden uzun süredir durmuş.
  k9 as (
    select count(*) filter (where sc.sync_status = 'error'
                              or sc.last_sync_at < now() - interval '3 days')::bigint as n,
      max(sc.last_sync_at) as last_sync_at,
      max(sc.sync_error) as sync_error,
      (select max(sh.ship_date) from public.shipstation_shipments sh where sh.org_id = p_org) as last_ship_date
    from public.shipstation_connection sc
    where sc.org_id = p_org and sc.status = 'connected'
  ),

  -- K10 · Son 90 günde Etsy etiketi siparişe bağlanmamış (aylık özette var,
  -- sipariş karında yok).
  k10 as (
    select count(*)::bigint as n, coalesce(sum(-le.amount_cents), 0)::bigint as amt
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type in ('shipping_labels', 'shipping_labels_usps_return')
      and le.entry_date >= now() - interval '90 days'
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org and c.external_key = 'ledger:' || le.entry_id)
  ),

  -- K11 · Siparişe bağlanmamış ters ibraz (chargeback).
  k11 as (
    select count(*)::bigint as n, coalesce(sum(-le.amount_cents), 0)::bigint as amt
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.ledger_type = 'CHARGEBACK_DEBIT'
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org and c.external_key = 'ledger:' || le.entry_id)
  ),

  -- K12 · Ledger senkronun gerisinde (0179). Faz hata verirse koşu durur ve
  -- sync_snapshot_stale yanar; faz hatasız ama boş dönerse yalnız bu kontrol
  -- görür. İki saat: (a) ledger'ın son kaydından 3 günden sonraki ve panele en
  -- az bir gün önce yazılmış bir Etsy satışı (tur ortasında yeni yazılan satış
  -- sayılmaz, satış fazı turun başında, ledger fazı sonra koşar); (b) ledger'ı
  -- normalde her gün kayıt alan mağazada (son 30 günün en az 20'si) mağaza
  -- fotoğrafı (etsy_shop_snapshots, ledger fazından sonra yazılır) ledger'ın son
  -- kaydından 5 günden fazla ileride. etsy_connection okunmaz: tabloda RLS açık
  -- ve politika yok, security invoker fonksiyon onu oturumda hep boş görür.
  k12 as (
    select
      (select max(le.entry_date) from public.etsy_ledger_entries le
       where le.org_id = p_org) as last_ledger,
      (select max(sn.created_at) from public.etsy_shop_snapshots sn
       where sn.org_id = p_org) as last_snapshot,
      (select max(s.order_date) from public.sales s
       where s.org_id = p_org and s.source = 'etsy') as last_sale
  ),
  k12_x as (
    select k.*,
      exists (select 1 from public.sales s
              where s.org_id = p_org and s.source = 'etsy'
                and s.order_date > coalesce(k.last_ledger, '-infinity'::timestamptz) + interval '3 days'
                and s.created_at < now() - interval '1 day') as sale_gap,
      (select count(distinct (le.entry_date at time zone 'UTC')::date)
       from public.etsy_ledger_entries le
       where le.org_id = p_org and k.last_ledger is not null
         and le.entry_date > k.last_ledger - interval '30 days') as active_days
    from k12 k
  ),
  k12_eval as (
    select x.*,
      (x.sale_gap
        or (coalesce(x.active_days, 0) >= 20 and x.last_snapshot is not null
            and x.last_snapshot - x.last_ledger > interval '5 days')) as stale
    from k12_x x
  ),

  -- K13 · ShipStation postajı çift sayılmasın (0179). Siparişe bağlanan gönderi
  -- (external_key 'ss:<id>') aylık "ShipStation postaj" özetinden düşmeli; özeti
  -- yalnız başarılı ShipStation senkronu yeniden kuruyor, bağlamayı ise Etsy
  -- senkronu ve "İade verisini çek" de yapıyor. ShipStation senkronu durunca çift
  -- sayım kalıcı oluyor (Jade 2026-11-09: $12.277,26 fazla).
  k13 as (
    select
      coalesce((select sum(c.amount_cents) from public.costs c
                where c.org_id = p_org and c.source = 'shipstation'), 0)::bigint as booked,
      coalesce((select sum(c.amount_cents) from public.costs c
                where c.org_id = p_org and c.source = 'shipstation'
                  and c.external_key like 'ss:%'), 0)::bigint as linked,
      coalesce((select sum(coalesce(sh.shipment_cost_cents, 0) + coalesce(sh.insurance_cost_cents, 0))
                from public.shipstation_shipments sh
                where sh.org_id = p_org and not coalesce(sh.voided, false)
                  and sh.ship_date is not null), 0)::bigint as raw
  ),

  -- K14 · Aynı kalem ve türde iki maliyet kaynağı (0179). Elle (manual) ya da
  -- faturayla (invoice) maliyetlenmiş kalemde motor (gold_auto) satırı da
  -- duruyorsa İşletme Karı ve taraf toplamları ikisini birden toplar;
  -- sale_item_pnl yalnız elle olanı öne alır, türü boş fatura satırını hiç
  -- saymaz. Tür boşsa kategoriden türetilir (malzeme = gold, iscilik = labor).
  k14_rows as (
    select c.sale_item_id, c.source, c.amount_cents,
      coalesce(c.cost_kind, case when cc.key = 'malzeme' then 'gold'
                                 when cc.key = 'iscilik' then 'labor' end) as kind
    from public.costs c
    left join public.cost_categories cc on cc.id = c.category_id
    where c.org_id = p_org
      and c.sale_item_id is not null
      and c.currency = (select currency from cur)
      and c.source in ('gold_auto', 'invoice', 'manual')
  ),
  k14_pairs as (
    select sale_item_id, kind,
      sum(amount_cents) filter (where source = 'gold_auto') as auto_cents,
      bool_or(source = 'manual') as has_manual,
      bool_or(source = 'invoice') as has_invoice
    from k14_rows
    where kind is not null
    group by sale_item_id, kind
  ),
  k14 as (
    select
      count(distinct sale_item_id) filter (where auto_cents is not null
                                           and (has_manual or has_invoice))::bigint as n,
      coalesce(sum(auto_cents) filter (where auto_cents is not null
                                       and (has_manual or has_invoice)), 0)::bigint as amt,
      jsonb_build_object(
        'manual_pairs', count(*) filter (where auto_cents is not null and has_manual),
        'invoice_pairs', count(*) filter (where auto_cents is not null and has_invoice and not has_manual),
        'untyped_invoice_rows', (select count(*) from public.costs c2
                                 where c2.org_id = p_org and c2.source = 'invoice'
                                   and c2.cost_kind is null and c2.sale_item_id is not null)) as detail
    from k14_pairs
  )

  select 'ledger_balance_break'::text, 'kritik'::text, k1.n_bad = 0,
    case when k1.n_bad = 0 then 'Etsy ledger bakiye zinciri tutuyor'
         else 'Etsy ledger''ında eksik satır var: bakiye zinciri tutmuyor' end,
    'Ledger satırlarının toplamı açılış bakiyesiyle birlikte Etsy''nin son bakiyesini vermiyor; arada senkronlanmamış satır var demektir. Eksik satır ücret, iade ve payout raporunu sessizce eksik gösterir. Senkronu elle tetikle; fark kapanmazsa ledger senkronu ilgili ayı yeniden çekmeli.',
    k1.n_bad::bigint, k1.amt, (select currency from cur), '/ayarlar/etsy', 'Senkronu elle tetikle',
    jsonb_build_object('rows', k1.rows_n, 'by_currency', k1.detail)
  from k1

  union all
  select 'refund_backlog', 'kritik', k2.n = 0,
    case when k2.n = 0 then 'İadeli siparişlerin iade tutarı okunmuş'
         else k2.n || ' iadeli siparişin iade tutarı okunmamış: gelir fazla görünüyor' end,
    'Etsy bu siparişlerde iade yaptı ama panel tutarı henüz okumadı; kar tablosu bu siparişleri tam gelirle sayıyor ve marj olduğundan yüksek görünüyor. Satış ve Kar sayfasında "İade verisini çek" ile geri doldur; kuyruk bitene kadar her gün tekrar et.',
    k2.n, k2.amt, (select currency from cur), '/satislar/maliyet', 'İade verisini çek', k2.detail
  from k2

  union all
  select 'refund_status_mismatch', 'onemli', k3.n = 0,
    case when k3.n = 0 then 'Ledger iadeleri panelle tutarlı'
         else k3.n || ' siparişte ledger iadesi panelle çelişiyor' end,
    'Bu siparişlerde Etsy ledger''ı iade gösteriyor ama panelde sipariş ya hala tamamlandı statüsünde ya da okunan iade tutarı ledger''dan farklı; bu siparişlerin geliri yanlış. İade sinyali iadeyle aynı saniyede yazılan vergi iadesinden, siparişin herhangi bir vergi iadesinden ve vergisiz siparişte kalemin işlem ücreti iadesinden okunur; geri alınan iadeler dışarıdadır. Köprüsüz siparişte tutar ücret ve vergi iadelerinden tahmin edilir. Panelde bu siparişleri yeniden okuyan bir buton henüz yok: "İade verisini çek" yalnız iade statüsündeki siparişleri okur. Düzeltme senkronda (muhasebe belgesinde IAD-01); o zamana kadar bu tutarı gelirden düşerek oku.',
    k3.n, k3.amt, (select currency from cur), '/satislar', 'Siparişleri gözden geçir', k3.detail
  from k3

  union all
  select 'order_fee_gap', 'onemli',
    abs(k4.gap) <= greatest(500, (k4.ledger_fees * 0.002)::bigint),
    case when abs(k4.gap) <= greatest(500, (k4.ledger_fees * 0.002)::bigint)
           then 'Sipariş ücretleri ledger''la tutarlı'
         when k4.gap > 0 then 'Etsy ücretinin bir kısmı hiçbir siparişe yazılmamış'
         else 'Sipariş ücretleri ledger''dan fazla: iade edilen ücret düşülmemiş' end,
    'Ledger''da siparişe ait Etsy ücreti (işlem, işleme, Offsite Ads ve iadeleri) ile sipariş satırlarına yazılan ücretin toplamı farklı; kalem bazlı kar bu fark kadar yanlış. Bilinen sebepler: ödeme kimliği bağlanmamış siparişlerde işleme ücreti, reference_type ''etsy'' olan Offsite Ads satırları, ücret iadelerinin düşülmemesi ve kargo işlem ücreti. Düzeltme sipariş ücreti motorunda (rebuild_sales_etsy_fees); muhasebe belgesinde adım olarak yazılı.',
    -- Sayı: işleme ücreti siparişe bağlanamayan canlı sipariş; o yoksa 1 (tek toplam fark).
    case when abs(k4.gap) <= greatest(500, (k4.ledger_fees * 0.002)::bigint) then 0
         else greatest(k4.no_payment_id, 1) end,
    abs(k4.gap), (select currency from cur), '/satislar/maliyet', 'Sipariş karını gör',
    jsonb_build_object('ledger_fee_cents', k4.ledger_fees, 'order_fee_cents', k4.order_fees,
      'gap_cents', k4.gap, 'live_orders_without_payment_id', k4.no_payment_id, 'ledger_by_type', k4.by_type)
  from k4

  union all
  select 'cancelled_order_cogs', 'kritik', k5.n = 0,
    case when k5.n = 0 then 'Kargo kanıtı olmayan iptal siparişte satış maliyeti yok'
         else k5.n || ' iptal siparişe kargo kanıtı olmadan satış maliyeti yazılmış: kar olduğundan düşük görünüyor' end,
    'Bu siparişler iptal edildi, kargolandıklarına dair kayıt yok ama altın, işçilik ya da taş maliyeti yazılı. '
      || k5.never_n || ' sipariş hiç tahsil edilmedi (' || public.accounting_fmt_cents(k5.never_c, (select currency from cur)) || '): bu maliyet kesin hayalettir. '
      || k5.charged_n || ' sipariş tahsil edilip iade edildi (' || public.accounting_fmt_cents(k5.charged_c, (select currency from cur)) || ') ve kargo kaydının tutulduğu dönemde kaydı yok: büyük olasılıkla o da hayalettir. '
      || 'Gelir iptal diye dışarıda, maliyet İşletme Karı''na giriyor; bu tutarın son 6 aya düşen kısmı ' || public.accounting_fmt_cents(k5.amt_6m, (select currency from cur))
      || ', İşletme Karı kartını okurken yalnız bunu kara geri ekle. '
      || case when k5.unknown_n > 0 then 'Kargo kaydı olmayan dönemde tahsil edilip iade edilmiş ' || k5.unknown_n
           || ' iptal (' || public.accounting_fmt_cents(k5.unknown_c, (select currency from cur)) || ') sayıya girmedi: kargolanıp kargolanmadığı bilinmiyor. ' else '' end
      || 'Kargolanmış iptaller de sayıya girmez; ürün geri döndüyse satış detayındaki kalem maliyeti formuna iadeyi ve geri kazanılan değeri gir. Kalıcı düzeltme altın maliyet motorunda (muhasebe belgesinde MAL-02).',
    k5.n, k5.amt, (select currency from cur), '/satislar/maliyet', 'İptal maliyetlerini gör', k5.detail
  from k5

  union all
  select 'ledger_type_unknown', 'onemli', k6.n = 0,
    case when k6.n = 0 then 'Tüm ledger türleri sınıflı'
         else k6.n || ' ledger türü sözlükte yok: muhasebe sınıfı bilinmiyor' end,
    'Etsy yeni bir ledger türü yazmaya başladı ve panel bu türün gelir mi, gider mi, vergi mi, nakit mi olduğunu bilmiyor; tür sınıflanana kadar gider ve kar raporlarına girmeyebilir. Türü etsy_ledger_type_classes sözlüğüne bir migration ile ekle; kontrol kendiliğinden yeşile döner.',
    k6.n, k6.amt, (select currency from cur), '/maliyetler', 'Giderleri gör', jsonb_build_object('types', k6.detail)
  from k6

  union all
  select 'ledger_cost_drift', 'onemli', k7.n = 0,
    case when k7.n = 0 then 'Ledger giderleri aylık gider tablosuyla tutarlı'
         else k7.n || ' ayda Etsy ledger gideri panelle tutmuyor' end,
    'Ledger''daki Etsy giderleri (ücret, reklam, kargo, abonelik) ile panele yazılan aylık gider satırları farklı: ' || k7.months_txt || '. Aylık gider ve İşletme Karı bu fark kadar yanlış. Sebep çoğunlukla eşlemede olmayan bir gider türü ya da iadesi gideri aşan bir ay (muhasebe belgesinde SIS-01).',
    k7.n, k7.amt, (select currency from cur), '/maliyetler', 'Giderleri gör', jsonb_build_object('months', k7.detail)
  from k7

  union all
  select 'ads_spend_unmeasured', 'bilgi',
    k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14,
    case when k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14
           then 'Etsy Ads harcaması ölçülüyor'
         else 'Etsy Ads harcaması sürüyor ama getirisi ölçülmüyor' end,
    'Ledger''da Etsy Ads harcaması sürüyor (son harcama günü ' || coalesce(to_char(k8.last_spend_day, 'YYYY-MM-DD'), 'yok')
      || ') ama son reklam performans verisi (Etsy Ads CSV) '
      || coalesce(to_char(k8.last_csv, 'YYYY-MM-DD') || ' tarihli', 'hiç yüklenmemiş')
      || '; bu harcamanın getirisini (ROAS) bilmiyorsun. Etsy Ads panosundan CSV''yi indir. Panelde CSV yükleme yüzeyi şu an yok; geri getirilmesi muhasebe belgesinde adım olarak yazılı (RKL-01).',
    case when k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14 then 0 else 1 end::bigint,
    k8.amt, (select currency from cur), '/maliyetler', 'Reklam giderini gör',
    jsonb_build_object('last_csv_date', k8.last_csv, 'last_spend_date', k8.last_spend,
      'last_spend_csv_day', k8.last_spend_day, 'last_csv_day_cents', (select csv_cents from k8_lastday))
  from k8

  union all
  select 'shipstation_sync_failing', 'onemli', k9.n = 0,
    case when k9.n = 0 then 'ShipStation senkronu sağlıklı'
         else 'ShipStation senkronu duruyor: etiket maliyeti panele girmiyor' end,
    'ShipStation bağlı görünüyor ama senkron hata veriyor ya da günlerdir başarıyla bitmedi; o tarihten beri alınan ShipStation etiketlerinin maliyeti panelde yok ve sipariş karı fazla görünüyor. Hata 401 ise API anahtarı geçersizdir: ShipStation''da yeni anahtar üretip Ayarlar''dan yeniden bağla.',
    k9.n, null::bigint, (select currency from cur), '/ayarlar/shipstation', 'Bağlantıyı yenile',
    jsonb_build_object('last_sync_at', k9.last_sync_at, 'sync_error', k9.sync_error, 'last_ship_date', k9.last_ship_date)
  from k9

  union all
  select 'labels_unlinked', 'bilgi', k10.n = 0,
    case when k10.n = 0 then 'Son 90 günün Etsy etiketleri siparişlere bağlı'
         else k10.n || ' Etsy kargo etiketi hiçbir siparişe bağlı değil (son 90 gün)' end,
    'Bu etiketler aylık kargo giderinde var ama hangi siparişe ait oldukları bilinmiyor; sipariş bazlı karda kargo eksik. Satış detayından elle bağla; otomatik bağlama yalnız kalemin kargolanma anı ±15 dakikaya düşerse çalışır.',
    k10.n, k10.amt, (select currency from cur), '/satislar/maliyet', 'Etiketleri bağla', '{}'::jsonb
  from k10

  union all
  select 'chargeback_unlinked', 'bilgi', k11.n = 0,
    case when k11.n = 0 then 'Ters ibrazlar siparişlere bağlı'
         else k11.n || ' ters ibraz (chargeback) bir siparişe bağlı değil' end,
    'Bankanın geri çektiği ödeme ledger''da var ama hangi satışın gelirini sildiği görünmüyor; o satışın karı fazla görünüyor. Satış detayından ledger kaydını siparişe bağla.',
    k11.n, k11.amt, (select currency from cur), '/satislar', 'Satışı bul', '{}'::jsonb
  from k11

  union all
  select 'ledger_stale', 'onemli', not k12_eval.stale,
    case when not k12_eval.stale then 'Etsy ledger''ı senkronla güncel'
         else 'Etsy ledger''ı senkronun gerisinde kaldı: ücret ve iade eksik' end,
    'Ledger''ın son kaydı ' || coalesce(to_char(k12_eval.last_ledger at time zone 'UTC', 'YYYY-MM-DD'), 'yok')
      || ', son Etsy satışı ' || coalesce(to_char(k12_eval.last_sale at time zone 'UTC', 'YYYY-MM-DD'), 'yok')
      || ', son mağaza fotoğrafı ' || coalesce(to_char(k12_eval.last_snapshot at time zone 'UTC', 'YYYY-MM-DD'), 'yok')
      || '. Senkron koşuyor ama ledger satırları gelmiyor: bu tarihten sonraki işlem, işleme ve reklam ücretleri, iadeler ve payout panelde yok; sipariş karı ve aylık gider eksik. Senkronu elle tetikle; düzelmezse ledger fazı ya hata veriyor ya da boş dönüyor, Ayarlar > Etsy''de senkron durumuna bak.',
    case when not k12_eval.stale then 0 else 1 end::bigint,
    null::bigint, (select currency from cur), '/ayarlar/etsy', 'Senkronu elle tetikle',
    jsonb_build_object('last_ledger_at', k12_eval.last_ledger, 'last_sale_at', k12_eval.last_sale,
      'last_snapshot_at', k12_eval.last_snapshot, 'sale_gap', k12_eval.sale_gap,
      'active_days_30', k12_eval.active_days)
  from k12_eval

  union all
  select 'postage_double_count', 'kritik', abs(k13.booked - k13.raw) <= 100,
    case when abs(k13.booked - k13.raw) <= 100 then 'ShipStation postajı gidere bir kez yazılmış'
         when k13.booked > k13.raw then 'ShipStation postajı gidere iki kez yazılmış: kar olduğundan düşük görünüyor'
         else 'ShipStation postajının bir kısmı gidere yazılmamış: kar olduğundan yüksek görünüyor' end,
    'ShipStation gönderilerinin postaj ve sigorta toplamı ' || public.accounting_fmt_cents(k13.raw, (select currency from cur)) || ', panele yazılan ShipStation gider satırları '
      || public.accounting_fmt_cents(k13.booked, (select currency from cur)) || '. Siparişe bağlanan gönderi aylık "ShipStation postaj" özetinden düşmeli; özet yalnız başarılı ShipStation senkronunda yeniden kurulduğu için senkron dururken bağlanan gönderiler hem siparişte hem aylık özette sayılır. Fark İşletme Karı''nı bu tutar kadar bozar. ShipStation bağlantısı düzelince özet kendiliğinden yeniden kurulur; kalıcı düzeltme bağlayıcının özeti de aynı işlemde yeniden kurmasıdır (muhasebe belgesinde SEV-02).',
    case when abs(k13.booked - k13.raw) <= 100 then 0 else 1 end::bigint,
    abs(k13.booked - k13.raw), (select currency from cur), '/maliyetler', 'Kargo giderini gör',
    jsonb_build_object('booked_cents', k13.booked, 'linked_cents', k13.linked, 'shipments_cents', k13.raw)
  from k13

  union all
  select 'cogs_source_conflict', 'kritik', k14.n = 0,
    case when k14.n = 0 then 'Her kalemin maliyeti tek kaynaktan sayılıyor'
         else k14.n || ' kalemde motor maliyeti elle ya da faturalı maliyetle birlikte sayılıyor' end,
    'Bu kalemlere elle ya da faturayla gerçek maliyet girilmiş, ama altın motorunun tahmini de yerinde duruyor. Satış ve Kar sayfası elle girilen tutarı öne alır, İşletme Karı ve taraf toplamları ise ikisini birden toplar: maliyet bu tutar kadar fazla, kar o kadar düşük görünür. Türü boş fatura satırı Satış ve Kar sayfasında hiç sayılmaz, orada yalnız motor tahmini görünür. Düzeltme altın maliyet motorunda (kaynak önceliği elle, fatura, motor); muhasebe belgesinde MAL-01.',
    k14.n, k14.amt, (select currency from cur), '/satislar/maliyet', 'Kalem maliyetlerini gör', k14.detail
  from k14
$$;

comment on function public.accounting_checks(uuid) is
  'Salt okunur muhasebe kontrol döngüleri (0178; düzeltmeler ve K12..K14 0179). Her kontrol tek satır; ok=false satırlar Uyarı Merkezi''nde görünür. Belge: docs/muhasebe/senaryo-matrisi.md';

revoke all on function public.accounting_checks(uuid) from public, anon;
grant execute on function public.accounting_checks(uuid) to authenticated, service_role;

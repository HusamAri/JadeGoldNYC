-- 0179 · accounting_checks düzeltmeleri (2026-11-09)
--
-- 0178 canlıya çıktıktan sonra senaryo matrisinin çürütücüleri dört kontrolde
-- kusur buldu; her biri canlı veriyle ayrıca ölçüldü:
--   K1 ledger_balance_break: kapanış satırını entry_id ile seçiyordu; aynı
--      saniyede birden çok satır olunca sahte kritik. Jade son 91 gün: 39 gün
--      son saniye çok satırlı, 0178 kuralı 13 günde yanlış, yeni kural 0.
--   K3 refund_status_mismatch: yalnız aynı saniye vergi köprüsüne bakıyordu.
--      Jade 5 yerine 6, EON 3 yerine 4 sipariş (vergi satırı 1 sn sonra ya da
--      vergisiz sipariş). Geri alınan iade (Jade 1) dışarıda.
--   K5 cancelled_order_cogs: is_shipped NULL'u "kargolanmadı" sayıyordu
--      (Jade'de 11.588 kalemin 8'inde dolu). Kanıt artık pozitif: Jade 813
--      yerine 741 sipariş, $413.506,76 yerine $379.482,00; 74 kargolu iptal
--      ($35.410,48) gerçek maliyet olarak dışarıda.
--   K8 ads_spend_unmeasured: ledger d+1 kaymasını modellemiyordu (Jade
--      $100, EON $12,87 fazla).
-- Yeni: K12 ledger_stale (önemli), satış var ama ledger gelmiyor. etsy_connection
-- okunmaz (RLS açık, politika yok): koşul yalnız sales ve ledger verisinden.
-- Dönüş tipi aynı; Uyarı Merkezi (lib/db/queries/alerts.ts) anahtardan
-- bağımsız çalıştığı için kod değişikliği gerekmez.

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
  -- 13'ünde sağlam veride sahte kırılma verirdi). İlk saniyedeki her satır bir
  -- açılış adayı, son saniyedeki her satır bir kapanış adayıdır; herhangi bir
  -- çift eşitliği sağlıyorsa zincir tutar.
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
      array_agg(distinct le.balance_cents - le.amount_cents)
        filter (where le.created_timestamp = c.first_ts) as openings,
      array_agg(distinct le.balance_cents)
        filter (where le.created_timestamp = c.last_ts) as closings
    from k1_cur c
    join public.etsy_ledger_entries le
      on le.org_id = p_org
     and le.currency is not distinct from c.currency
     and le.created_timestamp in (c.first_ts, c.last_ts)
     and le.amount_cents is not null
     and le.balance_cents is not null
    group by c.currency
  ),
  k1_eval as (
    select c.currency, c.rows_n, c.total, e.openings, e.closings,
      (select min(abs(cl - op - c.total))
         from unnest(e.openings) as op
         cross join unnest(e.closings) as cl) as min_diff
    from k1_cur c
    join k1_edge e on e.currency is not distinct from c.currency
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
  -- yazılabiliyor) ya da kaleminin transaction_refund satırı (vergisiz siparişte
  -- köprü yoktur) iade sayılır; iadesi geri alınan receipt bu iki sinyalden
  -- dışlanır. Tutar köprü yoksa transaction_refund / 0,065 ile tahmin edilir.
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
  st_rcpt as materialized (
    select distinct t.receipt from tx_ref t where t.ledger_type = 'sales_tax_refund'
  ),
  rev_rcpt as materialized (
    select distinct t.receipt from tx_ref t where t.ledger_type = 'REFUND_REVERSAL_SALES_TAX'
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
    select s.id, s.status, s.refunds_synced_at,
      coalesce(s.refunded_cents, 0) as panel_refund,
      b.ledger_refund, ts.tr_cents,
      (st.receipt is not null) as has_tax_refund,
      (rr.receipt is not null) as reversed
    from public.sales s
    left join bridged b on b.receipt = s.etsy_receipt_id
    left join tr_sale ts on ts.sale_id = s.id
    left join st_rcpt st on st.receipt = s.etsy_receipt_id
    left join rev_rcpt rr on rr.receipt = s.etsy_receipt_id
    where s.org_id = p_org
      and (b.receipt is not null or ts.sale_id is not null or st.receipt is not null)
  ),
  k3_rows as (
    select c.*,
      (c.status in ('completed', 'paid', 'processing')
        and (coalesce(c.ledger_refund, 0) > 0
             or (not c.reversed and (c.tr_cents is not null or c.has_tax_refund)))) as stale_status,
      (c.refunds_synced_at is not null
        and coalesce(c.ledger_refund, 0) > 0
        and abs(c.ledger_refund - c.panel_refund) > 100) as amount_mismatch,
      coalesce(c.ledger_refund, round(c.tr_cents / 0.065)::bigint) as ledger_est
    from k3_cand c
  ),
  k3 as (
    select
      count(*) filter (where stale_status or amount_mismatch)::bigint as n,
      coalesce(sum(abs(coalesce(ledger_est, 0) - panel_refund))
        filter (where stale_status or amount_mismatch), 0)::bigint as amt,
      jsonb_build_object(
        'status_stale', count(*) filter (where stale_status),
        'status_stale_unbridged', count(*) filter (where stale_status and ledger_refund is null),
        'amount_mismatch', count(*) filter (where amount_mismatch),
        'amount_estimated_orders', count(*) filter (where (stale_status or amount_mismatch)
                                                    and ledger_refund is null and tr_cents is not null),
        'reversed_excluded', count(*) filter (where reversed and status in ('completed', 'paid', 'processing')
                                               and coalesce(ledger_refund, 0) <= 0),
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
  -- 0174'ten sonra yeniden okunan receipt'te dolu, bu yüzden NULL "kargolanmadı"
  -- sayılmaz. Kanıt pozitif aranır: is_shipped, shipped_at, Etsy kargo kaydı
  -- (sale_shipments) ya da iptal edilmemiş ShipStation gönderisi (order_number =
  -- receipt id). Kargolanmış iptalin maliyeti gerçektir (ürün çıktı), sayıya
  -- girmez; detayda ayrıca durur. Tahsilat durumu kalemin transaction (işlem
  -- ücreti) ve transaction_refund ledger satırından okunur.
  k5_cost as materialized (
    select s.id as sale_id, s.etsy_receipt_id,
      (coalesce(s.is_shipped, false) or s.shipped_at is not null) as own_ship,
      c.source, sum(c.amount_cents)::bigint as cents
    from public.costs c
    left join public.sale_items si on si.id = c.sale_item_id
    join public.sales s on s.id = coalesce(c.sale_id, si.sale_id)
    where c.org_id = p_org
      and s.org_id = p_org
      and s.status = 'cancelled'
      and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging')
           or (c.cost_kind is null and c.source = 'gold_auto'))
    group by s.id, s.etsy_receipt_id, s.is_shipped, s.shipped_at, c.source
  ),
  k5_sale as materialized (
    select sale_id, etsy_receipt_id, bool_or(own_ship) as own_ship, sum(cents)::bigint as cents
    from k5_cost
    group by sale_id, etsy_receipt_id
  ),
  k5_items as materialized (
    select si.sale_id, si.etsy_transaction_id, si.shipped_at
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
  k5_eval as (
    select k.sale_id, k.cents,
      (k.own_ship
        or exists (select 1 from k5_items i where i.sale_id = k.sale_id and i.shipped_at is not null)
        or exists (select 1 from public.sale_shipments sh where sh.sale_id = k.sale_id)
        or x.receipt is not null) as shipped,
      coalesce(f.charged, false) as charged,
      coalesce(f.refunded, false) as refunded
    from k5_sale k
    left join k5_flags f on f.sale_id = k.sale_id
    left join k5_ss x on x.receipt = k.etsy_receipt_id
  ),
  k5 as (
    select count(*) filter (where not shipped)::bigint as n,
      coalesce(sum(cents) filter (where not shipped), 0)::bigint as amt,
      jsonb_build_object(
        'never_charged', jsonb_build_object(
          'orders', count(*) filter (where not shipped and not charged),
          'cents', coalesce(sum(cents) filter (where not shipped and not charged), 0)),
        'charged_refunded', jsonb_build_object(
          'orders', count(*) filter (where not shipped and charged and refunded),
          'cents', coalesce(sum(cents) filter (where not shipped and charged and refunded), 0)),
        'charged_not_refunded', jsonb_build_object(
          'orders', count(*) filter (where not shipped and charged and not refunded),
          'cents', coalesce(sum(cents) filter (where not shipped and charged and not refunded), 0)),
        'shipped_excluded', jsonb_build_object(
          'orders', count(*) filter (where shipped),
          'cents', coalesce(sum(cents) filter (where shipped), 0)),
        'by_source', coalesce((
          select jsonb_object_agg(x.source, x.cents) from (
            select kc.source, sum(kc.cents)::bigint as cents
            from k5_cost kc
            join k5_eval e on e.sale_id = kc.sale_id
            where not e.shipped
            group by kc.source) x), '{}'::jsonb)) as detail
    from k5_eval
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
      coalesce(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'),
        'ledger_cents', ledger_cents, 'panel_cents', panel_cents, 'diff_cents', diff)
        order by m) filter (where abs(diff) > 100), '[]'::jsonb) as detail
    from k7_diff
  ),

  -- K8 · Etsy Ads harcaması sürüyor ama performans verisi (Ads CSV) eski.
  -- 0179: Etsy bir günün harcamasını ertesi gün (UTC) ledger'a yazar; ledger
  -- günü d+1 = CSV günü d (Jade 203/208, EON 71/71 gün birebir). Son CSV
  -- gününün ertesi günkü ledger satırı ölçülmüş sayılır.
  k8_csv as (
    select max(a.stat_date) as last_csv
    from public.ad_daily_stats a
    where a.org_id = p_org and a.source = 'etsy_ads_csv'
  ),
  k8 as (
    select kc.last_csv,
      max((le.entry_date at time zone 'UTC')::date) as last_spend,
      max((le.entry_date at time zone 'UTC')::date) - 1 as last_spend_day,
      coalesce(sum(-le.amount_cents) filter (
        where (le.entry_date at time zone 'UTC')::date - 1
              > coalesce(kc.last_csv, date '1900-01-01')), 0)::bigint as amt
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

  -- K12 · Ledger satışların gerisinde (0179): senkron satışları çekiyor ama
  -- ledger satırı gelmiyor. Faz hata verirse koşu durur ve sync_snapshot_stale
  -- yanar; faz hatasız ama boş dönerse yalnız bu kontrol görür. Satış ve ledger
  -- aynı org koşusunda çekildiği için iki tarih arasındaki fark, cron'un org'u
  -- kaç günde bir işlediğinden bağımsızdır.
  -- etsy_connection okunmaz: tabloda RLS açık ve politika yok (token taşır),
  -- security invoker fonksiyon oturumda onu hep boş görürdü. Koşul yalnız veriden.
  k12 as (
    select
      (select max(s.order_date) from public.sales s
       where s.org_id = p_org and s.source = 'etsy') as last_sale,
      (select max(le.entry_date) from public.etsy_ledger_entries le
       where le.org_id = p_org) as last_ledger
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
    'Bu siparişlerde Etsy ledger''ı iade gösteriyor ama panelde sipariş ya hala tamamlandı statüsünde ya da okunan iade tutarı ledger''dan farklı; bu siparişlerin geliri yanlış. İade sinyali üç yerden okunur: iadeyle aynı saniyede yazılan vergi iadesi, siparişin herhangi bir vergi iadesi ya da kalemin işlem ücreti iadesi; geri alınan iadeler dışarıdadır. Köprüsüz siparişte tutar işlem ücreti iadesinden tahmin edilir. Sipariş detayından senkronu tazele; durum ve tutar Etsy''den yeniden okunur.',
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
    'Bu siparişler iptal edildi ve kargolandıklarına dair kayıt yok (ShipStation gönderisi, Etsy kargo kaydı ya da kargo tarihi), ama altın, işçilik ya da taş maliyeti yazılı kaldı. Hiç tahsil edilmemiş olanların maliyeti kesin hayalettir; tahsil edilip iade edilenlerinki büyük olasılıkla öyledir (ayrım detayda). Gelir iptal diye dışarıda, maliyet İşletme Karı''na giriyor. Parça stoğa döndüyse bedeli stoktadır, satış maliyeti değildir. Kargolanmış iptaller bu sayıya girmez: ürün çıktığı için maliyetleri gerçektir. ShipStation senkronu durduğundan beri kargolanan siparişlerde kanıt eksik olabilir. Düzeltme altın maliyet motorunda; o zamana kadar bu tutarı kara geri ekleyerek oku.',
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
    'Ledger''daki Etsy giderleri (ücret, reklam, kargo, abonelik) ile panele yazılan aylık gider satırları bu aylarda farklı; aylık gider ve İşletme Karı bu fark kadar yanlış. Sebep çoğunlukla eşlemede olmayan bir gider türü ya da iadesi gideri aşan bir ay; detaydaki aylara bak.',
    k7.n, k7.amt, (select currency from cur), '/maliyetler', 'Giderleri gör', jsonb_build_object('months', k7.detail)
  from k7

  union all
  select 'ads_spend_unmeasured', 'bilgi',
    k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14,
    case when k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14
           then 'Etsy Ads harcaması ölçülüyor'
         else 'Etsy Ads harcaması sürüyor ama getirisi ölçülmüyor' end,
    'Ledger''da Etsy Ads harcaması devam ediyor ama son reklam performans verisi (Etsy Ads CSV) bu tarihten eski; bu harcamanın getirisini (ROAS) bilmiyorsun. Etsy Ads panosundan CSV''yi indir. Panelde CSV yükleme yüzeyi şu an yok; geri getirilmesi muhasebe belgesinde adım olarak yazılı.',
    case when k8.last_spend_day is null or k8.last_spend_day - coalesce(k8.last_csv, date '1900-01-01') <= 14 then 0 else 1 end::bigint,
    k8.amt, (select currency from cur), '/maliyetler', 'Reklam giderini gör',
    jsonb_build_object('last_csv_date', k8.last_csv, 'last_spend_date', k8.last_spend,
      'last_spend_csv_day', k8.last_spend_day)
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
  select 'ledger_stale', 'onemli',
    k12.last_sale is null
      or (k12.last_ledger is not null and k12.last_sale - k12.last_ledger <= interval '3 days'),
    case when k12.last_sale is null
           or (k12.last_ledger is not null and k12.last_sale - k12.last_ledger <= interval '3 days')
           then 'Etsy ledger''ı satışlarla güncel'
         else 'Etsy ledger''ı satışların gerisinde kaldı: ücret ve iade eksik' end,
    'Son Etsy satışı, ledger''ın son kaydından 3 günden daha yeni: senkron satışları çekiyor ama ledger satırları gelmiyor. Bu tarihten sonraki işlem, işleme ve reklam ücretleri, iadeler ve payout panelde yok; sipariş karı ve aylık gider eksik. Senkronu elle tetikle; düzelmezse ledger fazı ya hata veriyor ya da boş dönüyor demektir, Ayarlar > Etsy''de senkron durumuna bak.',
    case when k12.last_sale is null
           or (k12.last_ledger is not null and k12.last_sale - k12.last_ledger <= interval '3 days')
           then 0 else 1 end::bigint,
    null::bigint, (select currency from cur), '/ayarlar/etsy', 'Senkronu elle tetikle',
    jsonb_build_object('last_sale_at', k12.last_sale, 'last_ledger_at', k12.last_ledger)
  from k12
$$;

comment on function public.accounting_checks(uuid) is
  'Salt okunur muhasebe kontrol döngüleri (0178, düzeltme ve K12 0179). Her kontrol tek satır; ok=false satırlar Uyarı Merkezi''nde görünür. Belge: docs/muhasebe/senaryo-matrisi.md';

revoke all on function public.accounting_checks(uuid) from public, anon;
grant execute on function public.accounting_checks(uuid) to authenticated, service_role;

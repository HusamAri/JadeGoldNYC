-- 0178 · Muhasebe kontrol döngüleri: ledger türü sözlüğü + accounting_checks(org)
--
-- Neden: Etsy'nin vermediği ya da panelin sessizce düşürdüğü muhasebe bilgisi
-- (iade tutarı, ücret iadesi, iptal siparişte maliyet, eşlenmeyen ledger türü,
-- kopuk ShipStation senkronu) bugüne kadar hiçbir yerde ölçülmüyordu. Bu
-- migration iki şey kurar:
--
--   1) etsy_ledger_type_classes: canlı veride görülen 57 ledger türünün
--      muhasebe sınıfı (tahsilat, kontra gelir, vergi emaneti, ücret, reklam,
--      kargo, abonelik, kredi, nakit) ve sipariş ücreti kapsamı (order_fee).
--      Etsy resmi bir ledger_type listesi yayınlamıyor (open-api #738, #1209);
--      sözlük canlı veriden türetildi (2026-11-08) ve YENİ bir tür gelince
--      accounting_checks onu "sözlükte yok" diye işaretler. Sınıfı bilinmeyen
--      tür tahminle eklenmez: önce gerçek satır okunur, sonra migration ile
--      buraya yazılır.
--
--   2) accounting_checks(p_org): salt okunur kontrol döngüleri. Her kontrol
--      tek satır döner (ok, önem, başlık, ipucu, sayı, tutar, detay). Uyarı
--      Merkezi (lib/db/queries/alerts.ts) ok=false satırları gösterir.
--      Fonksiyon security invoker'dır: RLS (org_id = current_org_id()) aynen
--      uygulanır, başka org'un verisi görünmez.
--
-- Belgeler: docs/muhasebe/senaryo-matrisi.md (senaryo, alan, kontrol
-- döngüsü), docs/muhasebe/kontrol-donguleri.sql (elle koşulabilir sorgular).
-- Ölçüm dayanakları (2026-11-08, canlı DB):
--   · ledger toplam kimliği 4/4 org'da kuruşu kuruşuna tutuyor;
--   · PAYMENT_PROCESSING_FEE 10.277/10.277 ödemede %3 + $0,25; tam iadede
--     tamamı, kısmi iadede yalnız %3 geri geliyor (1.488/1.488 ve 184/203);
--   · REFUND_GROSS reference_id = payment_adjustment kimliği (receipt ve
--     payment id ile 0/1.922 eşleşme); aynı saniyede yazılan sales_tax_refund
--     (reference = receipt) ile 1.690/1.922 iade tek siparişe bağlanıyor.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Ledger türü sözlüğü (global, org'suz başvuru verisi)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.etsy_ledger_type_classes (
  ledger_type text primary key,
  accounting_class text not null check (accounting_class in (
    'tahsilat', 'kontra_gelir', 'vergi_emaneti', 'ucret', 'reklam',
    'kargo', 'abonelik', 'kredi', 'nakit'
  )),
  -- true: tutar siparişe aittir ve sales.etsy_fees_cents kapsamındadır
  -- (reference = receipt, transaction ya da ödeme kimliği).
  order_fee boolean not null default false,
  note text not null,
  added_on date not null default current_date
);

comment on table public.etsy_ledger_type_classes is
  'Etsy ledger_type -> muhasebe sınıfı sözlüğü (0178). Yeni tür = migration ile eklenir; accounting_checks sözlükte olmayan türü işaretler.';

alter table public.etsy_ledger_type_classes enable row level security;

drop policy if exists etsy_ledger_type_classes_read on public.etsy_ledger_type_classes;
create policy etsy_ledger_type_classes_read on public.etsy_ledger_type_classes
  for select to authenticated using (true);

insert into public.etsy_ledger_type_classes (ledger_type, accounting_class, order_fee, note) values
  -- Tahsilat (alıcının ödediği brüt; gelir değil, gelirin kaynağı)
  ('PAYMENT_GROSS', 'tahsilat', false, 'Alıcıdan tahsil edilen brüt ödeme (ürün + kargo + vergi). Gelir değildir; gelir sales tablosundan vergi düşülerek kurulur. reference = shop_payment id.'),
  -- Kontra gelir
  ('REFUND_GROSS', 'kontra_gelir', false, 'Alıcıya iade (brüt, vergi dahil). reference_id payment_adjustment kimliğidir; siparişe aynı saniyede yazılan sales_tax_refund üzerinden bağlanır.'),
  ('REFUND_REVERSAL_GROSS', 'kontra_gelir', false, 'İadenin geri alınması: iade edilen para satıcıya döner.'),
  ('CHARGEBACK_DEBIT', 'kontra_gelir', false, 'Banka ters ibrazı: alıcının bankası ödemeyi geri çekti. Siparişe elle bağlanır.'),
  -- Vergi emaneti (Etsy toplar ve öder; ne gelir ne gider)
  ('sales_tax', 'vergi_emaneti', false, 'Alıcıdan toplanan satış vergisi; Etsy marketplace facilitator olarak öder. reference = receipt id.'),
  ('sales_tax_refund', 'vergi_emaneti', false, 'İade edilen satış vergisi. reference = receipt id; REFUND_GROSS ile aynı saniyede yazılır.'),
  ('REFUND_REVERSAL_SALES_TAX', 'vergi_emaneti', false, 'İade geri alınınca vergi emanetinin geri kaydı. reference = receipt id.'),
  -- Sipariş ücretleri (sales.etsy_fees_cents kapsamı)
  ('transaction', 'ucret', true, 'Satış işlem ücreti (%6,5, kalem bazında). reference = transaction id.'),
  ('transaction_refund', 'ucret', true, 'İade edilen işlem ücreti. reference = transaction id; iadeden sonra yazılır, aynı saniyede değil.'),
  ('transaction_quantity', 'ucret', true, 'Çok adetli satırda ek adet işlem ücreti. reference = transaction id.'),
  ('transaction_quantity_refund', 'ucret', true, 'Ek adet işlem ücreti iadesi. reference = transaction id.'),
  ('shipping_transaction', 'ucret', true, 'Alıcının ödediği kargo üzerinden %6,5 işlem ücreti. reference = receipt id.'),
  ('shipping_transaction_refund', 'ucret', true, 'Kargo işlem ücreti iadesi. reference = receipt id.'),
  ('buyer_fee', 'ucret', true, 'Siparişe bağlı Etsy ücreti (reference = receipt id); anlamı Etsy belgesinde yok, tutarlar küçük.'),
  ('buyer_fee_refund', 'ucret', true, 'buyer_fee iadesi (reference = receipt id).'),
  ('PAYMENT_PROCESSING_FEE', 'ucret', true, 'Ödeme işleme ücreti; ölçülen kural %3 + $0,25 (10.277/10.277). reference = shop_payment id.'),
  ('REFUND_PROCESSING_FEE', 'ucret', true, 'İadede geri gelen işleme ücreti: tam iadede tamamı, kısmi iadede yalnız %3 (ölçüm 2026-11-08). reference = payment_adjustment id.'),
  ('REFUND_REVERSAL_PROCESSING_FEE', 'ucret', true, 'İade geri alınınca işleme ücretinin yeniden kesilmesi.'),
  -- Listing ve yenileme ücretleri (siparişe değil listinge ait)
  ('listing', 'ucret', false, 'Listing açma ücreti ($0,20). reference = listing id.'),
  ('listing_refund', 'ucret', false, 'Listing ücreti iadesi.'),
  ('listing_private', 'ucret', false, 'Kişiye özel listing ücreti.'),
  ('renew', 'ucret', false, 'Elle yenileme ücreti.'),
  ('renew_expired', 'ucret', false, 'Süresi dolan listingin yenilenmesi.'),
  ('renew_expired_refund', 'ucret', false, 'Süresi dolan listing yenilemesinin iadesi.'),
  ('renew_sold', 'ucret', false, 'Satıştan sonra elle yenileme.'),
  ('renew_sold_refund', 'ucret', false, 'Satış sonrası elle yenilemenin iadesi.'),
  ('renew_sold_auto', 'ucret', false, 'Satıştan sonra otomatik yenileme ($0,20, adet başına).'),
  ('renew_sold_auto_refund', 'ucret', false, 'Otomatik yenilemenin iadesi (iade ya da iptalde).'),
  ('auto_renew_expired', 'ucret', false, 'Süresi dolunca otomatik yenileme.'),
  ('auto_renew_expired_refund', 'ucret', false, 'Süre dolumu yenilemesinin iadesi.'),
  ('seller_onboarding_fee', 'ucret', false, 'Mağaza açılış ücreti (tek seferlik). 0178 itibarıyla rebuild_etsy_ledger_costs eşlemesinde YOK.'),
  -- Reklam
  ('prolist', 'reklam', false, 'Etsy Ads günlük harcaması.'),
  ('prolist_refund', 'reklam', false, 'Etsy Ads harcama iadesi.'),
  ('offsite_ads_fee', 'reklam', true, 'Offsite Ads ücreti (%12 ya da %15, sipariş başına $100 tavan). reference = receipt id; reference_type ''receipt'' de ''etsy'' de receipt taşır (369/369 eşleşti).'),
  ('offsite_ads_fee_refund', 'reklam', true, 'İade edilen siparişte Offsite Ads ücretinin iadesi. reference = receipt id (156/156 eşleşti).'),
  -- Kargo
  ('shipping_labels', 'kargo', false, 'Etsy''den alınan gidiş kargo etiketi. reference = etiket id (receipt değil).'),
  ('shipping_labels_usps_return', 'kargo', false, 'USPS iade etiketi; alıcı taratınca kesilir (pay-on-scan).'),
  ('shipping_label_refund', 'kargo', false, 'Etiket iptali (void) iadesi.'),
  ('shipping_label_insurance', 'kargo', false, 'Etiket sigorta primi.'),
  ('shipping_label_insurance_refund', 'kargo', false, 'Sigorta primi iadesi.'),
  ('shipping_label_usps_adjustment', 'kargo', false, 'USPS yeniden tartım düzeltmesi (ek ücret).'),
  ('shipping_label_usps_adjustment_credit', 'kargo', false, 'USPS düzeltme kredisi.'),
  ('shipping_label_fedex_adjustment', 'kargo', false, 'FedEx düzeltmesi (ek ücret).'),
  ('shipping_label_fedex_adjustment_credit', 'kargo', false, 'FedEx düzeltme kredisi.'),
  ('shipping_label_globegistics_adjustment', 'kargo', false, 'Globegistics (uluslararası) etiket düzeltmesi.'),
  -- Abonelik
  ('tier_2_subscription', 'abonelik', false, 'Etsy Plus aylık aboneliği.'),
  -- Kredi (ücretleri azaltır; 0178 itibarıyla aylık gider özetine girmez)
  ('etsy_plus_credit', 'kredi', false, 'Etsy Plus aylık kredisi (listing ve reklam kredisi).'),
  ('etsy_plus_onboarding_fee_credit', 'kredi', false, 'Etsy Plus ile açılış ücreti kredisi.'),
  ('seller_credit', 'kredi', false, 'Etsy''nin satıcıya verdiği kredi (telafi).'),
  ('MISC_CR_SL', 'kredi', false, 'Etsy''nin elle verdiği çeşitli kredi; anlamı belgelenmemiş.'),
  ('SELLER_DRIVEN_TRAFFIC_CREDIT', 'kredi', false, 'Share & Save kredisi (%4). reference = receipt id.'),
  ('sdt_credit_reversal', 'kredi', false, 'Share & Save kredisinin geri alınması.'),
  -- Nakit (kar katmanı değil; bakiye ve payout mutabakatı)
  ('DISBURSE2', 'nakit', false, 'Banka hesabına payout. Gider değildir.'),
  ('RECOUP', 'nakit', false, 'Eksi bakiyenin satıcının kartından ya da bankasından tahsili. Gelir değildir.'),
  ('billing_payment', 'nakit', false, 'Etsy faturasının kartla ödenmesi. Gider değildir; gider ücret satırlarındadır.'),
  ('ADYENBALANCE_REVERSAL', 'nakit', false, 'Geri dönen payout (bakiyeye geri giriş).'),
  ('seller_onboarding_fee_payment', 'nakit', false, 'Açılış ücretinin ödenmesi.')
on conflict (ledger_type) do update
  set accounting_class = excluded.accounting_class,
      order_fee = excluded.order_fee,
      note = excluded.note;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) accounting_checks(p_org): her kontrol tek satır döner
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
  -- Arada senkronlanmamış satır varsa eşitlik bozulur.
  k1_cur as (
    select le.currency,
      count(*) as rows_n,
      (array_agg(le.balance_cents - le.amount_cents order by le.created_timestamp, le.entry_id))[1] as opening,
      sum(le.amount_cents) as total,
      (array_agg(le.balance_cents order by le.created_timestamp desc, le.entry_id desc))[1] as closing
    from public.etsy_ledger_entries le
    where le.org_id = p_org
      and le.amount_cents is not null
      and le.balance_cents is not null
    group by le.currency
  ),
  k1 as (
    select
      count(*) filter (where closing <> opening + total) as n_bad,
      coalesce(sum(abs(closing - opening - total)), 0)::bigint as amt,
      coalesce(sum(rows_n), 0)::bigint as rows_n,
      coalesce(jsonb_agg(jsonb_build_object(
        'currency', currency, 'rows', rows_n, 'opening_cents', opening,
        'sum_cents', total, 'closing_cents', closing,
        'diff_cents', closing - opening - total)), '[]'::jsonb) as detail
    from k1_cur
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

  -- K3 · Ledger iadesi ile panel çelişiyor. Köprü: REFUND_GROSS ile aynı
  -- saniyede yazılan TEK sales_tax_refund (reference = receipt id).
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
  k3_rows as (
    select s.id, s.status, b.ledger_refund, coalesce(s.refunded_cents, 0) as panel_refund,
      (s.status in ('completed', 'paid', 'processing')) as stale_status,
      (s.refunds_synced_at is not null
        and abs(b.ledger_refund - coalesce(s.refunded_cents, 0)) > 100) as amount_mismatch
    from bridged b
    join public.sales s on s.org_id = p_org and s.etsy_receipt_id = b.receipt
    where b.ledger_refund > 0
  ),
  k3 as (
    select
      count(*) filter (where stale_status or amount_mismatch)::bigint as n,
      coalesce(sum(abs(ledger_refund - panel_refund)) filter (where stale_status or amount_mismatch), 0)::bigint as amt,
      jsonb_build_object(
        'status_stale', count(*) filter (where stale_status),
        'amount_mismatch', count(*) filter (where amount_mismatch),
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

  -- K5 · İptal edilip kargolanmamış siparişe yazılmış satış maliyeti (COGS).
  k5 as (
    select count(distinct s.id)::bigint as n,
      coalesce(sum(c.amount_cents), 0)::bigint as amt,
      jsonb_build_object(
        'by_source', coalesce((
          select jsonb_object_agg(x.source, x.cents) from (
            select c2.source, sum(c2.amount_cents) as cents
            from public.costs c2
            left join public.sale_items si2 on si2.id = c2.sale_item_id
            join public.sales s2 on s2.id = coalesce(c2.sale_id, si2.sale_id)
            where c2.org_id = p_org and s2.status = 'cancelled'
              and not coalesce(s2.is_shipped, false)
              and (c2.cost_kind in ('gold', 'labor', 'gem', 'packaging')
                   or (c2.cost_kind is null and c2.source = 'gold_auto'))
            group by c2.source) x), '{}'::jsonb)) as detail
    from public.costs c
    left join public.sale_items si on si.id = c.sale_item_id
    join public.sales s on s.id = coalesce(c.sale_id, si.sale_id)
    where c.org_id = p_org
      and s.status = 'cancelled'
      and not coalesce(s.is_shipped, false)
      and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging')
           or (c.cost_kind is null and c.source = 'gold_auto'))
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
  k8 as (
    select
      (select max(a.stat_date) from public.ad_daily_stats a where a.org_id = p_org) as last_csv,
      max(le.entry_date)::date as last_spend,
      coalesce(sum(-le.amount_cents) filter (where le.entry_date::date > coalesce(
        (select max(a.stat_date) from public.ad_daily_stats a where a.org_id = p_org),
        date '1900-01-01')), 0)::bigint as amt
    from public.etsy_ledger_entries le
    where le.org_id = p_org and le.ledger_type in ('prolist', 'prolist_refund')
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
    'Bu siparişlerde Etsy ledger''ı iade gösteriyor ama panelde sipariş ya hala tamamlandı statüsünde ya da okunan iade tutarı ledger''dan farklı; bu siparişlerin geliri yanlış. Sipariş detayından senkronu tazele; durum ve tutar Etsy''den yeniden okunur.',
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
    case when k5.n = 0 then 'İptal siparişlerde satış maliyeti yok'
         else k5.n || ' iptal siparişe satış maliyeti yazılmış: kar olduğundan düşük görünüyor' end,
    'Bu siparişler iptal edildi ve hiç kargolanmadı, ama altın, işçilik ya da taş maliyeti yazılı kaldı. Gelir iptal diye dışarıda, maliyet İşletme Karı''na giriyor. Parça stoğa döndüyse bedeli stoktadır, satış maliyeti değildir. Düzeltme altın maliyet motorunda; o zamana kadar bu tutarı kara geri ekleyerek oku.',
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
    k8.last_spend is null or k8.last_spend - coalesce(k8.last_csv, date '1900-01-01') <= 14,
    case when k8.last_spend is null or k8.last_spend - coalesce(k8.last_csv, date '1900-01-01') <= 14
           then 'Etsy Ads harcaması ölçülüyor'
         else 'Etsy Ads harcaması sürüyor ama getirisi ölçülmüyor' end,
    'Ledger''da Etsy Ads harcaması devam ediyor ama son reklam performans verisi (Etsy Ads CSV) bu tarihten eski; bu harcamanın getirisini (ROAS) bilmiyorsun. Etsy Ads panosundan CSV''yi indir. Panelde CSV yükleme yüzeyi şu an yok; geri getirilmesi muhasebe belgesinde adım olarak yazılı.',
    case when k8.last_spend is null or k8.last_spend - coalesce(k8.last_csv, date '1900-01-01') <= 14 then 0 else 1 end::bigint,
    k8.amt, (select currency from cur), '/maliyetler', 'Reklam giderini gör',
    jsonb_build_object('last_csv_date', k8.last_csv, 'last_spend_date', k8.last_spend)
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
$$;

comment on function public.accounting_checks(uuid) is
  'Salt okunur muhasebe kontrol döngüleri (0178). Her kontrol tek satır; ok=false satırlar Uyarı Merkezi''nde görünür. Belge: docs/muhasebe/senaryo-matrisi.md';

revoke all on function public.accounting_checks(uuid) from public, anon;
grant execute on function public.accounting_checks(uuid) to authenticated, service_role;

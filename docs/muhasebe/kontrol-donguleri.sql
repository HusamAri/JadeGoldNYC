-- Muhasebe kontrol döngüleri: elle koşulabilir sorgular (2026-11-09)
--
-- Bu dosya docs/muhasebe/senaryo-matrisi.md senaryolarının kontrol sorgularıdır.
-- Hepsi salt okunur tek SELECT'tir; Supabase SQL editöründe ya da MCP ile
-- tek tek koşulur. Org seçimi ada göre alt sorguyla yapılır: başka mağaza
-- için adı değiştir. Her bloğun başlığında senaryo kimliği, canlı kontrol
-- (accounting_checks K numarası) ya da önerilen uyarı anahtarı ve
-- 2026-11-08 ölçümü yazar; beklenen değer sorgunun kendi yorum satırındadır.
-- Üreteç: docs/muhasebe/kaynak/render.py (elle düzenleme yapma).

-- 0) Canlı kontroller tek çağrıda (0178, 0179): yalnız başarısızlar
select o.name, c.check_key, c.severity, c.count_n, c.amount_cents, c.title
from organizations o cross join lateral accounting_checks(o.id) c
where not c.ok
order by o.name, c.severity, c.check_key;

-- ==== 1. Gelir ve vergi emaneti (GEL) ====

-- GEL-01 Gelir tek tanıma iner: vergi emaneti ve iadedeki vergi gelirden ayrılır | kaynak PAY-04 | kontrol: öneri: sales_tax_mismatch | ölçüm 2026-11-08: Orijinal SQL hatasız (::text birleşimi bu sorguda zaman aşımı vermedi): ledger_rows 9.473, unmatched_ledger_rows 1, mismatch_rows 0, diff_cents 0, tax_counted_as_revenue_cents 14.172.103; reference_id::bigint biçimiyle aynı sonuç. amended_control_sql (tüm org): tax_in_dashboard_revenue_cents Artifact 5.273, EON 213.662, Jade 14.172.103, Ophir 17.528, Seselka 0; refund_tax_in_pnl_cents 5.273 / 6.853 / 18.398 / 6.835 / 0; refund_tax_ledger_cents Jade 4.518.499; mismatch_rows hepsinde 0.
-- beklenen: mismatch_rows = 0; tax_in_dashboard_revenue_cents ve refund_tax_in_pnl_cents maruziyet ölçüsüdür: sorgu gelir formülüne değil vergi tutarına baktığı için gelir tanımı ve sale_item_pnl düzeltilince de sıfıra inmez; düzeltmenin yeşil kanıtı LED-03 bloğundaki full_refund_net_rev_cents = 0'dır. Vergi iadesi ledger'da receipt'e bağlıdır (sales_tax_refund.reference_id = receipt id); ölçülen 2026-11-08: Jade 0 / 14.172.103 / 18.398
with st as materialized (
  select org_id, reference_id::bigint r, -amount_cents tax from etsy_ledger_entries
  where ledger_type = 'sales_tax' and reference_type = 'receipt' and reference_id ~ '^[0-9]+$'),
str as materialized (
  select org_id, reference_id::bigint r, sum(amount_cents) tax_ref from etsy_ledger_entries
  where ledger_type in ('sales_tax_refund', 'REFUND_REVERSAL_SALES_TAX') and reference_id ~ '^[0-9]+$'
  group by 1, 2)
select o.name,
  (select count(*) from st where st.org_id = o.id) ledger_tax_rows,
  (select count(*) from st join sales s on s.org_id = st.org_id and s.etsy_receipt_id = st.r
    where st.org_id = o.id and s.tax_cents <> st.tax) mismatch_rows,
  (select coalesce(sum(s.tax_cents), 0) from sales s where s.org_id = o.id and s.status <> 'cancelled') tax_in_dashboard_revenue_cents,
  (select coalesce(sum(str.tax_ref), 0) from str join sales s on s.org_id = str.org_id and s.etsy_receipt_id = str.r
    where str.org_id = o.id and s.refunded_cents > 0) refund_tax_in_pnl_cents,
  (select coalesce(sum(str.tax_ref), 0) from str where str.org_id = o.id) refund_tax_ledger_cents
from organizations o
order by o.name;

-- GEL-01 Gelir tek tanıma iner: vergi emaneti ve iadedeki vergi gelirden ayrılır | kaynak LED-02 | kontrol: öneri: sales_tax_mismatch | ölçüm 2026-11-08: 0 / 0 / 1120 (Jade, 2026-11-08, hata yok).
select count(*) filter (where le.amount_cents <> s.grand_total_cents) as mismatched_payments, coalesce(sum(le.amount_cents - s.grand_total_cents) filter (where le.amount_cents <> s.grand_total_cents),0) as diff_cents, count(*) as linked_payments from sales s join etsy_ledger_entries le on le.org_id = s.org_id and le.ledger_type = 'PAYMENT_GROSS' and le.reference_id = s.etsy_payment_id::text where s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_payment_id is not null; -- beklenen: 0 / 0 (2026-11-08 Jade: 0 / 0 / 1120);

-- GEL-01 Gelir tek tanıma iner: vergi emaneti ve iadedeki vergi gelirden ayrılır | kaynak LED-03 | kontrol: öneri: sales_tax_mismatch | ölçüm 2026-11-08: Orijinal: 0 / 0 / 9472 (hata yok). Düzeltilmiş: tax_mismatch_rows 0, matched_receipts 9472, full_refund_orders_nonzero_net 2, full_refund_net_rev_cents -18398 (Jade'in okunmuş iki tam iadeli siparişinde net gelir tam vergi kadar eksi).
with lt as (select reference_id::bigint as receipt_id, -sum(amount_cents) as ledger_tax from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'sales_tax' and reference_type = 'receipt' and reference_id ~ '^[0-9]+$' group by 1), fr as (select s.id, sum(v.net_revenue_cents) as net_rev from sales s join sale_item_pnl v on v.sale_id = s.id where s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.refunds_synced_at is not null and s.refunded_cents > 0 and s.refunded_cents = s.grand_total_cents group by s.id) select (select count(*) from sales s join lt on lt.receipt_id = s.etsy_receipt_id where s.org_id = (select id from organizations where name = 'Jade Gold NYC') and lt.ledger_tax <> s.tax_cents) as tax_mismatch_rows, (select count(*) from sales s join lt on lt.receipt_id = s.etsy_receipt_id where s.org_id = (select id from organizations where name = 'Jade Gold NYC')) as matched_receipts, (select count(*) from fr where net_rev <> 0) as full_refund_orders_nonzero_net, (select coalesce(sum(net_rev), 0) from fr where net_rev <> 0) as full_refund_net_rev_cents; -- beklenen: 0 / receipt sayısı / 0 / 0 (tam iadede net gelir 0, vergi iadesi gelirden düşülmez); 2026-11-08 Jade: 0 / 9472 / 2 / -18398;

-- GEL-01 Gelir tek tanıma iner: vergi emaneti ve iadedeki vergi gelirden ayrılır | kaynak REF-15 | kontrol: öneri: sales_tax_mismatch | ölçüm 2026-11-08: Verilen SQL: Jade 2 sipariş / 18.398 cent; aynı formül tüm org'larda 6 / 37.160 (Jade 2 / 18.398, EON 1 / 6.654, Ophir 2 / 6.835, Artifact 1 / 5.273). Düzeltilmiş SQL (ledger bazlı, iptal hariç): Artifact 1 / 5.273; EON 2 / 6.853 (potansiyel 6 / 26.608); Jade senkronlu 0 (potansiyel 472 / 793.551); Ophir 2 / 6.835; Seselka 0.
-- Beklenen: synced_tax_inside_cents bugünkü maruziyettir; sorgu ledger vergi iadesini topladığı için vergi payı ayrılınca kendiliğinden sıfıra inmez. Vergi payı kolonu kurulunca sorgu o kolonu düşerek yeniden yazılır ve o zaman her org için 0 beklenir.
-- Vergi payı ledger'dan: sales_tax_refund (+) ve REFUND_REVERSAL_SALES_TAX (-), reference_id = receipt id.
-- Bugün (2026-11-08): Artifact 1 / 5.273; EON 2 / 6.853 (potansiyel 26.608); Jade 0 (potansiyel 472 sipariş / 793.551); Ophir 2 / 6.835; Seselka 0.
with tb as materialized (
  select le.org_id, le.reference_id::bigint as receipt_id, sum(le.amount_cents) as tax_back_cents
  from public.etsy_ledger_entries le
  where le.ledger_type in ('sales_tax_refund', 'REFUND_REVERSAL_SALES_TAX')
    and le.reference_id ~ '^[0-9]+$'
  group by le.org_id, le.reference_id::bigint
)
select o.id as org_id, o.name,
  count(s.id) filter (where s.refunds_synced_at is not null and s.status <> 'cancelled') as synced_orders,
  coalesce(sum(tb.tax_back_cents) filter (where s.refunds_synced_at is not null and s.status <> 'cancelled'), 0) as synced_tax_inside_cents,
  count(s.id) filter (where s.status <> 'cancelled') as noncancelled_orders,
  coalesce(sum(tb.tax_back_cents) filter (where s.status <> 'cancelled'), 0) as noncancelled_tax_back_cents
from public.organizations o
left join tb on tb.org_id = o.id
left join public.sales s on s.org_id = tb.org_id and s.etsy_receipt_id = tb.receipt_id
group by o.id, o.name order by o.name;

-- GEL-02 1099-K brüt tutarı ile panel brütünün yıllık mutabakatı | kaynak PAY-05 | kontrol: öneri: tax_form_mismatch | ölçüm 2026-11-08: Hatasız (Jade): 2022 2.094 ödeme, gross 40.270.249, tax 2.532.409, expected 37.737.840; 2023 3.195 / 71.105.086 / 4.551.601 / 66.553.485; 2024 2.759 / 72.763.667 / 4.774.558 / 67.989.109; 2025 1.553 / 60.193.228 / 3.919.576 / 56.273.652; 2026 676 / 33.362.282 / 2.084.630 / 31.277.652 cent.
-- beklenen: expected_1099k_cents = Form 1099-K Box 1a (tolerans yuzde 0,5); olculen 2026-11-08 Jade 2025: 56.273.652 cent (1.553 odeme)
select extract(year from entry_date)::int tax_year,
       count(*) filter (where ledger_type = 'PAYMENT_GROSS') payments,
       sum(amount_cents) filter (where ledger_type = 'PAYMENT_GROSS') gross_cents,
       -sum(amount_cents) filter (where ledger_type = 'sales_tax') tax_cents,
       sum(amount_cents) filter (where ledger_type = 'PAYMENT_GROSS')
         + sum(amount_cents) filter (where ledger_type = 'sales_tax') expected_1099k_cents
from etsy_ledger_entries
where org_id = (select id from organizations where name = 'Jade Gold NYC')
  and ledger_type in ('PAYMENT_GROSS', 'sales_tax')
  and entry_date is not null
group by 1
order by 1;

-- GEL-03 Etsy dışı satış (elle giriş, Shopier, receipt kimliksiz CSV): tahsilat kanalı, kanal ücreti, kalem satırı ve satıcının beyan edeceği satış vergisi | kaynak EK-01 | kontrol: öneri: non_etsy_sale_incomplete | ölçüm 2026-11-08: ölçülmedi
-- EK-01 kontrol: Etsy dışı satış (manual, shopier ya da receipt kimliksiz csv).
-- Beklenen: non_etsy_sales > 0 olsa bile no_line_items, no_collection_info, etsy_fee_on_non_etsy,
-- tax_without_jurisdiction ve etsy_buyer_match = 0. Bugün (2026-11-09) 5 org'da tüm sayaçlar 0.
select o.id as org_id, o.name, o.default_currency,
  count(s.id) as non_etsy_sales,
  coalesce(sum(s.grand_total_cents), 0) as non_etsy_grand_cents,
  coalesce(sum(s.tax_cents), 0) as seller_owed_tax_cents,
  count(s.id) filter (where not exists (select 1 from public.sale_items si where si.sale_id = s.id)) as no_line_items,
  count(s.id) filter (where s.payment_method is null or s.is_paid is null) as no_collection_info,
  count(s.id) filter (where s.etsy_fees_cents > 0) as etsy_fee_on_non_etsy,
  count(s.id) filter (where s.tax_cents > 0 and s.ship_state is null) as tax_without_jurisdiction,
  count(s.id) filter (where s.buyer_name is not null and exists (
      select 1 from public.sales e
      where e.org_id = s.org_id and e.source = 'etsy'
        and lower(e.buyer_name) = lower(s.buyer_name)
        and e.order_date > s.order_date - interval '365 days')) as etsy_buyer_match
from public.organizations o
left join public.sales s
  on s.org_id = o.id
 and (s.source in ('manual', 'shopier') or (s.source = 'csv' and s.etsy_receipt_id is null))
group by o.id, o.name, o.default_currency
order by o.name;

-- ==== 2. İade, iptal ve chargeback (IAD) ====

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak LED-04 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: Orijinal: refund_gap_cents 69903589, unsynced_refund_sales 567 (iddiayla aynı, hata yok). Düzeltilmiş (iptal dışı, aynı saniye köprüsü): live_orders_with_ledger_refund 453, live_refund_gap_cents 10924554, unbridged_refunds 232, unsynced_refund_sales 567.
with g as materialized (select entry_id, created_timestamp as ts, -amount_cents as gross from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'REFUND_GROSS'), t as materialized (select created_timestamp as ts, reference_id::bigint as receipt_id from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'sales_tax_refund' and reference_id ~ '^[0-9]+$'), one as (select t.ts, min(t.receipt_id) as receipt_id from t group by t.ts having count(distinct t.receipt_id) = 1), b as (select o.receipt_id, sum(g.gross) as ledger_refund from g join one o on o.ts = g.ts group by o.receipt_id), p as (select sale_id, sum(amount_cents) as panel_refund from sale_refunds where org_id = (select id from organizations where name = 'Jade Gold NYC') group by sale_id) select count(*) filter (where s.status <> 'cancelled') as live_orders_with_ledger_refund, coalesce(sum(b.ledger_refund - coalesce(p.panel_refund, 0)) filter (where s.status <> 'cancelled'), 0) as live_refund_gap_cents, (select count(*) from g) - (select count(*) from g join one o on o.ts = g.ts) as unbridged_refunds, (select count(*) from sales where org_id = (select id from organizations where name = 'Jade Gold NYC') and status in ('refunded', 'partially_refunded') and refunds_synced_at is null) as unsynced_refund_sales from b join sales s on s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_receipt_id = b.receipt_id left join p on p.sale_id = s.id; -- beklenen: live_refund_gap_cents 0 (en çok ledger iadesinin %1'i), unsynced_refund_sales 0; unbridged_refunds ledger'daki aynı saniye köprüsünü ölçtüğü için payment_adjustments senkronuyla düşmez, köprü tablosu kurulunca bağsız iade o tablodan sayılır; 2026-11-08 Jade: 453 / 10924554 / 232 / 567;

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak REF-01 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: Verilen SQL: backlog_orders 567, grand_cents 18.810.929 (beklenen 0, sapma var). Düzeltilmiş SQL (org listesi organizations'tan): Jade 567 / 18.810.929, payment_queue 9.812; EON, Ophir, Artifact, Seselka 0 / 0 / 0.
-- Beklenen: her org için backlog_orders = 0. payment_queue > 0 iken iade geri doldurması aç kalır (ödeme eşlemesi bütçeyi önce tüketir).
-- Bugün (2026-11-08): Jade 567 sipariş / 18.810.929 cent, payment_queue 9.812; EON, Ophir, Artifact, Seselka 0 / 0 / 0.
select o.id as org_id, o.name,
       count(s.id) as backlog_orders,
       coalesce(sum(s.grand_total_cents), 0) as backlog_grand_cents,
       (select count(*) from public.sales p
         where p.org_id = o.id and p.etsy_receipt_id is not null and p.etsy_payment_id is null
           and (p.etsy_payment_checked_at is null or p.etsy_payment_checked_at < now() - interval '7 days')) as payment_queue
from public.organizations o
left join public.sales s
  on s.org_id = o.id
 and s.status in ('refunded', 'partially_refunded')
 and s.refunds_synced_at is null
 and s.order_date < now() - interval '2 days'
group by o.id, o.name
order by o.name;

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak REF-04 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: Verilen SQL: ledger_refund_cents 69.756.577, panel_refund_cents 247.073, diff_cents 69.509.504. Düzeltilmiş SQL (org bazlı): Artifact 88.320 / 88.320 / 0, köprü 1/1, netlenmeyen ücret iadesi 2.675; EON 322.983 / 78.103 / 244.880, köprü 6/7, 6.971; Jade 69.756.577 / 247.073 / 69.509.504, köprü 1.690/1.922, 183.322; Ophir 123.135 / 123.135 / 0, köprü 2/2, 3.744; Seselka 0.
-- Beklenen: her org için diff_cents = 0 (tolerans ledger_refund_cents / 100). bridged_rows ve fee_refund_not_netted_cents maruziyet ölçüsüdür: bridged_rows yalnız ledger'daki aynı saniye köprüsünü sayar, köprü tablosu kurulunca o tablodan sayılır; fee_refund_not_netted_cents netlemeden sonra da sıfıra inmez, netlemenin yeşil kanıtı K4 order_fee_gap'tir.
-- Bugün (2026-11-08): Jade 69.756.577 / 247.073 / 69.509.504, köprü 1.690/1.922, netlenmeyen 183.322; EON 322.983 / 78.103 / 244.880, 6/7, 6.971; Ophir fark 0, 3.744; Artifact fark 0, 2.675; Seselka 0.
with rg as materialized (
  select org_id, reference_id as adj_id, created_timestamp
  from public.etsy_ledger_entries where ledger_type = 'REFUND_GROSS'
),
st as materialized (
  select org_id, created_timestamp, min(reference_id::bigint) as receipt_id, count(*) as n
  from public.etsy_ledger_entries
  where ledger_type = 'sales_tax_refund' and reference_id ~ '^[0-9]+$'
  group by org_id, created_timestamp
),
adj as materialized (
  select rg.org_id, rg.adj_id, st.receipt_id
  from rg join st on st.org_id = rg.org_id and st.created_timestamp = rg.created_timestamp and st.n = 1
),
rpf as materialized (
  select org_id, reference_id as adj_id, sum(amount_cents) as fee_back
  from public.etsy_ledger_entries where ledger_type = 'REFUND_PROCESSING_FEE' group by 1, 2
)
select o.id as org_id, o.name, x.ledger_refund_cents, x.panel_refund_cents,
       x.ledger_refund_cents - x.panel_refund_cents as diff_cents,
       x.refund_rows, x.bridged_rows, x.fee_refund_not_netted_cents
from public.organizations o
cross join lateral (
  select
    coalesce((select sum(-le.amount_cents) from public.etsy_ledger_entries le
              where le.org_id = o.id and le.ledger_type in ('REFUND_GROSS', 'REFUND_REVERSAL_GROSS')), 0) as ledger_refund_cents,
    coalesce((select sum(r.amount_cents) from public.sale_refunds r where r.org_id = o.id), 0) as panel_refund_cents,
    (select count(*) from rg where rg.org_id = o.id) as refund_rows,
    (select count(*) from adj where adj.org_id = o.id) as bridged_rows,
    coalesce((select sum(rpf.fee_back) from adj
              join rpf on rpf.org_id = adj.org_id and rpf.adj_id = adj.adj_id
              join public.sales s on s.org_id = adj.org_id and s.etsy_receipt_id = adj.receipt_id and s.etsy_payment_id is not null
              where adj.org_id = o.id), 0) as fee_refund_not_netted_cents
) x
order by o.name;

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak PAY-06 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: Orijinal hatasız: ledger_refund_cents 69.756.577, panel_refund_cents 247.073, gap_cents 69.509.504, violations 1.899 (violations alt sorgusu ::text ile de 1.899 döndü, zaman aşımı yok; reference_id::bigint biçimi aynı sonucu verdi). amended_control_sql (köprüyle ana panel şişkinliği): refund_rows 1.922, bridged_refund_rows 1.690, overstated_cents 10.924.554, overstated_orders 453.
-- beklenen: overstated_cents = 0 (ana panel ve İşletme Karı geliri iadeyi düşünce); bridged_refund_rows / refund_rows >= 0,85 (köprü kapsamı); ölçülen 2026-11-08 Jade: 1.922 / 1.690 / 10.924.554 / 453
with rg as materialized (
  select created_timestamp, -amount_cents amt from etsy_ledger_entries
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'REFUND_GROSS'),
tx as materialized (
  select created_timestamp, reference_id::bigint receipt from etsy_ledger_entries
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'sales_tax_refund' and reference_id ~ '^[0-9]+$'),
tx_one as (select created_timestamp, min(receipt) receipt from tx group by 1 having count(distinct receipt) = 1),
b as (select o.receipt, sum(r.amt) amt, count(*) n from rg r join tx_one o on o.created_timestamp = r.created_timestamp group by 1)
select (select count(*) from rg) refund_rows,
       (select sum(n) from b) bridged_refund_rows,
       coalesce(sum(b.amt - coalesce(s.refunded_cents, 0)) filter (where s.status <> 'cancelled'), 0) overstated_cents,
       count(*) filter (where s.status <> 'cancelled' and b.amt > coalesce(s.refunded_cents, 0)) overstated_orders
from b
join sales s on s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_receipt_id = b.receipt;

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak REF-14 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: Verilen SQL (zaman aşımı yok): Jade 6. Düzeltilmiş SQL (transaction_refund ya da sales_tax_refund sinyali, geri alınanlar hariç, org bazlı): Jade 6 / 282.565; EON 4 / 244.880; Artifact, Ophir, Seselka 0.
-- Beklenen: her org için stale_orders = 0 (ledger iade sinyali olan sipariş iade/iptal statüsünde ya da yeniden okunmuş).
-- Bugün (2026-11-08): Jade 6 / 282.565 cent; EON 4 / 244.880; Artifact, Ophir, Seselka 0.
with tr as materialized (
  select org_id, reference_id::bigint as tx_id from public.etsy_ledger_entries
  where ledger_type = 'transaction_refund' and reference_id ~ '^[0-9]+$' group by 1, 2
),
st as materialized (
  select org_id, reference_id::bigint as receipt_id from public.etsy_ledger_entries
  where ledger_type = 'sales_tax_refund' and reference_id ~ '^[0-9]+$' group by 1, 2
),
rv as materialized (
  select org_id, reference_id::bigint as receipt_id from public.etsy_ledger_entries
  where ledger_type = 'REFUND_REVERSAL_SALES_TAX' and reference_id ~ '^[0-9]+$' group by 1, 2
),
sig as (
  select si.org_id, si.sale_id
  from tr join public.sale_items si on si.org_id = tr.org_id and si.etsy_transaction_id = tr.tx_id
  union
  select s.org_id, s.id
  from st join public.sales s on s.org_id = st.org_id and s.etsy_receipt_id = st.receipt_id
)
select o.id as org_id, o.name,
       count(s.id) as stale_orders,
       coalesce(sum(s.grand_total_cents), 0) as grand_cents
from public.organizations o
left join sig on sig.org_id = o.id
left join public.sales s
  on s.id = sig.sale_id
 and s.status not in ('refunded', 'partially_refunded', 'cancelled')
 and s.refunds_synced_at is null
 and not exists (select 1 from rv where rv.org_id = s.org_id and rv.receipt_id = s.etsy_receipt_id)
group by o.id, o.name order by o.name;

-- IAD-01 İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | kaynak LED-15 | kontrol: canlı: K2 refund_backlog, K3 refund_status_mismatch | ölçüm 2026-11-08: 6 / 1899 / 282565 (Jade, hata yok; etsy_transaction_id::text join zaman aşımına düşmedi).
with sig as (select distinct si.sale_id from etsy_ledger_entries le join sale_items si on si.org_id = le.org_id and si.etsy_transaction_id::text = le.reference_id where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'transaction_refund') select count(*) filter (where s.status not in ('refunded','partially_refunded','cancelled')) as status_mismatch_sales, count(*) filter (where s.refunds_synced_at is null) as signal_but_unsynced, coalesce(sum(s.grand_total_cents) filter (where s.status not in ('refunded','partially_refunded','cancelled')),0) as mismatch_grand_cents from sig join sales s on s.id = sig.sale_id where s.org_id = (select id from organizations where name = 'Jade Gold NYC'); -- beklenen: 0 / 0 / 0 (2026-11-08 Jade: 6 / 1899 / 282,565);

-- IAD-02 İptal siparişin tahsilat durumu: hiç tahsil edilmedi, tahsil edilip iade edildi ya da para satıcıda kaldı | kaynak REF-02 | kontrol: öneri: cancelled_settlement_open | ölçüm 2026-11-08: Verilen SQL (zaman aşımı yok): cancelled_charged_not_refunded 11, grand_cents 404.316. Düzeltilmiş SQL: Jade kept_orders 12 / 418.764, never_charged 777 / 36.330.618; EON never_charged 1 / 85.857; Ophir never_charged 4 / 223.568; Artifact ve Seselka 0.
-- Beklenen: her org için kept_orders = 0 ya da her biri sahip onaylı settlement_state = 'reversed_kept'.
-- Küme: iptal statüsünde ama para satıcıda kalmış sipariş = (işlem ücreti kesilmiş ve işlem ücreti iadesi yok) ya da (iadesi REFUND_REVERSAL ile geri alınmış).
-- Bugün (2026-11-08): Jade kept 12 / 418.764, never_charged 777 / 36.330.618; EON never_charged 1 / 85.857; Ophir never_charged 4 / 223.568; Artifact, Seselka 0.
with tx as materialized (
  select le.org_id, si.sale_id,
         bool_or(le.ledger_type = 'transaction') as charged,
         bool_or(le.ledger_type = 'transaction_refund') as fee_refunded
  from public.etsy_ledger_entries le
  join public.sale_items si on si.org_id = le.org_id and si.etsy_transaction_id = le.reference_id::bigint
  where le.ledger_type in ('transaction', 'transaction_refund') and le.reference_id ~ '^[0-9]+$'
  group by le.org_id, si.sale_id
),
rev as materialized (
  select distinct rg.org_id, st.reference_id::bigint as receipt_id
  from public.etsy_ledger_entries rv
  join public.etsy_ledger_entries rg
    on rg.org_id = rv.org_id and rg.ledger_type = 'REFUND_GROSS' and rg.reference_id = rv.reference_id
  join public.etsy_ledger_entries st
    on st.org_id = rg.org_id and st.ledger_type = 'sales_tax_refund'
   and st.created_timestamp = rg.created_timestamp and st.reference_id ~ '^[0-9]+$'
  where rv.ledger_type = 'REFUND_REVERSAL_GROSS'
)
select o.id as org_id, o.name,
  count(s.id) as cancelled_orders,
  count(s.id) filter (where (tx.charged and not tx.fee_refunded) or rev.receipt_id is not null) as kept_orders,
  coalesce(sum(s.grand_total_cents) filter (where (tx.charged and not tx.fee_refunded) or rev.receipt_id is not null), 0) as kept_grand_cents,
  count(s.id) filter (where tx.sale_id is null) as never_charged_orders,
  coalesce(sum(s.grand_total_cents) filter (where tx.sale_id is null), 0) as never_charged_grand_cents
from public.organizations o
left join public.sales s on s.org_id = o.id and s.status = 'cancelled'
left join tx on tx.org_id = s.org_id and tx.sale_id = s.id
left join rev on rev.org_id = s.org_id and rev.receipt_id = s.etsy_receipt_id
group by o.id, o.name order by o.name;

-- IAD-02 İptal siparişin tahsilat durumu: hiç tahsil edilmedi, tahsil edilip iade edildi ya da para satıcıda kaldı | kaynak PAY-07 | kontrol: öneri: cancelled_settlement_open | ölçüm 2026-11-08: Orijinal hatasız: cancelled_paid_refund_unknown 1.386, grand_cents 57.397.440 (Jade; ::text birleşimiyle zaman aşımı yok). amended_control_sql (birleşik tahsil sinyali): cancelled_collected 1.394, collected_grand_cents 57.935.115, refund_unknown 1.392, refund_unknown_grand_cents 57.688.042.
-- beklenen: refund_unknown = 0 (tahsil edilmiş her iptalde refunded_cents okunmuş). Tahsil sinyali: receipt'te sales_tax ledger satırı YA DA kalemde transaction_refund (iptallerde is_paid boş); ölçülen 2026-11-08 Jade: 1.394 / 57.935.115 / 1.392 / 57.688.042
with st as materialized (
  select distinct reference_id::bigint r from etsy_ledger_entries
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'sales_tax' and reference_type = 'receipt' and reference_id ~ '^[0-9]+$'),
tr as materialized (
  select distinct si.sale_id from etsy_ledger_entries le
  join sale_items si on si.org_id = le.org_id and si.etsy_transaction_id = le.reference_id::bigint
  where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'transaction_refund' and le.reference_id ~ '^[0-9]+$')
select count(*) cancelled_collected,
       coalesce(sum(s.grand_total_cents), 0) collected_grand_cents,
       count(*) filter (where s.refunded_cents = 0) refund_unknown,
       coalesce(sum(s.grand_total_cents) filter (where s.refunded_cents = 0), 0) refund_unknown_grand_cents
from sales s
where s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.status = 'cancelled'
  and (s.etsy_receipt_id in (select r from st) or s.id in (select sale_id from tr));

-- IAD-02 İptal siparişin tahsilat durumu: hiç tahsil edilmedi, tahsil edilip iade edildi ya da para satıcıda kaldı | kaynak LED-14 | kontrol: öneri: cancelled_settlement_open | ölçüm 2026-11-08: 13 / 0 / 394085 (Jade, hata yok).
select count(*) as reversals, count(*) filter (where not exists (select 1 from etsy_ledger_entries g where g.org_id = r.org_id and g.ledger_type = 'REFUND_GROSS' and g.reference_id = r.reference_id)) as reversal_without_original, coalesce(sum(amount_cents),0) as reversed_gross_cents from etsy_ledger_entries r where r.org_id = (select id from organizations where name = 'Jade Gold NYC') and r.ledger_type = 'REFUND_REVERSAL_GROSS'; -- beklenen: reversal_without_original = 0 (2026-11-08 Jade: 13 / 0 / 394,085);

-- IAD-03 Kısmi iade hangi kaleme ait: pay dağıtımı yerine ledger transaction_refund ağırlığı | kaynak REF-03 | kontrol: öneri: partial_refund_unattributed | ölçüm 2026-11-08: Verilen SQL (zaman aşımı yok): partial_refunds_misallocated 38. Düzeltilmiş SQL: Jade 38 sipariş / 409.099 cent tahmini yanlış dağıtım; EON, Ophir, Artifact, Seselka 0 / 0.
-- Beklenen: her org için misallocated_orders = 0 (kalem bağı ya da ledger ağırlığı kullanılınca).
-- Bugün (2026-11-08): Jade 38 sipariş / 409.099 cent tahmini yanlış dağıtım (transaction_refund / 0,065); diğer org'lar 0.
with tr as materialized (
  select org_id, reference_id::bigint as tx_id, sum(amount_cents) as tr_cents
  from public.etsy_ledger_entries
  where ledger_type = 'transaction_refund' and reference_id ~ '^[0-9]+$'
  group by 1, 2
),
it as (
  select s.org_id, s.id as sale_id, si.line_total_cents, coalesce(tr.tr_cents, 0) as tr_cents,
         count(*) over (partition by s.id) as n_items,
         sum(si.line_total_cents) over (partition by s.id) as line_sum
  from public.sales s
  join public.sale_items si on si.sale_id = s.id and si.org_id = s.org_id
  left join tr on tr.org_id = si.org_id and tr.tx_id = si.etsy_transaction_id
  where s.status = 'partially_refunded'
),
ps as (
  select org_id, sale_id, max(n_items) as n_items,
         count(*) filter (where tr_cents > 0) as refunded_items,
         sum(tr_cents) as tr_cents,
         sum(line_total_cents) filter (where tr_cents = 0) as nonref_line,
         max(line_sum) as line_sum
  from it group by org_id, sale_id
)
select o.id as org_id, o.name,
  count(ps.sale_id) filter (where ps.n_items > 1 and ps.tr_cents > 0 and ps.refunded_items < ps.n_items) as misallocated_orders,
  coalesce(round(sum((ps.tr_cents / 0.065) * ps.nonref_line::numeric / nullif(ps.line_sum, 0))
    filter (where ps.n_items > 1 and ps.tr_cents > 0 and ps.refunded_items < ps.n_items)), 0) as misallocated_cents_est
from public.organizations o
left join ps on ps.org_id = o.id
group by o.id, o.name order by o.name;

-- IAD-04 Chargeback (CHARGEBACK_DEBIT): kontra gelir, sipariş bağı ve itiraz sonucu | kaynak REF-07 | kontrol: canlı: K11 chargeback_unlinked | ölçüm 2026-11-08: Verilen SQL: unlinked_chargebacks 2, cents 59.565. Düzeltilmiş SQL (org bazlı): Jade 2 / 59.565 (1 chargeback kimliği); Artifact, EON, Ophir, Seselka 0.
-- Beklenen: her org için unlinked_chargebacks = 0.
-- Bugün (2026-11-08): Jade 2 satır / 59.565 cent (1 chargeback kimliği); diğer org'lar 0.
select o.id as org_id, o.name,
       count(le.entry_id) as unlinked_chargebacks,
       coalesce(-sum(le.amount_cents), 0) as cents,
       count(distinct le.reference_id) as chargeback_ids
from public.organizations o
left join public.etsy_ledger_entries le
  on le.org_id = o.id
 and le.ledger_type = 'CHARGEBACK_DEBIT'
 and not exists (
   select 1 from public.costs c
   where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id
 )
group by o.id, o.name
order by o.name;

-- IAD-04 Chargeback (CHARGEBACK_DEBIT): kontra gelir, sipariş bağı ve itiraz sonucu | kaynak LED-11 | kontrol: canlı: K11 chargeback_unlinked | ölçüm 2026-11-08: 2 / 59565 (Jade, hata yok). 0178 accounting_checks chargeback_unlinked Jade 2 / 59565, diğer org'lar 0.
select count(*) as unlinked_chargebacks, coalesce(sum(-amount_cents),0) as cents from etsy_ledger_entries le where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'CHARGEBACK_DEBIT' and not exists (select 1 from costs c where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id); -- beklenen: 0 / 0 (2026-11-08 Jade: 2 / 59,565);

-- IAD-04 Chargeback (CHARGEBACK_DEBIT): kontra gelir, sipariş bağı ve itiraz sonucu | kaynak PAY-10 | kontrol: canlı: K11 chargeback_unlinked | ölçüm 2026-11-08: Hatasız: chargebacks 2, cents 59.565, unlinked 2 (Jade).
-- beklenen: unlinked = 0; olculen 2026-11-08 Jade: chargebacks 2, cents 59.565, unlinked 2
select count(*) chargebacks, coalesce(-sum(amount_cents), 0) cents,
       count(*) filter (where not exists (select 1 from costs c
                                          where c.org_id = le.org_id
                                            and c.external_key = 'ledger:' || le.entry_id)) unlinked
from etsy_ledger_entries le
where org_id = (select id from organizations where name = 'Jade Gold NYC')
  and ledger_type = 'CHARGEBACK_DEBIT';

-- IAD-05 Etsy dışı iade (havale, PayPal, nakit, mağaza kredisi): kaynak, yöntem ve denetim izi | kaynak REF-10 | kontrol: öneri: manual_refund_no_ref | ölçüm 2026-11-08: Verilen SQL: Jade 0. Düzeltilmiş SQL (org bazlı): mismatch_orders 5 org'da 0 (senkronlu sipariş Jade 11, EON 6, Ophir 2, Artifact 1, Seselka 0); sale_refunds_audited false.
-- Beklenen: her org için mismatch_orders = 0 ve sale_refunds_audited = true (elle iade yolu açılmadan önce).
-- Bugün (2026-11-08): 5 org'da mismatch 0; sale_refunds_audited false.
select o.id as org_id, o.name,
       count(s.id) filter (where coalesce(r.cents, 0) <> s.refunded_cents) as mismatch_orders,
       count(s.id) as synced_orders,
       exists (
         select 1 from pg_trigger t
         where t.tgrelid = 'public.sale_refunds'::regclass and not t.tgisinternal and t.tgname = 'audit'
       ) as sale_refunds_audited
from public.organizations o
left join public.sales s on s.org_id = o.id and s.refunds_synced_at is not null
left join (
  select org_id, sale_id, sum(amount_cents) as cents
  from public.sale_refunds group by org_id, sale_id
) r on r.org_id = s.org_id and r.sale_id = s.id
group by o.id, o.name order by o.name;

-- IAD-06 Açık dönem iade karşılığı: son 30 günün ve yeni kapanan ayın karı henüz gelmemiş iade ve iptalleri taşımıyor | kaynak EK-02 | kontrol: öneri: refund_reserve_drift | ölçüm 2026-11-08: ölçülmedi
-- EK-02 kontrol: açık dönem (son 30 gün) iade karşılığı, yaşa göre ağırlıklı.
-- Beklenen: karşılık kaydı kurulduktan sonra booked_reserve_cents = expected_reserve_cents;
-- mature_orders < 30 ise oran ölçülemez (expected null, karşılık sahip girişine kalır).
-- Bugün (2026-11-09): Jade expected yaklaşık 230.800 cent (now() ile kayar), booked 0 (kolon yok);
-- EON 23, Ophir 1, Artifact 0, Seselka 0 olgun sipariş: expected null.
with rg as materialized (
  select le.org_id, le.created_timestamp, le.entry_date, -le.amount_cents as amt
  from public.etsy_ledger_entries le
  join public.organizations o on o.id = le.org_id
  where le.ledger_type = 'REFUND_GROSS'
),
tx as materialized (
  select le.org_id, le.created_timestamp, min(le.reference_id::bigint) as receipt
  from public.etsy_ledger_entries le
  join public.organizations o on o.id = le.org_id
  where le.ledger_type = 'sales_tax_refund' and le.reference_id ~ '^[0-9]+$'
  group by le.org_id, le.created_timestamp
  having count(distinct le.reference_id) = 1
),
rr as materialized (
  select s.org_id, s.id as sale_id, s.order_date, r.amt,
         extract(epoch from (r.entry_date - s.order_date)) / 86400.0 as lag_d
  from rg r
  join tx t on t.org_id = r.org_id and t.created_timestamp = r.created_timestamp
  join public.sales s on s.org_id = r.org_id and s.etsy_receipt_id = t.receipt
),
mature_sales as materialized (
  select s.org_id, count(*) as n, sum(s.grand_total_cents) as g
  from public.sales s
  where s.order_date >= now() - interval '425 days' and s.order_date < now() - interval '60 days'
    and (s.status <> 'cancelled' or exists (select 1 from rr where rr.sale_id = s.id))
  group by s.org_id
),
mature_ref as materialized (
  select rr.* from rr
  where rr.order_date >= now() - interval '425 days' and rr.order_date < now() - interval '60 days'
),
recent_live as materialized (
  select s.org_id, s.id, s.grand_total_cents as g, extract(epoch from (now() - s.order_date)) / 86400.0 as age_d
  from public.sales s
  where s.order_date >= now() - interval '30 days'
    and s.status in ('completed', 'paid', 'processing', 'shipped')
    and not exists (select 1 from rr where rr.sale_id = s.id)
)
select o.id as org_id, o.name,
  coalesce(ms.n, 0) as mature_orders,
  round(coalesce((select sum(amt) from mature_ref m where m.org_id = o.id), 0)::numeric / nullif(ms.g, 0), 4) as mature_refund_rate,
  coalesce((select sum(g) from recent_live r where r.org_id = o.id), 0) as recent_live_gross_cents,
  case when coalesce(ms.n, 0) < 30 then null else
    coalesce(round((select sum(r.g * (select coalesce(sum(m.amt) filter (where m.lag_d > r.age_d), 0)
                                      from mature_ref m where m.org_id = o.id)::numeric / ms.g)
                    from recent_live r where r.org_id = o.id)), 0)
  end as expected_reserve_cents,
  0 as booked_reserve_cents
from public.organizations o
left join mature_sales ms on ms.org_id = o.id
order by o.name;

-- ==== 3. Etsy ücretleri ve kredileri (UCR) ====

-- UCR-01 İşleme ücreti (PAYMENT_PROCESSING_FEE) siparişe API'siz ledger köprüsüyle bağlanır | kaynak LED-06 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Orijinal: 7778 / 2 / 1120 (hata yok). Düzeltilmiş: backlog_bridgeable 7722, bridge_contradicts_api 0, bridge_agrees_api 1117, payment_link_backlog 7778.
with p as materialized (select reference_id as pay_ref, created_timestamp as ts from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'PAYMENT_GROSS'), t as materialized (select created_timestamp as ts, reference_id::bigint as receipt_id from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'sales_tax' and reference_id ~ '^[0-9]+$'), tx as materialized (select le.created_timestamp as ts, s.etsy_receipt_id as receipt_id from etsy_ledger_entries le join sale_items si on si.org_id = le.org_id and si.etsy_transaction_id = le.reference_id::bigint join sales s on s.id = si.sale_id where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'transaction' and le.reference_id ~ '^[0-9]+$'), c as (select p.pay_ref, t.receipt_id from p join t on t.ts between p.ts - 2 and p.ts + 2 union select p.pay_ref, tx.receipt_id from p join tx on tx.ts between p.ts - 2 and p.ts + 2), m as (select pay_ref, min(receipt_id) as receipt_id from c group by pay_ref having count(distinct receipt_id) = 1) select count(*) filter (where s.etsy_payment_id is null and s.status <> 'cancelled' and s.order_date < now() - interval '7 days') as backlog_bridgeable, count(*) filter (where s.etsy_payment_id is not null and s.etsy_payment_id::text <> m.pay_ref) as bridge_contradicts_api, count(*) filter (where s.etsy_payment_id is not null and s.etsy_payment_id::text = m.pay_ref) as bridge_agrees_api, (select count(*) from sales where org_id = (select id from organizations where name = 'Jade Gold NYC') and etsy_payment_id is null and status <> 'cancelled' and order_date < now() - interval '7 days') as payment_link_backlog from m join sales s on s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_receipt_id = m.receipt_id; -- beklenen: köprü yazılınca backlog_bridgeable 0, payment_link_backlog köprüsüz kalanlar kadar, bridge_contradicts_api 0; 2026-11-08 Jade: 7722 / 0 / 1117 / 7778;

-- UCR-01 İşleme ücreti (PAYMENT_PROCESSING_FEE) siparişe API'siz ledger köprüsüyle bağlanır | kaynak PAY-08 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Orijinal hatasız (::text birleşimi zaman aşımı vermedi): ppf_rows_90d 159, unlinked_rows_90d 63, unlinked_cents_90d 111.858 (pencere kaydığı için analizdeki 160 / 64 / 113.852'den biraz farklı).
-- beklenen: unlinked_rows_90d = 0; olculen 2026-11-08 Jade: 160 satirin 64'u bagsiz, 113.852 cent
select count(*) ppf_rows_90d,
       count(*) filter (where s.id is null) unlinked_rows_90d,
       coalesce(-sum(le.amount_cents) filter (where s.id is null), 0) unlinked_cents_90d
from etsy_ledger_entries le
left join sales s on s.org_id = le.org_id and s.etsy_payment_id::text = le.reference_id
where le.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and le.ledger_type = 'PAYMENT_PROCESSING_FEE'
  and le.entry_date >= now() - interval '90 days';

-- UCR-02 İade işleme ücreti (REFUND_PROCESSING_FEE) siparişe bağlanmıyor; tam iadede yüzde 3 + $0,25, kısmide yalnız yüzde 3 | kaynak LED-05 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: 1922 / 1707 / 215 / 0 (Jade, hata yok). Bağımsız: 0178 K4 order_fee_gap Jade +6032014, EON -19252, Ophir -3744, Artifact -12675.
with g as (select reference_id, -sum(amount_cents) as gross from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'REFUND_GROSS' group by 1), f as (select reference_id, sum(amount_cents) as fee from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'REFUND_PROCESSING_FEE' group by 1) select count(*) as refund_pairs, count(*) filter (where abs(f.fee - (round(0.03*g.gross)+25)) <= 1) as full_refund_rule, count(*) filter (where abs(f.fee - round(0.03*g.gross)) <= 1) as partial_refund_rule, count(*) filter (where abs(f.fee - round(0.03*g.gross)) > 1 and abs(f.fee - (round(0.03*g.gross)+25)) > 1) as rule_breaking_pairs from g join f on f.reference_id = g.reference_id; -- beklenen: rule_breaking_pairs = 0 (2026-11-08 Jade: 1922 / 1707 / 215 / 0);

-- UCR-02 İade işleme ücreti (REFUND_PROCESSING_FEE) siparişe bağlanmıyor; tam iadede yüzde 3 + $0,25, kısmide yalnız yüzde 3 | kaynak REF-09 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Verilen SQL (yalnız senkronlu sipariş): Jade 1 sipariş / 1.531 cent. Düzeltilmiş SQL (ledger bazlı tam iade, org bazlı): Artifact 1 / 12.675; EON 5 / 19.719; Jade 244 / 422.155 (190'ında ödeme kimliği var); Ophir 2 / 3.744; Seselka 0.
-- Beklenen: her org için full_refund_fee_not_netted = 0 (işlem ücreti tamamen iade edilmiş siparişte net Etsy ücreti <= 50 cent).
-- Bugün (2026-11-08): Jade 244 / 422.155 cent (190'ında ödeme kimliği), EON 5 / 19.719, Ophir 2 / 3.744, Artifact 1 / 12.675, Seselka 0.
with tf as materialized (
  select le.org_id, si.sale_id,
         sum(-le.amount_cents) filter (where le.ledger_type = 'transaction') as fee,
         coalesce(sum(le.amount_cents) filter (where le.ledger_type = 'transaction_refund'), 0) as back
  from public.etsy_ledger_entries le
  join public.sale_items si on si.org_id = le.org_id and si.etsy_transaction_id = le.reference_id::bigint
  where le.ledger_type in ('transaction', 'transaction_refund') and le.reference_id ~ '^[0-9]+$'
  group by le.org_id, si.sale_id
)
select o.id as org_id, o.name,
       count(s.id) as full_refund_fee_not_netted,
       coalesce(sum(s.etsy_fees_cents), 0) as fee_cents,
       count(s.id) filter (where s.etsy_payment_id is not null) as with_payment_id
from public.organizations o
left join tf on tf.org_id = o.id and tf.fee > 0 and tf.back >= tf.fee - 1
left join public.sales s on s.id = tf.sale_id and s.org_id = tf.org_id and s.etsy_fees_cents > 50
group by o.id, o.name order by o.name;

-- UCR-03 Offsite Ads ücreti ve iadesi sipariş ücretine girmiyor (reference_type ve tür filtresi) | kaynak REK-05 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Özgün SQL çalıştı (::text birleştirmeye rağmen zaman aşımı yok): fee_rows 757, linked_rows 757, unlinked_cents 0, orders_fee_total_below_offsite 364 (iddiayla aynı). Düzeltilmiş SQL (bigint, sipariş başına net): receipts 757, linked_receipts 757, unlinked_net_cents 0, receipts_engine_wrong 358, net_under_cents 569.339, ledger_net_cents 1.790.575, engine_cents 1.221.236.
with f as materialized (
  select le.reference_id::bigint as rid,
         coalesce(-sum(le.amount_cents) filter (where le.ledger_type = 'offsite_ads_fee'), 0) as fee_all,
         coalesce(-sum(le.amount_cents) filter (where le.ledger_type = 'offsite_ads_fee' and le.reference_type = 'receipt'), 0) as fee_in_engine,
         coalesce(sum(le.amount_cents) filter (where le.ledger_type = 'offsite_ads_fee_refund'), 0) as refund_all
  from etsy_ledger_entries le
  where le.org_id = (select id from organizations where name = 'Jade Gold NYC')
    and le.ledger_type in ('offsite_ads_fee', 'offsite_ads_fee_refund')
    and le.reference_id ~ '^[0-9]+$'
  group by 1)
select count(*) as receipts,
       count(s.id) as linked_receipts,
       coalesce(sum(f.fee_all - f.refund_all) filter (where s.id is null), 0) as unlinked_net_cents,
       count(*) filter (where f.fee_in_engine <> f.fee_all - f.refund_all) as receipts_engine_wrong,
       coalesce(sum(f.fee_all - f.refund_all - f.fee_in_engine), 0) as net_under_cents,
       coalesce(sum(f.fee_all - f.refund_all), 0) as ledger_net_cents,
       coalesce(sum(f.fee_in_engine), 0) as engine_cents
from f
left join sales s on s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_receipt_id = f.rid
-- beklenen: linked_receipts = receipts, unlinked_net_cents = 0; motor düzelince (fee_in_engine yerine sales'teki Offsite net) receipts_engine_wrong = 0;

-- UCR-03 Offsite Ads ücreti ve iadesi sipariş ücretine girmiyor (reference_type ve tür filtresi) | kaynak LED-07 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Orijinal: 459 / 799175 (yalnız 'etsy' tipi; hata yok). Düzeltilmiş: offsite_rows_outside_order_fee 527, net_missing_cents 569339, refund_rows_not_netted 158 (Jade). Aynı mantık diğer org'larda: EON 1 / -10000 / 1, Artifact 1 / -10000 / 1, Ophir 0 / 0 / 0, Seselka 0 / 0 / 0.
select count(*) as offsite_rows_outside_order_fee, coalesce(sum(-le.amount_cents), 0) as net_missing_cents, count(*) filter (where le.ledger_type = 'offsite_ads_fee_refund') as refund_rows_not_netted from etsy_ledger_entries le where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type in ('offsite_ads_fee', 'offsite_ads_fee_refund') and not (le.ledger_type = 'offsite_ads_fee' and le.reference_type = 'receipt') and le.reference_id ~ '^[0-9]+$' and exists (select 1 from sales s where s.org_id = le.org_id and s.etsy_receipt_id = le.reference_id::bigint); -- beklenen: rebuild düzeltilip filtre güncellenince 0 / 0 / 0; 2026-11-08 Jade: 527 / 569339 / 158;

-- UCR-03 Offsite Ads ücreti ve iadesi sipariş ücretine girmiyor (reference_type ve tür filtresi) | kaynak REK-06 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Özgün SQL çalıştı (Jade): refunded_orders_without_fee_refund 5, claimable_cents 16.800, fee_refund_but_order_not_refunded 0 (iddiayla aynı). EON değeri düzeltilmiş SQL ile doğrulandı. Düzeltilmiş SQL (bigint, tüm org'lar): Jade 5 / 16.800 / 0 / 0; EON 0 / 0 / 1 / 10.000; by Artifact Studio Jewelry, Ophir Gold USA, Seselka Home 0 / 0 / 0 / 0.
select o.name, x.*
from organizations o
cross join lateral (
  with fee as (
    select le.reference_id::bigint as rid, -sum(le.amount_cents) as fee_cents
    from etsy_ledger_entries le
    where le.org_id = o.id and le.ledger_type = 'offsite_ads_fee' and le.reference_id ~ '^[0-9]+$'
    group by 1),
  rf as (
    select le.reference_id::bigint as rid, sum(le.amount_cents) as refund_cents
    from etsy_ledger_entries le
    where le.org_id = o.id and le.ledger_type = 'offsite_ads_fee_refund' and le.reference_id ~ '^[0-9]+$'
    group by 1)
  select count(*) filter (where s.status in ('refunded', 'cancelled') and rf.rid is null) as refunded_orders_without_fee_refund,
         coalesce(sum(fee.fee_cents) filter (where s.status in ('refunded', 'cancelled') and rf.rid is null), 0) as unrefunded_fee_cents,
         count(*) filter (where rf.rid is not null and s.status not in ('refunded', 'cancelled', 'partially_refunded')) as fee_refund_but_order_live,
         coalesce(sum(rf.refund_cents) filter (where rf.rid is not null and s.status not in ('refunded', 'cancelled', 'partially_refunded')), 0) as fee_refund_on_live_order_cents
  from fee
  join sales s on s.org_id = o.id and s.etsy_receipt_id = fee.rid
  left join rf on rf.rid = fee.rid) x
order by o.name
-- beklenen: dört sütun da 0 (iadeli siparişte ücret iadesi var; ücret iadesi olan sipariş panelde iadeli görünüyor);

-- UCR-04 Kargo işlem ücreti (shipping_transaction) ve iadesi sipariş ücretine girmiyor | kaynak KRG-10 | kontrol: canlı: K4 order_fee_gap | ölçüm 2026-11-08: Özgün SQL (Jade): n_mismatch 0, n_paid_ship_without_fee 0, shipping_income_cents 4181879, shipping_fee_cents 220123, birebir. Düzeltilmiş SQL (uyumsuz / ücretsiz / ücret / iade / net): Jade 0 / 0 / 220123 / 49433 / 170690; EON 0 / 0 / 563 / 0 / 563; Artifact, Ophir, Seselka 0.
-- KRG-10. Beklenen: n_mismatch = 0, n_paid_ship_without_fee = 0 ve net_fee_not_in_order_fees_cents = 0 (rebuild_sales_etsy_fees kargo işlem ücretini yazınca). Ölçüm 2026-11-08: Jade 0 / 0, brüt 220123, iade 49433, net 170690; EON 563 / 0 / 563.
with fee as (
  select le.org_id, le.reference_id::bigint as rid, sum(le.amount_cents) as fee_cents
  from etsy_ledger_entries le
  where le.ledger_type = 'shipping_transaction' and le.reference_id ~ '^[0-9]+$'
  group by 1, 2
),
ref as (
  select le.org_id, sum(le.amount_cents) as refund_cents
  from etsy_ledger_entries le
  where le.ledger_type = 'shipping_transaction_refund'
  group by 1
),
floor_d as (
  select le.org_id, min(le.entry_date) as d from etsy_ledger_entries le group by 1
)
select o.name,
  count(s.id) filter (where f.rid is not null and abs(-f.fee_cents - round(s.shipping_cents * 0.065)) > 1) as n_mismatch,
  count(s.id) filter (where f.rid is null and s.status <> 'cancelled') as n_paid_ship_without_fee,
  coalesce(-sum(f.fee_cents), 0) as shipping_fee_cents,
  coalesce(max(r.refund_cents), 0) as shipping_fee_refund_cents,
  coalesce(-sum(f.fee_cents), 0) - coalesce(max(r.refund_cents), 0) as net_fee_not_in_order_fees_cents
from organizations o
left join floor_d fd on fd.org_id = o.id
left join sales s on s.org_id = o.id and s.shipping_cents > 0 and s.order_date >= fd.d
left join fee f on f.org_id = s.org_id and f.rid = s.etsy_receipt_id
left join ref r on r.org_id = o.id
group by o.id, o.name order by o.name;

-- UCR-05 Etsy kredileri (Etsy Plus, Share & Save, seller_credit, MISC_CR_SL): sınıf ve sebep | kaynak LED-12 | kontrol: öneri: ledger_credit_unclassified | ölçüm 2026-11-08: 918 / 439790 (Jade, 30 günden eski, bağsız kredi satırı; hata yok). Bildirilen 934 / 440590 değeri 30 gün süzgeci olmadan tüm zaman toplamıdır.
select count(*) as unclassified_credit_rows, coalesce(sum(amount_cents),0) as credit_cents from etsy_ledger_entries le where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type in ('MISC_CR_SL','seller_credit','SELLER_DRIVEN_TRAFFIC_CREDIT','sdt_credit_reversal','etsy_plus_credit','etsy_plus_onboarding_fee_credit') and le.entry_date < now() - interval '30 days' and not exists (select 1 from costs c where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id); -- beklenen: 0 / 0 (2026-11-08 Jade: 934 / 440,590);

-- UCR-05 Etsy kredileri (Etsy Plus, Share & Save, seller_credit, MISC_CR_SL): sınıf ve sebep | kaynak PAY-09 | kontrol: öneri: ledger_credit_unclassified | ölçüm 2026-11-08: Hatasız: etsy_plus_credit n 192, cents 9.600, in_costs 0 (Jade, son 365 gün; diğer kredi türleri son 365 günde yok).
-- beklenen: her satirda in_costs = n; olculen 2026-11-08 Jade: etsy_plus_credit n 192, cents 9.600, in_costs 0
select ledger_type, count(*) n, sum(amount_cents) cents,
       count(*) filter (where exists (select 1 from costs c
                                      where c.org_id = le.org_id
                                        and c.external_key = 'ledger:' || le.entry_id)) in_costs
from etsy_ledger_entries le
where org_id = (select id from organizations where name = 'Jade Gold NYC')
  and ledger_type in ('etsy_plus_credit', 'seller_credit', 'SELLER_DRIVEN_TRAFFIC_CREDIT',
                      'sdt_credit_reversal', 'MISC_CR_SL')
  and entry_date >= now() - interval '365 days'
group by 1
order by 1;

-- UCR-05 Etsy kredileri (Etsy Plus, Share & Save, seller_credit, MISC_CR_SL): sınıf ve sebep | kaynak REF-08 | kontrol: öneri: ledger_credit_unclassified | ölçüm 2026-11-08: Verilen SQL: 32 satır, 758.996 cent. Düzeltilmiş SQL (org bazlı; geri almalar ve $5 ve üstü MISC_CR_SL ile seller_credit): Jade 38 satır / 785.269 cent (13 geri alma, 25 kredi); Artifact, EON, Ophir, Seselka 0.
-- Beklenen: her org için unlinked_rows = 0 (geri alma ve $5 ve üstü Etsy kredisi bir siparişe ya da sale_credits kaydına bağlı).
-- Bağ anahtarı bugün costs.external_key; sale_credits kurulunca ledger_entry_id ile aynı kontrol.
-- Bugün (2026-11-08): Jade 38 satır / 785.269 cent (13 geri alma, 25 kredi); diğer org'lar 0.
select o.id as org_id, o.name,
       count(le.entry_id) as unlinked_rows,
       coalesce(sum(le.amount_cents), 0) as cents,
       count(le.entry_id) filter (where le.ledger_type = 'REFUND_REVERSAL_GROSS') as reversals,
       count(le.entry_id) filter (where le.ledger_type in ('MISC_CR_SL', 'seller_credit')) as credits
from public.organizations o
left join public.etsy_ledger_entries le
  on le.org_id = o.id
 and (le.ledger_type = 'REFUND_REVERSAL_GROSS'
      or (le.ledger_type in ('MISC_CR_SL', 'seller_credit') and le.amount_cents >= 500))
 and not exists (
   select 1 from public.costs c
   where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id
 )
group by o.id, o.name order by o.name;

-- UCR-05 Etsy kredileri (Etsy Plus, Share & Save, seller_credit, MISC_CR_SL): sınıf ve sebep | kaynak REK-10 | kontrol: öneri: ledger_credit_unclassified | ölçüm 2026-11-08: Çalıştı: credit_rows 3, rate_mismatch 0, credit_with_offsite_fee 0, reversal_without_refund 0 (iddiayla aynı).
select count(*) as credit_rows,
       count(*) filter (where abs(le.amount_cents - round(0.04 * (coalesce(s.item_total_cents,0) + coalesce(s.shipping_cents,0)))) > 1
                          and abs(le.amount_cents - round(0.065 * (coalesce(s.item_total_cents,0) + coalesce(s.shipping_cents,0)))) > 1) as rate_mismatch,
       count(*) filter (where exists (select 1 from etsy_ledger_entries o where o.org_id = le.org_id and o.ledger_type = 'offsite_ads_fee' and o.reference_id = le.reference_id)) as credit_with_offsite_fee,
       (select count(*) from etsy_ledger_entries r left join sales s2 on s2.org_id = r.org_id and s2.etsy_receipt_id::text = r.reference_id
         where r.org_id = (select id from organizations where name = 'Jade Gold NYC') and r.ledger_type = 'sdt_credit_reversal' and coalesce(s2.status,'') not in ('refunded','cancelled','partially_refunded')) as reversal_without_refund
from etsy_ledger_entries le
join sales s on s.org_id = le.org_id and s.etsy_receipt_id::text = le.reference_id
where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'SELLER_DRIVEN_TRAFFIC_CREDIT'
-- beklenen: rate_mismatch = 0, credit_with_offsite_fee = 0, reversal_without_refund = 0. Ölçüm Jade: 3 kredi, 0, 0, 0.;

-- ==== 4. Reklam (RKL) ====

-- RKL-01 Etsy Ads CSV yükleme yolu, tazelik ve ledger mutabakatı (bir günlük kayma, yalnız tam ay) | kaynak REK-02 | kontrol: canlı: K8 ads_spend_unmeasured | ölçüm 2026-11-08: Özgün SQL çalıştı: last_csv_day 2026-07-26, stale_days 105, ledger_prolist_30d_cents 72.431 (iddiayla aynı). Düzeltilmiş SQL (tüm org'lar, gün kaymalı): by Artifact Studio Jewelry CSV yok, son 30 gün 21.925, ölçülmemiş 30.996, alarm true; EON 56 gün, 29.389, 58.239, true; Jade 105 gün, 72.431, 457.889, true; Ophir Gold USA CSV yok, 14.507, 36.277, true; Seselka Home harcama 0, alarm false.
select o.id as org_id, o.name, a.last_csv_day,
       current_date - a.last_csv_day as stale_days,
       coalesce(l.spend_30d_cents, 0) as ledger_prolist_30d_cents,
       coalesce(l.unmeasured_cents, 0) as unmeasured_cents,
       (coalesce(l.spend_30d_cents, 0) > 0 and (a.last_csv_day is null or current_date - a.last_csv_day > 7)) as alarm
from organizations o
left join lateral (select max(ad.stat_date) as last_csv_day from ad_daily_stats ad where ad.org_id = o.id) a on true
left join lateral (
  select -sum(le.amount_cents) filter (where le.entry_date >= now() - interval '30 days') as spend_30d_cents,
         -sum(le.amount_cents) filter (where (le.entry_date at time zone 'UTC')::date - 1 > coalesce(a.last_csv_day, date '1900-01-01')) as unmeasured_cents
  from etsy_ledger_entries le
  where le.org_id = o.id and le.ledger_type in ('prolist', 'prolist_refund')) l on true
order by o.name
-- beklenen: ledger_prolist_30d_cents > 0 olan her org'da alarm = false (stale_days <= 7);

-- RKL-01 Etsy Ads CSV yükleme yolu, tazelik ve ledger mutabakatı (bir günlük kayma, yalnız tam ay) | kaynak REK-01 | kontrol: canlı: K8 ads_spend_unmeasured | ölçüm 2026-11-08: Özgün SQL çalıştı: mismatched_months 0, net_diff_cents -78, complete_months 6 (iddiayla aynı). Düzeltilmiş SQL (tüm org'lar organizations'tan, tam ay = ayın her günü CSV'de, UTC): Jade 6 tam ay / 0 uyumsuz / -78 cent; EON 8 tam ay / 0 / 0; by Artifact Studio Jewelry, Ophir Gold USA ve Seselka Home 0 tam ay / 0 / 0.
with l as (
  select le.org_id, date_trunc('month', (le.entry_date at time zone 'UTC') - interval '1 day')::date as m, -sum(le.amount_cents) as ledger_cents
  from etsy_ledger_entries le
  where le.org_id in (select id from organizations) and le.ledger_type in ('prolist', 'prolist_refund')
  group by 1, 2),
a as (
  select ad.org_id, date_trunc('month', ad.stat_date)::date as m, sum(ad.spend_cents) as csv_cents, count(distinct ad.stat_date) as days
  from ad_daily_stats ad
  where ad.org_id in (select id from organizations) and ad.source = 'etsy_ads_csv'
  group by 1, 2)
select o.name, count(a.m) as complete_months,
       count(a.m) filter (where abs(a.csv_cents - coalesce(l.ledger_cents, 0)) > 100) as mismatched_months,
       coalesce(sum(a.csv_cents - coalesce(l.ledger_cents, 0)), 0) as net_diff_cents
from organizations o
left join a on a.org_id = o.id and a.days = extract(day from (a.m + interval '1 month' - interval '1 day'))::int
left join l on l.org_id = a.org_id and l.m = a.m
group by o.name
order by o.name
-- beklenen: her org için mismatched_months = 0 (tam ay = ayın her günü CSV'de; ledger günü d+1 = CSV günü d, UTC);

-- RKL-01 Etsy Ads CSV yükleme yolu, tazelik ve ledger mutabakatı (bir günlük kayma, yalnız tam ay) | kaynak LED-08 | kontrol: canlı: K8 ads_spend_unmeasured | ölçüm 2026-11-08: Orijinal: 3 / 8 / 2026-07-26 (hata yok; 3 ayın 2'si kısmi ay). Düzeltilmiş (yalnız tam aylar): full_months_over_tolerance 1, full_months_compared 6, full_month_abs_diff_cents 4104, last_csv_day 2026-07-26, last_spend_day 2026-11-07 (Jade). EON aynı mantıkla 1 / 3 / 1175 / 2026-09-13 / 2026-11-07; Ophir ve Artifact'te CSV hiç yok.
with a as (select date_trunc('month', stat_date)::date as m, sum(spend_cents) as csv_cents, count(distinct stat_date) as days from ad_daily_stats where org_id = (select id from organizations where name = 'Jade Gold NYC') group by 1), l as (select date_trunc('month', entry_date)::date as m, sum(-amount_cents) as ledger_cents from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type in ('prolist', 'prolist_refund') group by 1) select count(*) filter (where abs(a.csv_cents - l.ledger_cents) > greatest(100, 0.02 * l.ledger_cents)) as full_months_over_tolerance, count(*) as full_months_compared, coalesce(sum(abs(a.csv_cents - l.ledger_cents)), 0) as full_month_abs_diff_cents, (select max(stat_date) from ad_daily_stats where org_id = (select id from organizations where name = 'Jade Gold NYC')) as last_csv_day, (select max(entry_date)::date from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'prolist') as last_spend_day from a join l on l.m = a.m where a.days = extract(day from (a.m + interval '1 month' - interval '1 day')); -- beklenen: 0 / n / küçük fark ve last_spend_day - last_csv_day <= 14 gün; 2026-11-08 Jade: 1 / 6 / 4104 / 2026-07-26 / 2026-11-07;

-- RKL-01 Etsy Ads CSV yükleme yolu, tazelik ve ledger mutabakatı (bir günlük kayma, yalnız tam ay) | kaynak PAY-12 | kontrol: canlı: K8 ads_spend_unmeasured | ölçüm 2026-11-08: Hatasız: full_months 6, months_off 1, net_diff_cents -4.078, off_detail 2026-04:-4000 (Jade).
-- beklenen: months_off = 0; olculen 2026-11-08 Jade: 6 tam ay, 1 sapma (2026-04 CSV ledger'dan 4.000 cent dusuk)
with a as (select date_trunc('month', stat_date)::date mo, count(*) days, sum(spend_cents) csv
           from ad_daily_stats where org_id = (select id from organizations where name = 'Jade Gold NYC') group by 1),
     l as (select date_trunc('month', entry_date at time zone 'America/New_York')::date mo, -sum(amount_cents) ledger
           from etsy_ledger_entries
           where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type in ('prolist', 'prolist_refund')
           group by 1)
select count(*) full_months,
       count(*) filter (where abs(a.csv - l.ledger) > greatest(100, 0.02 * l.ledger)) months_off,
       coalesce(sum(a.csv - l.ledger), 0) net_diff_cents,
       string_agg(to_char(a.mo, 'YYYY-MM') || ':' || (a.csv - l.ledger), ',')
         filter (where abs(a.csv - l.ledger) > greatest(100, 0.02 * l.ledger)) off_detail
from a join l on l.mo = a.mo
where a.days >= 28;

-- RKL-02 ROAS başa baş eşiği kalem karından türer, Etsy atfı düzeltilir | kaynak REK-03 | kontrol: öneri: ads_below_breakeven | ölçüm 2026-11-08: Çalıştı: breakeven_roas 3,22; reported_roas 3,55; adjusted_roas 2,49; ok false (iddiayla aynı). Duyarlılık: i = 0,8 ile Haz 2,84 < 3,22; Tem raporlanan 2,96 < 3,22 (düzeltmesiz de altında).
with m as (
  select sum(net_profit_cents)::numeric / nullif(sum(net_revenue_cents),0) as margin
  from sale_item_pnl
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and status = 'completed'
    and order_date >= '2026-01-01' and order_date < '2026-08-01'),
a as (
  select sum(revenue_cents)::numeric / nullif(sum(spend_cents),0) as roas
  from ad_daily_stats
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and stat_date >= '2026-06-01' and stat_date < '2026-07-01')
select round(1/m.margin, 2) as breakeven_roas, round(a.roas, 2) as reported_roas,
       round(a.roas * 0.7, 2) as adjusted_roas,
       (a.roas * 0.7 >= 1/m.margin) as ok
from m, a
-- beklenen: ok = true. Ölçüm Jade Haz 2026: başa baş 3,22, raporlanan 3,55, düzeltilmiş 2,49, ok = false (alarm).;

-- RKL-03 Listing düzeyi Etsy Ads istatistiği tarihsiz ve bayat; EON'da günlük CSV listing tablosuna yanlış eşlenmiş | kaynak REK-04 | kontrol: öneri: ads_listing_stats_stale | ölçüm 2026-11-08: Özgün SQL çalıştı (yalnız Jade): snap_day 2026-06-20, age_days 141, listing_spend 103.728, ledger_spend 185.820, within_store_total true, open_actions 2 (iddiayla aynı). Düzeltilmiş SQL (tüm org'lar, son snapshot, gün kaymalı 30 gün): Jade 2026-06-20 / 141 gün / 103.728 / 0 bağsız satır / ledger 179.821 / true / 2 açık karar; EON 2026-07-21 / 110 gün / 3.886 / 52 bağsız satır 3.537 cent / ledger 2.914 / false / 0 açık karar.
select o.name, x.*
from organizations o
cross join lateral (
  with snap as (
    select max(pm.created_at)::date as d from product_metrics pm
    where pm.org_id = o.id and pm.ads_spend_cents is not null),
  pm as (
    select sum(pm.ads_spend_cents) as spend,
           count(*) filter (where pm.product_id is null) as unlinked_rows,
           coalesce(sum(pm.ads_spend_cents) filter (where pm.product_id is null), 0) as unlinked_spend
    from product_metrics pm, snap
    where pm.org_id = o.id and pm.ads_spend_cents is not null and pm.created_at::date = snap.d),
  l as (
    select -sum(le.amount_cents) as ledger
    from etsy_ledger_entries le, snap
    where le.org_id = o.id and le.ledger_type in ('prolist', 'prolist_refund')
      and (le.entry_date at time zone 'UTC')::date - 1 between snap.d - 29 and snap.d)
  select snap.d as snap_day, current_date - snap.d as age_days, pm.spend as listing_spend_cents,
         pm.unlinked_rows, pm.unlinked_spend as unlinked_spend_cents, l.ledger as ledger_spend_cents,
         (pm.spend <= l.ledger * 1.05) as within_store_total,
         (select count(*) from ads_actions a where a.org_id = o.id and a.status = 'beklemede') as open_actions
  from snap, pm, l) x
where x.snap_day is not null
order by o.name
-- beklenen: within_store_total = true, age_days <= 45, unlinked_rows = 0, open_actions = 0;

-- RKL-04 Offsite Ads oranı (yüzde 12 ya da 15), $100 tavanı ve kayıt politikası org ayarında yok | kaynak REK-07 | kontrol: öneri: offsite_rate_mismatch | ölçüm 2026-11-08: Özgün SQL çalıştı: pretax_365_cents 26.989.256 (analizde 27.042.755; 365 günlük pencere kaydığı için), expected_rate 0,12, fee_rows 757, unexplained_rows 0, capped_rows 34. Düzeltilmiş SQL (tüm org'lar, oran sınıfları ayrı): Jade 757 satır, 34 tavan, 718 %12, 5 %15 (son 2022-05-30), 0 açıklanamayan; EON 6 satır, 6 tavan, 2 satır yalnız %15 ile açıklanıyor (son 2026-09-08), pretax_365 3.093.989; by Artifact Studio Jewelry 1 tavan, %15 kanıtı 2026-10-18; Ophir Gold USA ve Seselka Home 0 satır.
select o.name, x.*
from organizations o
cross join lateral (
  with f as (
    select -le.amount_cents as fee, le.entry_date,
           coalesce(s.item_total_cents, 0) + coalesce(s.shipping_cents, 0) as base
    from etsy_ledger_entries le
    join sales s on s.org_id = o.id and s.etsy_receipt_id = le.reference_id::bigint
    where le.org_id = o.id and le.ledger_type = 'offsite_ads_fee' and le.reference_id ~ '^[0-9]+$')
  select (select sum(coalesce(s2.item_total_cents, 0) + coalesce(s2.shipping_cents, 0)) from sales s2
            where s2.org_id = o.id and s2.order_date >= now() - interval '365 days' and coalesce(s2.status, '') <> 'cancelled') as pretax_365_cents,
         count(*) as fee_rows,
         count(*) filter (where fee = 10000) as capped_rows,
         count(*) filter (where fee <> 10000 and abs(fee - round(0.12 * base)) <= 2) as r12_rows,
         count(*) filter (where fee <> 10000 and abs(fee - round(0.15 * base)) <= 2) as r15_rows,
         (max(entry_date) filter (where fee <> 10000 and abs(fee - round(0.15 * base)) <= 2))::date as last_r15_at,
         count(*) filter (where fee = 10000 and round(0.12 * base) < 10000) as cap_only_explained_by_15,
         (max(entry_date) filter (where fee = 10000 and round(0.12 * base) < 10000))::date as last_cap_only_15_at,
         count(*) filter (where fee <> 10000 and abs(fee - round(0.12 * base)) > 2 and abs(fee - round(0.15 * base)) > 2) as unexplained_rows
  from f) x
order by o.name
-- beklenen: unexplained_rows = 0; pretax_365_cents >= 1.000.000 olan org'da last_r15_at ve last_cap_only_15_at eşiğin aşıldığı tarihten eski olmalı;

-- RKL-05 Reklam gider sınıfı: Offsite değişken, Etsy Ads isteğe bağlı sabit; org'lar arası is_fixed ve iki yüzey köprüsü | kaynak REK-09 | kontrol: öneri: cost_class_inconsistent | ölçüm 2026-11-08: Özgün SQL çalıştı: reklam distinct_flags 2 (5 org: 2 true, 3 false), offsite_ads satırı yok, etsy_ucretleri ve kargo 1/false (iddiayla aynı). Düzeltilmiş SQL (tüm sistem kategorileri): diger 2, yol_ulasim 2, reklam 2 farklı değer; etsy_ucretleri, iscilik, kargo, malzeme, paketleme, tas 1 değer (false).
select cc.key, count(distinct cc.is_fixed) as distinct_flags, bool_and(cc.is_fixed) as all_fixed, bool_or(cc.is_fixed) as any_fixed, count(*) as orgs
from cost_categories cc
where cc.is_system and cc.org_id in (select id from organizations)
group by cc.key
order by cc.key
-- beklenen: her key için distinct_flags = 1; reklam, yol_ulasim, diger için all_fixed = true; offsite_ads eklenince all_fixed = false;

-- RKL-05 Reklam gider sınıfı: Offsite değişken, Etsy Ads isteğe bağlı sabit; org'lar arası is_fixed ve iki yüzey köprüsü | kaynak REK-13 | kontrol: öneri: cost_class_inconsistent | ölçüm 2026-11-08: Özgün SQL çalıştı: item_contribution_cents 619.918, reklam_cents 175.695, offsite_net_cents -4.133, bridge 440.090, naive 444.223, double_count_cents -4.133 (metin 4.133 diyor, sorgu -4.133 döndürüyor). Düzeltilmiş SQL (gerçek çakışma): item_contribution_cents 619.918, overlap_cents 619, offsite_net_in_month_cents -4.133.
with f as materialized (
  select le.reference_id::bigint as rid, -le.amount_cents as fee
  from etsy_ledger_entries le
  where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type = 'offsite_ads_fee'
    and le.reference_type = 'receipt' and le.reference_id ~ '^[0-9]+$'),
p as (
  select sum(net_profit_cents) as item_contribution_cents
  from sale_item_pnl
  where org_id = (select id from organizations where name = 'Jade Gold NYC') and order_date >= '2026-06-01' and order_date < '2026-07-01' and status <> 'cancelled'),
ov as (
  select coalesce(sum(f.fee), 0) as overlap_cents
  from f join sales s on s.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.etsy_receipt_id = f.rid
  where s.order_date >= '2026-06-01' and s.order_date < '2026-07-01' and s.status <> 'cancelled'),
o as (
  select coalesce(-sum(le.amount_cents), 0) as offsite_net_in_month_cents
  from etsy_ledger_entries le
  where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.ledger_type in ('offsite_ads_fee', 'offsite_ads_fee_refund')
    and le.entry_date >= '2026-06-01' and le.entry_date < '2026-07-01')
select p.item_contribution_cents, ov.overlap_cents, o.offsite_net_in_month_cents
from p, ov, o
-- beklenen: overlap_cents = 0 (Offsite ücreti aylık reklam özetinden ayrılınca ya da köprü raporu overlap'i düşünce);

-- RKL-06 Etsy dışı reklam (Meta, Pinterest, Google, TikTok): kampanya, platform ve listing atfı | kaynak REK-11 | kontrol: öneri: external_ads_unreconciled | ölçüm 2026-11-08: Özgün SQL çalıştı, 0 satır döndü (iddiayla aynı: Etsy dışı reklam kaydı yok). Düzeltilmiş sayım SQL'i: 5 org'un hepsinde external_stat_days 0, external_stat_spend_cents 0, external_ad_cost_rows 0, external_ad_cost_cents 0.
select o.id as org_id, o.name,
  (select count(*) from ad_daily_stats a where a.org_id = o.id and a.source <> 'etsy_ads_csv') as external_stat_days,
  (select coalesce(sum(a.spend_cents), 0) from ad_daily_stats a where a.org_id = o.id and a.source <> 'etsy_ads_csv') as external_stat_spend_cents,
  (select count(*) from costs c join cost_categories cc on cc.id = c.category_id
     where c.org_id = o.id and cc.key = 'reklam' and c.source <> 'etsy_ledger') as external_ad_cost_rows,
  (select coalesce(sum(c.amount_cents), 0) from costs c join cost_categories cc on cc.id = c.category_id
     where c.org_id = o.id and cc.key = 'reklam' and c.source <> 'etsy_ledger') as external_ad_cost_cents
from organizations o
order by o.name
-- beklenen: veri gelene kadar dört sütun 0; veri gelince her platform ve ay için external_stat_spend_cents ile fatura toplamı ±%2 tutmalı;

-- ==== 5. Kargo ve sevkiyat (SEV) ====

-- SEV-01 Etsy gidiş ve iade etiketi siparişe bağlanmıyor: shipped_at ve iade tarihi geriye dönük boş | kaynak KRG-01 | kontrol: canlı: K10 labels_unlinked | ölçüm 2026-11-08: Özgün SQL (Jade): n_unlinked 1740, unlinked_cents 1227452, analizle birebir. Düzeltilmiş SQL (n_unlinked / unlinked_cents / n_receipts_never_reread): Artifact 1 / 570 / 0; EON 52 / 40272 / 40; Jade 1740 / 1227452 / 8872; Ophir 3 / 3094 / 3; Seselka 0 / 0 / 0.
-- KRG-01. Beklenen: her org'da n_unlinked = 0 ve n_receipts_never_reread = 0. Ölçüm 2026-11-08: Jade 1740 / 1227452 / 8872, EON 52 / 40272 / 40, Ophir 3 / 3094 / 3, Artifact 1 / 570 / 0 (void edilmiş etiket), Seselka 0.
select o.name,
  count(le.entry_id) filter (where not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)) as n_unlinked,
  coalesce(-sum(le.amount_cents) filter (where not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)), 0) as unlinked_cents,
  (select count(*) from sales s where s.org_id = o.id and s.refunds_synced_at is null
     and s.status in ('completed', 'shipped', 'partially_refunded', 'refunded')) as n_receipts_never_reread
from organizations o
left join etsy_ledger_entries le on le.org_id = o.id and le.reference_type = 'shipping_label'
  and le.ledger_type in ('shipping_labels', 'shipping_label_insurance') and le.amount_cents < 0
group by o.id, o.name order by o.name;

-- SEV-01 Etsy gidiş ve iade etiketi siparişe bağlanmıyor: shipped_at ve iade tarihi geriye dönük boş | kaynak LED-09 | kontrol: canlı: K10 labels_unlinked | ölçüm 2026-11-08: Orijinal: 2 / -1008 / 0 (hata yok). Düzeltilmiş (üç kategori, bağlı satırlar hariç, rebuild ile aynı eşleme): dropped_credit_months 2, dropped_credit_cents 1008, sales_with_two_label_sources 0, items_with_shipped_at 8, items 11588. Beş org'da düşen ay: Jade kargo 2026-09 973 ve 2026-05 35, Artifact kargo 2026-11 570, diğerleri 0.
with m as (select case when le.ledger_type ilike 'prolist%' or le.ledger_type ilike 'offsite_ads_fee%' then 'reklam' when le.ledger_type ilike 'shipping_label%' then 'kargo' when le.ledger_type ilike 'transaction%' or le.ledger_type ilike 'shipping_transaction%' or le.ledger_type ilike '%processing_fee%' or le.ledger_type ilike 'listing%' or le.ledger_type ilike 'renew%' or le.ledger_type ilike 'auto_renew%' or le.ledger_type ilike 'buyer_fee%' or le.ledger_type ilike 'tier_%subscription%' then 'etsy_ucretleri' end as cat, date_trunc('month', le.entry_date)::date as mo, sum(le.amount_cents) as s from etsy_ledger_entries le where le.org_id = (select id from organizations where name = 'Jade Gold NYC') and le.entry_date is not null and le.amount_cents is not null and not exists (select 1 from costs c where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id) group by 1, 2) select (select count(*) from m where cat is not null and s > 0) as dropped_credit_months, (select coalesce(sum(s), 0) from m where cat is not null and s > 0) as dropped_credit_cents, (select count(*) from (select c.sale_id from costs c where c.org_id = (select id from organizations where name = 'Jade Gold NYC') and c.cost_kind = 'shipping_label' and c.external_key is not null group by c.sale_id having count(distinct split_part(c.external_key, ':', 1)) > 1) x) as sales_with_two_label_sources, (select count(*) filter (where shipped_at is not null) from sale_items where org_id = (select id from organizations where name = 'Jade Gold NYC')) as items_with_shipped_at, (select count(*) from sale_items where org_id = (select id from organizations where name = 'Jade Gold NYC')) as items; -- beklenen: 0 / 0 / 0 ve items_with_shipped_at items'a yakın; 2026-11-08 Jade: 2 / 1008 / 0 / 8 / 11588;

-- SEV-01 Etsy gidiş ve iade etiketi siparişe bağlanmıyor: shipped_at ve iade tarihi geriye dönük boş | kaynak KRG-05 | kontrol: canlı: K10 labels_unlinked | ölçüm 2026-11-08: Özgün SQL (Jade): n_unlinked_return 210, unlinked_cents 90190, birebir. Düzeltilmiş SQL: Jade 210 / 90190 (toplam 212), EON 5 / 2737 (toplam 13), Artifact, Ophir, Seselka 0.
-- KRG-05. Beklenen: her org'da n_unlinked_return_60d = 0. Ölçüm 2026-11-08: Jade 210 / 90190 (toplam 212), EON 5 / 2737 (toplam 13), Artifact, Ophir, Seselka 0.
select o.name,
  count(le.entry_id) filter (where le.entry_date < now() - interval '60 days' and not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)) as n_unlinked_return_60d,
  coalesce(-sum(le.amount_cents) filter (where le.entry_date < now() - interval '60 days' and not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)), 0) as unlinked_cents_60d,
  count(le.entry_id) as n_return_labels_all
from organizations o
left join etsy_ledger_entries le on le.org_id = o.id and le.ledger_type = 'shipping_labels_usps_return' and le.amount_cents < 0
group by o.id, o.name order by o.name;

-- SEV-01 Etsy gidiş ve iade etiketi siparişe bağlanmıyor: shipped_at ve iade tarihi geriye dönük boş | kaynak REF-06 | kontrol: canlı: K10 labels_unlinked | ölçüm 2026-11-08: Verilen SQL: 210 etiket, 90.190 cent. Düzeltilmiş SQL (org bazlı): Jade 210 / 90.190; EON 6 / 3.334; Artifact, Ophir, Seselka 0.
-- Beklenen: her org için unlinked_return_labels = 0.
-- Bugün (2026-11-08): Jade 210 / 90.190 cent; EON 6 / 3.334; Artifact, Ophir, Seselka 0.
select o.id as org_id, o.name,
       count(le.entry_id) as unlinked_return_labels,
       coalesce(-sum(le.amount_cents), 0) as cents
from public.organizations o
left join public.etsy_ledger_entries le
  on le.org_id = o.id
 and le.ledger_type = 'shipping_labels_usps_return'
 and le.entry_date < now() - interval '45 days'
 and not exists (
   select 1 from public.costs c
   where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id
 )
group by o.id, o.name
order by o.name;

-- SEV-02 ShipStation postajı çift sayılıyor: aylık özet ve siparişe bağlı satır birlikte toplanıyor | kaynak KRG-02 | kontrol: canlı: K13 postage_double_count | ölçüm 2026-11-08: Özgün SQL (Jade): overcount_cents 1227726, birebir. Düzeltilmiş SQL: Jade overcount_cents 1227726, monthly_minus_unlinked_cents 1227726; Artifact, EON, Ophir, Seselka 0 / 0.
-- KRG-02. Beklenen: her org'da overcount_cents = 0 ve monthly_minus_unlinked_cents = 0. Ölçüm 2026-11-08: Jade 1227726 ve 1227726 (aylık satır 1260514, siparişe eşleşmeyen gönderi 32788), diğer 4 org 0.
select o.name,
  (select coalesce(sum(c.amount_cents), 0) from costs c where c.org_id = o.id and c.source = 'shipstation')
  - (select coalesce(sum(sh.shipment_cost_cents + coalesce(sh.insurance_cost_cents, 0)), 0) from shipstation_shipments sh
      where sh.org_id = o.id and not coalesce(sh.voided, false) and sh.ship_date is not null) as overcount_cents,
  (select coalesce(sum(c.amount_cents), 0) from costs c where c.org_id = o.id and c.source = 'shipstation' and c.external_key is null)
  - (select coalesce(sum(sh.shipment_cost_cents + coalesce(sh.insurance_cost_cents, 0)), 0) from shipstation_shipments sh
      where sh.org_id = o.id and not coalesce(sh.voided, false) and sh.ship_date is not null
        and not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ss:' || sh.shipment_id)) as monthly_minus_unlinked_cents
from organizations o order by o.name;

-- SEV-02 ShipStation postajı çift sayılıyor: aylık özet ve siparişe bağlı satır birlikte toplanıyor | kaynak KRG-13 | kontrol: canlı: K13 postage_double_count | ölçüm 2026-11-08: Özgün SQL (Jade): 3 / 4439 / 29 / 32788, birebir. Düzeltilmiş SQL: Jade 3 / 4439 / 29 / 32788; diğer 4 org 0.
-- KRG-13. Beklenen: rol işaretlendikten sonra sınıflandırılmamış çok etiketli sipariş ve siparişsiz gönderi 0. Ölçüm 2026-11-08 Jade: 3 çok etiketli sipariş (4439 cent), 29 siparişsiz gönderi (32788 cent); diğer org'larda 0.
with sh as (
  select x.org_id, x.shipment_cost_cents + coalesce(x.insurance_cost_cents, 0) as cents,
    case when x.order_number ~ '^[0-9]{1,18}$' then x.order_number::bigint end as receipt
  from shipstation_shipments x
  where not coalesce(x.voided, false)
),
multi as (
  select c.org_id, c.sale_id, sum(c.amount_cents) as cents
  from costs c
  where c.cost_kind = 'shipping_label' and c.external_key is not null and c.sale_id is not null
  group by c.org_id, c.sale_id having count(*) > 1
)
select o.name,
  (select count(*) from multi m where m.org_id = o.id) as n_multi_label_orders,
  (select coalesce(sum(m.cents), 0) from multi m where m.org_id = o.id) as multi_label_cents,
  (select count(*) from sh where sh.org_id = o.id and not exists (select 1 from sales s where s.org_id = o.id and s.etsy_receipt_id = sh.receipt)) as n_non_order_shipments,
  (select coalesce(sum(sh.cents), 0) from sh where sh.org_id = o.id and not exists (select 1 from sales s where s.org_id = o.id and s.etsy_receipt_id = sh.receipt)) as non_order_cents
from organizations o order by o.name;

-- SEV-03 ShipStation 401 ile 121 gündür kopuk: cron nabzı ok=true, ayar sayfası hatayı göstermiyor | kaynak KRG-03 | kontrol: canlı: K9 shipstation_sync_failing | ölçüm 2026-11-08: Özgün SQL (Jade): days_stale 121, sync_status error, sync_error 'ShipStation API hatası (401) /orders: 401 Unauthorized', n_orders_since_without_label 181, birebir. Düzeltilmiş SQL (bağlantısı olan tek org Jade): 121 / error / 181 etiketsiz / 181 sipariş / 50'si 500 dolar üstü / son ship_date 2026-07-09.
-- KRG-03 kontrol (bağlı her org). Beklenen: days_stale <= 2, sync_error null, n_orders_since_without_label = 0. Ölçüm 2026-11-08: yalnız Jade bağlı; 121 gün, error, 181 / 181, 50'si 500 dolar üstü, son ship_date 2026-07-09.
select o.name, extract(day from now() - sc.last_sync_at)::int as days_stale, sc.sync_status, left(sc.sync_error, 80) as sync_error,
       (select count(*) from sales s
         where s.org_id = sc.org_id and s.status in ('completed', 'partially_refunded') and s.order_date >= sc.last_sync_at
           and not exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label')) as n_orders_since_without_label,
       (select count(*) from sales s
         where s.org_id = sc.org_id and s.status in ('completed', 'partially_refunded') and s.order_date >= sc.last_sync_at) as n_orders_since,
       (select count(*) from sales s
         where s.org_id = sc.org_id and s.status in ('completed', 'partially_refunded') and s.order_date >= sc.last_sync_at and s.grand_total_cents >= 50000) as n_ge_500,
       (select max(sh.ship_date)::date from shipstation_shipments sh where sh.org_id = sc.org_id) as last_ship_date
from shipstation_connection sc join organizations o on o.id = sc.org_id
order by o.name;

-- SEV-04 Ledger ve ShipStation dışı etiket (gişe, Pirate Ship) ile satıcının üstlendiği gümrük için giriş yolu yok | kaynak KRG-04 | kontrol: öneri: orders_without_label_cost | ölçüm 2026-11-08: Özgün SQL (Jade): n_shipped_orders 8492, n_without_label_cost 6973, birebir. Düzeltilmiş SQL (kargolanmış / etiketsiz / etiketsiz ABD ücretsiz kargo / manual etiket satırı): Artifact 0 / 0 / 0 / 0; EON 41 / 40 / 0 / 0; Jade 8492 / 6973 / 6167 / 0; Ophir 3 / 3 / 0 / 0; Seselka 0 / 0 / 0 / 0.
-- KRG-04 kontrol (tüm org'lar). Beklenen: n_without_label_cost = 0. Ölçüm 2026-11-08: Jade 8492 / 6973 / 6167 / 0, EON 41 / 40, Ophir 3 / 3, Artifact ve Seselka 0.
select o.name, count(s.*) as n_shipped_orders,
  count(s.*) filter (where not exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label')) as n_without_label_cost,
  count(s.*) filter (where s.shipping_cents = 0 and s.ship_country = 'US' and not exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label')) as n_without_label_us_free,
  (select count(*) from costs c where c.org_id = o.id and c.source = 'manual' and c.cost_kind in ('shipping_label','return_label')) as n_manual_label_rows
from organizations o
left join sales s on s.org_id = o.id and s.status in ('completed', 'partially_refunded') and s.order_date < now() - interval '7 days'
group by o.id, o.name order by o.name;

-- SEV-04 Ledger ve ShipStation dışı etiket (gişe, Pirate Ship) ile satıcının üstlendiği gümrük için giriş yolu yok | kaynak KRG-12 | kontrol: öneri: orders_without_label_cost | ölçüm 2026-11-08: Özgün SQL (Jade): 610 / 1 / 47 / 1949075 / 205515, birebir. Düzeltilmiş SQL: Jade 610 / 1 / 4 / 1949075 / 205515 / 101 etiketli; diğer org'larda uluslararası sipariş 0.
-- KRG-12. Beklenen: n_intl_negative_margin = 0 ve n_intl_shipped_refund_without_return_cost = 0. Ölçüm 2026-11-08 Jade: 610 sipariş, negatif marj 1, kargolanmış iadeli ve iade kargo kaydı olmayan 4, gelir 1949075, etiket 205515 cent (101 sipariş).
with intl as (
  select s.org_id, s.id, s.status, s.shipping_cents,
    (select coalesce(sum(c.amount_cents), 0) from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label') as label_cents,
    (select coalesce(sum(c.amount_cents), 0) from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'return_label') as return_cents
  from sales s
  where s.ship_country <> 'US' and s.status in ('completed', 'partially_refunded', 'refunded')
)
select o.name, count(i.id) as n_intl,
  count(i.id) filter (where i.label_cents > 0 and i.shipping_cents < i.label_cents) as n_intl_negative_margin,
  count(i.id) filter (where i.status in ('refunded', 'partially_refunded') and i.label_cents > 0 and i.return_cents = 0) as n_intl_shipped_refund_without_return_cost,
  coalesce(sum(i.shipping_cents), 0) as intl_shipping_income_cents,
  coalesce(sum(i.label_cents), 0) as intl_label_cents,
  count(i.id) filter (where i.label_cents > 0) as n_with_label
from organizations o left join intl i on i.org_id = o.id
group by o.id, o.name order by o.name;

-- SEV-05 Etiket iadesi (void) ve sigorta iadesi bağlı siparişe dönmüyor; having bağ kurulunca krediyi siler | kaynak KRG-06 | kontrol: öneri: label_refund_unapplied | ölçüm 2026-11-08: Özgün SQL (Jade): n_linked_label_refund_missing 0, refund_cents_not_applied 0, n_labels_with_refund_total 149, birebir. Düzeltilmiş SQL: n_linked_label_refund_missing 5 org'da 0; credit_dropped_cents Jade 1008, Artifact 570, EON, Ophir, Seselka 0.
-- KRG-06 düzeltilmiş kontrol. Beklenen: her org'da n_linked_label_refund_missing = 0 ve credit_dropped_cents = 0. Ölçüm 2026-11-08: missing 5 org'da 0; düşen kredi Jade 1008, Artifact 570, diğerleri 0.
select o.name,
  (select count(*) from costs c
     join etsy_ledger_entries l on l.org_id = c.org_id and c.external_key = 'ledger:' || l.entry_id
                                and l.ledger_type in ('shipping_labels', 'shipping_label_insurance')
     join etsy_ledger_entries r on r.org_id = l.org_id and r.reference_id = l.reference_id
                                and r.ledger_type in ('shipping_label_refund', 'shipping_label_insurance_refund')
    where c.org_id = o.id and c.sale_id is not null
      and not exists (select 1 from costs c2 where c2.org_id = o.id and c2.external_key = 'ledger:' || r.entry_id)) as n_linked_label_refund_missing,
  (select coalesce(-sum(x.net), 0) from (
     select -sum(le.amount_cents) as net
     from etsy_ledger_entries le
     where le.org_id = o.id and le.ledger_type ilike 'shipping_label%' and le.entry_date is not null and le.amount_cents is not null
       and not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)
     group by date_trunc('month', le.entry_date)) x
   where x.net < 0) as credit_dropped_cents
from organizations o order by o.name;

-- SEV-06 Kargo sigortası primi ayrı görünmüyor; yüksek değerli gönderi sigortasız ve imzasız gidiyor | kaynak KRG-08 | kontrol: öneri: uninsured_high_value_shipment | ölçüm 2026-11-08: Özgün SQL (Jade): n_uninsured_ge_500 274, uninsured_value_cents 23304789, birebir. Düzeltilmiş SQL (sigortasız 500 dolar üstü / değer / 250 dolar üstü imzasız): Jade 274 / 23304789 / 430; Artifact, EON, Ophir, Seselka 0 / 0 / 0 (ShipStation verisi yok).
-- KRG-08. Beklenen: her org'da n_uninsured_ge_500 = 0 ve n_ge_250_without_signature = 0 (playbook 06 kuralı). Ölçüm 2026-11-08: Jade 274 / 23304789 / 430; diğer org'larda ShipStation verisi yok.
with sh as (
  select x.org_id, x.shipment_id, x.insurance_cost_cents, x.raw->>'confirmation' as confirmation,
    case when x.order_number ~ '^[0-9]{1,18}$' then x.order_number::bigint end as receipt
  from shipstation_shipments x
  where not coalesce(x.voided, false)
)
select o.name,
  count(s.id) filter (where s.grand_total_cents >= 50000
    and not exists (select 1 from sh where sh.org_id = s.org_id and sh.receipt = s.etsy_receipt_id and coalesce(sh.insurance_cost_cents, 0) > 0)
    and not exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label' and c.notes ilike '%insurance%')) as n_uninsured_ge_500,
  coalesce(sum(s.grand_total_cents) filter (where s.grand_total_cents >= 50000
    and not exists (select 1 from sh where sh.org_id = s.org_id and sh.receipt = s.etsy_receipt_id and coalesce(sh.insurance_cost_cents, 0) > 0)
    and not exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label' and c.notes ilike '%insurance%')), 0) as uninsured_value_cents,
  count(s.id) filter (where s.grand_total_cents >= 25000
    and not exists (select 1 from sh where sh.org_id = s.org_id and sh.receipt = s.etsy_receipt_id and sh.confirmation in ('signature', 'adult_signature', 'direct_signature'))) as n_ge_250_without_signature
from organizations o
left join sales s on s.org_id = o.id and s.status in ('completed', 'partially_refunded', 'refunded')
  and exists (select 1 from sh where sh.org_id = s.org_id and sh.receipt = s.etsy_receipt_id)
group by o.id, o.name order by o.name;

-- SEV-07 Ücretsiz kargo payı ile gerçek etiket arasındaki kayma: pricing_config.shipping_usd ile repo sabiti çelişiyor | kaynak KRG-11 | kontrol: öneri: shipping_allowance_drift | ölçüm 2026-11-08: Özgün SQL (Jade): n_orders 1520, avg_label_cents 592, drift_vs_allowance 0.184, shortfall_cents 140148, birebir. Düzeltilmiş SQL: Jade 1520 sipariş, postaj ortalaması 556, sigorta 54718, 500'e göre sapma 0.112, eksik 85430, pricing_config 22.00 USD'ye göre sapma -0.747; diğer org'larda ShipStation bağlı ABD ücretsiz kargo siparişi 0.
-- KRG-11. Beklenen: |drift_vs_repo_500| <= 0.10 ve pricing_config.shipping_usd ile repo sabiti aynı değer. Ölçüm 2026-11-08 Jade: 1520 sipariş, postaj ort. 556, sigorta 54718, sapma (500'e) 0.112, eksik 85430; pricing_config 22 USD'ye göre sapma -0.747.
with sh as (
  select x.org_id, x.shipment_cost_cents, coalesce(x.insurance_cost_cents, 0) as ins,
    case when x.order_number ~ '^[0-9]{1,18}$' then x.order_number::bigint end as receipt
  from shipstation_shipments x
  where not coalesce(x.voided, false)
),
per_order as (
  select s.org_id, s.id, sum(sh.shipment_cost_cents) as postage, sum(sh.ins) as ins
  from sh join sales s on s.org_id = sh.org_id and s.etsy_receipt_id = sh.receipt
  where s.ship_country = 'US' and s.shipping_cents = 0
  group by s.org_id, s.id
)
select o.name, count(p.id) as n_orders, round(avg(p.postage)) as avg_postage_cents, coalesce(sum(p.ins), 0) as insurance_cents,
  round((avg(p.postage) - 500) / 500.0, 3) as drift_vs_repo_500,
  coalesce(sum(p.postage), 0) - 500 * count(p.id) as shortfall_vs_500_cents,
  max(pc.shipping_usd) as pricing_config_shipping_usd,
  round((avg(p.postage) - max(pc.shipping_usd) * 100) / nullif(max(pc.shipping_usd) * 100, 0), 3) as drift_vs_pricing_config
from organizations o
left join per_order p on p.org_id = o.id
left join pricing_config pc on pc.org_id = o.id
group by o.id, o.name order by o.name;

-- SEV-08 Ön ödemeli postaj bakiyesi (Stamps.com, ShipStation cüzdanı): yükleme gider değil avans | kaynak KRG-15 | kontrol: öneri: postage_funding_mismatch | ölçüm 2026-11-08: Özgün SQL (Jade): stamps_balance_cents 4486, consumed_cents 1260514, manual_topup_rows_cents 0, birebir. Düzeltilmiş SQL: Jade 4486 / 1 farklı bakiye / okuma 2026-07-10 / tüketim 1260514 / yükleme benzeri satır 0 / 0 cent; Artifact, EON, Ophir, Seselka taşıyıcı verisi yok, 0.
-- KRG-15 kontrol (tüm org'lar, tüm kaynaklar). Beklenen: topup_rows_cents = 0 (yükleme gider yazılmaz) ve balance_read_at son 2 gün içinde. Ölçüm 2026-11-08: Jade bakiye 4486 (okuma 2026-07-10), tüketim 1260514, yükleme benzeri satır 0.
select o.name,
  (select max(sc.balance_cents) from shipstation_carriers sc where sc.org_id = o.id and sc.code = 'stamps_com') as stamps_balance_cents,
  (select count(distinct sc.balance_cents) from shipstation_carriers sc where sc.org_id = o.id) as n_distinct_balances,
  (select max(sc.updated_at)::date from shipstation_carriers sc where sc.org_id = o.id) as balance_read_at,
  (select coalesce(sum(sh.shipment_cost_cents + coalesce(sh.insurance_cost_cents, 0)), 0) from shipstation_shipments sh where sh.org_id = o.id and not coalesce(sh.voided, false)) as consumed_cents,
  (select count(*) from costs c where c.org_id = o.id and c.source in ('manual', 'csv', 'invoice')
     and (c.vendor ilike any (array['%stamps%', '%shipstation%', '%pirate%', '%usps%', '%parcelguard%']) or c.description ilike any (array['%stamps%', '%shipstation%', '%pirate%', '%usps%', '%postage%', '%postaj%']))) as n_topup_like_rows,
  (select coalesce(sum(c.amount_cents), 0) from costs c where c.org_id = o.id and c.source in ('manual', 'csv', 'invoice')
     and (c.vendor ilike any (array['%stamps%', '%shipstation%', '%pirate%', '%usps%', '%parcelguard%']) or c.description ilike any (array['%stamps%', '%shipstation%', '%pirate%', '%usps%', '%postage%', '%postaj%']))) as topup_rows_cents
from organizations o order by o.name;

-- ==== 6. COGS ve stok (MAL) ====

-- MAL-01 Aynı kalemde üç maliyet kaynağı: invoice ve manual satırı varken gold_auto da sayılıyor | kaynak COGS-01 | kontrol: canlı: K14 cogs_source_conflict | ölçüm 2026-11-08: Analizdeki SQL hatasız koştu: 8 / 9 (iddiayla aynı). Düzeltilmiş SQL elle çakışmasını da sayar: 10 kalem çakışma / 9 kalemde türsüz fatura / 229.732 cent çift sayılan motor tutarı.
-- Beklenen: 0 / 0 / 0. Bugün (EON): 10 kalem çakışma (8 fatura + 2 elle) / 9 kalemde türsüz fatura / 229.732 cent çift sayılan motor tutarı
select
  count(*) filter (where has_auto and (has_invoice or has_manual)) as items_with_conflicting_sources,
  count(*) filter (where untyped_invoice_rows > 0) as items_with_untyped_invoice,
  coalesce(sum(auto_cents) filter (where has_auto and (has_invoice or has_manual)), 0) as double_counted_auto_cents
from (
  select c.sale_item_id,
    bool_or(c.source = 'gold_auto') as has_auto,
    bool_or(c.source = 'invoice') as has_invoice,
    bool_or(c.source = 'manual' and c.cost_kind in ('gold', 'labor')) as has_manual,
    count(*) filter (where c.source = 'invoice' and c.cost_kind is null) as untyped_invoice_rows,
    sum(c.amount_cents) filter (where c.source = 'gold_auto') as auto_cents
  from costs c
  where c.org_id = (select id from organizations where name = 'EON') and c.sale_item_id is not null
  group by c.sale_item_id
) x;

-- MAL-02 İptal edilen siparişte hayalet COGS: gelir dışlanıyor, maliyet kalıyor | kaynak REF-13 | kontrol: canlı: K5 cancelled_order_cogs | ölçüm 2026-11-08: Verilen SQL: cancelled_orders_with_cogs 813, phantom_cogs_cents 41.350.676 (kargo kanıtı geçersiz). Düzeltilmiş SQL (org bazlı): Jade 815 / 41.489.248; never_charged 319 / 16.239.117; refunded_no_ship 423 / 21.813.012; shipped 72 / 3.402.476; Artifact, EON, Ophir, Seselka 0.
-- Beklenen: her org için never_charged_orders = 0 ve refunded_no_ship_orders = 0 (COGS iptal edilmiş ya da sahip 'üretildi' dedi).
-- Kargo kanıtı: iptal edilmemiş ShipStation gönderisi (order_number = receipt id). sales.is_shipped / sale_items.shipped_at yalnız yeniden okunan receipt'te dolu olduğu için kanıt sayılmaz.
-- Bugün (2026-11-08): Jade 815 / 41.489.248; never_charged 319 / 16.239.117; refunded_no_ship 423 / 21.813.012; shipped 72 / 3.402.476; diğer org'lar 0.
with tx as materialized (
  select le.org_id, si.sale_id,
         bool_or(le.ledger_type = 'transaction') as charged,
         bool_or(le.ledger_type = 'transaction_refund') as refunded
  from public.etsy_ledger_entries le
  join public.sale_items si on si.org_id = le.org_id and si.etsy_transaction_id = le.reference_id::bigint
  where le.ledger_type in ('transaction', 'transaction_refund') and le.reference_id ~ '^[0-9]+$'
  group by le.org_id, si.sale_id
),
ss as materialized (
  select distinct org_id, order_number::bigint as receipt_id
  from public.shipstation_shipments
  where coalesce(voided, false) = false and order_number ~ '^[0-9]+$'
),
cc as materialized (
  select s.org_id, s.id as sale_id, s.etsy_receipt_id, sum(c.amount_cents) as cogs_cents
  from public.sales s
  join public.costs c on c.sale_id = s.id and c.org_id = s.org_id and c.source = 'gold_auto'
  where s.status = 'cancelled'
  group by s.org_id, s.id, s.etsy_receipt_id
)
select o.id as org_id, o.name,
  count(cc.sale_id) as cancelled_with_cogs,
  coalesce(sum(cc.cogs_cents), 0) as cogs_cents,
  count(cc.sale_id) filter (where tx.sale_id is null) as never_charged_orders,
  coalesce(sum(cc.cogs_cents) filter (where tx.sale_id is null), 0) as never_charged_cogs_cents,
  count(cc.sale_id) filter (where tx.refunded and ss.receipt_id is null) as refunded_no_ship_orders,
  coalesce(sum(cc.cogs_cents) filter (where tx.refunded and ss.receipt_id is null), 0) as refunded_no_ship_cogs_cents,
  count(cc.sale_id) filter (where ss.receipt_id is not null) as shipped_orders,
  coalesce(sum(cc.cogs_cents) filter (where ss.receipt_id is not null), 0) as shipped_cogs_cents
from public.organizations o
left join cc on cc.org_id = o.id
left join tx on tx.org_id = cc.org_id and tx.sale_id = cc.sale_id
left join ss on ss.org_id = cc.org_id and ss.receipt_id = cc.etsy_receipt_id
group by o.id, o.name order by o.name;

-- MAL-02 İptal edilen siparişte hayalet COGS: gelir dışlanıyor, maliyet kalıyor | kaynak COGS-02 | kontrol: canlı: K5 cancelled_order_cogs | ölçüm 2026-11-08: Analizdeki SQL hatasız: 815 sipariş / 41.489.248 cent. Düzeltilmiş SQL: 813 sipariş / 41.350.676 cent / 813 siparişte is_shipped NULL. accounting_checks(Jade) cancelled_order_cogs: 813 / 41.350.676 cent, birebir.
-- Beklenen: 0 / 0 / 0. Bugün (Jade): 813 sipariş / 41.350.676 cent / 813 siparişte is_shipped NULL (kargo bilgisi kanıt değil varsayım)
select count(distinct s.id) as cancelled_unshipped_sales_with_cogs,
       coalesce(sum(c.amount_cents), 0) as phantom_cogs_cents,
       count(distinct s.id) filter (where s.is_shipped is null) as shipped_status_unknown_sales
from costs c
left join sale_items si on si.id = c.sale_item_id
join sales s on s.id = coalesce(c.sale_id, si.sale_id)
where c.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and s.status = 'cancelled'
  and not coalesce(s.is_shipped, false)
  and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging') or c.source in ('gold_auto', 'invoice'));

-- MAL-03 Maliyetsiz kalem tespiti sipariş düzeyinde ve 90 günlük: tarihsel ve etiket bağlı siparişler görünmüyor | kaynak COGS-03 | kontrol: öneri: uncosted_sale_items | ölçüm 2026-11-08: Hatasız: Jade 90 gün 37 kalem / 2.052.787 cent (iddiayla aynı). Ek ölçüm: Jade tüm zaman 1.833 / 84.001.905 cent (RPC mantığı 1.561); EON 8 / 1.117.800 (RPC 7 / 1.020.300); Ophir 1 / 100.000 (RPC 0).
-- Beklenen: 0 kalem / 0 cent. Bugün (Jade, 90 gün): 37 kalem / 2.052.787 cent; tüm zaman 1.833 kalem / 84.001.905 cent
select count(*) as items_without_cogs,
       coalesce(sum(si.line_total_cents), 0) as revenue_without_cogs_cents
from sale_items si
join sales s on s.id = si.sale_id
where si.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and s.status <> 'cancelled'
  and s.order_date >= now() - interval '90 days'
  and not exists (
    select 1 from costs c
    where c.sale_item_id = si.id
      and (c.cost_kind in ('gold', 'labor') or c.source in ('gold_auto', 'invoice')));

-- MAL-04 Ayar bugünkü ilan başlığından çözülüyor: 18K kalem atlanıyor, 10K satış 14K maliyetleniyor | kaynak COGS-04 | kontrol: öneri: karat_mismatch | ölçüm 2026-11-08: Analizdeki SQL hatasız: EON 0 / 1 / 397.000 cent. Düzeltilmiş SQL: EON 1 / 1 / 397.000 cent; aynı gövde Jade org_id ile 21 / 0 / 0.
-- Beklenen: 0 / 0 / 0. Bugün (EON): 1 ayar uyumsuz kalem / 1 kalem 18K gramlı maliyetsiz / 397.000 cent; aynı gövde Jade org_id ile 21 / 0 / 0
with it as materialized (
  select si.id, si.line_total_cents, v.w,
    coalesce(v.prop_karat,
      case when (si.title ~* '\y10\s*k')::int + (si.title ~* '\y14\s*k')::int + (si.title ~* '\y18\s*k')::int = 1
           then case when si.title ~* '\y10\s*k' then '10K' when si.title ~* '\y14\s*k' then '14K' else '18K' end end) as sold_karat,
    (select max(substring(c.notes from 'Ayar: (1[048]K)')) from costs c
      where c.sale_item_id = si.id and c.source = 'gold_auto') as cost_karat
  from sale_items si
  join sales s on s.id = si.sale_id and s.status <> 'cancelled'
  left join lateral (
    select pv.weight_grams as w,
      case when jsonb_typeof(pv.properties) = 'object' then upper(nullif(pv.properties ->> 'Karat', '')) end as prop_karat
    from product_variants pv
    where pv.org_id = si.org_id and pv.sku = si.sku and si.sku <> ''
    limit 1) v on true
  where si.org_id = (select id from organizations where name = 'EON'))
select count(*) filter (where sold_karat <> cost_karat) as karat_mismatch_items,
       count(*) filter (where sold_karat = '18K' and w > 0 and cost_karat is null) as k18_weighted_uncosted_items,
       coalesce(sum(line_total_cents) filter (where sold_karat = '18K' and w > 0 and cost_karat is null), 0) as k18_uncosted_revenue_cents
from it;

-- MAL-05 Tarihsel altın alım fiyatı yok: 2022-2025 satışları 2026-07 alım fiyatıyla maliyetlenmiş | kaynak COGS-05 | kontrol: öneri: cogs_price_basis_stale | ölçüm 2026-11-08: Analizdeki SQL hatasız: Jade 8.252 satır / 168.447.546 cent (yalnız altın satırları). Düzeltilmiş SQL: 16.228 geriye dönük satır / 207.991.041 cent / 8.252 yedek spot satırı.
-- Beklenen (tarihli alım fiyatı tablosu kurulunca): 0 / 0 / 0. Bugün (Jade): 16.228 satır / 207.991.041 cent satıştan 31+ gün sonra o günün alım fiyatıyla yazılmış; 8.252 altın satırı 4088 yedek spotuyla (yalnız altın/işçilik bölünmesini bozar)
select count(*) filter (where c.created_at::date - c.cost_date > 31) as retro_rows_with_current_price,
       coalesce(sum(c.amount_cents) filter (where c.created_at::date - c.cost_date > 31), 0) as retro_cents,
       count(*) filter (where substring(c.notes from 'Ons: \$([0-9.]+)')::numeric in (4088, 4500)) as fallback_spot_rows
from costs c
where c.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and c.source = 'gold_auto';

-- MAL-06 İşçilik standart maliyeti ve varyans: EON'un parça başı modeli hiç çalışmamış | kaynak COGS-06 | kontrol: öneri: labor_variance_high | ölçüm 2026-11-08: Analizdeki SQL hatasız: 39 satır / %58,1 (yalnız 2 elle kalem). Düzeltilmiş SQL (fatura dahil): 39 gram başı kalem / 10 ölçülmüş kalem / gerçek 72.397 cent / motor 42.631 cent / mutlak varyans %43,2 / net eksik %41,1 / ölçülmemiş motor işçiliği 167.320 cent.
-- Beklenen: labor_model = per_piece org'da gram başı motor kalemi 0; |gerçek - motor| / gerçek <= %15. Bugün (EON): 39 gram başı kalem / 10 ölçülmüş kalem / gerçek 72.397 cent / motor 42.631 cent / mutlak varyans %43,2 / net eksik %41,1 / ölçülmemiş motor işçiliği 167.320 cent
with real_labor as materialized (
  select c.sale_item_id, sum(c.amount_cents) as real_cents
  from costs c left join cost_categories cc on cc.id = c.category_id
  where c.org_id = (select id from organizations where name = 'EON') and c.source in ('manual', 'invoice')
    and coalesce(c.cost_kind, case cc.key when 'iscilik' then 'labor' end) = 'labor'
  group by 1),
auto_labor as materialized (
  select c.sale_item_id, sum(c.amount_cents) as auto_cents,
    bool_or(c.notes like 'Iscilik (alim - piyasa)%') as per_gram
  from costs c left join cost_categories cc on cc.id = c.category_id
  where c.org_id = (select id from organizations where name = 'EON') and c.source = 'gold_auto'
    and coalesce(c.cost_kind, case cc.key when 'iscilik' then 'labor' end) = 'labor'
  group by 1)
select
  (select count(*) from auto_labor where per_gram) as per_gram_labor_items,
  count(*) as measured_items,
  sum(r.real_cents) as real_cents, sum(a.auto_cents) as auto_cents,
  round(100.0 * sum(abs(r.real_cents - a.auto_cents)) / nullif(sum(r.real_cents), 0), 1) as abs_variance_pct,
  round(100.0 * (sum(r.real_cents) - sum(a.auto_cents)) / nullif(sum(r.real_cents), 0), 1) as net_under_pct,
  (select sum(auto_cents) from auto_labor al where not exists (select 1 from real_labor rl where rl.sale_item_id = al.sale_item_id)) as unmeasured_auto_cents
from real_labor r join auto_labor a using (sale_item_id);

-- MAL-07 Taş maliyeti fiyat kitabında var, satış anında COGS'a yazılmıyor | kaynak COGS-07 | kontrol: öneri: gem_cogs_missing | ölçüm 2026-11-08: Hatasız: 0 / 29 (analizde 0 / 30; 12 aylık kayan pencere bir kalemi dışarıda bıraktı). 29 kalem 3.651.208 cent.
-- Beklenen: 0 / 0. Bugün (Jade): 0 (taş künyeli varyant yok) / 30 (başlıkta taş geçen, 12 ay, taş maliyetsiz)
select
  (select count(*) from sale_items si join sales s on s.id = si.sale_id and s.status <> 'cancelled'
     join product_variants v on v.org_id = si.org_id and v.sku = si.sku and v.stone_carat is not null
     where si.org_id = (select id from organizations where name = 'Jade Gold NYC')
       and not exists (select 1 from costs c where c.sale_item_id = si.id and c.cost_kind = 'gem')) as stone_variant_items_without_gem_cogs,
  (select count(*) from sale_items si join sales s on s.id = si.sale_id and s.status <> 'cancelled'
     where si.org_id = (select id from organizations where name = 'Jade Gold NYC') and s.order_date >= now() - interval '12 months'
       and (coalesce(si.title,'') ~* '\ycz\y|zirconia|cubic|pearl|sapphire|emerald|ruby|moissanite|opal|topaz|garnet|amethyst|birthstone'
            or (coalesce(si.title,'') ~* 'diamond' and coalesce(si.title,'') !~* 'diamond[- ]?cut'))
       and not exists (select 1 from costs c where c.sale_item_id = si.id and c.cost_kind = 'gem')) as stone_titled_items_without_gem_cogs;

-- MAL-08 Paketleme: kutu alımı sabit gider yazılıyor, sipariş başı tüketim hiç yazılmıyor | kaynak COGS-08 | kontrol: öneri: packaging_cogs_missing | ölçüm 2026-11-08: Analizdeki SQL hatasız: 747 kalem / 717 sipariş / 0 cent (analizde 748 / 718; 12 aylık kayan pencere). Düzeltilmiş SQL (sipariş başı): 717 sipariş / 0 cent kayıtlı / 573.600 cent pricing_config standardıyla eksik.
-- Beklenen: 0 sipariş / 0 cent. Bugün (Jade, 12 ay): 717 tamamlanmış sipariş paketsiz / 0 cent kayıtlı / 573.600 cent pricing_config standardıyla eksik (sahibin kuralı: 1 kutu = 1 sipariş)
select count(*) as completed_orders_without_packaging,
  (select coalesce(sum(amount_cents), 0) from costs
     where org_id = (select id from organizations where name = 'Jade Gold NYC') and cost_kind = 'packaging') as packaging_cents_booked,
  count(*) * coalesce((select round(packaging_usd * 100)::int from pricing_config
     where org_id = (select id from organizations where name = 'Jade Gold NYC')), 0) as missing_at_pricing_standard_cents
from sales s
where s.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and s.status = 'completed'
  and s.order_date >= now() - interval '12 months'
  and not exists (
    select 1 from costs c
    where c.org_id = s.org_id and c.cost_kind = 'packaging'
      and (c.sale_id = s.id or c.sale_item_id in (select si.id from sale_items si where si.sale_id = s.id)));

-- MAL-09 İade edilen ya da kaybolan ürünün akıbeti: stoğa dönüş, hurda, kayıp tazminatı, alıcıda kalma | kaynak REF-05 | kontrol: öneri: return_disposition_missing | ölçüm 2026-11-08: Verilen SQL: 431 sipariş, cogs_cents 15.524.839. Düzeltilmiş SQL (refunded statü + işlem ücreti tamamen iade edilmiş kalem, 30 gün, org bazlı): Artifact 0; EON 3 sipariş / 3 kalem / 91.308; Jade 309 / 319 / 10.302.933; Ophir 1 / 1 / 19.260; Seselka 0.
-- Beklenen: her org için orders = 0 (tamamen iade edilmiş kalemde akıbet kararı verilmiş).
-- Bugün (2026-11-08): Jade 309 sipariş / 319 kalem / 10.302.933 cent; EON 3 / 3 / 91.308; Ophir 1 / 1 / 19.260; Artifact, Seselka 0.
with tf as materialized (
  select org_id, reference_id::bigint as tx_id,
         coalesce(sum(-amount_cents) filter (where ledger_type = 'transaction'), 0) as fee_cents,
         coalesce(sum(amount_cents) filter (where ledger_type = 'transaction_refund'), 0) as back_cents
  from public.etsy_ledger_entries
  where ledger_type in ('transaction', 'transaction_refund') and reference_id ~ '^[0-9]+$'
  group by 1, 2
),
ic as materialized (
  select c.sale_item_id, sum(c.amount_cents) as cogs_cents
  from public.costs c
  where c.sale_item_id is not null
    and (c.source = 'gold_auto' or c.cost_kind in ('gold', 'labor', 'gem', 'packaging'))
  group by c.sale_item_id
),
q as (
  select si.org_id, si.sale_id, si.id as item_id, ic.cogs_cents
  from public.sale_items si
  join public.sales s on s.id = si.sale_id and s.org_id = si.org_id
  join ic on ic.sale_item_id = si.id
  left join tf on tf.org_id = si.org_id and tf.tx_id = si.etsy_transaction_id
  where s.status <> 'cancelled'
    and s.order_date < now() - interval '30 days'
    and si.returned_at is null
    and ic.cogs_cents > 0
    and (s.status = 'refunded' or (tf.fee_cents > 0 and tf.back_cents >= tf.fee_cents - 1))
)
select o.id as org_id, o.name,
       count(distinct q.sale_id) as orders, count(q.item_id) as items,
       coalesce(sum(q.cogs_cents), 0) as cogs_cents
from public.organizations o
left join q on q.org_id = o.id
group by o.id, o.name order by o.name;

-- MAL-09 İade edilen ya da kaybolan ürünün akıbeti: stoğa dönüş, hurda, kayıp tazminatı, alıcıda kalma | kaynak COGS-09 | kontrol: öneri: return_disposition_missing | ölçüm 2026-11-08: Analizdeki SQL hatasız: 24 kalem / 588.377 cent. Düzeltilmiş SQL (30 gün gecikme, tarih coalesce): 23 kalem / 571.914 cent / 3 kalemde COGS yok / 15 tam iade kalemi.
-- Beklenen: 0 / 0. Bugün (Jade, 12 ay, 30 gün gecikmeli): 23 kalem / 571.914 cent (3 kalemde COGS yok, 15 tam iade kalemi); last_refund_at Jade'in 567 iadeli siparişinde NULL olduğu için tarih coalesce ile alınır
select count(*) as refunded_items_without_disposition,
       coalesce(sum(x.cogs_cents), 0) as cogs_at_risk_cents,
       count(*) filter (where x.cogs_cents is null) as items_without_cogs,
       count(*) filter (where x.full_refund) as full_refund_items
from (
  select si.id, si.returned_at, (s.status = 'refunded') as full_refund,
    (select sum(c.amount_cents) from costs c where c.sale_item_id = si.id
       and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging') or c.source in ('gold_auto', 'invoice'))) as cogs_cents
  from sale_items si join sales s on s.id = si.sale_id
  where si.org_id = (select id from organizations where name = 'Jade Gold NYC')
    and s.status in ('refunded', 'partially_refunded')
    and coalesce(s.last_refund_at, s.order_date) >= now() - interval '12 months'
    and coalesce(s.last_refund_at, s.order_date) < now() - interval '30 days'
) x
where x.returned_at is null;

-- MAL-09 İade edilen ya da kaybolan ürünün akıbeti: stoğa dönüş, hurda, kayıp tazminatı, alıcıda kalma | kaynak KRG-09 | kontrol: öneri: return_disposition_missing | ölçüm 2026-11-08: Özgün SQL (Jade): 42 sipariş, 1343868 cent, birebir. Düzeltilmiş SQL (açık vaka / değer / sonucu yazılmamış COGS): Artifact 1 / 88320 / 50904; EON 1 / 74904 / 0; Jade 163 / 7657021 / 4189610; Ophir 2 / 123135 / 19260; Seselka 0 / 0 / 0.
-- KRG-09. Beklenen: her org'da n_open_cases = 0 (kargolanmış ve tam iade ya da iptal edilmiş her siparişte dönüş, geri kazanım ya da zarar kaydı var). Ölçüm 2026-11-08: Jade 163 / 7657021 / COGS 4189610; Ophir 2; Artifact 1; EON 1.
select o.name, count(s.id) as n_open_cases, coalesce(sum(s.grand_total_cents), 0) as order_value_cents,
  coalesce(sum((select sum(c.amount_cents) from costs c left join sale_items si on si.id = c.sale_item_id
     where c.org_id = s.org_id and coalesce(c.sale_id, si.sale_id) = s.id
       and (c.cost_kind in ('gold', 'labor', 'gem', 'packaging') or (c.cost_kind is null and c.source = 'gold_auto')))), 0) as cogs_without_outcome_cents
from organizations o
left join sales s on s.org_id = o.id and s.status in ('refunded', 'cancelled')
  and exists (select 1 from costs c where c.org_id = s.org_id and c.sale_id = s.id and c.cost_kind = 'shipping_label' and c.amount_cents > 0)
  and not exists (select 1 from sale_items si where si.org_id = s.org_id and si.sale_id = s.id and (si.returned_at is not null or si.recovered_cents > 0))
group by o.id, o.name order by o.name;

-- MAL-09 İade edilen ya da kaybolan ürünün akıbeti: stoğa dönüş, hurda, kayıp tazminatı, alıcıda kalma | kaynak COGS-10 | kontrol: öneri: return_disposition_missing | ölçüm 2026-11-08: Hatasız: 0 kalem / 0 cent. Beş org'da returned_at dolu 0 satır, recovered_cents toplamı 0.
-- Beklenen: hurda işaretli kalemlerin recovered toplamı = rafineri ödemesi dağıtımı (scrap_lots kurulunca sağ taraf oradan). Bugün (Jade): 0 kalem / 0 cent (hiç kayıt yok)
select count(*) as scrapped_items,
       coalesce(sum(recovered_cents), 0) as recovered_cents
from sale_items
where org_id = (select id from organizations where name = 'Jade Gold NYC')
  and returned_at is not null
  and coalesce(return_note, '') ~* 'hurda|scrap|erit';

-- MAL-10 Satışsız stok çıkışı: numune, hediye, influencer, kayıp, yeniden yapım ve garanti | kaynak COGS-11 | kontrol: öneri: stock_out_without_purpose | ölçüm 2026-11-08: Hatasız: EON 0 satır / 0 cent. Beş org'da satışsız COGS kategorili satır 0 (tüm kaynaklar), unit_price 0 kalem 0, cost_kind 'other' 0.
-- Beklenen: 0 (purpose kolonu gelince: and c.purpose is null). Bugün (EON): 0 satır (hiç girilmiyor; Jade de 0)
select count(*) as cogs_rows_without_sale,
       coalesce(sum(c.amount_cents), 0) as cents
from costs c
join cost_categories cc on cc.id = c.category_id
where c.org_id = (select id from organizations where name = 'EON')
  and c.sale_id is null
  and cc.key in ('malzeme', 'iscilik', 'tas', 'paketleme');

-- MAL-10 Satışsız stok çıkışı: numune, hediye, influencer, kayıp, yeniden yapım ve garanti | kaynak REK-12 | kontrol: öneri: stock_out_without_purpose | ölçüm 2026-11-08: Çalıştı: gift_rows 0, gift_cost_cents 0, wrongly_linked_to_sale 0 (iddiayla aynı).
select count(*) as gift_rows, coalesce(sum(c.amount_cents),0) as gift_cost_cents,
       count(*) filter (where c.sale_id is not null) as wrongly_linked_to_sale
from costs c join cost_categories cc on cc.id = c.category_id
where c.org_id = (select id from organizations where name = 'Jade Gold NYC') and cc.key = 'reklam' and c.source in ('manual','csv')
  and (c.description ilike any (array['%hediye%','%influencer%','%gift%','%numune%','%ugc%']) or c.vendor ilike '%influencer%')
-- beklenen: wrongly_linked_to_sale = 0; gift_rows sahibin gönderim defteriyle eşit. Ölçüm Jade: 0 / 0 / 0 (kayıt yok). Alan kurulunca filtre cost_kind = 'gifted_product' olur.;

-- MAL-11 Gerçek maliyet girişi fiyat tabanını tetiklemiyor; indirim ve ücret parametresi iki kaynakta | kaynak COGS-15 | kontrol: öneri: price_below_actual_cost | ölçüm 2026-11-08: Analizdeki SQL hatasız: 0 / 0 (yalnız 2 SKU'yu gördü). Düzeltilmiş SQL (fatura dahil, en derin indirim greatest(discount_pct/100, 1 - sale_rate)): 10 SKU / 0 varyant maliyet altında / 0 cent / en kötü net-maliyet oranı 1,32.
-- Beklenen: 0 varyant / 0 cent. Bugün (EON): 10 SKU gerçek maliyetli (8 fatura + 2 elle) / 0 varyant maliyet altında / 0 cent / en kötü net-maliyet oranı 1,32 (sale_rate 0,75)
with real_rows as materialized (
  select c.sale_item_id, c.amount_cents,
    coalesce(c.cost_kind, case cc.key when 'malzeme' then 'gold' when 'iscilik' then 'labor' when 'tas' then 'gem' when 'paketleme' then 'packaging' end) as kind
  from costs c left join cost_categories cc on cc.id = c.category_id
  where c.org_id = (select id from organizations where name = 'EON') and c.source in ('manual', 'invoice') and c.sale_item_id is not null),
per_item as (
  select r.sale_item_id, sum(r.amount_cents) filter (where r.kind in ('gold', 'labor', 'gem', 'packaging')) as cogs_cents
  from real_rows r group by 1),
actual as (
  select si.sku,
    (array_agg(pi.cogs_cents / greatest(si.quantity, 1) order by s.order_date desc))[1] as unit_cost_cents
  from per_item pi join sale_items si on si.id = pi.sale_item_id join sales s on s.id = si.sale_id
  where si.sku <> '' and pi.cogs_cents > 0
  group by si.sku),
cfg as (
  select coalesce((select sale_rate from pricing_config where org_id = (select id from organizations where name = 'EON')), 1) as sale_rate)
select count(*) as skus_with_actual_cost,
  count(*) filter (where pv.active and pv.price_cents * (1 - greatest(coalesce(p.discount_pct, 0) / 100.0, 1 - cfg.sale_rate)) * (1 - 0.128) - 45 < a.unit_cost_cents) as variants_priced_below_actual_cost,
  coalesce(sum(a.unit_cost_cents - floor(pv.price_cents * (1 - greatest(coalesce(p.discount_pct, 0) / 100.0, 1 - cfg.sale_rate)) * (1 - 0.128) - 45))
    filter (where pv.active and pv.price_cents * (1 - greatest(coalesce(p.discount_pct, 0) / 100.0, 1 - cfg.sale_rate)) * (1 - 0.128) - 45 < a.unit_cost_cents), 0) as gap_cents,
  min(round((pv.price_cents * (1 - greatest(coalesce(p.discount_pct, 0) / 100.0, 1 - cfg.sale_rate)) * (1 - 0.128) - 45) / nullif(a.unit_cost_cents, 0), 2)) as worst_net_to_cost_ratio
from actual a
cross join cfg
join product_variants pv on pv.org_id = (select id from organizations where name = 'EON') and pv.sku = a.sku
join products p on p.id = pv.product_id;

-- MAL-12 Stoğa dönen iade parçası: taşıma değeri, yeniden satışta stoktan tüketim ve yıl sonu stok | kaynak EK-03 | kontrol: öneri: return_stock_unvalued | ölçüm 2026-11-08: ölçülmedi
-- EK-03 kontrol: kargolanıp tam iade ya da iptal edilen kalem (parça büyük olasılıkla geri geldi)
-- ile aynı SKU'nun 7-180 gün içindeki yeniden satışı.
-- Beklenen: unresolved_resale_items = 0 (her çift bir stok partisine bağlı ya da 'yeni üretim' işaretli)
-- ve akıbeti girilmemiş iade kalemi kalmaz. Bugün (2026-11-09) Jade: 169 kalem, 4.328.182 cent COGS,
-- 58 çözülmemiş çift, üst sınır 1.442.854 cent; stok tablosu yok.
with ret_items as materialized (
  select si.org_id, si.id, si.sku, s.order_date, si.returned_at, si.recovered_cents,
         (select coalesce(sum(c.amount_cents), 0) from public.costs c
           where c.sale_item_id = si.id
             and (c.cost_kind in ('gold','labor','gem','packaging') or c.source in ('gold_auto','invoice'))) as cogs
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.organizations o on o.id = s.org_id
  where s.status in ('cancelled', 'refunded')
    and (s.shipped_at is not null or si.shipped_at is not null
         or exists (select 1 from public.shipstation_shipments ss
                    where ss.org_id = s.org_id and ss.order_number = s.etsy_receipt_id::text
                      and coalesce(ss.voided, false) = false))
),
flagged as (
  select r.*,
         exists (select 1 from public.sale_items s2 join public.sales x on x.id = s2.sale_id
                 where s2.org_id = r.org_id and s2.sku = r.sku
                   and x.status in ('completed','paid','processing','shipped')
                   and x.order_date > r.order_date + interval '7 days'
                   and x.order_date <= r.order_date + interval '180 days') as resold
  from ret_items r
)
select o.id as org_id, o.name,
  count(f.id) as returned_shipped_items,
  coalesce(sum(f.cogs), 0) as cogs_still_booked_cents,
  count(f.id) filter (where f.returned_at is not null) as disposition_recorded,
  coalesce(sum(f.recovered_cents), 0) as recovered_cents,
  count(f.id) filter (where f.resold and f.cogs > 0) as unresolved_resale_items,
  coalesce(sum(f.cogs) filter (where f.resold and f.cogs > 0), 0) as double_cost_upper_bound_cents
from public.organizations o
left join flagged f on f.org_id = o.id
group by o.id, o.name
order by o.name;

-- ==== 7. Sabit ve Etsy dışı giderler (GDR) ====

-- GDR-01 Abonelik ve tekrarlayan sabit giderler: üretici yok, Etsy Plus değişken sepette | kaynak COGS-13 | kontrol: öneri: fixed_cost_month_missing | ölçüm 2026-11-08: Analizdeki SQL hatasız: EON 4 ay eksik (2026-06, 2026-09, 2026-10, 2026-11). Düzeltilmiş SQL: EON 4 ay / 50.000 cent Offsite Ads sabit kovada / 6.000 cent abonelik değişken kovada (son 6 ay); aynı gövde Jade için 6 / 57.863 / 5.000.
-- Beklenen: 0 / 0 / 0. Bugün (EON): 4 ay elle sabit gidersiz / 50.000 cent Offsite Ads sabit kovada / 6.000 cent Etsy Plus aboneliği değişken kovada (son 6 ay); aynı gövde Jade için 6 / 57.863 / 5.000
with months as (
  select to_char(date_trunc('month', now()) - (interval '1 month' * g), 'YYYY-MM') as m from generate_series(0, 5) g),
fixed as (
  select to_char(c.cost_date, 'YYYY-MM') as m, sum(c.amount_cents) as cents
  from costs c join cost_categories cc on cc.id = c.category_id
  where c.org_id = (select id from organizations where name = 'EON') and cc.is_fixed and c.source in ('manual', 'csv')
  group by 1)
select
  (select count(*) from months mo left join fixed f on f.m = mo.m where f.cents is null) as months_without_manual_fixed_costs,
  (select coalesce(sum(-le.amount_cents), 0) from etsy_ledger_entries le
     where le.org_id = (select id from organizations where name = 'EON')
       and le.ledger_type in ('offsite_ads_fee', 'offsite_ads_fee_refund')
       and le.entry_date >= date_trunc('month', now()) - interval '5 months')
   * (select count(*) from cost_categories cc
       where cc.org_id = (select id from organizations where name = 'EON') and cc.key = 'reklam' and cc.is_fixed) as offsite_ads_in_fixed_cents,
  (select coalesce(sum(-le.amount_cents), 0) from etsy_ledger_entries le
     where le.org_id = (select id from organizations where name = 'EON')
       and le.ledger_type = 'tier_2_subscription'
       and le.entry_date >= date_trunc('month', now()) - interval '5 months')
   * (select count(*) from cost_categories cc
       where cc.org_id = (select id from organizations where name = 'EON') and cc.key = 'etsy_ucretleri' and not cc.is_fixed) as subscription_in_variable_cents;

-- GDR-01 Abonelik ve tekrarlayan sabit giderler: üretici yok, Etsy Plus değişken sepette | kaynak LED-10 | kontrol: öneri: fixed_cost_month_missing | ölçüm 2026-11-08: Orijinal: 0 / 56 (hata yok). Düzeltilmiş: anomalous_or_missing_months 0, missing_months 0, closed_months 56 (Jade). 4 org'da kapanmış ay Jade 56, EON 15, Ophir 4, Artifact 2; eksik 0, anomali 0.
with b as (select min(date_trunc('month', entry_date)) as m0 from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'tier_2_subscription'), mo as (select gs::date as m from b cross join lateral generate_series(b.m0, date_trunc('month', now()) - interval '1 month', interval '1 month') gs), sub as (select date_trunc('month', entry_date)::date as m, count(*) as n, sum(amount_cents) as c from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'tier_2_subscription' group by 1) select count(*) filter (where sub.n is null or sub.n <> 1 or sub.c <> -1000) as anomalous_or_missing_months, count(*) filter (where sub.n is null) as missing_months, count(*) as closed_months from mo left join sub on sub.m = mo.m; -- beklenen: 0 / 0 / kapanmış ay sayısı; 2026-11-08 Jade: 0 / 0 / 56;

-- GDR-02 Tedarikçi faturası başlığı, kalemlere dağıtım ve kur; canlı İşletme Karı 0109 yerine 0097 gövdesiyle | kaynak COGS-12 | kontrol: öneri: invoice_unallocated | ölçüm 2026-11-08: Hatasız: EON 0 USD dışı satır / 0 cent / 18 başlıksız fatura satırı / 204.000 cent.
-- Beklenen: non_usd_rows = 0 ya da hepsi fx_rate'li (kolon gelince), invoice satırı başlıksız = 0 (invoice_id gelince). Bugün (EON): 0 USD dışı satır; 18 fatura satırı 204.000 cent başlıksız
select count(*) filter (where c.currency <> 'USD') as non_usd_rows,
       coalesce(sum(c.amount_cents) filter (where c.currency <> 'USD'), 0) as non_usd_cents,
       count(*) filter (where c.source = 'invoice') as invoice_rows_without_header,
       coalesce(sum(c.amount_cents) filter (where c.source = 'invoice'), 0) as invoice_cents
from costs c
where c.org_id = (select id from organizations where name = 'EON');

-- GDR-03 Taraf (H, Y, I): kim katlanır ile kim ödedi ayrımı ve ay sonu ortak mutabakatı | kaynak COGS-14 | kontrol: öneri: bearer_unassigned | ölçüm 2026-11-08: Hatasız: EON 12 atanmamış satır / 12.881 cent; H 16.150; Y 0; I 2.032.428; toplam 2.061.459 cent (H + Y + I + atanmamış = toplam).
-- Beklenen: unassigned_rows = 0 ve h+y+i = total. Bugün (EON): 12 satır 12.881 cent atanmamış; Jade (ortaklık yok) 1.977 satırda taraf dolu
select count(*) filter (where bearer is null) as unassigned_rows,
       coalesce(sum(amount_cents) filter (where bearer is null), 0) as unassigned_cents,
       coalesce(sum(amount_cents) filter (where bearer = 'H'), 0) as h_cents,
       coalesce(sum(amount_cents) filter (where bearer = 'Y'), 0) as y_cents,
       coalesce(sum(amount_cents) filter (where bearer = 'I'), 0) as i_cents,
       coalesce(sum(amount_cents), 0) as total_cents
from costs
where org_id = (select id from organizations where name = 'EON') and currency = 'USD';

-- ==== 8. Nakit, payout ve dönem kapanışı (NAK) ====

-- NAK-01 Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | kaynak LED-13 | kontrol: öneri: payout_unmatched | ölçüm 2026-11-08: 0 / 0 / 566147 (Jade, hata yok). 4 org'da balance_identity_gap 0, null bakiye 0; Seselka'da ledger satırı yok.
with e as (select amount_cents, balance_cents, entry_date, entry_id from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC')) select (select sum(amount_cents) from e) - (select balance_cents from e order by entry_date desc, entry_id desc limit 1) as balance_identity_gap_cents, (select count(*) from e where balance_cents is null) as null_balance_rows, (select sum(-amount_cents) from etsy_ledger_entries where org_id = (select id from organizations where name = 'Jade Gold NYC') and ledger_type = 'DISBURSE2' and entry_date >= date_trunc('month', now())) as payouts_this_month_cents; -- beklenen: 0 / 0 (2026-11-08: 4 org'da 0 / 0);

-- NAK-01 Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | kaynak PAY-02 | kontrol: öneri: payout_unmatched | ölçüm 2026-11-08: Hatasız: payouts_35d 16, payout_cents_35d 2.166.642, reversals_35d 0, last_payout_at 2026-11-06 13:38:36 UTC (Jade).
-- beklenen: reversals_35d = 0; payouts_35d > 0 (satis varsa). bank_deposits kurulunca left join ile unmatched = 0 eklenir
-- olculen 2026-11-08 Jade: payouts_35d 16, payout_cents_35d 2.166.642, reversals_35d 0, son payout 2026-11-06 13:38 UTC
select count(*) filter (where ledger_type = 'DISBURSE2') payouts_35d,
       coalesce(-sum(amount_cents) filter (where ledger_type = 'DISBURSE2'), 0) payout_cents_35d,
       count(*) filter (where ledger_type = 'ADYENBALANCE_REVERSAL') reversals_35d,
       max(entry_date) filter (where ledger_type = 'DISBURSE2') last_payout_at
from etsy_ledger_entries
where org_id = (select id from organizations where name = 'Jade Gold NYC')
  and ledger_type in ('DISBURSE2', 'ADYENBALANCE_REVERSAL')
  and entry_date >= now() - interval '35 days';

-- NAK-01 Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | kaynak PAY-03 | kontrol: öneri: payout_unmatched | ölçüm 2026-11-08: Hatasız: recoup_n 10, recoup_cents 612.925, billing_cents 0, funding_cents_90d 612.925, recoup_not_negative_before 0 (Jade, 90 gün). amended_control_sql (tüm org): funding_cents_90d Artifact 46.552, EON 5.340, Jade 612.925, Ophir 58.486, Seselka 0; recoup_nonneg_before_90d hepsinde 0.
-- beklenen: funding_cents_90d = kart ya da banka ekstresindeki Etsy çekimleri (elle karşılaştırılır); recoup_nonneg_before_90d sınıf hatası değildir, kullanılabilir bakiye eksiyken ledger bakiyesinin artı olduğunu (bekletilen fon) gösterir ve PAY-14'e gider; ölçülen 2026-11-08: Jade 612.925 / 0
select o.name,
       count(le.*) filter (where le.ledger_type = 'RECOUP') recoup_n_90d,
       coalesce(sum(le.amount_cents) filter (where le.ledger_type = 'RECOUP'), 0) recoup_cents_90d,
       coalesce(sum(le.amount_cents) filter (where le.ledger_type = 'billing_payment'), 0) billing_cents_90d,
       coalesce(sum(le.amount_cents), 0) funding_cents_90d,
       count(le.*) filter (where le.ledger_type = 'RECOUP' and le.balance_cents - le.amount_cents >= 0) recoup_nonneg_before_90d
from organizations o
left join etsy_ledger_entries le
  on le.org_id = o.id
 and le.ledger_type in ('RECOUP', 'billing_payment', 'seller_onboarding_fee_payment')
 and le.entry_date >= now() - interval '90 days'
group by o.name
order by o.name;

-- NAK-01 Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | kaynak REF-12 | kontrol: öneri: payout_unmatched | ölçüm 2026-11-08: Verilen SQL: Jade integrity_diff_cents 0. Düzeltilmiş SQL (org bazlı): 5 org'da 0 (Artifact 303 satır, EON 862, Jade 72.399, Ophir 267, Seselka 0).
-- Beklenen: her org için integrity_diff_cents = 0 (toplam amount_cents = en son satırın balance_cents'i).
-- Bugün (2026-11-08): 5 org'da 0 (Artifact -6.218, EON 165.384, Jade 84.437, Ophir -2.212, Seselka satır yok).
select o.id as org_id, o.name,
  coalesce((select sum(le.amount_cents) from public.etsy_ledger_entries le where le.org_id = o.id), 0) as sum_amount_cents,
  (select le.balance_cents from public.etsy_ledger_entries le where le.org_id = o.id
    order by le.entry_date desc nulls last, le.entry_id desc limit 1) as last_balance_cents,
  coalesce((select sum(le.amount_cents) from public.etsy_ledger_entries le where le.org_id = o.id), 0)
   - coalesce((select le.balance_cents from public.etsy_ledger_entries le where le.org_id = o.id
       order by le.entry_date desc nulls last, le.entry_id desc limit 1), 0) as integrity_diff_cents,
  (select count(*) from public.etsy_ledger_entries le where le.org_id = o.id) as rows
from public.organizations o order by o.name;

-- NAK-01 Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | kaynak PAY-14 | kontrol: öneri: payout_unmatched | ölçüm 2026-11-08: Hatasız: payouts_90d 39, payout_cents_90d 4.802.348, left_zero 16, avg_residual_cents 70.534, max_residual_cents 250.133, residual_over_20pct 19 (Jade). amended_control_sql: hold_signal_90d tüm org'larda 0; hold_signal_365d Jade 12 (338.954 cent, son 2026-05-17), diğer org'lar 0; payouts_90d Artifact 1, EON 24, Jade 39, Ophir 5, Seselka 0.
-- beklenen: hold_signal_90d = 0. Ledger bakiyesi artı iken Etsy'nin karttan RECOUP çekmesi, kullanılabilir bakiyenin ledger bakiyesinden düşük olduğunu (bekletilen fon) gösterir; API rezerv vermediği için tek dolaylı sinyal budur; ölçülen 2026-11-08 Jade: 90 gün 0, 365 gün 12 / 338.954
select o.name,
  count(le.*) filter (where le.ledger_type = 'DISBURSE2' and le.entry_date >= now() - interval '90 days') payouts_90d,
  count(le.*) filter (where le.ledger_type = 'RECOUP' and le.balance_cents - le.amount_cents >= 0 and le.entry_date >= now() - interval '90 days') hold_signal_90d,
  count(le.*) filter (where le.ledger_type = 'RECOUP' and le.balance_cents - le.amount_cents >= 0 and le.entry_date >= now() - interval '365 days') hold_signal_365d,
  coalesce(sum(le.amount_cents) filter (where le.ledger_type = 'RECOUP' and le.balance_cents - le.amount_cents >= 0 and le.entry_date >= now() - interval '365 days'), 0) hold_signal_cents_365d,
  max(le.entry_date) filter (where le.ledger_type = 'RECOUP' and le.balance_cents - le.amount_cents >= 0) last_hold_signal
from organizations o
left join etsy_ledger_entries le on le.org_id = o.id and le.ledger_type in ('DISBURSE2', 'RECOUP')
group by o.name
order by o.name;

-- NAK-02 Ay kapanışı: dönem kilidi, düzeltme kaydı, iadenin raporlandığı ay ve raporlama esası | kaynak PAY-15 | kontrol: öneri: closed_period_drift | ölçüm 2026-11-08: Orijinal hatasız: sales_restated_30d 637, costs_backdated_30d 1.685, costs_backdated_cents_30d 1.227.726 (Jade). amended_control_sql (audit_log farkı): closed_sales_updates 1.105, closed_sales_fin_changed 238, refund_delta_cents 50.193, fee_delta_cents 151.771, closed_cost_net_delta_cents 1.227.726, cost_sources shipstation:insert.
-- beklenen: kapanmış aylarda (bir önceki aydan eski) closed_sales_fin_changed = 0 ve closed_cost_net_delta_cents = 0, ya da journal_adjustments ile açıklanmış; ölçülen 2026-11-08 Jade: 238 sipariş, ücret 151.771, iade 50.193, maliyet 1.227.726 (shipstation:insert)
with b as (select (date_trunc('month', now()) - interval '1 month') as boundary),
s as (
  select a.entity_id,
    (a.diff->'after'->>'order_date')::timestamptz od,
    (a.diff->'before'->>'refunded_cents')::bigint rb, (a.diff->'after'->>'refunded_cents')::bigint ra,
    (a.diff->'before'->>'etsy_fees_cents')::bigint fb, (a.diff->'after'->>'etsy_fees_cents')::bigint fa,
    (a.diff->'before'->>'grand_total_cents')::bigint gb, (a.diff->'after'->>'grand_total_cents')::bigint ga,
    a.diff->'before'->>'status' sb, a.diff->'after'->>'status' sa
  from audit_log a
  where a.org_id = (select id from organizations where name = 'Jade Gold NYC') and a.entity_type = 'sales' and a.action = 'update'
    and a.created_at >= now() - interval '30 days'),
c as (
  select a.action, (coalesce(a.diff->'after', a.diff->'before')->>'cost_date')::date cd,
    (coalesce(a.diff->'after', a.diff->'before')->>'amount_cents')::bigint amt,
    coalesce(a.diff->'after', a.diff->'before')->>'source' src
  from audit_log a
  where a.org_id = (select id from organizations where name = 'Jade Gold NYC') and a.entity_type = 'costs' and a.action in ('insert', 'delete')
    and a.created_at >= now() - interval '30 days')
select
 (select count(*) from s, b where s.od < b.boundary) closed_sales_updates,
 (select count(distinct entity_id) from s, b where s.od < b.boundary
    and (s.rb is distinct from s.ra or s.fb is distinct from s.fa or s.gb is distinct from s.ga or s.sb is distinct from s.sa)) closed_sales_fin_changed,
 (select coalesce(sum(coalesce(s.ra, 0) - coalesce(s.rb, 0)), 0) from s, b where s.od < b.boundary) refund_delta_cents,
 (select coalesce(sum(coalesce(s.fa, 0) - coalesce(s.fb, 0)), 0) from s, b where s.od < b.boundary) fee_delta_cents,
 (select coalesce(sum(case when c.action = 'insert' then c.amt else -c.amt end), 0) from c, b where c.cd < b.boundary::date) closed_cost_net_delta_cents,
 (select string_agg(distinct c.src || ':' || c.action, ',') from c, b where c.cd < b.boundary::date) cost_sources;

-- NAK-02 Ay kapanışı: dönem kilidi, düzeltme kaydı, iadenin raporlandığı ay ve raporlama esası | kaynak REF-11 | kontrol: öneri: closed_period_drift | ölçüm 2026-11-08: Verilen SQL (UTC ay): 2026-10 Jade ledger 647.632, panel 0, fark 647.632. Düzeltilmiş SQL (NY ayı, org bazlı): 2026-10 Artifact 88.320 / 88.320 / 0; EON 205.519 / 63.929 / 141.590; Jade 607.229 / 0 / 607.229; Ophir 73.710 / 73.710 / 0; Seselka 0.
-- Önceki takvim ayı (America/New_York): beklenen her org için |diff_cents| <= ledger_cents / 100.
-- Bugün (2026-11-08) 2026-10: Jade 607.229 / 0; EON 205.519 / 63.929; Ophir ve Artifact fark 0; Seselka 0.
with m as (
  select date_trunc('month', (now() at time zone 'America/New_York') - interval '1 month') at time zone 'America/New_York' as m0,
         date_trunc('month', now() at time zone 'America/New_York') at time zone 'America/New_York' as m1
)
select o.id as org_id, o.name,
       to_char(m.m0 at time zone 'America/New_York', 'YYYY-MM') as month,
       x.ledger_cents, x.panel_cents, x.ledger_cents - x.panel_cents as diff_cents
from public.organizations o
cross join m
cross join lateral (
  select
    coalesce((select sum(-le.amount_cents) from public.etsy_ledger_entries le
              where le.org_id = o.id and le.ledger_type in ('REFUND_GROSS', 'REFUND_REVERSAL_GROSS')
                and le.entry_date >= m.m0 and le.entry_date < m.m1), 0) as ledger_cents,
    coalesce((select sum(r.amount_cents) from public.sale_refunds r
              where r.org_id = o.id and r.refunded_at >= m.m0 and r.refunded_at < m.m1), 0) as panel_cents
) x
order by o.name;

-- NAK-03 Yıl sonu muhasebeci paketi: vergi formu satır eşlemesi, 1099-K köprüsü ve XLSX üzerinden Numbers teslimi | kaynak EK-04 | kontrol: öneri: tax_package_unreconciled | ölçüm 2026-11-08: ölçülmedi
-- EK-04 kontrol: vergi yılı paketinin ledger kimliği (yıl 2025, NY takvimi; başka yıl için yr CTE'sini değiştir).
-- Beklenen: paket kurulduktan sonra diff_cents yalnız açıklanmış köprü kalemleri (yıl sınırını geçen iade,
-- tahsil edilip iptal edilen sipariş) kadar, cogs_on_cancelled_cents = 0.
-- Bugün (2026-11-09) Jade 2025: satır 3 38.084.396 cent, /raporlar geliri 42.040.412, diff 3.956.016,
-- iptal COGS 14.227.385; diğer org'larda 2025 verisi yok.
with yr as (select timestamptz '2025-01-01 00:00 America/New_York' as y0,
                   timestamptz '2026-01-01 00:00 America/New_York' as y1),
led as (
  select le.org_id,
    sum(le.amount_cents) filter (where le.ledger_type = 'PAYMENT_GROSS') as payment_gross,
    -sum(le.amount_cents) filter (where le.ledger_type = 'sales_tax') as tax_collected,
    sum(le.amount_cents) filter (where le.ledger_type = 'sales_tax_refund') as tax_refunded,
    -sum(le.amount_cents) filter (where le.ledger_type in ('REFUND_GROSS','REFUND_REVERSAL_GROSS')) as refunds_gross,
    -sum(le.amount_cents) filter (where k.accounting_class = 'reklam') as advertising,
    -sum(le.amount_cents) filter (where k.accounting_class = 'ucret') as fees,
    sum(le.amount_cents) filter (where k.accounting_class = 'kredi') as credits
  from public.etsy_ledger_entries le
  join public.organizations o on o.id = le.org_id
  left join public.etsy_ledger_type_classes k on k.ledger_type = le.ledger_type
  cross join yr
  where le.entry_date >= yr.y0 and le.entry_date < yr.y1
  group by le.org_id
),
pnl as (
  select s.org_id,
    sum(s.grand_total_cents) filter (where s.status <> 'cancelled') as panel_report_revenue
  from public.sales s cross join yr
  where s.order_date >= yr.y0 and s.order_date < yr.y1
  group by s.org_id
),
cg as (
  select c.org_id,
    sum(c.amount_cents) as cogs_all,
    sum(c.amount_cents) filter (where s.status = 'cancelled') as cogs_on_cancelled
  from public.costs c
  left join public.sales s on s.id = c.sale_id
  where c.cost_date >= '2025-01-01' and c.cost_date < '2026-01-01'
    and (c.cost_kind in ('gold','labor','gem','packaging') or c.source in ('gold_auto','invoice'))
  group by c.org_id
)
select o.id as org_id, o.name,
  coalesce(l.payment_gross - l.tax_collected, 0) as schedule_c_line1_cents,
  coalesce(l.refunds_gross - l.tax_refunded, 0) as schedule_c_line2_cents,
  coalesce((l.payment_gross - l.tax_collected) - (l.refunds_gross - l.tax_refunded), 0) as schedule_c_line3_cents,
  coalesce(p.panel_report_revenue, 0) as panel_report_revenue_cents,
  coalesce(p.panel_report_revenue, 0) - coalesce((l.payment_gross - l.tax_collected) - (l.refunds_gross - l.tax_refunded), 0) as diff_cents,
  coalesce(g.cogs_all, 0) as cogs_table_cents,
  coalesce(g.cogs_on_cancelled, 0) as cogs_on_cancelled_cents,
  coalesce(l.advertising, 0) as line8_advertising_cents,
  coalesce(l.fees, 0) - coalesce(l.credits, 0) as line10_fees_net_cents,
  coalesce(l.tax_collected - l.tax_refunded, 0) as info_etsy_remitted_tax_cents
from public.organizations o
left join led l on l.org_id = o.id
left join pnl p on p.org_id = o.id
left join cg g on g.org_id = o.id
order by o.name;

-- ==== 9. Sistem bütünlüğü ve ledger sözlüğü (SIS) ====

-- SIS-01 Aylık ledger özeti sözlüğü okumuyor: having ile düşen ay, eşlenmeyen tür ve bayat özet | kaynak LED-01 | kontrol: canlı: K6 ledger_type_unknown, K7 ledger_cost_drift | ölçüm 2026-11-08: Orijinal (VALUES listeli, Jade, 30 gün): unknown_types 0, unknown_cents 0, hata yok. Düzeltilmiş (canlı sözlük, 5 org): unknown_types_30d ve unknown_cents_30d beş org'da 0 / 0; cost_class_cents_outside_rebuild Jade 440590, EON 7400, Ophir -680, Artifact -1360, Seselka 0.
select o.name, (select count(distinct e.ledger_type) from etsy_ledger_entries e where e.org_id = o.id and e.entry_date >= now() - interval '30 days' and not exists (select 1 from etsy_ledger_type_classes d where d.ledger_type = e.ledger_type)) as unknown_types_30d, (select coalesce(sum(e.amount_cents), 0) from etsy_ledger_entries e where e.org_id = o.id and e.entry_date >= now() - interval '30 days' and not exists (select 1 from etsy_ledger_type_classes d where d.ledger_type = e.ledger_type)) as unknown_cents_30d, (select coalesce(sum(e.amount_cents), 0) from etsy_ledger_entries e join etsy_ledger_type_classes d on d.ledger_type = e.ledger_type where e.org_id = o.id and d.accounting_class in ('ucret', 'reklam', 'kargo', 'abonelik', 'kredi') and not (e.ledger_type ilike 'prolist%' or e.ledger_type ilike 'offsite_ads_fee%' or e.ledger_type ilike 'shipping_label%' or e.ledger_type ilike 'transaction%' or e.ledger_type ilike 'shipping_transaction%' or e.ledger_type ilike '%processing_fee%' or e.ledger_type ilike 'listing%' or e.ledger_type ilike 'renew%' or e.ledger_type ilike 'auto_renew%' or e.ledger_type ilike 'buyer_fee%' or e.ledger_type ilike 'tier_%subscription%')) as cost_class_cents_outside_rebuild from organizations o order by o.name; -- beklenen: her org 0 / 0 / 0 (üçüncü kolon rebuild sözlüğü okuyunca 0 olur); 2026-11-08: ilk iki kolon 5 org'da 0, üçüncü Jade 440590, EON 7400, Ophir -680, Artifact -1360, Seselka 0;

-- SIS-01 Aylık ledger özeti sözlüğü okumuyor: having ile düşen ay, eşlenmeyen tür ve bayat özet | kaynak PAY-11 | kontrol: canlı: K6 ledger_type_unknown, K7 ledger_cost_drift | ölçüm 2026-11-08: Orijinal hatasız: dropped_months 2, dropped_net_cents 1.008, unmapped_types 6, unmapped_rows 936 (Jade). amended_control_sql (sözlük tabanlı, tüm org): Artifact 1 / 570 / seller_onboarding_fee 2.900 / kredi 1.540; EON 0 / 0 / seller_onboarding_fee 2.900 / 10.300; Jade 2 / 1.008 / yok / 440.590; Ophir 0 / 0 / seller_onboarding_fee 2.900 / 2.220; Seselka 0 / 0 / yok / 0.
-- beklenen: dropped_months = 0, unmapped_expense_cents = 0 (sözlükte gider sınıfı olup rebuild eşlemesinde olmayan tür), credits_outside_costs_cents = 0 (kredi sınıfı maliyete yansıyınca); ölçülen 2026-11-08 Jade: 2 / 1.008 / 0 / 440.590
with m as materialized (
  select le.org_id, le.ledger_type, d.accounting_class, date_trunc('month', le.entry_date)::date mo, le.amount_cents,
    case when le.ledger_type ilike 'prolist%' or le.ledger_type ilike 'offsite_ads_fee%' then 'reklam'
         when le.ledger_type ilike 'shipping_label%' then 'kargo'
         when le.ledger_type ilike 'transaction%' or le.ledger_type ilike 'shipping_transaction%'
           or le.ledger_type ilike '%processing_fee%' or le.ledger_type ilike 'listing%'
           or le.ledger_type ilike 'renew%' or le.ledger_type ilike 'auto_renew%'
           or le.ledger_type ilike 'buyer_fee%' or le.ledger_type ilike 'tier_%subscription%' then 'etsy_ucretleri' end cat
  from etsy_ledger_entries le
  join etsy_ledger_type_classes d on d.ledger_type = le.ledger_type
  where le.entry_date is not null and le.amount_cents is not null
    and not exists (select 1 from costs c where c.org_id = le.org_id and c.external_key = 'ledger:' || le.entry_id)),
agg as (select org_id, cat, mo, sum(amount_cents) s from m where cat is not null group by 1, 2, 3)
select o.name,
  (select count(*) from agg where agg.org_id = o.id and agg.s >= 0) dropped_months,
  (select coalesce(sum(agg.s), 0) from agg where agg.org_id = o.id and agg.s >= 0) dropped_net_credit_cents,
  (select string_agg(distinct m.ledger_type, ',') from m where m.org_id = o.id and m.cat is null and m.accounting_class in ('ucret', 'reklam', 'kargo', 'abonelik')) unmapped_expense_types,
  (select coalesce(-sum(m.amount_cents), 0) from m where m.org_id = o.id and m.cat is null and m.accounting_class in ('ucret', 'reklam', 'kargo', 'abonelik')) unmapped_expense_cents,
  (select coalesce(sum(m.amount_cents), 0) from m where m.org_id = o.id and m.accounting_class = 'kredi') credits_outside_costs_cents
from organizations o
order by o.name;

-- SIS-01 Aylık ledger özeti sözlüğü okumuyor: having ile düşen ay, eşlenmeyen tür ve bayat özet | kaynak REK-08 | kontrol: canlı: K6 ledger_type_unknown, K7 ledger_cost_drift | ölçüm 2026-11-08: Özgün SQL çalıştı (Artifact): mismatched_months 1, diff_cents 2.500, dropped_months 0 (iddiayla aynı). Düzeltilmiş SQL (tüm org'lar, full join): by Artifact Studio Jewelry 1 / 2.500 / 0 (ledger 30.996, costs 28.496, 3 ay); EON 0 / 0 / 0 (6 ay, 178.863 = 178.863); Jade 0 / 0 / 0 (57 ay, 23.131.330 = 23.131.330); Ophir Gold USA 0 / 0 / 0 (4 ay, 36.277); Seselka Home 0.
select o.name, x.*
from organizations o
cross join lateral (
  with l as (
    select date_trunc('month', le.entry_date)::date as m, -sum(le.amount_cents) as ledger_cents
    from etsy_ledger_entries le
    where le.org_id = o.id
      and (le.ledger_type ilike 'prolist%' or le.ledger_type ilike 'offsite_ads_fee%')
      and not exists (select 1 from costs c where c.org_id = o.id and c.external_key = 'ledger:' || le.entry_id)
    group by 1),
  c as (
    select c.cost_date as m, sum(c.amount_cents) as cost_cents
    from costs c join cost_categories cc on cc.id = c.category_id
    where c.org_id = o.id and cc.key = 'reklam' and c.source = 'etsy_ledger' and c.external_key is null
    group by 1)
  select count(*) filter (where coalesce(c.cost_cents, 0) <> coalesce(l.ledger_cents, 0)) as mismatched_months,
         coalesce(sum(coalesce(l.ledger_cents, 0) - coalesce(c.cost_cents, 0)), 0) as diff_cents,
         count(*) filter (where l.ledger_cents <= 0) as dropped_months,
         count(l.m) as ledger_months,
         coalesce(sum(l.ledger_cents), 0) as ledger_total_cents,
         coalesce(sum(c.cost_cents), 0) as cost_total_cents
  from l full join c on c.m = l.m) x
order by o.name
-- beklenen: her org için mismatched_months = 0, diff_cents = 0, dropped_months = 0 (cari ay dahil);

-- SIS-02 Ledger bakiye zinciri ve tazeliği: K1 0179 ile düzeldi, aylık ekstre ikinci kaynak | kaynak PAY-01 | kontrol: canlı: K1 ledger_balance_break, K12 ledger_stale | ölçüm 2026-11-08: Orijinal SQL hatasız: months 57, months_with_gap 0, gap_months null (Jade). amended_control_sql (tüm org, ledger_backfilled): Artifact 3 ay 0 boşluk, EON 16/0, Jade 57/0, Ophir 5/0, Seselka Home 0 ay.
-- beklenen: ledger_backfilled org'larda months_with_gap = 0; açılış bakiyesi 0 (tam geri doldurulmuş ledger mağazanın ilk kaydından başlar); kapanış ayın son saniyesindeki HERHANGİ bir satırla karşılaştırılır, çünkü aynı saniyede entry_id sırası Etsy'nin bakiye sırası değildir; ölçülen 2026-11-08: Jade 57/0, EON 16/0, Ophir 5/0, Artifact 3/0
with e as materialized (
  select le.org_id, date_trunc('month', le.entry_date)::date mo, le.created_timestamp, le.amount_cents, le.balance_cents
  from etsy_ledger_entries le
  join etsy_connection ec on ec.org_id = le.org_id and ec.ledger_backfilled
  where le.amount_cents is not null and le.balance_cents is not null and le.entry_date is not null),
m as (select org_id, mo, sum(amount_cents) flow, max(created_timestamp) last_ts from e group by 1, 2),
cum as (select org_id, mo, last_ts, sum(flow) over (partition by org_id order by mo) closing_from_flow from m),
chk as (
  select c.org_id, c.mo, bool_or(e.balance_cents = c.closing_from_flow) ok
  from cum c join e on e.org_id = c.org_id and e.mo = c.mo and e.created_timestamp = c.last_ts
  group by 1, 2)
select o.name, count(chk.mo) months, count(*) filter (where not chk.ok) months_with_gap,
       string_agg(to_char(chk.mo, 'YYYY-MM'), ',') filter (where not chk.ok) gap_months
from organizations o left join chk on chk.org_id = o.id
group by o.name order by o.name;

-- SIS-02 Ledger bakiye zinciri ve tazeliği: K1 0179 ile düzeldi, aylık ekstre ikinci kaynak | kaynak PAY-13 | kontrol: canlı: K1 ledger_balance_break, K12 ledger_stale | ölçüm 2026-11-08: Hatasız: statement_month 2026-10, ledger_rows 463, amount_total_cents 134.614, net_excluding_listing_fees_cents 136.514, gross_cents 2.680.409, refund_cents -647.632, payout_cents -1.753.328 (Jade, UTC ayı). amended_control_sql: utc_rows 463, utc_amount_cents 134.614, ny_rows 459, ny_amount_cents 170.509.
-- beklenen: ekstre CSV satır sayısı ve Amount toplamı iki saat dilimi adayından BİRİYLE birebir (tolerans 0 cent); ilk içe aktarımda tutan dilim org'a kaydedilir; ölçülen 2026-11-08 Jade Ekim: UTC 463 / 134.614, New York 459 / 170.509
with b as (select date_trunc('month', now()) - interval '1 month' m0, date_trunc('month', now()) m1)
select to_char((select m0 from b), 'YYYY-MM') statement_month,
  count(*) filter (where le.entry_date >= b.m0 and le.entry_date < b.m1) utc_rows,
  coalesce(sum(le.amount_cents) filter (where le.entry_date >= b.m0 and le.entry_date < b.m1), 0) utc_amount_cents,
  count(*) filter (where (le.entry_date at time zone 'America/New_York') >= b.m0::timestamp
                     and (le.entry_date at time zone 'America/New_York') < b.m1::timestamp) ny_rows,
  coalesce(sum(le.amount_cents) filter (where (le.entry_date at time zone 'America/New_York') >= b.m0::timestamp
                     and (le.entry_date at time zone 'America/New_York') < b.m1::timestamp), 0) ny_amount_cents
from etsy_ledger_entries le cross join b
where le.org_id = (select id from organizations where name = 'Jade Gold NYC')
  and le.entry_date >= (select m0 from b) - interval '1 day' and le.entry_date < (select m1 from b) + interval '1 day';

-- SIS-03 Finansal denetim izi: 90 günlük saklama kararı, silinen iz ve audit trigger'sız finansal ayar tabloları | kaynak EK-05 | kontrol: öneri: audit_trail_gap | ölçüm 2026-11-08: ölçülmedi
-- EK-05 kontrol: finansal denetim izi kapsamı ve sürekliliği.
-- Beklenen: missing_trigger_tables = 0 ve fin_audit_oldest haftadan haftaya ileri kaymaz (finansal iz silinmez).
-- Bugün (2026-11-09): 5 finansal tabloda trigger yok; Jade finansal izi 2026-08-05'te başlıyor (ilk sipariş 2022-03-25).
with fin_tables(t) as (values ('sales'),('sale_items'),('costs'),('sale_refunds'),('sale_shipments'),
                              ('organizations'),('pricing_config'),('cost_categories')),
trig as (
  select ft.t,
         exists (select 1 from pg_trigger tg
                 join pg_class c on c.oid = tg.tgrelid
                 join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
                 join pg_proc p on p.oid = tg.tgfoid
                 where c.relname = ft.t and not tg.tgisinternal and p.proname = 'audit_trigger') as has_audit
  from fin_tables ft
),
miss as (
  select count(*) filter (where not has_audit) as n,
         string_agg(t, ',' order by t) filter (where not has_audit) as names
  from trig
)
select o.id as org_id, o.name,
  (select min(s.order_date)::date from public.sales s where s.org_id = o.id) as first_order,
  (select min(a.created_at)::date from public.audit_log a
    where a.org_id = o.id and a.entity_type in ('sales','sale_items','costs','sale_refunds','sale_shipments')) as fin_audit_oldest,
  (select count(*) from public.audit_log a
    where a.org_id = o.id and a.entity_type in ('sales','sale_items','costs','sale_refunds','sale_shipments')) as fin_audit_rows,
  (select count(*) from public.audit_log a
    where a.org_id = o.id and a.entity_type in ('sales','sale_items','costs')
      and a.created_at < now() - interval '90 days') as fin_rows_older_90d,
  m.n as missing_trigger_tables,
  m.names as missing_tables
from public.organizations o cross join miss m
order by o.name;

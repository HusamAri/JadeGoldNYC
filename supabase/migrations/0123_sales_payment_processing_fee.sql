-- 0123 — sipariş başına GERÇEK Etsy ücretini tamamla: ödeme işleme ücreti + iade mahsubu
-- ---------------------------------------------------------------------------
-- 0040 bilerek yalnız `transaction` + `offsite_ads_fee` kalemlerini yazıyordu ve
-- PAYMENT_PROCESSING_FEE'yi "receipt'e temiz eşlenmiyor" gerekçesiyle dışarıda
-- bırakıyordu. Faz 0 ölçümü bunun BEDELİNİ gösterdi: EON'da panel $91,55 ücret
-- gösterirken gerçek (işlem + işleme) $137,78 — ücret %33,6 EKSİK, dolayısıyla
-- net kâr sistematik olarak ŞİŞKİN raporlanıyordu.
--
-- Eksik parça bir eşleme anahtarıydı: PAYMENT_PROCESSING_FEE satırının
-- reference_id'si receipt değil `shop_payment_id`. Etsy bu bağı resmî olarak
-- getShopPaymentByReceiptId ucunda veriyor (Payment.receipt_id + payment_id) —
-- uç repoda hiç tanımlı değildi. Artık tanımlı (lib/etsy/payments.ts) ve
-- eşleme `sales.etsy_payment_id` kolonunda kalıcı tutuluyor.
--
-- Ayrıca iade mahsubu eklendi: ledger ücreti sadece kesmiyor, iade olunca GERİ
-- de çeviriyor (canlı vaka: receipt 4123975168 tam iade → transaction_refund
-- +569, REFUND_PROCESSING_FEE +305, net ücret 0). Bu satırlar toplama dahil
-- edilmezse iade edilmiş siparişte ücret olduğundan yüksek görünür.
--
-- İşaret düzeni: ledger'da ücret NEGATİF, ücret iadesi POZİTİF tutar taşır.
-- Toplamda `-amount_cents` alındığı için iade kalemleri kendiliğinden düşer.

alter table public.sales
  add column if not exists etsy_payment_id bigint;

comment on column public.sales.etsy_payment_id is
  'Etsy shop_payment_id (getShopPaymentByReceiptId). PAYMENT_PROCESSING_FEE ledger satırlarını siparişe bağlayan tek temiz anahtar.';

create index if not exists sales_etsy_payment_id_idx
  on public.sales (org_id, etsy_payment_id)
  where etsy_payment_id is not null;

create or replace function public.rebuild_sales_etsy_fees(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with
  -- 1) İşlem ücreti (%6,5) ve iadesi — reference_id = sale_items.etsy_transaction_id.
  per_transaction as (
    select si.sale_id, sum(-le.amount_cents) as fee_cents
    from public.etsy_ledger_entries le
    join public.sale_items si
      on si.org_id = p_org_id
     and si.etsy_transaction_id::text = le.reference_id
    where le.org_id = p_org_id
      and le.ledger_type in ('transaction', 'transaction_refund')
      and le.amount_cents is not null
    group by si.sale_id
  ),
  -- 2) Offsite Ads ücreti — doğrudan receipt'e bağlı.
  per_receipt_ads as (
    select s.id as sale_id, sum(-le.amount_cents) as fee_cents
    from public.etsy_ledger_entries le
    join public.sales s
      on s.org_id = p_org_id
     and s.etsy_receipt_id::text = le.reference_id
    where le.org_id = p_org_id
      and le.ledger_type = 'offsite_ads_fee'
      and le.reference_type = 'receipt'
      and le.amount_cents is not null
    group by s.id
  ),
  -- 3) YENİ: ödeme işleme ücreti ve iadesi — reference_id = shop_payment_id,
  --    siparişe sales.etsy_payment_id üzerinden bağlanır. Eşleme yoksa satır
  --    toplama GİRMEZ (uydurma yok); o sipariş "işleme ücreti bilinmiyor"
  --    durumundadır ve sales_etsy_fee_coverage görünümünde işaretlenir.
  per_payment_processing as (
    select s.id as sale_id, sum(-le.amount_cents) as fee_cents
    from public.etsy_ledger_entries le
    join public.sales s
      on s.org_id = p_org_id
     and s.etsy_payment_id is not null
     and s.etsy_payment_id::text = le.reference_id
    where le.org_id = p_org_id
      and le.ledger_type in ('PAYMENT_PROCESSING_FEE', 'REFUND_PROCESSING_FEE')
      and le.amount_cents is not null
    group by s.id
  ),
  totals as (
    select sale_id, sum(fee_cents)::integer as fee_cents
    from (
      select * from per_transaction
      union all
      select * from per_receipt_ads
      union all
      select * from per_payment_processing
    ) x
    group by sale_id
  )
  update public.sales s
  set etsy_fees_cents = t.fee_cents
  from totals t
  where s.id = t.sale_id
    and s.org_id = p_org_id
    and s.etsy_fees_cents is distinct from t.fee_cents;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_sales_etsy_fees(uuid) from public, anon;
grant execute on function public.rebuild_sales_etsy_fees(uuid) to authenticated, service_role;

-- KAPSAM ŞEFFAFLIĞI: hangi siparişin ücreti eksiksiz, hangisinde hangi kalem
-- yok — "bilinmeyen maliyet sessizce ikame edilmez" kuralının veri karşılığı.
-- P&L ekranı bu görünümü okuyup eksik kalemi AÇIKÇA "bilinmiyor" gösterir.
create or replace view public.sales_etsy_fee_coverage as
select
  s.id as sale_id,
  s.org_id,
  s.etsy_receipt_id,
  s.etsy_payment_id,
  s.etsy_fees_cents,
  exists (
    select 1 from public.etsy_ledger_entries le
    join public.sale_items si on si.sale_id = s.id and si.org_id = s.org_id
    where le.org_id = s.org_id
      and le.ledger_type = 'transaction'
      and le.reference_id = si.etsy_transaction_id::text
  ) as has_transaction_fee,
  exists (
    select 1 from public.etsy_ledger_entries le
    where le.org_id = s.org_id
      and le.ledger_type in ('PAYMENT_PROCESSING_FEE', 'REFUND_PROCESSING_FEE')
      and s.etsy_payment_id is not null
      and le.reference_id = s.etsy_payment_id::text
  ) as has_processing_fee,
  exists (
    select 1 from public.etsy_ledger_entries le
    where le.org_id = s.org_id
      and le.ledger_type = 'offsite_ads_fee'
      and le.reference_type = 'receipt'
      and le.reference_id = s.etsy_receipt_id::text
  ) as has_offsite_ads_fee
from public.sales s
where s.etsy_receipt_id is not null;

comment on view public.sales_etsy_fee_coverage is
  'Sipariş başına ücret kapsamı: hangi kalem ledger''dan gerçekten geldi. has_processing_fee=false ise o siparişin işleme ücreti BİLİNMİYOR — tahmin edilmez, arayüzde öyle gösterilir.';

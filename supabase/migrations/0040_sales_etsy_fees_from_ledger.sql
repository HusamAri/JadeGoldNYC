-- 0040 — sales.etsy_fees_cents'i ledger'dan gerçek per-order ücretle doldur
-- ------------------------------------------------------------------
-- sales.etsy_fees_cents hiç senkron kodunda set edilmiyordu (bkz. Satışlar
-- denetimi) — 10.799 siparişin tamamında 0, "Net (ücret sonrası)" hep
-- Genel Toplam'a eşitti. Etsy Receipts API per-sipariş ücret döndürmüyor,
-- ama ledger entry'leri güvenilir şekilde eşleşiyor:
--   - ledger_type='transaction' → reference_id = sale_items.etsy_transaction_id
--     (asıl Etsy işlem/listing ücreti — en büyük kalem)
--   - ledger_type='offsite_ads_fee' AND reference_type='receipt' →
--     reference_id = sales.etsy_receipt_id (yalnız Offsite Ads satışında oluşur)
-- Kapsam DIŞI (bilerek): PAYMENT_PROCESSING_FEE — reference_id bir receipt/
-- transaction'a temiz eşlenmiyor (ödeme toplu işlenmiş olabilir); bu ücret
-- toplam bazda rebuild_etsy_ledger_costs ile costs'ta izlenmeye devam eder.
-- Bu yüzden burada yazılan tutar "gerçek ama eksiksiz değil" — kısmi kapsam
-- olduğu koddaki yorumla belgelenir.

create or replace function public.rebuild_sales_etsy_fees(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with per_transaction as (
    select si.sale_id, sum(-le.amount_cents) as fee_cents
    from public.etsy_ledger_entries le
    join public.sale_items si
      on si.org_id = p_org_id
     and si.etsy_transaction_id::text = le.reference_id
    where le.org_id = p_org_id
      and le.ledger_type = 'transaction'
      and le.amount_cents is not null
    group by si.sale_id
  ),
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
  totals as (
    select sale_id, sum(fee_cents)::integer as fee_cents
    from (
      select * from per_transaction
      union all
      select * from per_receipt_ads
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

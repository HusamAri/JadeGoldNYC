-- 0125 — 0123'ün açtığı iki tenant-izolasyon deliğini kapat
-- ---------------------------------------------------------------------------
-- 0123 yazılırken ücret mantığı doğruydu ama iki yetki ayrıntısı gözden kaçtı;
-- ikisi de çok-org kurulumda BAŞKA organizasyonun verisini erişilebilir yapıyor.
--
-- (1) `rebuild_sales_etsy_fees` GRANT'i geri gelmişti.
--     0040 fonksiyonu `authenticated`'a açmıştı; `0058_security_hardening`
--     bunu BİLEREK geri almıştı: fonksiyon SECURITY DEFINER ve `p_org_id`'yi
--     hiç doğrulamıyor — çağıran o org'un üyesi mi diye bakmıyor, RLS'i de
--     atlıyor. Başka bir org'un UUID'sini ele geçiren herhangi bir oturumlu
--     kullanıcı o org'un `sales` satırlarını yeniden yazdırabilirdi.
--     0123 `create or replace` ile birlikte 0040'ın GRANT satırını da
--     kopyaladığı için 0058'in sertleştirmesi sessizce geri alınmıştı.
--     Tek çağıran zaten service-role admin istemcisi (lib/etsy/sync.ts) —
--     `authenticated`'ın bu fonksiyona erişmesi hiçbir akışta gerekmiyor.
--
-- (2) `sales_etsy_fee_coverage` görünümü RLS'i atlıyordu.
--     PostgreSQL'de view varsayılan olarak SAHİBİNİN haklarıyla çalışır.
--     Bu repoda migration'lar `supabase_admin` ile uygulanıyor (bkz. AGENTS.md)
--     ve Supabase varsayılan yetkileri o sahibin nesnelerine `authenticated`
--     SELECT'i bağlıyor → görünüm üzerinden HER organizasyonun ücret/ödeme
--     kapsamı okunabilir hâle gelmişti; alttaki `sales` RLS'i devreye girmiyordu.
--     `security_invoker = on` ile görünüm ÇAĞIRANIN haklarıyla çalışır ve
--     `sales` / `sale_items` / `etsy_ledger_entries` politikaları uygulanır
--     (0076 ve 0077'de kurulan desenin aynısı).

revoke execute on function public.rebuild_sales_etsy_fees(uuid) from authenticated;

create or replace view public.sales_etsy_fee_coverage
with (security_invoker = on) as
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
  'Sipariş başına ücret kapsamı: hangi kalem ledger''dan gerçekten geldi. has_processing_fee=false ise o siparişin işleme ücreti BİLİNMİYOR — tahmin edilmez, arayüzde öyle gösterilir. security_invoker=on: satırlar çağıranın org RLS''ine göre filtrelenir.';

-- 0147 — sipariş↔ödeme eşlemesine İLERLEME KAYDI: sales.etsy_payment_checked_at
-- ---------------------------------------------------------------------------
-- Neden: "Etsy'den her şeyi çek" panelde sonsuza dek takılı kalıyordu.
--
-- Kök neden: `syncReceiptPayments` (lib/etsy/payments.ts) yalnız
-- `etsy_payment_id IS NULL` satırlarını seçiyor ve satırı ANCAK Etsy bir ödeme
-- döndürürse dolduruyordu. Etsy o sipariş için ödeme döndürmezse (`empty` —
-- çok eski sipariş, iptal, ledger kapsamı dışı) ya da çağrı hata verirse satır
-- NULL kalıyordu. Sonraki dilim AYNI satırları seçiyor, yine çözemiyor ve
-- `remaining: true` dönüyordu; senkron fazı `payments`ta çakılıyor, istemcinin
-- `for(;;)` domino döngüsü hiç bitmiyordu.
--
-- Ölçüm (2026-08-20): Jade Gold NYC'de 10.869 Etsy siparişinin 10.474'ü
-- eşlenmemiş; senkron 2026-08-05'ten beri `running`/`payments`, son ilerleme
-- 08-16 ve 15 günde yalnız 395 eşleşme. EON'da 12/12 eşli olduğu için aynı
-- akış 11 saniyede bitiyor — yani hata veriye bağlıydı, koda değil, ve küçük
-- org'da hiç görünmüyordu.
--
-- Çözüm: her DENENEN satıra zaman damgası basılır. Sorgu "hiç denenmemiş ya da
-- N günden eski denenmiş" satırları seçer; böylece çözülemeyen satır bir sonraki
-- turda tekrar seçilmez ve faz İLERLEMEK ZORUNDA kalır. Damga `etsy_payment_id`
-- yerine ayrı kolonda tutulur çünkü o kolon gerçek Etsy kimliğidir — "denendi
-- ama bulunamadı"yı oraya yazmak veriyi kirletirdi.
--
-- Tazelik penceresi (7 gün) koda gömülüdür: yeni sipariş birkaç gün sonra
-- ödeme kaydı oluşturabilir, kalıcı olarak dışlamak yanlış olurdu.

alter table public.sales
  add column if not exists etsy_payment_checked_at timestamptz;

comment on column public.sales.etsy_payment_checked_at is
  'Sipariş↔ödeme eşlemesinin en son DENENDİĞİ an (başarılı/boş/hata fark etmez). '
  'Eşleme kuyruğunun ilerlemesini garanti eder: çözülemeyen satır tazelik '
  'penceresi dolana kadar yeniden denenmez. Bkz. lib/etsy/payments.ts.';

-- Kuyruk sorgusunun taradığı küme: eşlenmemiş Etsy siparişleri, en eski
-- denemeden başlayarak. Kısmi indeks — eşlenmiş satırlar (çoğunluk olacak)
-- indekse hiç girmez.
create index if not exists sales_payment_queue_idx
  on public.sales (org_id, etsy_payment_checked_at nulls first)
  where etsy_payment_id is null and etsy_receipt_id is not null;

-- 0098 — competitor_watch şirket-hafızası (audit) triggerı
--
-- Denetim bulgusu: 0091'de eklenen competitor_watch tablosu audit_trigger'a
-- bağlanmamış — rakip seti create/update/delete'leri audit_log'a hiç düşmüyor,
-- oysa sales/costs/products/... hepsi düşüyor (0011 deseni). Sabit comp-set
-- kararları (hangi rakip ne zaman eklendi/çıkarıldı) şirket hafızasında iz
-- bırakmalı. competitor_prices audit'e girmez: yüksek-hacimli fiyat zaman
-- serisi (cron her koşumda satır yazar) — audit_log'u boğar, kasıt bu.

create trigger audit
  after insert or update or delete on public.competitor_watch
  for each row execute function public.audit_trigger();

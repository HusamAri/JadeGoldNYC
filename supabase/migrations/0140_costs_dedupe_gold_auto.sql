-- 0140 — costs: fatura varken gold_auto satırı kalmasın (çift COGS kuralı).
-- ---------------------------------------------------------------------------
-- 13 Ağustos denetimi (docs/eon/strategy/2026-08-13-eon-etsy-denetim.md §2.1):
-- 9 siparişte COGS iki kez yazılıydı — 'invoice' (Tamsan faturası, 0135
-- backfill'i) + 'gold_auto' (Altın Tedarik modeli). Panel toplamı ~$1.761
-- hayalet maliyet taşıyordu.
--
-- Canlıda temizlik 2026-08-13'te uygulandı (16 satır, $1.506,62 — audit_log'da
-- delete kayıtları duruyor; kalan 2 gold_auto satırı fatura BEKLEYEN #1
-- siparişin modeli, bilerek tutuluyor). Bu migration kuralı kalıcılaştırır:
-- idempotent, canlıda yeniden koşmak 0 satır siler; taze provizyonda ve
-- gelecekte fatura girildiği halde gold_auto artığı kalmış her durumda aynı
-- temizliği uygular.
--
-- Üretici (lib/gold-cost-entry.ts) 0135'ten beri idempotens kontrolünde iki
-- kaynağa ('gold_auto','invoice') baktığı için silinen satır yeniden üretilmez.

delete from public.costs g
where g.source = 'gold_auto'
  and (
    (g.sale_item_id is not null and exists (
      select 1 from public.costs i
      where i.source = 'invoice'
        and i.sale_item_id = g.sale_item_id
    ))
    or
    (g.sale_item_id is null and g.sale_id is not null and exists (
      select 1 from public.costs i
      where i.source = 'invoice'
        and i.sale_id = g.sale_id
    ))
  );

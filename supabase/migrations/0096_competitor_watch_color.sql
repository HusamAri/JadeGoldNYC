-- 0096 — competitor_watch renk etiketi (manuel comp-set görselleştirme)
--
-- Kullanıcı elle eklediği rakip listingleri panelde RENK-KODLU görmek istiyor:
-- her rakip shop kendi rengini taşır, varyant-matris karşılaştırmasında (senin
-- width×size varyantın vs rakibin aynı width×size'ı) hangi hücrenin hangi rakibe
-- ait olduğu renkle ayrışır. Renk yoksa UI otomatik palet-döngüsüne düşer.
--
-- Kapasite (ürün başına ≤10 rakip) uygulama katmanında (addCompetitorToSet)
-- zorlanır — sabit comp-set STR yaklaşımı; keyword_research organik top-10 ayrı.

alter table public.competitor_watch
  add column if not exists color text;

comment on column public.competitor_watch.color is
  'Rakip için hex renk (#RRGGBB); panelde varyant-matris karşılaştırmasında ayrıştırma. null = otomatik palet.';

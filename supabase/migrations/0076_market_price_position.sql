-- 0076 — Pazar fiyat konumu: keyword_research'e gram-bazlı kıyas + panel uyarı görünümü.
-- Günlük pazar araştırması rutini altın takı fiyatını $/gram normalize edip
-- melt (eritme) tabanı + rakip bandına göre konum yazar; panel ana sayfası
-- bu görünümden "pahalı kaldı / çok ucuz" uyarıları üretir.

alter table public.keyword_research
  add column if not exists our_per_gram_cents integer,
  add column if not exists market_low_per_gram_cents integer,
  add column if not exists market_avg_per_gram_cents integer,
  add column if not exists market_high_per_gram_cents integer,
  add column if not exists melt_per_gram_cents integer,
  add column if not exists price_position text,
  add column if not exists deviation_pct numeric,
  add column if not exists confidence text,
  add column if not exists recommendation text;

alter table public.keyword_research
  drop constraint if exists keyword_research_price_position_check;
alter table public.keyword_research
  add constraint keyword_research_price_position_check
  check (price_position is null or price_position in ('pahali','ucuz','bantta','belirsiz'));

alter table public.keyword_research
  drop constraint if exists keyword_research_confidence_check;
alter table public.keyword_research
  add constraint keyword_research_confidence_check
  check (confidence is null or confidence in ('yuksek','orta','dusuk'));

-- Ürün başına EN GÜNCEL araştırma + ürün meta bilgisi.
-- security_invoker: RLS çağıran kullanıcının yetkisiyle uygulanır
-- (keyword_research/products select policy'leri devreye girer).
create or replace view public.market_price_alerts
with (security_invoker = on) as
select distinct on (kr.product_id)
  kr.org_id,
  kr.product_id,
  p.etsy_listing_id,
  p.title,
  p.status,
  kr.researched_at,
  kr.keyword,
  kr.result_count,
  kr.our_price_cents,
  kr.our_per_gram_cents,
  kr.market_low_per_gram_cents,
  kr.market_avg_per_gram_cents,
  kr.market_high_per_gram_cents,
  kr.melt_per_gram_cents,
  kr.price_position,
  kr.deviation_pct,
  kr.confidence,
  kr.recommendation
from public.keyword_research kr
join public.products p on p.id = kr.product_id
order by kr.product_id, kr.researched_at desc;

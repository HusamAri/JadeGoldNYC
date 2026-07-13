-- 0077 — Pazar fiyat uyarılarına verilen KARARLAR.
-- Kullanıcı bir uyarıyı panelden yönetir: ya önerilen fiyatı uygular
-- (fiyat güncellenir) ya da gerekçeyle reddeder (tedarik problemi, maliyet
-- altı, marka primi, yanlış rakip, geçici...). Karar + sonraki aksiyon önerisi
-- burada saklanır; karar verilmiş (en güncel araştırmaya ait) uyarı ana panelde
-- tekrar gösterilmez.

-- Motorun hesapladığı ÖNERİLEN TAM FİYAT (uygula butonu bunu kullanır).
alter table public.keyword_research
  add column if not exists suggested_price_cents integer;

create table if not exists public.market_price_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  -- hangi araştırma anlık görüntüsüne cevaben (en güncel uyarı)
  research_id uuid references public.keyword_research(id) on delete set null,
  decision text not null check (decision in ('applied', 'rejected')),
  -- uyarının o anki önerdiği fiyat + gerçekte uygulanan (applied)
  suggested_price_cents integer,
  applied_price_cents integer,
  -- reddetme gerekçesi (senaryolar)
  reject_reason text check (reject_reason in
    ('tedarik', 'maliyet_alti', 'marka_primi', 'yanlis_rakip', 'gecici', 'diger')),
  note text,
  -- karara göre üretilen "sıradaki aksiyon" önerisi
  next_action text,
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists market_price_decisions_product_idx
  on public.market_price_decisions (org_id, product_id, created_at desc);
create index if not exists market_price_decisions_research_idx
  on public.market_price_decisions (research_id);

alter table public.market_price_decisions enable row level security;

create policy "mpd_select" on public.market_price_decisions
  for select to authenticated
  using (org_id = public.current_org_id());
create policy "mpd_insert" on public.market_price_decisions
  for insert to authenticated
  with check (org_id = public.current_org_id());

-- Ürün başına EN GÜNCEL karar (uyarı kartında "uygulandı/reddedildi" durumu).
create or replace view public.latest_market_decision
with (security_invoker = on) as
select distinct on (product_id)
  product_id, org_id, research_id, decision, applied_price_cents,
  reject_reason, next_action, created_at
from public.market_price_decisions
order by product_id, created_at desc;

-- 0074 — Rekabet fiyat araştırması (keyword research)
-- Her listing için "araştırma kelimesi"nde Etsy'de organik çıkan ilk ~10 rakip
-- ürünün fiyat analizi. Listingler 7 gruba bölünür (research_group 0..6); günlük
-- cron bir grubu işler → her listing 7 günde bir tazelenir.
--
-- Anahtar kelime kaynağı: products.research_keyword (elle/CSV override — "en çok
-- tıklanan" kelime Etsy Stats'tan buraya girilir). Boşsa birincil tag (tags[1])
-- otomatik tohum olarak kullanılır (Etsy API arama-terimi istatistiği vermiyor).

alter table public.products
  add column if not exists research_group smallint,
  add column if not exists research_keyword text;

-- Deterministik grup: id hash % 7. 7 hex hane = 28 bit → bit(28)::int daima
-- ≥0 (negatif modülo riski yok). Mevcut satırları backfill'le.
update public.products
  set research_group =
    (('x' || substr(md5(id::text), 1, 7))::bit(28)::int % 7)::smallint
  where research_group is null;

-- Yeni listing eklendiğinde grubu otomatik ata.
create or replace function public.assign_research_group()
returns trigger language plpgsql as $$
begin
  if new.research_group is null then
    new.research_group :=
      (('x' || substr(md5(new.id::text), 1, 7))::bit(28)::int % 7)::smallint;
  end if;
  return new;
end $$;

drop trigger if exists trg_assign_research_group on public.products;
create trigger trg_assign_research_group
  before insert on public.products
  for each row execute function public.assign_research_group();

-- Araştırma anlık görüntüleri (listing başına tarih serisi; en güncel = son satır).
create table if not exists public.keyword_research (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  keyword text not null,
  researched_at timestamptz not null default now(),
  our_price_cents integer,             -- araştırma anındaki bizim fiyat
  currency text not null default 'USD',
  result_count smallint not null default 0,
  min_cents integer,
  max_cents integer,
  avg_cents integer,
  median_cents integer,
  our_rank_pct numeric,                -- bizim fiyatın rakip bandındaki konumu:
                                       -- 0 = en ucuz, 1 = en pahalı (bizden ucuz oranı)
  results jsonb not null default '[]'::jsonb,  -- [{title, price_cents, currency, shop, url, position}]
  created_at timestamptz not null default now()
);
create index if not exists keyword_research_latest_idx
  on public.keyword_research (org_id, product_id, researched_at desc);

-- RLS: org üyeleri okur; yazma yalnız service-role (cron) — insert/update policy yok.
alter table public.keyword_research enable row level security;
create policy "keyword_research_select" on public.keyword_research
  for select to authenticated
  using (org_id = public.current_org_id());

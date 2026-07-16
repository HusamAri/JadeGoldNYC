-- 0091 — Rakip seti (STR tarzı sabit comp-set) + yapılandırılmış fiyat hükmü.
-- ------------------------------------------------------------------
-- 1) competitor_watch / competitor_prices: kullanıcı belirlediği rakip
--    listinglerini bir ürüne SABİTLER; günlük cron fiyatlarını public
--    getListing ile çekip tarih serisi olarak yazar. Araştırma motoru taze
--    (48 saat) ≥3 kayıt bulursa fiyat bandını organik arama yerine bu setten
--    kurar (band_source='rakip-seti').
-- 2) keyword_research: öneri metni 3 parçaya ayrılır (what/why/action —
--    insancıl metin dersi), hangi fiyat/ağırlık temeli kullanıldı (basis_note),
--    fiziksel-mantık guard'ı sonucu (data_suspect) ve bandın kaynağı
--    (band_source) kaydedilir. `recommendation` tek-metin alanı geriye dönük
--    dolmaya devam eder.

-- ── keyword_research ek kolonları ────────────────────────────────────
alter table public.keyword_research
  add column if not exists verdict_what text,
  add column if not exists verdict_why text,
  add column if not exists verdict_action text,
  add column if not exists basis_note text,
  add column if not exists data_suspect boolean not null default false,
  add column if not exists band_source text;

alter table public.keyword_research
  drop constraint if exists keyword_research_band_source_check;
alter table public.keyword_research
  add constraint keyword_research_band_source_check
  check (band_source is null or band_source in ('organik', 'rakip-seti'));

-- ── Rakip seti: izlenen listingler ───────────────────────────────────
create table if not exists public.competitor_watch (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  competitor_listing_id bigint not null,
  shop_name text,
  title text,
  url text,
  note text,
  active boolean not null default true,   -- çıkarma = pasifleme (fiyat tarihi korunur)
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Aynı rakip aynı ürüne iki kez eklenmesin; yeniden ekleme upsert olur.
  unique (org_id, product_id, competitor_listing_id)
);

create index if not exists competitor_watch_product_idx
  on public.competitor_watch (org_id, product_id)
  where active;

-- ── Rakip seti: fiyat tarih serisi ───────────────────────────────────
create table if not exists public.competitor_prices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  watch_id uuid not null references public.competitor_watch(id) on delete cascade,
  price_cents integer,                    -- null = fiyat okunamadı (ör. listing kalktı)
  currency text not null default 'USD',
  state text,                             -- Etsy listing durumu ('active', ...) | 'gone' (404)
  captured_at timestamptz not null default now()
);

create index if not exists competitor_prices_watch_idx
  on public.competitor_prices (watch_id, captured_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────
-- competitor_watch: org üyeleri okur/yazar (listing_media deseni).
alter table public.competitor_watch enable row level security;
create policy "competitor_watch_all" on public.competitor_watch
  for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- competitor_prices: org üyeleri okur; yazma yalnız service-role
-- (cron + server action admin istemcisi) — insert/update policy yok.
alter table public.competitor_prices enable row level security;
create policy "competitor_prices_select" on public.competitor_prices
  for select to authenticated
  using (org_id = public.current_org_id());

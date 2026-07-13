-- 0069 — Etsy TAM senkron: API'nin sunduğu ama çekilmeyen her şey.
-- Yeni veri setleri:
--  * etsy_shop_snapshots  — mağaza sağlığı (getShop) GÜNLÜK fotoğraf: takipçi,
--    puan ortalaması/sayısı, aktif listing ve toplam satış sayacı, tatil modu.
--  * etsy_listing_stats   — listing views/num_favorers ömür boyu TOPLAMDIR;
--    Etsy tarihçe vermez. Her senkron günü fotoğraflanır → trend serisini
--    panel biriktirir (dün-bugün farkı = günlük görüntülenme).
--  * etsy_shipping_profiles — kargo profilleri (işlem süresi, menşei) —
--    dönüşüm/kargo senaryolarına veri.
--  * etsy_shop_sections   — mağaza bölümleri (başlık, aktif listing sayısı).
-- Yazan: service-role (senkron). Okuyan: org üyeleri (RLS select).

create table if not exists public.etsy_shop_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_date date not null,
  shop_name text,
  num_favorers integer,
  review_average numeric(3,2),
  review_count integer,
  listing_active_count integer,
  transaction_sold_count integer,
  is_vacation boolean,
  announcement text,
  url text,
  currency_code text,
  created_at timestamptz not null default now(),
  unique (org_id, snapshot_date)
);
create index if not exists etsy_shop_snapshots_org_idx
  on public.etsy_shop_snapshots(org_id, snapshot_date desc);

create table if not exists public.etsy_listing_stats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint not null,
  stat_date date not null,
  views integer,
  num_favorers integer,
  quantity integer,
  unique (org_id, etsy_listing_id, stat_date)
);
create index if not exists etsy_listing_stats_org_idx
  on public.etsy_listing_stats(org_id, stat_date desc);
create index if not exists etsy_listing_stats_listing_idx
  on public.etsy_listing_stats(org_id, etsy_listing_id, stat_date desc);

create table if not exists public.etsy_shipping_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  profile_id bigint not null,
  title text,
  min_processing_days integer,
  max_processing_days integer,
  processing_days_display text,
  origin_country_iso text,
  origin_postal_code text,
  updated_at timestamptz not null default now(),
  unique (org_id, profile_id)
);

create table if not exists public.etsy_shop_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  section_id bigint not null,
  title text,
  rank integer,
  active_listing_count integer,
  updated_at timestamptz not null default now(),
  unique (org_id, section_id)
);

alter table public.etsy_shop_snapshots enable row level security;
alter table public.etsy_listing_stats enable row level security;
alter table public.etsy_shipping_profiles enable row level security;
alter table public.etsy_shop_sections enable row level security;

create policy "etsy_shop_snapshots_read" on public.etsy_shop_snapshots
  for select to authenticated using (org_id = public.current_org_id());
create policy "etsy_listing_stats_read" on public.etsy_listing_stats
  for select to authenticated using (org_id = public.current_org_id());
create policy "etsy_shipping_profiles_read" on public.etsy_shipping_profiles
  for select to authenticated using (org_id = public.current_org_id());
create policy "etsy_shop_sections_read" on public.etsy_shop_sections
  for select to authenticated using (org_id = public.current_org_id());

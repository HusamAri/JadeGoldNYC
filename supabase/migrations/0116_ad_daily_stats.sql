-- 0116 — Mağaza geneli GÜNLÜK reklam istatistikleri (Etsy Ads "stats over time")
-- ------------------------------------------------------------------------------
-- Etsy Reklam panosunun GÜNLÜK dışa aktarımı (Date · Views · Clicks · Orders ·
-- Revenue · Spend · ROAS · Click rate · Ending budget) listing kırılımı VERMEZ;
-- mağaza geneli tek satır/gündür. Var olan iki reklam yüzeyi bunu tutamaz:
--   - product_metrics  → listing başına, dönemsel snapshot (günlük değil)
--   - shop_metrics     → serbest dönem etiketi; ROAS/tık oranı/bütçe kolonu yok
-- Bu tablo o boşluğu doldurur: org başına gün başına bir satır, idempotent
-- (org_id, stat_date) tekil. ROAS ve tık oranı TÜRETİLİR (revenue/spend,
-- clicks/views) — saklanmaz; ham sayaçlar + para (cent) saklanır.

create table if not exists public.ad_daily_stats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  stat_date date not null,
  views integer not null default 0,
  clicks integer not null default 0,
  orders integer not null default 0,
  revenue_cents bigint not null default 0,
  spend_cents bigint not null default 0,
  -- Gün sonu reklam bütçesi (Etsy "Ending budget") — bütçe artışını izler.
  ending_budget_cents bigint,
  currency text not null default 'USD',
  -- Kaynak etiketi (ileride farklı reklam platformları eklenebilir).
  source text not null default 'etsy_ads_csv',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, stat_date)
);
create index if not exists ad_daily_stats_org_date_idx
  on public.ad_daily_stats (org_id, stat_date desc);

create trigger set_updated_at
  before update on public.ad_daily_stats
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.ad_daily_stats
  for each row execute function public.audit_trigger();

alter table public.ad_daily_stats enable row level security;

create policy "ad_daily_stats_select" on public.ad_daily_stats for select to authenticated
  using (org_id = public.current_org_id());
create policy "ad_daily_stats_insert" on public.ad_daily_stats for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "ad_daily_stats_update" on public.ad_daily_stats for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "ad_daily_stats_delete" on public.ad_daily_stats for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- ── EON Temmuz 2026 seed (1–23 Tem) — idempotent upsert ──────────────────────
-- Kullanıcının yüklediği "etsy_ads_stats_20260701_20260723.csv". EON kendi
-- org'udur (slug 'eon'); org yoksa seed sessizce atlanır (başka ortam güvenli).
do $$
declare
  eon_id uuid;
begin
  select id into eon_id
  from public.organizations
  where slug = 'eon' or upper(name) = 'EON'
  limit 1;
  if eon_id is null then
    raise notice 'EON org bulunamadı — günlük reklam seed atlandı.';
    return;
  end if;

  insert into public.ad_daily_stats
    (org_id, stat_date, views, clicks, orders, revenue_cents, spend_cents, ending_budget_cents, currency, source)
  values
    (eon_id, date '2026-07-01',  25,  1, 0,     0,   83, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-02',  36,  2, 0,     0,  142, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-03',  28,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-04',  49,  2, 0,     0,   83, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-05',  36,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-06',  42,  1, 0,     0,  197, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-07',  64,  2, 0,     0,  383, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-08',  45,  1, 0,     0,   23, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-09',  64,  2, 0,     0,   46, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-10',  51,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-11',  41,  1, 0,     0,  197, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-12',  21,  1, 0,     0,   76, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-13',  21,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-14',  31,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-15',  28,  1, 0,     0,  165, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-16',   2,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-17', 160,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-18', 143,  0, 0,     0,    0, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-19',   7,  1, 0,     0,   84, 1500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-20',   4,  0, 0,     0,    0, 2500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-21', 111,  6, 1, 33500,  853, 2500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-22', 283,  7, 0,     0,  587, 2500, 'USD', 'etsy_ads_csv'),
    (eon_id, date '2026-07-23', 277, 13, 0,     0, 1631, 2500, 'USD', 'etsy_ads_csv')
  on conflict (org_id, stat_date) do update set
    views               = excluded.views,
    clicks              = excluded.clicks,
    orders              = excluded.orders,
    revenue_cents       = excluded.revenue_cents,
    spend_cents         = excluded.spend_cents,
    ending_budget_cents = excluded.ending_budget_cents,
    currency            = excluded.currency,
    source              = excluded.source,
    updated_at          = now();
end $$;

notify pgrst, 'reload schema';

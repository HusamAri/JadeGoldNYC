-- 0096 — Etsy DRAFT listing oluşturma işlem/denetim logu.
-- ------------------------------------------------------------------
-- Panel taslak ürünlerinden (products.status='draft', featured_rank dolu = OK
-- sinyali) Etsy'de draft listing kuran motorun (lib/etsy/create-listing.ts)
-- her denemesini kaydeder. İdempotens: products.etsy_listing_id dolunca ürün
-- atlanır; bu tablo "ne oldu / hangi adımda patladı" izini tutar.
--
-- outcome: 'created' (başarı) | 'failed' (bir adımda hata) | 'skipped'
--          (zaten oluşturulmuş / ön koşul yok).
-- step:    hangi adımda — 'listing' | 'inventory' | 'image' | 'done'.
-- request_summary: gönderilen payload'ın özeti (canlı yanıtla hata ayıklama).
--
-- Yazan: service-role (motor admin istemcisi). Okuyan: org üyeleri (RLS select).
-- Not: 0011 audit trigger'ı YALNIZ trigger EKLENEN tablolarda çalışır; bu tabloya
-- bilerek trigger eklenmez (kendisi zaten bir denetim izidir).

create table if not exists public.etsy_create_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  etsy_listing_id bigint,
  outcome text not null check (outcome in ('created', 'failed', 'skipped')),
  step text,
  error text,
  request_summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists etsy_create_log_org_created_idx
  on public.etsy_create_log (org_id, created_at desc);
create index if not exists etsy_create_log_org_product_idx
  on public.etsy_create_log (org_id, product_id);

-- ── RLS ──────────────────────────────────────────────────────────────
-- Org üyeleri okur; yazma yalnız service-role (insert/update policy YOK).
alter table public.etsy_create_log enable row level security;
create policy "etsy_create_log_select" on public.etsy_create_log
  for select to authenticated
  using (org_id = public.current_org_id());

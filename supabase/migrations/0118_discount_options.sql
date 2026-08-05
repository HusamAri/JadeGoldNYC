-- 0118 — İndirim seçenekleri: tarih aralığı, minimum sepet tutarı, paket (2 ürün)
-- ------------------------------------------------------------------------------
-- 0115 tek `products.discount_pct` (panel-içi; Etsy Sale/kupon API'si yok) ekledi.
-- Bu göç onu üç eksende zenginleştirir (hepsi PANEL-İÇİ planlama/marj — Etsy'ye
-- yazılmaz): (1) indirimin geçerli tarih aralığı, (2) minimum sepet toplamı
-- eşiği, (3) iki ürünü paket olarak eşleyip indirim (`discount_bundles`).

-- Ürün-düzeyi indirime pencere + sepet eşiği.
alter table public.products
  add column if not exists discount_start_at date,
  add column if not exists discount_end_at date,
  -- Minimum SEPET toplamı (cent) — indirim yalnız bu tutarın üstündeki
  -- siparişte uygulanır (Etsy 'spend X save Y%' mantığı; panel planlaması).
  add column if not exists discount_min_order_cents bigint;

-- Paket indirimi: iki ürün BİRLİKTE alınınca indirim (panel planlaması).
create table if not exists public.discount_bundles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_a_id uuid not null references public.products(id) on delete cascade,
  product_b_id uuid not null references public.products(id) on delete cascade,
  discount_pct integer not null default 0 check (discount_pct between 0 and 90),
  start_at date,
  end_at date,
  min_order_cents bigint,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Aynı iki ürün için tek paket; ürün kendisiyle eşlenemez.
  constraint discount_bundles_distinct check (product_a_id <> product_b_id),
  unique (org_id, product_a_id, product_b_id)
);
create index if not exists discount_bundles_org_idx
  on public.discount_bundles (org_id);
create index if not exists discount_bundles_products_idx
  on public.discount_bundles (product_a_id, product_b_id);

create trigger set_updated_at
  before update on public.discount_bundles
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.discount_bundles
  for each row execute function public.audit_trigger();

alter table public.discount_bundles enable row level security;

create policy "discount_bundles_select" on public.discount_bundles for select to authenticated
  using (org_id = public.current_org_id());
create policy "discount_bundles_insert" on public.discount_bundles for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "discount_bundles_update" on public.discount_bundles for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "discount_bundles_delete" on public.discount_bundles for delete to authenticated
  using (org_id = public.current_org_id());

notify pgrst, 'reload schema';

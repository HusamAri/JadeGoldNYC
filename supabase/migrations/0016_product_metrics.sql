-- 0016 — Ürün bazlı performans snapshot'ları (rapor §07 / §08)
-- ------------------------------------------------------------------
-- Ürün başına dönemsel görüntüleme/sipariş/ciro + Etsy Ads (tık/harcama/ciro).

create table public.product_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  period_label text not null,
  product_title text not null,
  sku text,
  views integer,
  orders integer,
  revenue_cents bigint,
  ads_clicks integer,
  ads_spend_cents bigint,
  ads_revenue_cents bigint,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.product_metrics (org_id, period_label);
create index on public.product_metrics (product_id);

create trigger set_updated_at
  before update on public.product_metrics
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.product_metrics
  for each row execute function public.audit_trigger();

alter table public.product_metrics enable row level security;

create policy "product_metrics_select" on public.product_metrics for select to authenticated
  using (org_id = public.current_org_id());
create policy "product_metrics_insert" on public.product_metrics for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "product_metrics_update" on public.product_metrics for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "product_metrics_delete" on public.product_metrics for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

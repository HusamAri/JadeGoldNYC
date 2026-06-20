-- 0015 — Etsy Stats dönemsel snapshot'ları (mağaza performansı)
-- ------------------------------------------------------------------
-- Dönüşüm hunisi metrikleri (ziyaret, dönüşüm, sepette terk, trafik kaynakları,
-- Etsy Ads ROAS, puan) sipariş verisinden türetilemez; dönemsel olarak girilir.

create table public.shop_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  period_label text not null,
  period_start date,
  period_end date,
  visits integer,
  orders integer,
  revenue_cents bigint,
  cart_abandon_amount_cents bigint,
  cart_abandon_count integer,
  rating numeric(2, 1),
  ads_spend_cents bigint,
  ads_revenue_cents bigint,
  traffic_sources jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.shop_metrics (org_id, period_end desc nulls last);

create trigger set_updated_at
  before update on public.shop_metrics
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.shop_metrics
  for each row execute function public.audit_trigger();

alter table public.shop_metrics enable row level security;

create policy "shop_metrics_select" on public.shop_metrics for select to authenticated
  using (org_id = public.current_org_id());
create policy "shop_metrics_insert" on public.shop_metrics for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "shop_metrics_update" on public.shop_metrics for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "shop_metrics_delete" on public.shop_metrics for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

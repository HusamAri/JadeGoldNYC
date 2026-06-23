-- ShipStation entegrasyonu: ham sipariş + gönderi (maliyet + takip) tabloları
-- ve devam ettirilebilir senkron imleci. Anahtarlar env'de
-- (SHIPSTATION_API_KEY/SECRET); girilene kadar atıl.

create table if not exists public.shipstation_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  order_id bigint not null unique,
  order_number text,
  order_date timestamptz,
  order_status text,
  customer_name text,
  customer_email text,
  order_total_cents bigint,
  currency text,
  store_id bigint,
  marketplace text,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shipstation_orders_org_idx
  on public.shipstation_orders (org_id, order_date desc nulls last);

create table if not exists public.shipstation_shipments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id bigint not null unique,
  order_id bigint,
  order_number text,
  ship_date timestamptz,
  create_date timestamptz,
  tracking_number text,
  carrier_code text,
  service_code text,
  shipment_cost_cents bigint,
  insurance_cost_cents bigint,
  voided boolean,
  customer_email text,
  currency text,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shipstation_shipments_org_idx
  on public.shipstation_shipments (org_id, ship_date desc nulls last);

create table if not exists public.shipstation_connection (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  status text not null default 'idle',
  sync_status text not null default 'idle',
  sync_phase text,
  sync_page integer not null default 0,
  sync_orders integer not null default 0,
  sync_shipments integer not null default 0,
  sync_error text,
  sync_started_at timestamptz,
  sync_updated_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipstation_orders enable row level security;
alter table public.shipstation_shipments enable row level security;
alter table public.shipstation_connection enable row level security;
create policy "shipstation_orders_select" on public.shipstation_orders
  for select to authenticated using (org_id = public.current_org_id());
create policy "shipstation_shipments_select" on public.shipstation_shipments
  for select to authenticated using (org_id = public.current_org_id());
create policy "shipstation_connection_select" on public.shipstation_connection
  for select to authenticated using (org_id = public.current_org_id());

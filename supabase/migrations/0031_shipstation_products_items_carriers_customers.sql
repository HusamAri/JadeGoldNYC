-- ShipStation genişletme: ürünler (maliyet), sipariş kalemleri, kargo
-- firmaları (bakiye), müşteriler. Kalemler ve müşteriler mevcut orders.raw'dan
-- SQL ile çıkarılır (API'siz); ürünler/kargolar API'den gelir.

create table if not exists public.shipstation_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id bigint not null unique,
  sku text,
  name text,
  price_cents bigint,
  default_cost_cents bigint,
  weight_oz numeric,
  active boolean,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shipstation_products_org_idx
  on public.shipstation_products (org_id, sku);

create table if not exists public.shipstation_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  order_item_id bigint,
  order_id bigint,
  sku text,
  name text,
  quantity integer,
  unit_price_cents bigint,
  product_id bigint,
  options jsonb,
  image_url text,
  warehouse_location text,
  created_at timestamptz not null default now()
);
create index if not exists shipstation_order_items_org_idx
  on public.shipstation_order_items (org_id, sku);
create index if not exists shipstation_order_items_order_idx
  on public.shipstation_order_items (org_id, order_id);

create table if not exists public.shipstation_carriers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text,
  account_number text,
  balance_cents bigint,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create table if not exists public.shipstation_customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  customer_id bigint,
  name text,
  orders_count integer not null default 0,
  total_spent_cents bigint not null default 0,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);
create index if not exists shipstation_customers_org_idx
  on public.shipstation_customers (org_id, last_order_at desc nulls last);

alter table public.shipstation_connection
  add column if not exists sync_products integer not null default 0;

alter table public.shipstation_products enable row level security;
alter table public.shipstation_order_items enable row level security;
alter table public.shipstation_carriers enable row level security;
alter table public.shipstation_customers enable row level security;
create policy "shipstation_products_select" on public.shipstation_products
  for select to authenticated using (org_id = public.current_org_id());
create policy "shipstation_order_items_select" on public.shipstation_order_items
  for select to authenticated using (org_id = public.current_org_id());
create policy "shipstation_carriers_select" on public.shipstation_carriers
  for select to authenticated using (org_id = public.current_org_id());
create policy "shipstation_customers_select" on public.shipstation_customers
  for select to authenticated using (org_id = public.current_org_id());

-- Sipariş kalemlerini orders.raw'dan çıkar (idempotent: delete+insert).
create or replace function public.rebuild_shipstation_order_items(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.shipstation_order_items where org_id = p_org_id;
  insert into public.shipstation_order_items
    (org_id, order_item_id, order_id, sku, name, quantity, unit_price_cents,
     product_id, options, image_url, warehouse_location)
  select
    p_org_id,
    nullif(it->>'orderItemId','')::bigint,
    o.order_id,
    nullif(it->>'sku',''),
    it->>'name',
    coalesce((it->>'quantity')::int, 0),
    round(coalesce((it->>'unitPrice')::numeric, 0) * 100)::bigint,
    nullif(it->>'productId','')::bigint,
    it->'options',
    it->>'imageUrl',
    it->>'warehouseLocation'
  from public.shipstation_orders o
  cross join lateral jsonb_array_elements(coalesce(o.raw->'items','[]'::jsonb)) it
  where o.org_id = p_org_id
    and coalesce((it->>'adjustment')::boolean, false) = false;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Müşterileri orders.raw'dan e-posta bazında topla (idempotent).
create or replace function public.rebuild_shipstation_customers(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.shipstation_customers where org_id = p_org_id;
  insert into public.shipstation_customers
    (org_id, email, customer_id, name, orders_count, total_spent_cents,
     first_order_at, last_order_at)
  select
    p_org_id,
    lower(customer_email),
    max((raw->>'customerId')::bigint),
    max(coalesce(raw->'billTo'->>'name', raw->'shipTo'->>'name')),
    count(*),
    round(sum(coalesce((raw->>'orderTotal')::numeric, 0)) * 100)::bigint,
    min(order_date),
    max(order_date)
  from public.shipstation_orders
  where org_id = p_org_id and coalesce(customer_email, '') <> ''
  group by lower(customer_email);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_shipstation_order_items(uuid) from public, anon;
revoke all on function public.rebuild_shipstation_customers(uuid) from public, anon;
grant execute on function public.rebuild_shipstation_order_items(uuid) to authenticated, service_role;
grant execute on function public.rebuild_shipstation_customers(uuid) to authenticated, service_role;

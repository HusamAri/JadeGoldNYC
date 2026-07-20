-- 0108 — Shopier bağlantısı (PAT REST API, org başına tek satır)
-- ------------------------------------------------------------------
-- Shopier resmi PAT (kişisel erişim anahtarı) REST API'si (api.shopier.com/v1)
-- sipariş/ürün verisi verir. Bu iskelet SİPARİŞ senkronunu kurar:
-- Shopier siparişleri sales'e `source='shopier'` olarak iner.
--
-- Sır modeli etsy_connection/shipstation_credentials ile aynı: RLS açık ama
-- POLİTİKA YOK → satırları yalnız service-role okur/yazar; PAT üyeye sızmaz.
-- Durum, aşağıdaki SECURITY DEFINER RPC ile (sır içermeyen alanlar) okunur.
-- Audit trigger BİLEREK yok (token sızmasın — etsy_connection kararıyla aynı).

create table if not exists public.shopier_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  pat text not null,
  shop_name text,
  status text not null default 'connected'
    check (status in ('connected', 'error', 'revoked')),
  last_sync_at timestamptz,
  sync_status text not null default 'idle',
  sync_page integer not null default 0,
  sync_orders integer not null default 0,
  sync_items integer not null default 0,
  -- Artımlı pencerenin başı — tur ortasında duraklayıp sürerken sayfalama
  -- aynı veri kümesi üzerinde kalsın (tam/pencereli karışmasın).
  sync_date_start date,
  sync_error text,
  sync_started_at timestamptz,
  sync_updated_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create trigger set_updated_at
  before update on public.shopier_connection
  for each row execute function public.set_updated_at();

alter table public.shopier_connection enable row level security;

-- Üye yüzeyi: yalnız sır içermeyen durum alanları (0104 shopify deseni).
create or replace function public.shopier_connection_status(p_org uuid)
returns table (
  status text,
  shop_name text,
  last_sync_at timestamptz,
  sync_status text,
  sync_error text
)
language sql
security definer
set search_path = public
as $$
  select c.status, c.shop_name, c.last_sync_at, c.sync_status, c.sync_error
  from public.shopier_connection c
  where c.org_id = p_org
    and p_org = public.current_org_id()
  limit 1;
$$;

revoke all on function public.shopier_connection_status(uuid) from public, anon;
grant execute on function public.shopier_connection_status(uuid) to authenticated;

-- Satış kaynağı sözlüğüne 'shopier' eklenir (0005 → 0025 zincirinin devamı).
alter table public.sales drop constraint if exists sales_source_check;
alter table public.sales add constraint sales_source_check
  check (source = any (array['manual'::text, 'csv'::text, 'etsy'::text, 'shopier'::text]));

-- Shopier sipariş kimliği — idempotent upsert anahtarı (org_id,etsy_receipt_id
-- deseninin Shopier karşılığı). TAM unique indeks: NULL çiftleri çakışmaz,
-- Etsy/CSV satırları etkilenmez; PostgREST onConflict tam indeks ister
-- (kısmi indeksi ON CONFLICT (cols) çözümleyemez).
alter table public.sales add column if not exists shopier_order_id text;
create unique index if not exists sales_org_shopier_order_uq
  on public.sales (org_id, shopier_order_id);

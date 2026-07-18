-- 0104 — Shopify bağlantı hazırlığı (inert OAuth iskeleti)
-- Yeni marka / ikinci kanal bağlamak için org başına tek bağlantı satırı.
-- Token'lar service-role ile yazılır; istemci yalnızca status RPC görür.

create table if not exists public.shopify_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_domain text not null,
  access_token text,
  scope text,
  shop_id text,
  shop_name text,
  connected_by uuid references auth.users(id) on delete set null,
  last_sync_at timestamptz,
  status text not null default 'connected'
    check (status in ('connected', 'expired', 'revoked', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create trigger set_updated_at
  before update on public.shopify_connection
  for each row execute function public.set_updated_at();

-- Token sızmasın — audit trigger YOK (etsy_connection ile aynı bilinçli tercih).

create table if not exists public.shopify_oauth_states (
  state text primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_domain text,
  redirect_to text,
  created_at timestamptz not null default now()
);

alter table public.shopify_connection enable row level security;
alter table public.shopify_oauth_states enable row level security;

-- Üyeler satırı göremez (token); yalnız status RPC. Service-role yazar.
-- oauth_states: hiç client erişimi yok.

create or replace function public.shopify_connection_status(p_org uuid)
returns table (
  status text,
  shop_domain text,
  shop_name text,
  last_sync_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.status, c.shop_domain, c.shop_name, c.last_sync_at
  from public.shopify_connection c
  where c.org_id = p_org
    and p_org = public.current_org_id()
  limit 1;
$$;

grant execute on function public.shopify_connection_status(uuid) to authenticated;

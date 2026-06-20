-- 0010 — Etsy OAuth bağlantısı ve geçici PKCE durumları
-- ------------------------------------------------------------------
-- Bu tablolar yalnızca service-role tarafından erişilir (token sızdırmaz).
-- RLS 0012'de etkinleştirilir; authenticated için politika tanımlanmaz.

create table public.etsy_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_user_id text,
  shop_id bigint,
  access_token text not null,
  refresh_token text not null,
  scope text,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  last_sync_at timestamptz,
  status text not null default 'connected'
    check (status in ('connected', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create trigger set_updated_at
  before update on public.etsy_connection
  for each row execute function public.set_updated_at();

create table public.etsy_oauth_states (
  state text primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  code_verifier text not null,
  redirect_to text,
  created_at timestamptz not null default now()
);

-- Token sızdırmadan bağlantı durumunu döndüren güvenli RPC.
-- Yalnızca kendi org'unun durumunu görebilir.
create or replace function public.etsy_connection_status(p_org uuid)
returns table (
  status text,
  shop_id bigint,
  last_sync_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.status, c.shop_id, c.last_sync_at, c.access_token_expires_at
  from public.etsy_connection c
  where c.org_id = p_org
    and c.org_id = public.current_org_id();
$$;

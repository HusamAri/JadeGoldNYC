-- 0132 — Pinterest bağlantısı (inert OAuth iskeleti, 0104 Shopify deseni).
--
-- Org başına tek bağlantı. Token'lar service-role ile yazılır; istemci yalnız
-- status RPC görür (satırı hiç okuyamaz). Etsy/Shopify ile aynı bilinçli
-- tercih: token taşıyan tabloda audit trigger YOK — diff'e token sızmasın.
--
-- Pinterest farkı: access_token SÜRELİ ve refresh_token'ın kendisi de süreli
-- (Pinterest v5 refresh token'a ayrı bir son kullanma verir). İkisinin de
-- bitişi ayrı kolonda tutulur ki panel "yeniden bağlan" uyarısını doğru
-- zamanda çıkarabilsin — refresh süresi dolduysa sessiz yenileme İMKÂNSIZDIR.

create table if not exists public.pinterest_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  access_token text,
  refresh_token text,
  scope text,
  -- Pinterest hesabı (kullanıcı) kimliği + görünen ad.
  account_id text,
  username text,
  account_type text,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  last_sync_at timestamptz,
  status text not null default 'connected'
    check (status in ('connected', 'expired', 'revoked', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create trigger set_updated_at
  before update on public.pinterest_connection
  for each row execute function public.set_updated_at();

create table if not exists public.pinterest_oauth_states (
  state text primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- PKCE doğrulayıcısı: Pinterest v5 authorization_code akışında PKCE destekler
  -- ve public client'ta zorunludur. Sunucuda üretilir, callback'te tüketilir.
  code_verifier text,
  redirect_to text,
  created_at timestamptz not null default now()
);

alter table public.pinterest_connection enable row level security;
alter table public.pinterest_oauth_states enable row level security;

-- Politika YOK: üye satırı göremez (token). Yazma yalnız service-role.
-- oauth_states'e hiç client erişimi yok.

create or replace function public.pinterest_connection_status(p_org uuid)
returns table (
  status text,
  username text,
  account_type text,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  last_sync_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.status, c.username, c.account_type,
         c.expires_at, c.refresh_expires_at, c.last_sync_at
  from public.pinterest_connection c
  where c.org_id = p_org
    and p_org = public.current_org_id()
  limit 1;
$$;

grant execute on function public.pinterest_connection_status(uuid) to authenticated;

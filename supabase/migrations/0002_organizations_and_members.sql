-- 0002 — Organizasyonlar ve üyeler (single-tenant; RLS çapası)
-- ------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  etsy_shop_id bigint,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on public.organization_members (user_id);

-- Geçerli kullanıcının org_id'si (RLS politikalarında kullanılır).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Geçerli kullanıcının rolü.
create or replace function public.current_org_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Yeni auth kullanıcısını tek organizasyona otomatik üye yapar.
-- İlk kullanıcı 'owner', sonrakiler 'member' olur.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_count int;
begin
  select id into v_org from public.organizations order by created_at limit 1;
  if v_org is null then
    return new;
  end if;
  select count(*) into v_count from public.organization_members;
  insert into public.organization_members (org_id, user_id, role)
  values (v_org, new.id, case when v_count = 0 then 'owner' else 'member' end)
  on conflict (org_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

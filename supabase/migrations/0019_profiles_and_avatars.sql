-- 0019 — Kullanıcı profilleri + avatar storage (hesap özelleştirme)
-- ------------------------------------------------------------------
-- Additive: mevcut veriyi değiştirmez. profiles tablosu auth.users'a 1-1 bağlı.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Üyeler birbirini görebilir (denetim kaydında ad/avatar göstermek için).
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- updated_at otomatik dokunma
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Yeni kullanıcıda profil satırı da oluştur (mevcut üyelik mantığı korunur).
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
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

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

-- Mevcut kullanıcılar için backfill.
insert into public.profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name' from auth.users
on conflict (id) do nothing;

-- Avatar storage kovası: herkese açık okuma; kullanıcı yalnız KENDİ klasörüne yazar.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select to public using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

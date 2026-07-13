-- 0071 — Platform seviyesi: çok-kiracılı (multi-tenant) çekirdek
-- ------------------------------------------------------------------
-- Panel tek şirket (Jade Gold) varsayımıyla kuruluydu: her yeni auth
-- kullanıcısı İLK organizasyona üye yapılıyor, current_org_id() ilk üyeliği
-- seçiyordu. Bu migration paneli platforma çevirir:
--   • Yeni kullanıcı hiçbir org'a OTOMATİK katılmaz; ya davetle katılır
--     (org_invites) ya da site içinden kendi şirketini kurar
--     (create_organization RPC → /kurulum sihirbazı).
--   • Kullanıcı birden çok şirkette üye olabilir; aktif şirket
--     profiles.active_org_id ile seçilir ve TÜM RLS bunu izler.
--   • Jade Gold NYC artık organizasyonlardan yalnızca biri.

-- ── Aktif şirket seçimi ─────────────────────────────────────────────
alter table public.profiles
  add column active_org_id uuid references public.organizations(id) on delete set null;

-- Mevcut kullanıcılar: ilk üyelikleri aktif şirket olsun (davranış değişmez).
update public.profiles p
set active_org_id = (
  select m.org_id from public.organization_members m
  where m.user_id = p.id order by m.created_at limit 1
)
where p.active_org_id is null;

-- ── Davetler ────────────────────────────────────────────────────────
-- Ekip daveti artık org'a bağlı: kullanıcı kaydolduğunda handle_new_user
-- bekleyen daveti tüketip DOĞRU şirkete üye yapar (eskiden ilk org'a girerdi).
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (org_id, email)
);
create index on public.org_invites (lower(email)) where accepted_at is null;

alter table public.org_invites enable row level security;
create policy "org_invites_select" on public.org_invites for select to authenticated
  using (org_id = public.current_org_id());
create policy "org_invites_manage" on public.org_invites for all to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() = 'owner')
  with check (org_id = public.current_org_id() and public.current_org_role() = 'owner');

-- ── RLS çapası: aktif şirket ────────────────────────────────────────
-- Aktif org yalnız GEÇERLİ bir üyelikse kullanılır; yoksa ilk üyeliğe düşer
-- (aktif org'dan çıkarılan kullanıcı kilitli kalmasın).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select m.org_id
      from public.organization_members m
      join public.profiles p on p.id = auth.uid() and p.active_org_id = m.org_id
      where m.user_id = auth.uid()
      limit 1
    ),
    (
      select org_id from public.organization_members
      where user_id = auth.uid()
      order by created_at
      limit 1
    )
  );
$$;

-- Rol her zaman AKTİF şirketteki rol (eskiden ilk üyeliğin rolüydü).
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
    and org_id = public.current_org_id()
  limit 1;
$$;

-- Kullanıcı üyesi olduğu TÜM org'ların adını görebilmeli (şirket seçici).
drop policy "org_select" on public.organizations;
create policy "org_select" on public.organizations for select to authenticated
  using (
    id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- Üye kendi üyelik satırlarını her org'da görebilmeli (şirket seçici).
drop policy "members_select" on public.organization_members;
create policy "members_select" on public.organization_members for select to authenticated
  using (
    user_id = auth.uid() or org_id = public.current_org_id()
  );

-- ── Yeni kullanıcı: otomatik org üyeliği YOK ────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  -- Bekleyen davet varsa o şirkete, davetteki rolle katıl.
  select * into v_invite
  from public.org_invites
  where lower(email) = lower(new.email) and accepted_at is null
  order by created_at
  limit 1;

  if v_invite.id is not null then
    insert into public.organization_members (org_id, user_id, role)
    values (v_invite.org_id, new.id, v_invite.role)
    on conflict (org_id, user_id) do nothing;
    update public.org_invites set accepted_at = now() where id = v_invite.id;
    update public.profiles set active_org_id = v_invite.org_id where id = new.id;
  end if;
  -- Davet yoksa üyeliksiz kalır → uygulama /kurulum sihirbazına yönlendirir.
  return new;
end;
$$;

-- ── Site içinden şirket kurulumu ────────────────────────────────────
-- /kurulum sihirbazının çağırdığı RPC: org + owner üyeliği + sistem maliyet
-- kategorileri tek atomik işlemde. Aynı kullanıcı ikinci/üçüncü şirketini de
-- bu yolla kurar (şirket seçicideki "Yeni şirket kur").
create or replace function public.create_organization(
  p_name text,
  p_currency text default 'USD'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_slug text;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'organization name required';
  end if;

  -- Slug: addan türet; çakışırsa kısa rastgele sonek.
  v_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'sirket'; end if;
  if exists (select 1 from public.organizations where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  insert into public.organizations (name, slug, default_currency)
  values (trim(p_name), v_slug, upper(coalesce(nullif(trim(p_currency), ''), 'USD')))
  returning id into v_org;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org, v_user, 'owner');

  -- Sistem maliyet kategorileri (0013 + 0018 tohumlarının birleşimi).
  insert into public.cost_categories (org_id, key, label_tr, is_system)
  select v_org, c.key, c.label_tr, true
  from (values
    ('malzeme', 'Malzeme'),
    ('kargo', 'Kargo'),
    ('etsy_ucretleri', 'Etsy Ücretleri'),
    ('reklam', 'Reklam'),
    ('iscilik', 'İşçilik'),
    ('paketleme', 'Paketleme'),
    ('yol_ulasim', 'Yol / Ulaşım'),
    ('diger', 'Diğer')
  ) as c(key, label_tr)
  on conflict (org_id, key) do nothing;

  update public.profiles set active_org_id = v_org where id = v_user;

  return v_org;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

-- ── ShipStation kimlik bilgileri: org başına, service-role-only ─────
-- Env (SHIPSTATION_API_KEY/SECRET) platform geneliydi; her şirket kendi
-- anahtarını site içinden girer. etsy_connection deseninde: RLS açık ama
-- POLİTİKA YOK → yalnız service-role okur/yazar, sırlar üyelere sızmaz.
create table public.shipstation_credentials (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  api_key text not null,
  api_secret text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.shipstation_credentials enable row level security;

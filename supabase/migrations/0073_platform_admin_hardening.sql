-- 0073 — Platform yöneticisi sertleştirmeleri (PR #130/#131 inceleme bulguları)
-- ------------------------------------------------------------------
-- 1) KRİTİK: create_organization, platform yöneticisi çağırdığında patlıyordu —
--    enroll_platform_admins trigger'ı (organizations AFTER INSERT) yöneticiyi
--    owner olarak ÖNCE ekliyor, RPC'nin kendi conflict'siz insert'i unique
--    ihlaline çarpıyordu. Membership insert artık conflict-güvenli.
-- 2) platform_admins'e SONRADAN eklenen yönetici mevcut şirketlere
--    yansımıyordu — insert trigger'ı tüm mevcut org'lara owner ekler.
-- 3) Kiracı owner'ı, platform yöneticisinin üyeliğini silebiliyor/düşürebiliyordu
--    — kullanıcı bağlamında (auth.uid() dolu) platform yöneticisi üyelik satırı
--    değiştirilemez; service-role (auth.uid() null) serbest kalır.

-- ── 1) create_organization: conflict-güvenli owner insert ──────────
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

  v_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'sirket'; end if;
  if exists (select 1 from public.organizations where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  insert into public.organizations (name, slug, default_currency)
  values (trim(p_name), v_slug, upper(coalesce(nullif(trim(p_currency), ''), 'USD')))
  returning id into v_org;

  -- enroll_platform_admins trigger'ı yukarıdaki insert'in sonunda çalışır ve
  -- kurucu platform yöneticisiyse bu satırı ZATEN eklemiş olur.
  insert into public.organization_members (org_id, user_id, role)
  values (v_org, v_user, 'owner')
  on conflict (org_id, user_id) do update set role = 'owner';

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

-- ── 2) Sonradan eklenen platform yöneticisi → mevcut org'lara backfill ──
create or replace function public.enroll_admin_to_all_orgs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (org_id, user_id, role)
  select o.id, new.user_id, 'owner'
  from public.organizations o
  on conflict (org_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger enroll_admin_to_all_orgs
  after insert on public.platform_admins
  for each row execute function public.enroll_admin_to_all_orgs();

-- ── 3) Platform yöneticisi üyeliği kiracı owner'ından korunur ───────
-- Kullanıcı bağlamında (RLS'li istek) platform yöneticisinin üyelik satırı
-- güncellenemez/silinemez — yönetici kendi satırına dokunabilir; service-role
-- (auth.uid() null) operasyonel işlemler için serbesttir.
create or replace function public.protect_platform_admin_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() <> old.user_id
     and exists (select 1 from public.platform_admins pa where pa.user_id = old.user_id)
  then
    raise exception 'Platform yöneticisinin üyeliği değiştirilemez.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_platform_admin_membership
  before update or delete on public.organization_members
  for each row execute function public.protect_platform_admin_membership();

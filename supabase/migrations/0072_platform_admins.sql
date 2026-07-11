-- 0072 — Platform yöneticileri
-- ------------------------------------------------------------------
-- Platform seviyesinde yönetici hesabı: platformdaki HER şirkete owner
-- olarak erişir (şirket seçicide hepsi listelenir), yeni şirket kurabilir
-- ve her şirkete e-posta ile üye davet edebilir (owner yetkisi).
--
-- Tasarım: RLS'e "süper kullanıcı" istisnası eklemek yerine (her politikaya
-- dokunmak gerekirdi) platform yöneticisi her org'a NORMAL owner üyeliğiyle
-- bağlanır — mevcut güvenlik modeli hiç değişmez. Yeni org kurulduğunda
-- trigger platform yöneticilerini otomatik owner yapar.

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- RLS açık, politika yok → yalnız service-role okur/yazar. Panel arayüzünde
-- yönetilmez; bilinçli olarak yalnız operasyonel (SQL/servis) erişim.
alter table public.platform_admins enable row level security;

-- Yeni şirket kurulduğunda platform yöneticilerini owner olarak ekle.
-- create_organization RPC'si kurucuyu ayrıca owner ekler; kurucu aynı zamanda
-- platform yöneticisiyse "on conflict do nothing" çakışmayı çözer.
create or replace function public.enroll_platform_admins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (org_id, user_id, role)
  select new.id, pa.user_id, 'owner'
  from public.platform_admins pa
  on conflict (org_id, user_id) do nothing;
  return new;
end;
$$;

create trigger enroll_platform_admins
  after insert on public.organizations
  for each row execute function public.enroll_platform_admins();

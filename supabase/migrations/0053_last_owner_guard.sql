-- 0053 — Son sahip (owner) koruması: atomik DB-seviyesi güvence (Devin #57).
-- Uygulama katmanındaki countOwners kontrolü check-then-act olduğundan
-- eşzamanlı iki istek org'u sahipsiz bırakabiliyordu (TOCTOU). Bu trigger,
-- bir owner satırını silmeyi/owner'lıktan düşürmeyi org'un owner satırlarını
-- kilitleyerek seri hale getirir; son sahibi kaldıracak işlemi reddeder.

create or replace function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_owners integer;
begin
  if tg_op = 'DELETE' then
    if old.role <> 'owner' then return old; end if;
    v_org := old.org_id;
  else -- UPDATE
    if old.role <> 'owner' or new.role = 'owner' then return new; end if;
    v_org := old.org_id;
  end if;

  -- Aynı org'un owner satırlarını kilitle → eşzamanlı kaldırmalar serileşir.
  perform 1 from public.organization_members
    where org_id = v_org and role = 'owner'
    for update;

  select count(*) into v_owners from public.organization_members
    where org_id = v_org and role = 'owner';

  if v_owners <= 1 then
    raise exception 'Organizasyonda en az bir sahip (owner) kalmalidir.'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists prevent_last_owner on public.organization_members;
create trigger prevent_last_owner
  before update or delete on public.organization_members
  for each row execute function public.prevent_last_owner_removal();

-- 0011 — Genel denetim trigger'ı + uygulama düzeyi loglama RPC'si
-- ------------------------------------------------------------------
-- Çekirdek tablolardaki her create/update/delete audit_log'a yazılır.
-- actor_id auth.uid()'den gelir (PostgREST JWT claim'ini istek transaction'ına
-- yazar; trigger aynı transaction'da çalıştığı için doğru aktörü görür).

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_entity uuid;
  v_action text;
  v_diff jsonb;
  v_actor uuid := auth.uid();
  v_actor_label text;
begin
  if (tg_op = 'DELETE') then
    v_org := (to_jsonb(old) ->> 'org_id')::uuid;
    v_entity := (to_jsonb(old) ->> 'id')::uuid;
    v_action := 'delete';
    v_diff := jsonb_build_object('before', to_jsonb(old));
  elsif (tg_op = 'UPDATE') then
    v_org := (to_jsonb(new) ->> 'org_id')::uuid;
    v_entity := (to_jsonb(new) ->> 'id')::uuid;
    v_action := 'update';
    v_diff := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
  else
    v_org := (to_jsonb(new) ->> 'org_id')::uuid;
    v_entity := (to_jsonb(new) ->> 'id')::uuid;
    v_action := 'insert';
    v_diff := jsonb_build_object('after', to_jsonb(new));
  end if;

  if v_actor is not null then
    select email into v_actor_label from auth.users where id = v_actor;
  else
    v_actor_label := 'Sistem';
  end if;

  insert into public.audit_log (
    org_id, actor_id, actor_label, action, entity_type, entity_id, summary, diff, source
  )
  values (
    v_org, v_actor, v_actor_label, v_action, tg_table_name, v_entity, null, v_diff,
    case when v_actor is null then 'system' else 'trigger' end
  );

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

-- Çekirdek veri tablolarına bağla.
-- NOT: etsy_connection BİLEREK hariç tutuldu (satır token içerir; diff'e sızmamalı).
create trigger audit after insert or update or delete on public.sales
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.sale_items
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.costs
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.products
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.designs
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.reviews
  for each row execute function public.audit_trigger();

-- Uygulama düzeyi semantik loglama (login, csv.import, etsy.connect/sync, report.export).
create or replace function public.log_audit(
  p_org_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_summary text,
  p_diff jsonb,
  p_source text,
  p_actor_label text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_label text := p_actor_label;
begin
  if v_label is null and v_actor is not null then
    select email into v_label from auth.users where id = v_actor;
  end if;
  insert into public.audit_log (
    org_id, actor_id, actor_label, action, entity_type, entity_id, summary, diff, source
  )
  values (
    p_org_id, v_actor, coalesce(v_label, 'Sistem'), p_action, p_entity_type,
    p_entity_id, p_summary, p_diff, coalesce(p_source, 'app')
  );
end;
$$;

grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb, text, text)
  to authenticated, service_role;
grant execute on function public.etsy_connection_status(uuid) to authenticated;
grant execute on function public.current_org_id() to authenticated, anon;
grant execute on function public.current_org_role() to authenticated, anon;

-- 0039 — Audit trigger: değişmeyen UPDATE'leri loglama (no-op guard)
-- ------------------------------------------------------------------
-- Etsy senkronu, içerik değişmese bile satırlara dokunup updated_at'i
-- güncelliyor; bu da audit_log'u 131k satırın %55'i "sahte update" olacak
-- şekilde şişiriyordu (bkz. Kayıtlar denetimi). updated_at hariç, satırın
-- geri kalanı aynıysa hiçbir şey loglanmaz.

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
    -- updated_at hariç satır aynıysa (içerik değişmemiş) hiçbir şey loglama.
    if (to_jsonb(old) - 'updated_at') = (to_jsonb(new) - 'updated_at') then
      return new;
    end if;
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

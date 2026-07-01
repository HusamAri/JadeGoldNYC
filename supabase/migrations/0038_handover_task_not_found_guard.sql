-- 0038 — handover_task: eşleşmeyen org_id/task_id'de sessizce başarılı olmasın
-- ------------------------------------------------------------------
-- Devin Review bulgusu (PR #52): UPDATE 0 satır etkilerse (bayat/hatalı
-- task_id ya da org_id uyuşmazlığı) INSERT yine de geçip atama olmadan
-- bir devir notu oluşturabiliyordu. FOUND kontrolüyle böyle bir durumda
-- tüm fonksiyon (atama + not) hata verip geri alınır.

create or replace function public.handover_task(
  p_task_id uuid,
  p_org_id uuid,
  p_to_user_id uuid,
  p_body text,
  p_author_id uuid,
  p_author_label text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.tasks
  set assignee_id = p_to_user_id
  where id = p_task_id and org_id = p_org_id;

  if not found then
    raise exception 'Görev bulunamadı (task_id=%, org_id=%)', p_task_id, p_org_id;
  end if;

  insert into public.task_notes (org_id, task_id, kind, body, author_id, author_label)
  values (p_org_id, p_task_id, 'handover', p_body, p_author_id, p_author_label);
end;
$$;

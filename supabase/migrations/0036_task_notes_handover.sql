-- 0036 — Görev notlarına "devir" türü (handover)
-- ------------------------------------------------------------------
-- Bir üye kendi bölümünü tamamlayıp göreve not düşerek başka bir üyeye
-- devredebilsin: task_notes.kind ayırt eder (adi not / devir kaydı).

alter table public.task_notes
  add column if not exists kind text not null default 'note'
    check (kind in ('note', 'handover'));

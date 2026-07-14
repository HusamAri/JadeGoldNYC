-- 0079 — Görev ilerleme yüzdesi + ikon + renk
-- ------------------------------------------------------------------
-- Zaman çizelgesi v2: süren görevlerde kullanıcı tanımlı ilerleme yüzdesi.
-- Görev ikon seti: görev tipini anlatan ikon anahtarı + isimlendirilmiş
-- renk skalasından renk anahtarı (lib/task-style.ts tek kaynak).

alter table public.tasks
  add column if not exists progress smallint
    check (progress is null or (progress between 0 and 100)),
  add column if not exists icon text,
  add column if not exists color text;

comment on column public.tasks.progress is
  'Süren görevin ilerleme yüzdesi (0-100); null = belirtilmedi.';
comment on column public.tasks.icon is
  'Görev ikon anahtarı (lib/task-style.ts TASK_ICONS).';
comment on column public.tasks.color is
  'İsimlendirilmiş renk anahtarı (lib/task-style.ts TASK_COLORS).';

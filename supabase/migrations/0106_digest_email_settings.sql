-- Günlük marka özet e-postası tercihleri (org bazında).
-- enabled: false → cron bu org'a mail atmaz.
alter table public.organizations
  add column if not exists digest_settings jsonb not null default '{"enabled": true}'::jsonb;

comment on column public.organizations.digest_settings is
  'Günlük digest e-posta ayarları: { enabled: boolean }. Varsayılan açık.';

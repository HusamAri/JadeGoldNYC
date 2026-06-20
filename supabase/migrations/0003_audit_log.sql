-- 0003 — Denetim logu (şirket hafızası, append-only)
-- ------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  diff jsonb,
  source text not null default 'app',
  ip inet,
  created_at timestamptz not null default now()
);

create index on public.audit_log (org_id, created_at desc);
create index on public.audit_log (entity_type, entity_id);
create index on public.audit_log (actor_id);

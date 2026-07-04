-- 0049 — Tasarım Panosu: görsel + pin (nokta) yorumları + thread yanıtları.
-- Görseller özel Storage bucket'ında (design-boards), org klasörü bazlı RLS ile.

create table if not exists public.design_boards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null default 'Pano',
  image_path text not null,
  image_width int,
  image_height int,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists design_boards_org_idx
  on public.design_boards(org_id, created_at desc);

create table if not exists public.design_pins (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.design_boards(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  x real not null, -- 0..1 görsele göre yatay konum
  y real not null, -- 0..1 dikey konum
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists design_pins_board_idx
  on public.design_pins(board_id, created_at);

create table if not exists public.design_pin_comments (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.design_pins(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists design_pin_comments_pin_idx
  on public.design_pin_comments(pin_id, created_at);

alter table public.design_boards enable row level security;
alter table public.design_pins enable row level security;
alter table public.design_pin_comments enable row level security;

-- Org üyeleri kendi org'larında okur/yazar (tüm CRUD). current_org_id() paneldeki desen.
create policy "design_boards_all" on public.design_boards for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "design_pins_all" on public.design_pins for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "design_pin_comments_all" on public.design_pin_comments for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- Özel bucket + org-klasörü bazlı erişim (path: <org_id>/...)
insert into storage.buckets (id, name, public)
  values ('design-boards', 'design-boards', false)
  on conflict (id) do nothing;

create policy "design_boards_obj_read" on storage.objects for select to authenticated
  using (bucket_id = 'design-boards' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy "design_boards_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'design-boards' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy "design_boards_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'design-boards' and (storage.foldername(name))[1] = public.current_org_id()::text);

-- 0050 — Tasarım koleksiyonları (panolar) + tasarım↔pano bağı.
-- Tasarımlar koleksiyonlara ("erkek koleksiyonu" gibi) gruplanır; her tasarımın
-- kendi görsel panosu (design_boards.design_id) olur. Şirket hafızası deseni:
-- org bazlı RLS (current_org_id), 0049 ile aynı stil.
--
-- NOT: Bu şema PR #96 sırasında canlı DB'ye uygulanmış ancak migration dosyası
-- repoya işlenmemişti (Devin bulgusu). Bu dosya canlı şemayı birebir yeniden
-- üretir; tüm ifadeler idempotent (if not exists / on conflict).

create table if not exists public.design_collections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists design_collections_org_idx
  on public.design_collections(org_id, created_at desc);

alter table public.design_collections enable row level security;

create policy "design_collections_all" on public.design_collections for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- Tasarım → koleksiyon (opsiyonel). Koleksiyon silinince tasarım koleksiyonsuz kalır.
alter table public.designs
  add column if not exists collection_id uuid references public.design_collections(id) on delete set null;
create index if not exists designs_collection_idx
  on public.designs(collection_id);

-- Pano → tasarım (her tasarımın kendi görseli/notları). Tasarım silinince pano da silinir.
alter table public.design_boards
  add column if not exists design_id uuid references public.designs(id) on delete cascade;
create index if not exists design_boards_design_idx
  on public.design_boards(design_id);

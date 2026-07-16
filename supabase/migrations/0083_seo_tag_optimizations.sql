-- 0083 — SEO tag optimizasyonları (13-tag önerileri: öneri → onay → Etsy'ye gönder → ölç)
--
-- 115 aktif listing için değer-öncelikli optimize 13-tag setleri burada yaşar.
-- Akış: pending (öneri) → approved (onaylandı) → pushed (Etsy'ye yazıldı) veya
-- rejected/failed. Push anında baseline metrik (views/favs/units) yakalanır ki
-- sonradan SEO etkisi ölçülebilsin (measure loop). old_tags = geri-alma verisi.
--
-- Kaynak API sınırı: Etsy arama-hacmi vermez; öneriler müşteri-dili + arketip
-- (leak/bestseller/converter/standart) + kural denetimiyle üretildi. Panel bu
-- alanda tek doğruluk kaynağıdır (0059 deseni).
--
-- RLS: org üyeleri okur + status/öneri düzenler; push (baseline+pushed) yalnız
-- service-role script/cron tarafından yazılır. Audit trigger EKLENMEZ (semantik
-- push olayları logAudit ile 'seo.tags.push' olarak yazılır — 115 seed spam'ı yok).

create table if not exists public.seo_tag_optimizations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint not null,
  title text,
  ptype text,                          -- ring | necklace | bracelet | pendant | earring | other
  archetype text,                      -- leak | bestseller | converter | standart
  old_tags text[] not null,            -- öneri üretildiğindeki mevcut 13 tag (geri-alma)
  proposed_tags text[] not null,       -- optimize 13 tag
  dropped jsonb not null default '[]'::jsonb,  -- [{tag, reason}]
  added jsonb not null default '[]'::jsonb,     -- [{tag, reason}]
  key_issue text,
  rationale text,
  confidence text,                     -- dusuk | orta | yuksek
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'pushed', 'rejected', 'failed')),
  -- Push anı baseline (measure loop) ────────────────────────────────
  baseline_views integer,
  baseline_favs integer,
  baseline_units integer,
  baseline_captured_at timestamptz,
  pushed_at timestamptz,
  pushed_by uuid references auth.users(id) on delete set null,
  pushed_tags text[],                  -- gerçekten Etsy'ye giden set (öneri sonradan düzenlenebilir)
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, etsy_listing_id)
);

create index if not exists seo_tag_opt_org_status_idx
  on public.seo_tag_optimizations (org_id, status);
create index if not exists seo_tag_opt_listing_idx
  on public.seo_tag_optimizations (org_id, etsy_listing_id);

-- updated_at otomatik dokunma
create or replace function public.touch_seo_tag_optimizations()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_seo_tag_opt on public.seo_tag_optimizations;
create trigger trg_touch_seo_tag_opt
  before update on public.seo_tag_optimizations
  for each row execute function public.touch_seo_tag_optimizations();

alter table public.seo_tag_optimizations enable row level security;

-- Org üyeleri okur.
create policy "seo_tag_opt_select" on public.seo_tag_optimizations
  for select to authenticated
  using (org_id = public.current_org_id());

-- Org üyeleri öneriyi onaylar/reddeder/düzenler (status + proposed_tags).
-- Push alanları (baseline/pushed_*) service-role script tarafından yazılır.
create policy "seo_tag_opt_update" on public.seo_tag_optimizations
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

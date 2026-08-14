-- 0141 — product_translations: listing metinlerinin dil katmanı.
-- ---------------------------------------------------------------------------
-- İspanyolca programı (docs/eon/strategy/2026-08-13-eon-iyilestirme-es-yol-
-- haritasi.md, Faz 4): panel üretimi metin DB + repoda yaşar, Etsy aynası
-- ezerse kaynak kaybolmaz (second-brain kuralı). İki kullanım:
--   lang='es'  → Etsy listing translation ucuna gidecek İspanyolca katman
--   lang='en'  → İngilizce başlık/tag REVİZYONUNUN sahnesi (aynı listing'e
--                tek düzenleme geçişi kuralı: en revizyonu ile es çevirisi
--                birlikte push edilir, 7-14 günlük oturma maliyeti bir kez)
-- Akış: workflow üretir (draft) → insan onaylar (approved) → ops rotası
-- push eder + read-back doğrular (pushed / failed). Onaysız satır push
-- kapısından geçemez; hiçbir adım Etsy'ye gözetimsiz yazmaz.

create table if not exists public.product_translations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lang text not null,
  title text,
  description text,
  tags text[],
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'pushed', 'failed')),
  -- Üretim kaynağı (workflow koşusu / elle giriş) — teşhis için.
  source text not null default 'workflow',
  -- Push sonrası read-back uyuşmazlığında insan için kısa neden.
  note text,
  pushed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, product_id, lang)
);

create index if not exists product_translations_org_status_idx
  on public.product_translations (org_id, status);

create trigger set_updated_at
  before update on public.product_translations
  for each row execute function public.set_updated_at();

create trigger audit
  after insert or update or delete on public.product_translations
  for each row execute function public.audit_trigger();

alter table public.product_translations enable row level security;

create policy "product_translations_select" on public.product_translations
  for select to authenticated using (org_id = public.current_org_id());
create policy "product_translations_insert" on public.product_translations
  for insert to authenticated with check (org_id = public.current_org_id());
create policy "product_translations_update" on public.product_translations
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "product_translations_delete" on public.product_translations
  for delete to authenticated
  using (org_id = public.current_org_id()
         and public.current_org_role() in ('owner', 'admin'));

notify pgrst, 'reload schema';

-- 0093 — Otomatik yeniden fiyatlama (reprice) kuralları + uygulama günlüğü.
-- ---------------------------------------------------------------------------
-- Kullanıcı isteği: "fiyatı rakip ortalamasının bir salınımına fixle" — ürün
-- fiyatı, son rakip araştırması çapasının (ortalama/medyan) tolerans üstüne
-- çıkınca hedefe (çapa + hedef offset) çekilir. Günlük cron (0 10 * * *,
-- /api/cron/reprice) kuralları değerlendirir; mode='otomatik' + varyantsız
-- listing'de Etsy'ye fiyat yazılır, aksi halde yalnız öneri loglanır.
--
-- Para kuralı: tüm eşikler tam sayı CENT; kur products.currency'den gelir ve
-- araştırma kaydının kuru ile eşleşmezse kural o turda değerlendirilmez.

-- Ürün başına TEK kural (product_id UNIQUE) — çakışan kural karmaşası olmaz.
create table if not exists public.reprice_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null unique references public.products(id) on delete cascade,
  -- kapali: hiç değerlendirilmez · oneri: yalnız log/uyarı · otomatik: Etsy'ye yaz
  mode text not null default 'oneri'
    check (mode in ('kapali', 'oneri', 'otomatik')),
  -- Çapa: son keyword_research kaydının avg_cents mi median_cents mi?
  anchor text not null default 'ortalama'
    check (anchor in ('ortalama', 'medyan')),
  -- Tetik: bizim fiyat > çapa + trigger_over_cents (varsayılan +$10)
  trigger_over_cents integer not null default 1000
    check (trigger_over_cents >= 0),
  -- Hedef: çapa + target_over_cents (varsayılan +$9)
  target_over_cents integer not null default 900
    check (target_over_cents >= 0),
  -- Mutlak taban (cent). NULL ise taban melt'ten türetilir (aşağıdaki çarpan).
  floor_cents integer check (floor_cents is null or floor_cents > 0),
  -- Melt tabanı çarpanı: taban = melt_per_gram_cents × weight_grams × çarpan
  -- (araştırma kaydında melt + üründe gram varsa hesaplanır).
  floor_melt_mult numeric not null default 1.3 check (floor_melt_mult > 0),
  -- Tek seferde azami yüzde değişim (fiyat şoku emniyeti).
  max_change_pct numeric not null default 10 check (max_change_pct > 0),
  -- Bu güvenin ALTINDAKİ araştırma kaydıyla asla tetiklenmez.
  min_confidence text not null default 'orta'
    check (min_confidence in ('dusuk', 'orta', 'yuksek')),
  -- İki otomatik uygulama arası asgari süre (saat).
  cooldown_hours integer not null default 24 check (cooldown_hours >= 0),
  last_applied_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reprice_rules_org_idx
  on public.reprice_rules (org_id);

create trigger set_updated_at
  before update on public.reprice_rules
  for each row execute function public.set_updated_at();

-- Şirket hafızası: kural değişiklikleri satır-diff'iyle loglanır (0011 deseni).
-- reprice_log zaten kendisi bir günlük — ona ayrıca audit trigger'ı gerekmez.
create trigger audit after insert or update or delete on public.reprice_rules
  for each row execute function public.audit_trigger();

-- Her cron değerlendirmesinin izi: uygulandı / öneri / atlandı + sebep.
-- Uyarı yüzeyleri (Uyarı Merkezi vb.) 'oneri' kayıtlarını buradan okuyabilir.
create table if not exists public.reprice_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rule_id uuid references public.reprice_rules(id) on delete set null,
  old_price_cents integer,
  new_price_cents integer,
  -- kullanılan çapa değeri (avg/median, cent)
  anchor_cents integer,
  -- kullanılan araştırma kaydı özeti: {research_id, keyword, researched_at,
  -- anchor, avg_cents, median_cents, confidence, result_count,
  -- melt_per_gram_cents, floor_cents, currency}
  basis jsonb,
  outcome text not null check (outcome in ('uygulandi', 'oneri', 'atlandi')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists reprice_log_org_idx
  on public.reprice_log (org_id, created_at desc);
-- Ürün detay kartındaki "son 5 kayıt" sorgusu için.
create index if not exists reprice_log_product_idx
  on public.reprice_log (org_id, product_id, created_at desc);

-- RLS: org üyeleri kuralları okur/yönetir (0077 deseni). Günlük yazma yalnız
-- service-role (cron/server action) — reprice_log'a insert policy yok.
alter table public.reprice_rules enable row level security;
alter table public.reprice_log enable row level security;

create policy "reprice_rules_select" on public.reprice_rules
  for select to authenticated
  using (org_id = public.current_org_id());
create policy "reprice_rules_insert" on public.reprice_rules
  for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "reprice_rules_update" on public.reprice_rules
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "reprice_rules_delete" on public.reprice_rules
  for delete to authenticated
  using (org_id = public.current_org_id());

create policy "reprice_log_select" on public.reprice_log
  for select to authenticated
  using (org_id = public.current_org_id());

-- PIN SİSTEMİ — kişiye özel emaye pin (sticker) setleri + panoya iğneleme.
--
-- Kavram: her KULLANICININ kendi pin seti vardır (pin_stickers; hesap-küresel,
-- org'a bağlı değil — kullanıcı hangi şirkette gezerse gezsin kendi setini
-- taşır). Kullanıcı bu pinleri panodaki yüzeylere iğneler (pins; org-kapsamlı
-- instance): görev, satış, zaman-çizelgesi olayı, kayıt (audit) satırı.
-- Aynı yere birden çok pin iğnelenebilir — UI yan yana asimetrik dizer.
-- Portre pini (kind='person') aynı zamanda kullanıcının profil fotoğrafıdır.

create table if not exists public.pin_stickers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  label text not null,
  src text not null, -- public asset yolu (/pins/<owner>/<key>.png)
  kind text not null default 'badge' check (kind in ('person', 'badge')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_user_id, key)
);

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sticker_id uuid not null references public.pin_stickers(id) on delete cascade,
  pinned_by uuid references auth.users(id) on delete set null,
  -- Hedef yüzey: task/sale/audit uuid taşır; event türetilmiş satır olduğundan
  -- deterministik bileşik anahtar taşır (kind|tarih|başlık).
  target_type text not null check (target_type in ('task', 'sale', 'event', 'audit')),
  target_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists pins_org_target_idx
  on public.pins (org_id, target_type, target_id);

-- Şirket hafızası: iğneleme/kaldırma da olaydır.
drop trigger if exists audit on public.pins;
create trigger audit after insert or update or delete on public.pins
  for each row execute function public.audit_trigger();

alter table public.pin_stickers enable row level security;
alter table public.pins enable row level security;

-- Sticker setleri: herkes OKUR (başkasının iğnelediği pini render etmek için
-- görsel/etiket gerekir); yazma yalnız sahibinde (seed migration'la gelir).
drop policy if exists "pin_stickers_select" on public.pin_stickers;
create policy "pin_stickers_select" on public.pin_stickers
  for select to authenticated using (true);
drop policy if exists "pin_stickers_insert" on public.pin_stickers;
create policy "pin_stickers_insert" on public.pin_stickers
  for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists "pin_stickers_delete" on public.pin_stickers;
create policy "pin_stickers_delete" on public.pin_stickers
  for delete to authenticated using (owner_user_id = auth.uid());

-- Pinler: org üyeleri görür; kullanıcı YALNIZ KENDİ setinden iğneler
-- ("her set hesabına özel" kuralı poliçede zorlanır); kaldırmayı iğneleyen
-- veya owner/admin yapar.
drop policy if exists "pins_select" on public.pins;
create policy "pins_select" on public.pins
  for select to authenticated using (org_id = public.current_org_id());
drop policy if exists "pins_insert" on public.pins;
create policy "pins_insert" on public.pins
  for insert to authenticated with check (
    org_id = public.current_org_id()
    and pinned_by = auth.uid()
    and exists (
      select 1 from public.pin_stickers s
      where s.id = sticker_id and s.owner_user_id = auth.uid()
    )
  );
drop policy if exists "pins_delete" on public.pins;
create policy "pins_delete" on public.pins
  for delete to authenticated using (
    org_id = public.current_org_id()
    and (pinned_by = auth.uid() or public.current_org_role() in ('owner', 'admin'))
  );

-- ── Seed: mevcut üç setin kayıtları (idempotent). Gamze setinde HÜSAM yazılı
-- pin BİLEREK yok (kullanıcı kararı). Yasin'in seti her iki hesabına bağlanır.
-- Efe'nin seti görseller gelince aynı desenle eklenecek. ──
with sets(email, key, label, src, kind, sort) as (
  values
    -- Gamze — ggamzesaglam@gmail.com
    ('ggamzesaglam@gmail.com', 'person', 'Gamze', '/pins/gamze/person.png', 'person', 0),
    ('ggamzesaglam@gmail.com', 'cat', 'Pamuk kedi', '/pins/gamze/cat.png', 'badge', 1),
    ('ggamzesaglam@gmail.com', 'jg-monogram', 'JG monogram', '/pins/gamze/jg-monogram.png', 'badge', 2),
    ('ggamzesaglam@gmail.com', 'chain', 'Altın zincir', '/pins/gamze/chain.png', 'badge', 3),
    ('ggamzesaglam@gmail.com', 'jade', 'Yeşim taşı', '/pins/gamze/jade.png', 'badge', 4),
    ('ggamzesaglam@gmail.com', 'ring-box', 'Yüzük kutusu', '/pins/gamze/ring-box.png', 'badge', 5),
    ('ggamzesaglam@gmail.com', 'curated-chaos', 'Curated Chaos', '/pins/gamze/curated-chaos.png', 'badge', 6),
    ('ggamzesaglam@gmail.com', 'coffee-notes', 'Kahve & defter', '/pins/gamze/coffee-notes.png', 'badge', 7),
    -- Hüsam — husam.ari@artifact-studio.com
    ('husam.ari@artifact-studio.com', 'person', 'Hüsam', '/pins/husam/person.png', 'person', 0),
    ('husam.ari@artifact-studio.com', 'curator', 'Curator', '/pins/husam/curator.png', 'badge', 1),
    ('husam.ari@artifact-studio.com', 'husam-name', 'Hüsam plaka', '/pins/husam/husam-name.png', 'badge', 2),
    ('husam.ari@artifact-studio.com', 'amuletta', 'Amuletta', '/pins/husam/amuletta.png', 'badge', 3),
    ('husam.ari@artifact-studio.com', 'motel-tag', 'Rooftop Nights', '/pins/husam/motel-tag.png', 'badge', 4),
    ('husam.ari@artifact-studio.com', 'hummingbird', 'Sinek kuşu', '/pins/husam/hummingbird.png', 'badge', 5),
    ('husam.ari@artifact-studio.com', 'ring', 'Yıldızlı yüzük', '/pins/husam/ring.png', 'badge', 6),
    ('husam.ari@artifact-studio.com', 'basket', 'Hasır sepet', '/pins/husam/basket.png', 'badge', 7),
    -- Yasin — iki hesabına da aynı set
    ('yasin@eonfinejewelry.com', 'person', 'Yasin', '/pins/yasin/person.png', 'person', 0),
    ('yasin@eonfinejewelry.com', 'eon-medallion', 'EON madalyon', '/pins/yasin/eon-medallion.png', 'badge', 1),
    ('yasin@eonfinejewelry.com', 'yasin-name', 'Yasin plaka', '/pins/yasin/yasin-name.png', 'badge', 2),
    ('yasin@eonfinejewelry.com', 'engraver', 'Gravür ustası', '/pins/yasin/engraver.png', 'badge', 3),
    ('yasin@eonfinejewelry.com', 'gemstone', 'Ham taş', '/pins/yasin/gemstone.png', 'badge', 4),
    ('yasin@eonfinejewelry.com', 'ring', 'Alyans', '/pins/yasin/ring.png', 'badge', 5),
    ('yasin@eonfinejewelry.com', 'ring-box', 'EON yüzük kutusu', '/pins/yasin/ring-box.png', 'badge', 6),
    ('yasin@eonfinejewelry.com', 'money', 'Deste', '/pins/yasin/money.png', 'badge', 7),
    ('yasin@eonfinejewelry.com', 'tesla', 'Siyah Tesla', '/pins/yasin/tesla.png', 'badge', 8),
    ('yasin@eonfinejewelry.com', 'eon-plate', 'EON plaka', '/pins/yasin/eon-plate.png', 'badge', 9),
    ('yasin@eonfinejewelry.com', 'ring-hammered', 'Dövme yüzük', '/pins/yasin/ring-hammered.png', 'badge', 10),
    ('yasin@eonfinejewelry.com', 'mandrel', 'Atölye takımı', '/pins/yasin/mandrel.png', 'badge', 11),
    ('yasin@eonfinejewelry.com', 'sketch', 'Tasarım eskizi', '/pins/yasin/sketch.png', 'badge', 12),
    ('yasin@eonfinejewelry.com', 'gold-pour', 'Altın döküm', '/pins/yasin/gold-pour.png', 'badge', 13),
    ('yasin@eonfinejewelry.com', 'emerald', 'Zümrüt', '/pins/yasin/emerald.png', 'badge', 14),
    ('yasin@eonfinejewelry.com', 'naive', 'Naive', '/pins/yasin/naive.png', 'badge', 15),
    ('yasin@eonfinejewelry.com', 'star', 'Pusula yıldızı', '/pins/yasin/star.png', 'badge', 16),
    ('yasnozkocak@gmail.com', 'person', 'Yasin', '/pins/yasin/person.png', 'person', 0),
    ('yasnozkocak@gmail.com', 'eon-medallion', 'EON madalyon', '/pins/yasin/eon-medallion.png', 'badge', 1),
    ('yasnozkocak@gmail.com', 'yasin-name', 'Yasin plaka', '/pins/yasin/yasin-name.png', 'badge', 2),
    ('yasnozkocak@gmail.com', 'engraver', 'Gravür ustası', '/pins/yasin/engraver.png', 'badge', 3),
    ('yasnozkocak@gmail.com', 'gemstone', 'Ham taş', '/pins/yasin/gemstone.png', 'badge', 4),
    ('yasnozkocak@gmail.com', 'ring', 'Alyans', '/pins/yasin/ring.png', 'badge', 5),
    ('yasnozkocak@gmail.com', 'ring-box', 'EON yüzük kutusu', '/pins/yasin/ring-box.png', 'badge', 6),
    ('yasnozkocak@gmail.com', 'money', 'Deste', '/pins/yasin/money.png', 'badge', 7),
    ('yasnozkocak@gmail.com', 'tesla', 'Siyah Tesla', '/pins/yasin/tesla.png', 'badge', 8),
    ('yasnozkocak@gmail.com', 'eon-plate', 'EON plaka', '/pins/yasin/eon-plate.png', 'badge', 9),
    ('yasnozkocak@gmail.com', 'ring-hammered', 'Dövme yüzük', '/pins/yasin/ring-hammered.png', 'badge', 10),
    ('yasnozkocak@gmail.com', 'mandrel', 'Atölye takımı', '/pins/yasin/mandrel.png', 'badge', 11),
    ('yasnozkocak@gmail.com', 'sketch', 'Tasarım eskizi', '/pins/yasin/sketch.png', 'badge', 12),
    ('yasnozkocak@gmail.com', 'gold-pour', 'Altın döküm', '/pins/yasin/gold-pour.png', 'badge', 13),
    ('yasnozkocak@gmail.com', 'emerald', 'Zümrüt', '/pins/yasin/emerald.png', 'badge', 14),
    ('yasnozkocak@gmail.com', 'naive', 'Naive', '/pins/yasin/naive.png', 'badge', 15),
    ('yasnozkocak@gmail.com', 'star', 'Pusula yıldızı', '/pins/yasin/star.png', 'badge', 16)
)
insert into public.pin_stickers (owner_user_id, key, label, src, kind, sort)
select u.id, s.key, s.label, s.src, s.kind, s.sort
from sets s
join auth.users u on u.email = s.email
on conflict (owner_user_id, key) do nothing;

-- Kullanıcı kararı: "bundan böyle profil fotoğrafı = portre pin cutout'u".
update public.profiles p
set avatar_url = s.src
from public.pin_stickers s
where s.owner_user_id = p.id and s.kind = 'person';

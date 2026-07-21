-- PIN KÜTÜPHANESİ + EFE SETİ.
--
-- Kural değişikliği (kullanıcı kararı): pin setleri artık ORTAK kütüphane —
-- her org üyesi HERKESİN rozet (badge) pinini iğneleyebilir. Portre pinleri
-- (kind='person') kütüphaneye girmez: onlar profil pinidir (avatar) ve
-- iğnelenemez.

drop policy if exists "pins_insert" on public.pins;
create policy "pins_insert" on public.pins
  for insert to authenticated with check (
    org_id = public.current_org_id()
    and pinned_by = auth.uid()
    and exists (
      select 1 from public.pin_stickers s
      where s.id = sticker_id and s.kind = 'badge'
    )
  );

-- ── Efe'nin seti (idempotent seed) ──
with sets(email, key, label, src, kind, sort) as (
  values
    ('efe.ari@artifact-studio.com', 'person', 'Efe', '/pins/efe/person.png', 'person', 0),
    ('efe.ari@artifact-studio.com', 'efe-name', 'Efe plaka', '/pins/efe/efe-name.png', 'badge', 1),
    ('efe.ari@artifact-studio.com', 'raptor', 'Raptor', '/pins/efe/raptor.png', 'badge', 2),
    ('efe.ari@artifact-studio.com', 'boss', 'Boss', '/pins/efe/boss.png', 'badge', 3),
    ('efe.ari@artifact-studio.com', 'money', 'Deste', '/pins/efe/money.png', 'badge', 4),
    ('efe.ari@artifact-studio.com', 'jg-medallion', 'JG madalyon', '/pins/efe/jg-medallion.png', 'badge', 5),
    ('efe.ari@artifact-studio.com', 'cuban-chain', 'Küba zinciri', '/pins/efe/cuban-chain.png', 'badge', 6),
    ('efe.ari@artifact-studio.com', 'jade-ring', 'Yeşim yüzük', '/pins/efe/jade-ring.png', 'badge', 7)
)
insert into public.pin_stickers (owner_user_id, key, label, src, kind, sort)
select u.id, s.key, s.label, s.src, s.kind, s.sort
from sets s
join auth.users u on u.email = s.email
on conflict (owner_user_id, key) do nothing;

-- Portre pini profil fotoğrafı olur (0113 kuralının Efe'ye uygulanması).
update public.profiles p
set avatar_url = s.src
from public.pin_stickers s
where s.owner_user_id = p.id and s.kind = 'person';

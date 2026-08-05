-- 0108 — EON size/width SEO edge (pilot)
-- Meridian (Dome *01) + Keystone (Beveled *03): promote US 4–13 + wide widths where TRUE.
-- title / tags / research_keyword; append SIZE QUESTIONS FAQ (keep v3 body).
-- Cornice slim-only claims deferred until inventory matches. No doorway pages.


update public.products
set
  title = $eon_t$14K Solid Yellow Gold Wedding Band, Dome, US 4 to 13$eon_t$,
  tags = ARRAY['solid 14k gold ring','14k gold band','mens wedding band','womens wedding ring','anniversary ring','dome wedding ring','comfort fit band','thin gold band','wide gold ring','engraved gold band','custom engraved ring','mens size 13 ring','wide wedding band']::text[],
  research_keyword = $eon_rk$14k yellow gold size 13 wedding band$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'GLD-R-1401'
  and archived_at is null;

update public.products
set
  title = $eon_t$14K Solid White Gold Wedding Band, Dome, US 4 to 13$eon_t$,
  tags = ARRAY['14k white gold ring','solid 14k gold band','mens wedding band','womens wedding ring','anniversary ring','dome wedding ring','comfort fit band','thin gold band','wide gold ring','engraved gold ring','custom engraved ring','mens size 13 ring','made to your size']::text[],
  research_keyword = $eon_rk$14k white gold large size wedding band$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'WHG-R-1401'
  and archived_at is null;

update public.products
set
  title = $eon_t$14K Solid Rose Gold Dome Wedding Band, US 4 to 13$eon_t$,
  tags = ARRAY['solid 14k gold ring','rose gold band','dome wedding ring','comfort fit band','mens wedding band','womens promise ring','anniversary ring','engraved gold ring','personalized band','thin gold band','wide gold ring','wide wedding band','made to your size']::text[],
  research_keyword = $eon_rk$14k rose gold wedding band wide sizes$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'RSG-R-1401'
  and archived_at is null;

update public.products
set
  title = $eon_t$14K Yellow Gold Beveled Wedding Band, Wide 2 to 12mm$eon_t$,
  tags = ARRAY['solid 14k gold ring','14k gold band','mens wedding band','womens wedding ring','unisex wedding band','anniversary ring','flat wedding band','beveled edge ring','wide gold ring','custom engraved ring','wide wedding band','8mm gold band','mens wide band']::text[],
  research_keyword = $eon_rk$wide 14k yellow gold beveled wedding band$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make larger sizes? Yes. US 4 through 16, including 11 to 13 where competition thins out.
Looking for a wide band? Yes. This profile runs 2 mm to 12 mm; six to eight millimeters reads as a wide solid gold wedding band on the hand.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make larger sizes? Yes. US 4 through 16, including 11 to 13 where competition thins out.
Looking for a wide band? Yes. This profile runs 2 mm to 12 mm; six to eight millimeters reads as a wide solid gold wedding band on the hand.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'GLD-R-1403'
  and archived_at is null;

update public.products
set
  title = $eon_t$14K White Gold Beveled Wedding Band, Wide 2 to 12mm$eon_t$,
  tags = ARRAY['14k white gold ring','solid gold band','white gold mens band','womens wedding ring','beveled edge ring','flat top band','anniversary ring','wide gold ring','engraved gold band','custom engraved ring','wide wedding band','8mm gold band','mens size 13 ring']::text[],
  research_keyword = $eon_rk$wide 14k white gold wedding band$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make larger sizes? Yes. US 4 through 16, including 11 to 13 where competition thins out.
Looking for a wide band? Yes. This profile runs 2 mm to 12 mm; six to eight millimeters reads as a wide solid gold wedding band on the hand.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make larger sizes? Yes. US 4 through 16, including 11 to 13 where competition thins out.
Looking for a wide band? Yes. This profile runs 2 mm to 12 mm; six to eight millimeters reads as a wide solid gold wedding band on the hand.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'WHG-R-1403'
  and archived_at is null;

update public.products
set
  title = $eon_t$10K Solid Yellow Gold Dome Wedding Band, US 4 to 13$eon_t$,
  tags = ARRAY['solid 10k gold ring','10k gold band','mens wedding band','womens gold ring','anniversary ring','dome wedding ring','comfort fit band','thin gold band','wide gold ring','engraved gold band','unisex gold band','mens size 13 ring','wide wedding band']::text[],
  research_keyword = $eon_rk$10k yellow gold large size wedding band$eon_rk$,
  description = case
    when coalesce(description, '') like '%SIZE QUESTIONS%' then description
    when coalesce(description, '') like '%WHY EON%' then
      replace(description, E'\nWHY EON', $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$ || E'\nWHY EON')
    else coalesce(description, '') || $eon_f$

SIZE QUESTIONS
Do you make size 13? Yes. This band is cut to US sizes 4 through 16, including the larger sizes most solid-gold shops stop short of.
Can I order an 8 mm band? Yes. Widths run from 2 mm to 12 mm on this profile. Six to eight millimeters is the wide everyday range; two to four millimeters stays slim for stacking.
$eon_f$
  end,
  updated_at = now()
where org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and sku = 'GLD-R-1001'
  and archived_at is null;

insert into public.keyword_ideas (org_id, product_id, seed, keyword, source, score, status)
select e.org_id, p.id, v.seed, v.keyword, 'manual', v.score, 'selected'
from public.organizations e
join lateral (values
  ('GLD-R-1401', 'size 13', 'mens size 13 ring', 72),
  ('GLD-R-1401', 'size 13', 'large size gold wedding band', 68),
  ('GLD-R-1401', 'size 13', '14k gold ring size 13', 70),
  ('GLD-R-1401', 'size 13', 'wide 14k yellow gold band', 66),
  ('GLD-R-1403', 'wide band', 'wide wedding band', 74),
  ('GLD-R-1403', 'wide band', '8mm gold wedding band', 71),
  ('GLD-R-1403', 'wide band', 'wide solid gold ring', 69),
  ('GLD-R-1403', 'wide band', 'mens wide wedding band', 67),
  ('WHG-R-1401', 'large size', 'large size white gold ring', 65),
  ('WHG-R-1401', 'large size', 'made to your size gold ring', 62),
  ('GLD-R-1001', '10k large', '10k gold ring size 13', 64),
  ('GLD-R-1001', '10k large', 'affordable large size gold band', 58)
) as v(sku, seed, keyword, score) on true
join public.products p on p.org_id = e.id and p.sku = v.sku and p.archived_at is null
where e.id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid
  and not exists (
    select 1 from public.keyword_ideas k
    where k.org_id = e.id and k.product_id = p.id and k.keyword = v.keyword
  );

insert into public.tasks
  (org_id, title, description, status, priority, lane, effort, due_date, sort_order, notes)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid,
  t.title,
  t.description,
  'todo',
  t.priority,
  t.lane,
  t.effort,
  t.due_date::date,
  t.sort_order,
  t.notes
from (values
  (110,
   'EON SEO: Large ring sizes intent guide (site)',
   'eonfinejewelry.com üzerinde tek rehber: large / men''s larger US sizes (11–13). Dürüst aralık: US 4–16, vurgu 11–13. Doorway sayfa yok. Meridian (Dome) listinglerine bağlan. FAQ: Do you make size 13?',
   'P1', 'B', '1 gun', '2026-08-05',
   'Etsy önce: GLD-R-1401 / WHG-R-1401 / RSG-R-1401 / GLD-R-1001 size+width etiketleri 0108 ile güncellendi.'),
  (111,
   'EON SEO: Wide solid gold wedding bands intent guide (site)',
   'Tek rehber: wide solid gold wedding bands (6–8 mm+). Keystone (Beveled) ve Meridian genişliklerine bağlan. FAQ: Can I order an 8 mm band? Cornice slim-only iddiası envanter daralana kadar yok.',
   'P1', 'B', '1 gun', '2026-08-05',
   'Pilot etiketler: wide wedding band, 8mm gold band — GLD-R-1403 / WHG-R-1403.')
) as t(sort_order, title, description, priority, lane, effort, due_date, notes)
where not exists (
  select 1 from public.tasks x
  where x.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid and x.title = t.title
);

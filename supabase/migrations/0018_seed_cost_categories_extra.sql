-- 0018 — Ek maliyet kategorileri: Paketleme, Yol / Ulaşım
-- Gamze'nin gider girişini (paketleme, yol masrafı) kolaylaştırmak için.
-- ------------------------------------------------------------------

insert into public.cost_categories (org_id, key, label_tr, is_system)
select o.id, c.key, c.label_tr, true
from public.organizations o
cross join (values
  ('paketleme', 'Paketleme'),
  ('yol_ulasim', 'Yol / Ulaşım')
) as c(key, label_tr)
where o.slug = 'jade-gold-nyc'
on conflict (org_id, key) do nothing;

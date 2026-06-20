-- 0013 — Tohum verisi: tek organizasyon + sistem maliyet kategorileri
-- ------------------------------------------------------------------

insert into public.organizations (name, slug, default_currency)
select 'Jade Gold NYC', 'jade-gold-nyc', 'USD'
where not exists (select 1 from public.organizations);

insert into public.cost_categories (org_id, key, label_tr, is_system)
select o.id, c.key, c.label_tr, true
from public.organizations o
cross join (values
  ('malzeme', 'Malzeme'),
  ('kargo', 'Kargo'),
  ('etsy_ucretleri', 'Etsy Ücretleri'),
  ('reklam', 'Reklam'),
  ('iscilik', 'İşçilik'),
  ('diger', 'Diğer')
) as c(key, label_tr)
where o.slug = 'jade-gold-nyc'
on conflict (org_id, key) do nothing;

-- Listing denetimi (SEO/kalite önerileri) için zenginleştirme alanları.
-- Etsy getListingsByShop bunları döndürür (görseller includes=Images ile).
alter table public.products
  add column if not exists description text,
  add column if not exists tags text[],
  add column if not exists materials text[],
  add column if not exists num_images integer,
  add column if not exists quantity integer,
  add column if not exists has_variations boolean,
  add column if not exists featured_rank integer,
  add column if not exists last_modified_ts bigint;

-- 0088 — Maliyete katlanan taraf (EON ortaklık yapısı): H / Y / I
-- ------------------------------------------------------------------
-- EON ortaklığında her maliyet bir tarafça karşılanır:
--   H = H tarafı · Y = Y tarafı · I = doğrudan kârdan düşen (taraf öncesi)
-- Kolon NULL kalabilir (Jade gibi tek sahipli org'larda taraf kavramı yok).
-- Otomatik atama: kategoriye varsayılan taraf (`cost_categories.default_bearer`)
-- tanımlanır; costs INSERT/UPDATE'inde bearer boşsa trigger kategoriden türetir.
-- Böylece tüm yazım yolları (manuel form, gold_auto motoru, CSV import)
-- ek kod gerektirmeden otomatik atamayı alır; formda elle H/Y/I seçilirse
-- trigger dokunmaz.

alter table public.costs
  add column if not exists bearer text
  check (bearer in ('H', 'Y', 'I'));

comment on column public.costs.bearer is
  'Maliyete katlanan taraf: H | Y | I (I = doğrudan kârdan). NULL = atanmamış.';

alter table public.cost_categories
  add column if not exists default_bearer text
  check (default_bearer in ('H', 'Y', 'I'));

comment on column public.cost_categories.default_bearer is
  'Bu kategorideki maliyetlere otomatik atanacak taraf (boşsa atama yapılmaz).';

create or replace function public.set_cost_bearer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Yalnız boş bırakılan bearer türetilir; elle seçim daima kazanır.
  if new.bearer is null and new.category_id is not null then
    select cc.default_bearer into new.bearer
    from public.cost_categories cc
    where cc.id = new.category_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_cost_bearer on public.costs;
create trigger trg_set_cost_bearer
  before insert or update on public.costs
  for each row execute function public.set_cost_bearer();

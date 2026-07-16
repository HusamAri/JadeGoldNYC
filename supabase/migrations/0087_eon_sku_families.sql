-- 0087 — EON SKU aile sistemi: tek-parça listing SKU'larını EON düzenine çevir
-- ------------------------------------------------------------------
-- EON'un kendi SKU sistemi vardır (Jade'inkinden farklı):
--   <RENK>-<TİP>-<AİLE>[-<mm>-<beden>]
--   RENK: RSG (Rose) | WHG (White) | GLD (Yellow) · TİP: R (Ring)
--   AİLE: 0001 Dome 14K · 0002 Dome 10K · 0003 Flat 14K · 0004 Beveled 14K ·
--         0005 Dome Milgrain 14K · 0006 Knife 14K
-- Kaynak: kullanıcının 16-listing EON planı (EON16Listing.csv +
-- EON16ListingTaslak.html) — her aile "eski #listing" eşlemesiyle verildi.
--
-- 0086 backfill'i EON'a Jade formatı (R<listingId>) basmıştı; bu migration
-- plandaki 17 eski listing'in SKU'larını aile koduna çevirir. GLD-R-0004
-- iki eski listing'i birleştirir (6mm + 8mm) → varyant SKU'ları -6 / -8
-- ekiyle ayrışır (org+sku benzersizliği). Planda olmayan 8 EON listing'i
-- (yarım kalanlar; arşiv+silme adayı) geçici mint SKU'sunda kalır.
-- Idempotent: yalnız eşleşen etsy_listing_id satırlarını günceller.

with map (etsy_listing_id, family_sku) as (
  values
    (4465158721, 'RSG-R-0001'),
    (4465158315, 'WHG-R-0001'),
    (4465740090, 'GLD-R-0001'),
    (4465756567, 'RSG-R-0002'),
    (4465756059, 'WHG-R-0002'),
    (4465755291, 'GLD-R-0002'),
    (4465147939, 'RSG-R-0003'),
    (4465147025, 'WHG-R-0003'),
    (4346570287, 'GLD-R-0003'),
    (4523850732, 'RSG-R-0004'),
    (4523835213, 'WHG-R-0004'),
    (4523823631, 'GLD-R-0004-6'),
    (4527660582, 'GLD-R-0004-8'),
    (4519967667, 'RSG-R-0005'),
    (4519956886, 'WHG-R-0005'),
    (4518770362, 'GLD-R-0005'),
    (4465157369, 'GLD-R-0006')
),
eon as (
  select id as org_id from public.organizations where name = 'EON'
),
upd_variant as (
  update public.product_variants pv
  set sku = m.family_sku
  from map m, eon
  where pv.org_id = eon.org_id
    and pv.etsy_listing_id = m.etsy_listing_id
    and pv.sku <> m.family_sku
  returning pv.etsy_listing_id
)
update public.products p
set sku = m.family_sku
from map m, eon
where p.org_id = eon.org_id
  and p.etsy_listing_id = m.etsy_listing_id
  and (p.sku is distinct from m.family_sku);

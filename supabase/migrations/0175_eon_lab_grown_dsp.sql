-- 0175_eon_lab_grown_dsp.sql
-- (Canlıya 2026-11-04 MCP ile "0173_eon_lab_grown_dsp" adıyla uygulandı; main'de 0173/0174 başka
-- migration'lara ait olduğu için dosya 0175'e taşındı. İçerik birebir, idempotent.)
-- EON'un ilk lab-grown pırlantalı listing'i: 14K Double Shared Prong yarım tur bant,
-- 13 round lab-grown taş (≈0,78 ct), Metal Color (3) × Ring Size (US 4-10, 13) = 39 varyant,
-- her beden tek fiyat $1.200 (sahip kararı 2026-11-04; alıcı %25 vitrinle $900).
-- Kaynak paket: docs/eon/lab-grown/01-double-shared-prong/ (fiyat kanıtı: docs/eon/lab-grown/2026-11-04-double-shared-prong-pricing.md).
-- Üretici: scripts/eon/gen_lab_grown_dsp_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: Etsy gerçek fotoğraf ister; listing_metadata.draftTransfer = hold ile
-- ops/drafts-push atlar. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-DSP-%';
--   beklenen: 93cbbc41e4f3cd1e28d8d41db67e1ac4
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0', 'EON-DSP', $ww$14K Gold Lab Grown Diamond Wedding Band, Double Shared Prong, Half Eternity, 2.75mm$ww$,
  $ww$A slim 14K gold band set with a row of lab grown diamonds in double shared prongs. Each stone sits between two pairs of prongs, so more of it is open to the light and the row reads as one continuous line of brightness. The stones run around the top half of the ring; the back is plain polished gold, comfortable against the finger and easy to resize.

YOUR RING
Solid 14K gold in yellow, white or rose. 13 round lab grown diamonds, about 2.4 mm each, approximately 0.78 carats in total. Band width about 2.75 mm, height about 2.5 mm, comfort-fit interior. The price is for one ring in your selected metal color and size; the lab grown diamonds are included.

CHOOSE YOUR OPTIONS
1. Metal Color: Yellow Gold, White Gold or Rose Gold.
2. Ring Size: US 4 to US 10, including half sizes. One price for every size.

ABOUT THE LAB GROWN DIAMONDS
Laboratory-grown diamonds are grown above ground and have the same crystal structure, hardness and brilliance as mined diamonds; they are not simulants. Each stone in this band is a round brilliant cut, matched for size and brightness.

SIZING AND RESIZING
Made to order in your size. Because the stones cover only the top half of the band, a jeweler can usually resize the ring within about one size; a full-eternity style cannot be resized. If you are unsure of your size, contact EON before ordering.

MADE FOR YOU
Made to order from raw precious-metal materials. The preparation time before dispatch is shown in the shipping details of this listing; transit time is separate.

CARE
Clean gently with mild soap, lukewarm water and a soft brush around the prongs, then pat dry. Avoid harsh chemicals and abrasive cleaners. Remove the ring before heavy work or sport; prongs can catch, and a jeweler should check them every year or two.$ww$,
  ARRAY[$ww$lab grown diamond$ww$,$ww$lab created diamond$ww$,$ww$lab grown band$ww$,$ww$lab grown ring$ww$,$ww$lab grown eternity$ww$,$ww$half eternity band$ww$,$ww$shared prong band$ww$,$ww$14k gold band$ww$,$ww$white gold band$ww$,$ww$rose gold band$ww$,$ww$yellow gold band$ww$,$ww$eternity ring$ww$,$ww$stackable gold band$ww$]::text[], ARRAY[$ww$Solid 14K yellow gold$ww$,$ww$Solid 14K white gold$ww$,$ww$Solid 14K rose gold$ww$,$ww$Lab grown diamond$ww$]::text[], 'draft', 'USD',
  120000, 20, true, null, 0, 'ring',
  'round', 'lab', 13, 400, 0,
  $ww${"productType":"ring","listingProtocol":"diamond_band","protocolVersion":"etsy-listing-v1","section":null,"sourcePackage":"2026-11-04-eon-lab-grown-dsp","sourcePackagePath":"docs/eon/lab-grown/01-double-shared-prong","generatorScript":"scripts/eon/gen_lab_grown_dsp_migration.mjs","sourceReferenceUrl":"https://brillianceindiamonds.com/products/lab-grown-double-shared-prong-diamond-band","variationAxes":["Metal Color","Ring Size"],"metalColor":"Yellow, white or rose gold (Metal Color axis)","goldSolidity":"Solid gold","offersPersonalization":false,"stone":{"origin":"lab","shape":"round","count":13,"stoneMm":2.4,"totalCarat":0.78,"colorClarity":null,"settingFeeCents":400,"castingFeeCents":0,"stoneCostCentsEstimate":8000,"stoneCostNote":"Inside the maker's all-in $550 quote, not itemised; ~$6/stone estimate for the panel cost view."},"band":{"widthMm":2.75,"heightMm":2.5,"karat":"14K"},"pricing":{"makerQuoteUsd":550,"makerQuoteCovers":"14K gold + labor + 13 stones + setting, US 7, one price intended for all sizes (independent model $529; maker's 2.75x2.5 mm band formula 5.48 g x $100/g = $548)","packagingUsd":8,"shippingUsd":22,"landedUsd":580,"multiplier":1.55,"engineUsd":899,"storePromotionRate":0.25,"listUsd":1200,"buyerUsd":900,"competitorUsd":945,"floorUsd":649,"offsiteFloorUsd":779,"modeledProfitWorstOffsiteUsd":134,"onePriceAllSizes":true,"spotUsdPerOzt":4065.8,"spotDate":"2026-11-04","methodology":"docs/eon/lab-grown/price_model.py; formula lib/pricing-engine/eon-cost.ts 457-472"},"approval":{"authority":"Owner 2026-11-04: list $1,200 -> 25% showcase -> $900; v1 = 14K, 3 colours, half-around (13 stones), US 4-10, one price for every size. Panel draft only; Etsy push waits for a real photo.","panelDraftAuthorized":true,"etsyDraftCreationAuthorized":false,"livePublicationAuthorized":false,"blockers":["No images: Etsy (2026-10-22) requires at least one unedited photo of the physical piece; the maker has not made or photographed a sample","Maker to confirm: $550 holds for US 4-10 at one price; stone colour/clarity grade; whether white gold is rhodium plated; preparation time","No shop section for lab grown pieces yet (owner creates it in Etsy before the push)","Spanish translation not written"]},"draftTransfer":{"status":"hold","route":"manual","reason":"real product photo required before any Etsy draft (playbook 01/04); remove the hold when the gallery exists","heldAt":"2026-11-04"},"variantSeal":"93cbbc41e4f3cd1e28d8d41db67e1ac4"}$ww$::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-DSP'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  'EON-DSP-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  120000,
  20,
  s.grams,
  'estimated',
  true,
  'USD',
  0.78,
  8000,
  'manual'
from public.products p
cross join (values ('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) as c(code, name)
cross join (values
    (4.0,'4',3.87),
    (4.5,'4.5',3.96),
    (5.0,'5',4.05),
    (5.5,'5.5',4.14),
    (6.0,'6',4.23),
    (6.5,'6.5',4.32),
    (7.0,'7',4.41),
    (7.5,'7.5',4.50),
    (8.0,'8',4.59),
    (8.5,'8.5',4.68),
    (9.0,'9',4.77),
    (9.5,'9.5',4.86),
    (10.0,'10',4.95)) as s(size, label, grams)
where p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0' and p.sku = 'EON-DSP'
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  stone_carat = excluded.stone_carat,
  stone_cost_cents = excluded.stone_cost_cents,
  stone_cost_source = excluded.stone_cost_source,
  updated_at = now();

commit;

-- 0143 — EON İspanyolca katmanı: mağaza-geneli değişmezlerin birleştirilmesi.
-- ---------------------------------------------------------------------------
-- Neden: 0142'nin metinleri 4 aileye bölünmüş bir workflow'da üretildi ve her
-- ajana yalnız "kendi partinde tutarlı ol" dendi. Sonuç: her metin kendi içinde
-- tutarlı, biçim kapısı temiz — ama MAĞAZA GENELİ nitelikler dörde bölünmüştü.
-- Bunlar ancak tüm sette koşulan kod sayacıyla görülür, ajan raporuyla değil.
--
-- Bu migration dört değişmezi sabitler:
--   1. Marka kuyruğu — 4 varyant vardı (SOBRE EON / PERSONALIZACIÓN /
--      MATERIAL Y OPCIONES / HECHO PARA UNA PERSONA / EON bölümlerinin BEŞİ de
--      ayrışmıştı). Kanonik metin, canlı İngilizce kuyruğun (919 kr, kaynak
--      listing 4539764153) bölüm bölüm karşılığıdır.
--   2. Ölçü birimi — `2mm` → `2 mm` (İspanyolcada sayı ile birim arasına boşluk
--      konur; İngilizce tarafta bitişik biçim doğru ve öyle KALIR).
--   3. Karat — malzeme ifadesi küçük harf (`oro de 10k`), fiziksel damga büyük
--      harf (`sello 10K`; yüzüğe basılan mühür gerçekten "10K" okur).
--   4. `banda` anglisizmi — ayrıca `banda ancha` İspanyolcada "geniş bant
--      internet" okunur.
--
-- Kural yazılı hâli: docs/eon/seo/es-ses-tonu.md
-- İstisna (belgelenmiş): 4543000739 tükenmiş tek parça özel sipariş metnidir,
-- marka kuyruğu taşımaz — bu migration ona dokunmaz ('SOBRE EON' içermiyor).
--
-- Gövde metinlerine (açılış, ürün gerçekleri, madde listeleri) DOKUNULMAZ.
-- Idempotent: dört dönüşüm de kendi çıktısı üzerinde sabit noktadır.
-- status/tags/pushed_at DEĞİŞMEZ — bu satırlar hâlâ 'draft' ve Etsy'ye gidemez.

begin;

with kanonik as (
  select $kuyruk$SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Nuestro orfebre fabrica cada pieza por encargo, en oro macizo de 10k o 14k, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo. Los estilos de letra disponibles y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del metal, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$kuyruk$ as tail
)
update product_translations t
set description = substring(t.description from 1 for position('SOBRE EON' in t.description) - 1) || k.tail
from kanonik k
where t.lang = 'es'
  and position('SOBRE EON' in t.description) > 0
  and substring(t.description from position('SOBRE EON' in t.description)) is distinct from k.tail;

-- Ölçü birimi, karat ve anglisizm: yalnız 'es' satırlarında.
update product_translations
set description = regexp_replace(description, '([0-9])mm', '\1 mm', 'g')
where lang = 'es' and description ~ '[0-9]mm';

update product_translations
set description = regexp_replace(
      regexp_replace(description, '1([0248])K', '1\1k', 'g'),
      '(sello de |sello |sellada |sellado )(1[0248])k', '\1\2K', 'g')
where lang = 'es'
  and description ~ '1[0248][Kk]'
  and description is distinct from regexp_replace(
      regexp_replace(description, '1([0248])K', '1\1k', 'g'),
      '(sello de |sello |sellada |sellado )(1[0248])k', '\1\2K', 'g');

update product_translations
set description = replace(description,
      'o una banda ancha que se sostenga sola', 'o uno ancho que se sostenga solo')
where lang = 'es' and description like '%o una banda ancha que se sostenga sola%';

update product_translations
set description = replace(description,
      'más despacio que una banda lisa', 'más despacio que un anillo liso')
where lang = 'es' and description like '%más despacio que una banda lisa%';

-- Kabul kapısı: değişmezler tutmuyorsa migration BAŞARISIZ olur (sessiz geçmez).
do $gate$
declare
  v_kuyruk_varyant int;
  v_mm_bitisik     int;
  v_banda          int;
  v_draft_disi     int;
begin
  select count(distinct substring(description from position('SOBRE EON' in description)))
    into v_kuyruk_varyant
    from product_translations
   where lang = 'es' and position('SOBRE EON' in description) > 0;

  select count(*) filter (where description ~ '[0-9]mm'),
         count(*) filter (where description ~ '\mbanda\M'),
         count(*) filter (where status <> 'draft' or tags is not null or pushed_at is not null)
    into v_mm_bitisik, v_banda, v_draft_disi
    from product_translations where lang = 'es';

  if v_kuyruk_varyant <> 1 then
    raise exception '0143: kanonik kuyruk tek olmalı, % varyant bulundu', v_kuyruk_varyant;
  end if;
  if v_mm_bitisik <> 0 then
    raise exception '0143: bitişik mm biçimi kaldı (% satır)', v_mm_bitisik;
  end if;
  if v_banda <> 0 then
    raise exception '0143: banda anglisizmi kaldı (% satır)', v_banda;
  end if;
  if v_draft_disi <> 0 then
    raise exception '0143: es satırları draft/tags NULL/pushed NULL olmalı (% sapma)', v_draft_disi;
  end if;
end
$gate$;

commit;

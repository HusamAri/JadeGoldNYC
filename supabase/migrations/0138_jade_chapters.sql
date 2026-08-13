-- 0138 — Anlam Bölümleri (Chapters): sınıflandırmayı kalıcılaştır
--
-- `lib/collections/chapters.ts` saf motoru bölümü başlıktan TÜRETİR ama hiçbir
-- yerde saklanmaz: her okuma yeniden hesaplar, elle düzeltme yapılamaz ve
-- bölüm-bazlı sorgu (facet, sayaç, staging join) yazılamaz. Bu migration
-- türetilmiş değeri products'a yazar ve elle geçersiz kılmaya (override) izin verir.
--
-- Etsy-ayna kuralı (0089 deseni): `chapter` ve `chapter_locked` PANEL yaşam-döngüsü
-- alanlarıdır — `lib/etsy/sync.ts` upsert alan listesinde YOKTUR, bu yüzden senkron
-- bunları ezmez. Senkron yeni listing getirdiğinde chapter NULL kalır; backfill
-- fonksiyonu tekrar çalıştırılarak (veya panelden) doldurulur.
--
-- chapter_locked = true → insan kararı; otomatik backfill bu satıra DOKUNMAZ.
-- Böylece motorun yanlış sınıfladığı parça (ör. "Lion & Eagle" hem koruma hem
-- statü) elle sabitlenir ve bir sonraki toplu çalıştırmada geri dönmez.

alter table public.products
  add column if not exists chapter text
    check (chapter is null or chapter in
      ('protection', 'faith', 'love', 'legacy', 'chains', 'earrings', 'rings')),
  add column if not exists chapter_locked boolean not null default false,
  -- Etsy vitrin bölümü (canlı mağazada listing hangi section'da duruyor).
  -- Bölüm ADLARI etsy_shop_sections'ta; burada yalnız bağ. Bu kolon anlam
  -- bölümünden (chapter) FARKLI bir eksendir: Etsy'deki bölümler biçim-temelli
  -- (Bracelets / Earrings / Cuban Link), chapter ise anlam-temelli. İkisi
  -- birlikte "vitrinde nerede duruyor" + "hangi hikâyeyi anlatıyor" sorularını
  -- ayrı ayrı cevaplar. Bunu senkron YAZAR (Etsy aynası).
  add column if not exists etsy_section_id bigint;

comment on column public.products.chapter is
  'Anlam bölümü (lib/collections/chapters.ts). Panel alanı — Etsy senkronu yazmaz.';
comment on column public.products.chapter_locked is
  'true ise bölüm elle sabitlendi; otomatik backfill atlar.';

create index if not exists products_org_chapter_idx
  on public.products (org_id, chapter);

-- ── Sınıflandırma: chapters.ts RULES dizisinin SQL karşılığı ─────────────────
-- Sıra KRİTİK: anlam biçimden önce gelir (Last Supper Ring → faith, yüzük değil).
-- Kelime sınırı (\m…\M) ZORUNLU: sınırsız 'ring' deseni herRINGbone ve steRLINGe
-- eşleşir ve tüm zincirleri yüzük yapardı (TS motorundaki \b'nin Postgres karşılığı).
create or replace function public.derive_chapter(p_title text, p_tags text[])
returns text
language sql
immutable
as $$
  with t as (select lower(coalesce(p_title, '') || ' ' || coalesce(array_to_string(p_tags, ' '), '')) as txt)
  select case
    when (select txt from t) ~ '(last supper|baby angel|\m(jesus|crucifix|cross|rosary|saint|religious|christian|praying|guadalupe|virgin|angel|medallion)\M)' then 'faith'
    when (select txt from t) ~ '(evil eye|italian horn|good luck|\m(hamsa|nazar|cornicello|elephant|protection|pharaoh|panther|lion|eagle)\M)' then 'protection'
    when (select txt from t) ~ '(\mheart\M|teddy|butterfly)' then 'love'
    when (select txt from t) ~ '(\mcuban\M|\mfranco\M|mariner|anchor|ice[d]?\s?out|\miced\M|\mcurb\M)' then 'legacy'
    when (select txt from t) ~ '(earring|\mhoops?\M|huggie|\mstuds?\M)' then 'earrings'
    when (select txt from t) ~ '(\mrings?\M|\mband\M|wedding)' then 'rings'
    else 'chains'
  end
$$;

comment on function public.derive_chapter(text, text[]) is
  'Başlık+etiketten anlam bölümü türetir. lib/collections/chapters.ts RULES ile birebir aynı sıra/desen.';

-- ── Backfill: kilitli olmayan satırları (yeniden) sınıfla ───────────────────
-- Idempotent + tekrar çalıştırılabilir: senkron yeni listing getirdikçe çağrılır.
create or replace function public.backfill_chapters(p_org uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.products p
     set chapter = public.derive_chapter(p.title, p.tags)
   where p.org_id = p_org
     and p.chapter_locked = false
     and p.etsy_listing_id is not null
     and p.etsy_deleted_at is null
     and p.chapter is distinct from public.derive_chapter(p.title, p.tags);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

comment on function public.backfill_chapters(uuid) is
  'Kilitsiz listingleri yeniden sınıflar, değişen satır sayısını döner. Senkron sonrası çağrılabilir.';

revoke execute on function public.backfill_chapters(uuid) from public, anon;

-- Jade Gold canlı kataloğunu şimdi sınıfla (EON dahil tüm org'lar için güvenli:
-- yalnız Etsy'de var olan, silinmemiş, kilitsiz satırlar).
do $$
declare
  v_org record;
begin
  for v_org in select id from public.organizations loop
    perform public.backfill_chapters(v_org.id);
  end loop;
end $$;

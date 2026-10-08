-- drafts-push verify tabanı: geriye dönük draftTransfer.sku / draftTransfer.sent (2026-10-08)
--
-- Neden: Etsy senkronu (lib/etsy/sync.ts upsertListingsPage) panel satırının
-- sku, tags ve description alanlarını Etsy'den ezer. Verify bunlara karşı
-- kıyaslarsa senkron sonrası Etsy'yi kendisiyle kıyaslar ve hep "geçti" der;
-- ayrıca boş SKU yüzünden hedefini bulamaz. Bağımsız inceleme ikisini de
-- doğruladı. Kod artık gönderim anında draftTransfer.sku ve draftTransfer.sent
-- yazıyor; bu dosya o tarihten önce açılmış satırları tamamlar.
--
-- Canlıya MCP ile uygulandı (by Artifact Studio Jewelry). İki koşullu blok:
--   1) 60 satır (xmas26 + him26): hiç senkronlanmamış (last_modified_ts null),
--      etsy.listing_create'ten sonra tag/açıklaması audit_log before/after'a
--      göre hiç değişmemiş, tüm varyasyon eksenleri birden fazla değer taşıyor
--      (create sabit satır eklemedi), 13 tag hepsi 1..20 karakter. Bu satırlarda
--      panel metni = gönderilen metin, sent olarak yazıldı.
--   2) 70 satır (fw2627 36 + ss27 34): senkron SKU'yu boşaltmış; SKU varyant
--      öneklerinden türetildi (tek değer ve modelId ile tutarlı). Bunlara sent
--      YAZILMADI: metin senkronla ezildiği için kanıt değil, verify onları
--      textSource "mirrored" (kıyaslanmadı) diye raporlar.
-- Sonuç: 130/130 drafts-push satırında draftTransfer.sku; 60'ında sent.

do $$
declare n int;
begin
  with t as (
    select p.id
    from products p
    where p.org_id='2c254edf-2119-4079-b09e-dc672e32c1f9'
      and p.listing_metadata->'draftTransfer'->>'route'='drafts-push'
      and p.listing_metadata->'draftTransfer'->>'status'='created'
      and p.listing_metadata->>'sourcePackage' in ('2026-10-06-artifact-xmas26','2026-10-07-artifact-him26')
      and p.last_modified_ts is null and p.sku is not null and p.etsy_listing_id is not null
      and p.listing_metadata->'draftTransfer'->'sent' is null
      and array_length(p.tags,1)=13 and not exists (select 1 from unnest(p.tags) x where length(trim(x))=0 or length(trim(x))>20)
      and not exists (
        select 1 from audit_log a
        where a.entity_id=p.id and a.action='update'
          and a.created_at > (select max(c.created_at) from audit_log c where c.entity_id=p.id and c.action='etsy.listing_create')
          and ((a.diff->'before'->>'description') is distinct from (a.diff->'after'->>'description')
            or (a.diff->'before'->'tags') is distinct from (a.diff->'after'->'tags')))
  )
  update products p set listing_metadata = jsonb_set(p.listing_metadata, '{draftTransfer}',
      (p.listing_metadata->'draftTransfer') || jsonb_build_object(
        'sku', p.sku,
        'sent', jsonb_build_object('tags', to_jsonb(p.tags), 'description', p.description),
        'sentBackfill', jsonb_build_object('at', now(), 'basis',
          'panel tags/description unchanged since etsy.listing_create (audit_log before/after), row never synced (last_modified_ts null), all variation axes vary so create appended no constants')))
  from t where p.id=t.id;
  get diagnostics n = row_count;
  if n <> 60 then raise exception 'expected 60 rows, got %', n; end if;
end $$;

do $$
declare n int;
begin
  with v as (
    select p.id,
      min(split_part(v.sku,'-',1)||'-'||split_part(v.sku,'-',2)||'-'||split_part(v.sku,'-',3)) vmin,
      max(split_part(v.sku,'-',1)||'-'||split_part(v.sku,'-',2)||'-'||split_part(v.sku,'-',3)) vmax,
      p.listing_metadata->>'modelId' mid
    from products p join product_variants v on v.product_id=p.id
    where p.org_id='2c254edf-2119-4079-b09e-dc672e32c1f9' and p.listing_metadata->'draftTransfer'->>'route'='drafts-push'
      and p.sku is null and p.listing_metadata->'draftTransfer'->>'sku' is null
    group by p.id
  )
  update products p set listing_metadata = jsonb_set(p.listing_metadata, '{draftTransfer,sku}', to_jsonb(v.vmin))
  from v where p.id=v.id and v.vmin=v.vmax and v.vmin like 'BAS-__-%' and v.vmin like '%-'||v.mid;
  get diagnostics n = row_count;
  if n <> 70 then raise exception 'expected 70 rows, got %', n; end if;
end $$;

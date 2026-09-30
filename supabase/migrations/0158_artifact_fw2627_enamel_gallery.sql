-- 0158_artifact_fw2627_enamel_gallery.sql
-- by Artifact Studio FW 26/27 enamel: 9 sales images per listing (positions 1..9, hero stays at 0),
-- num_images = 10, the image sentence in the description now covers the gallery and names the
-- three-metal frame as a colour visualization, approval blocker updated. Only unpublished drafts.
-- Panel only; no Etsy write. Images: public/artifact/fw2627-enamel/<ID>/02..10.jpg (docs: images.json).
-- Generator: docs/artifact-studio/fw2627-enamel/gen_images_migration.py. DO NOT EDIT BY HAND.
-- Seals (run after apply):
--   select count(*), md5(string_agg(p.sku||'|'||li.position||'|'||li.url||'|'||li.alt, E'\n'
--     order by p.sku||'|'||li.position||'|'||li.url||'|'||li.alt collate "C"))
--   from listing_images li join products p on p.id = li.product_id
--   where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku like 'BAS-FW-%' and li.position between 1 and 9;
--   expected: 360 / 628c1db2a64f0d78c4ef39bd2b1ebe10
--   select md5(string_agg(sku||'|'||md5(description), E'\n' order by sku collate "C")) from products
--   where org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and sku like 'BAS-FW-%';
--   expected: 70629dd02b731677bbb2f00c05d4dafd
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id,
  'https://amuletta.artifactstudio.info/artifact/fw2627-enamel/' || (p.listing_metadata->>'modelId') || '/' || lpad(g.s::text, 2, '0') || '.jpg',
  'url',
  case g.s
      when 2 then m->>'name' || $gl$ $gl$ || w
      when 3 then m->>'name' || $gl$ styled with autumn knitwear at home$gl$
      when 4 then $gl$Close-up of the flat $gl$ || en || $gl$ enamel and polished gold rim of the $gl$ || m->>'name'
      when 5 then $gl$Scale view of the $gl$ || m->>'name' || $gl$ in the hand, $gl$ || m->>'dims'
      when 6 then $gl$Side and fitting view of the $gl$ || m->>'name'
      when 7 then m->>'name' || $gl$ in a handmade ceramic dish$gl$
      when 8 then m->>'name' || $gl$ in an open gift box$gl$
      when 9 then m->>'name' || $gl$ shown in yellow, white and rose gold (colour visualization)$gl$
      when 10 then m->>'name' || $gl$ with the matching $gl$ || m->>'family' || $gl$ pieces$gl$
  end,
  g.s - 1
from public.products p
cross join generate_series(2, 10) g(s)
cross join lateral (select p.listing_metadata m) mm(m)
cross join lateral (select array_to_string(array(select jsonb_array_elements_text(m->'enamel')), ' and ') en) e
cross join lateral (select case m->>'productType' when 'ring' then 'worn on the ring finger'
  when 'necklace' then 'worn at the collarbone' when 'earring' then 'worn on the ear'
  when 'bracelet' then 'worn on the wrist' end w) ww
where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and not exists (select 1 from public.listing_images li where li.product_id = p.id
    and li.url = 'https://amuletta.artifactstudio.info/artifact/fw2627-enamel/' || (p.listing_metadata->>'modelId') || '/' || lpad(g.s::text, 2, '0') || '.jpg');

update public.products p
set num_images = 10,
    description = replace(p.description, $gl$The product image is a design visualization of the finished piece; the handmade piece may vary slightly.$gl$, $gl$The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.$gl$)
where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and (p.num_images is distinct from 10 or position($gl$The product image is a design visualization of the finished piece; the handmade piece may vary slightly.$gl$ in p.description) > 0);

update public.products p
set listing_metadata = jsonb_set(p.listing_metadata, '{approval,blockers,2}', to_jsonb($gl$Images are design visualizations (Higgsfield): hero plus 9 sales frames per listing, frame 09 is a metal colour visualization; photograph the physical piece before or after the first sale.$gl$::text))
where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and p.listing_metadata #>> '{approval,blockers,2}' like 'Hero image is a design visualization%';

commit;

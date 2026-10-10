-- EON double-leaf ring suggestion. Panel draft only; Etsy untouched.
-- Idempotent insertion; never overwrites an existing draft or published record.
-- 3 karats x 3 colors x 25 US whole/half sizes = 225 variants.
do $$
declare
  org uuid;
  product uuid;
begin
  select id into strict org from public.organizations where name = 'EON';
  if exists(select 1 from public.products where org_id = org and sku = 'EON-DL') then
    raise notice 'EON-DL already exists; preserving existing record';
    return;
  end if;
  insert into public.products(org_id, sku, title, description, tags, materials, status, currency, price_cents, has_variations)
  values(org, 'EON-DL', 'Double Leaf Gold Ring, 10K 14K 18K, Open Botanical Design, Yellow White or Rose Gold',
    'Two sculpted leaves face one another across an open space. Softly brushed surfaces contrast with polished edges, while fine vein details bring texture and depth to the design.

Choose 10K, 14K or 18K gold in Yellow Gold, White Gold or Rose Gold. US sizes 3–15 include every half size.

The open design is sized to your selection. Avoid repeatedly bending the band to adjust its fit.

EON Fine Jewelry
meaning designed to last
',
    ARRAY['gold leaf ring','botanical ring','double leaf ring','open gold ring','10k gold ring','14k gold ring','18k gold ring','yellow gold ring','white gold ring','rose gold ring','textured gold ring','nature inspired ring','sculptural ring'],
    ARRAY['10K gold','14K gold','18K gold'], 'draft','USD',42900,true)
  returning id into product;
  insert into public.product_variants(org_id,product_id,sku,name,properties,price_cents,weight_grams,weight_source,quantity,active)
  select org,product,
    'EON-DL-' || k.karat || 'K-' || c.code || '-US' || lpad(n::text,3,'0'),
    k.karat || 'K ' || c.color || ' / US ' || trim(to_char(n/10.0,'FM99.0')),
    jsonb_build_object('Gold Karat',k.karat || 'K','Gold Color',c.color,'Ring Size',trim(to_char(n/10.0,'FM99.0'))),
    k.price,null,null,null,true
  from (values(10,42900),(14,54900),(18,72900)) k(karat,price)
  cross join (values('YG','Yellow Gold'),('WG','White Gold'),('RG','Rose Gold')) c(code,color)
  cross join generate_series(30,150,5) n;
  if (select count(*) from public.product_variants where product_id=product) <> 225 then
    raise exception 'Expected 225 double-leaf variants';
  end if;
end $$;

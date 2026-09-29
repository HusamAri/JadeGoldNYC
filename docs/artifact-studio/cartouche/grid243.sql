-- Cartouche Signet (by Artifact Studio Jewelry, Etsy 4582948003): tam ızgara
-- Karat (10K/14K/18K) x Metal Color (Yellow/White/Rose) x Ring Size (US 3-16,
-- tam + yarım) = 243 panel varyantı. Kural: CLAUDE.md (3 eksen, TAM ızgara).
-- Fiyat ve gram geometri tahmini (weight_source = geometry_estimate).
-- Mühür (2026-09-29): 243 tekil SKU, sum(price_cents) = 46670700,
-- sum(row_number() over (order by sku) * price_cents) = 6535064400.
-- Canlı 105 varyantın 105'i aynı SKU ve aynı fiyatla ızgarada (0 fark).
-- Idempotent: ürünün panel varyantlarını silip ızgarayı yeniden yazar.
-- Etsy'ye yazmaz; Etsy yapısı app/api/ops/inventory-rebuild ile kurulur.
with guard as (select id from products where id='e42cd433-d661-48d1-80fa-6215b2c9f26d' and etsy_listing_id=4582948003 and status in ('draft','active')),
del as (delete from product_variants where product_id in (select id from guard) returning 1),
g(k,s,w,c) as (values ('10K','3',7.07,102900),('10K','3.5',7.26,104900),('10K','4',7.44,106900),('10K','4.5',7.62,108900),('10K','5',7.81,110900),('10K','5.5',7.99,112900),('10K','6',8.17,114900),('10K','6.5',8.36,116900),('10K','7',8.54,118900),('10K','7.5',8.73,120900),('10K','8',8.91,122900),('10K','8.5',9.09,124900),('10K','9',9.28,126900),('10K','9.5',9.46,128900),('10K','10',9.64,130900),('10K','10.5',9.83,132900),('10K','11',10.01,134900),('10K','11.5',10.2,136900),('10K','12',10.38,138900),('10K','12.5',10.56,140900),('10K','13',10.75,142900),('10K','13.5',10.93,144900),('10K','14',11.11,146400),('10K','14.5',11.3,148900),('10K','15',11.48,150400),('10K','15.5',11.67,152900),('10K','16',11.85,154400),('14K','3',7.92,146400),('14K','3.5',8.13,149400),('14K','4',8.34,152400),('14K','4.5',8.54,155400),('14K','5',8.75,158900),('14K','5.5',8.95,161900),('14K','6',9.16,164900),('14K','6.5',9.36,167900),('14K','7',9.57,170900),('14K','7.5',9.78,174400),('14K','8',9.98,177400),('14K','8.5',10.19,180400),('14K','9',10.39,183400),('14K','9.5',10.6,186900),('14K','10',10.81,189900),('14K','10.5',11.01,192900),('14K','11',11.22,195900),('14K','11.5',11.42,198900),('14K','12',11.63,202400),('14K','12.5',11.84,205400),('14K','13',12.04,208400),('14K','13.5',12.25,211400),('14K','14',12.45,214400),('14K','14.5',12.66,217900),('14K','15',12.87,220900),('14K','15.5',13.07,223900),('14K','16',13.28,226900),('18K','3',9.01,201400),('18K','3.5',9.24,205900),('18K','4',9.48,210900),('18K','4.5',9.71,215400),('18K','5',9.95,219900),('18K','5.5',10.18,224400),('18K','6',10.41,228900),('18K','6.5',10.65,233400),('18K','7',10.88,237900),('18K','7.5',11.12,242400),('18K','8',11.35,246900),('18K','8.5',11.58,251400),('18K','9',11.82,256400),('18K','9.5',12.05,260400),('18K','10',12.29,265400),('18K','10.5',12.52,269900),('18K','11',12.76,274400),('18K','11.5',12.99,278900),('18K','12',13.22,283400),('18K','12.5',13.46,287900),('18K','13',13.69,292400),('18K','13.5',13.93,296900),('18K','14',14.16,301400),('18K','14.5',14.39,305900),('18K','15',14.63,310900),('18K','15.5',14.86,315400),('18K','16',15.1,319900)),
col(cc,cn) as (values ('Y','Yellow Gold'),('W','White Gold'),('R','Rose Gold')),
ins as (
insert into product_variants (org_id,product_id,sku,name,properties,price_cents,weight_grams,weight_source,currency,quantity,active)
select '2c254edf-2119-4079-b09e-dc672e32c1f9', guard.id, 'BAS-S01-CRT-'||g.k||col.cc||'-US'||replace(g.s,'.','_'),
 'Cartouche Signet Ring: '||g.k||' '||col.cn||', US '||g.s,
 jsonb_build_object('Karat',g.k,'Metal Color',col.cn,'Ring Size','US '||g.s), g.c, g.w, 'geometry_estimate','USD',20,true
from guard, g, col
where (select count(*) from del) >= 0
returning 1)
select (select count(*) from del) deleted, (select count(*) from ins) inserted;

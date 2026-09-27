"use server";
import {revalidatePath} from 'next/cache';
import {requireMembership,getActiveOrg} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase/admin';
import {assertImportAccess,SOURCE} from '@/lib/artifact-2027/catalog';
import {artifactQuotedCost} from '@/lib/artifact-2027/weight-plan';
import {pricePlan,PRICE_PLAN} from '@/lib/artifact-2027/price-plan';
export async function applyArtifactPrices(){
 try{
  const m=await requireMembership();const org=await getActiveOrg();assertImportAccess(org?.name,m.role);
  const db=createAdminClient(), ids=pricePlan.map(p=>p.productId);
  const [pr,vr]=await Promise.all([
   db.from('products').select('id,sku,status,etsy_listing_id,archived_at,listing_metadata,price_cents,weight_grams,quantity').eq('org_id',m.org_id).in('id',ids),
   db.from('product_variants').select('id,product_id,sku,price_cents,weight_grams,quantity').eq('org_id',m.org_id).in('product_id',ids)
  ]);
  if(pr.error||vr.error||pr.data?.length!==20||vr.data?.length!==80)throw new Error('20 ürün / 80 varyant ön kontrolü başarısız.');
  for(const p of pricePlan){
   const x=pr.data.find(x=>x.id===p.productId);
   if(!x||x.sku!==p.sku||x.status!=='draft'||x.etsy_listing_id||x.archived_at||x.listing_metadata?.sourcePackage!==SOURCE||artifactQuotedCost(x.listing_metadata)!==p.costCents||Number(x.weight_grams)!==p.weightGrams||(x.price_cents!==null&&x.price_cents!==p.priceCents))throw new Error(`${p.id}: mevcut kayıt korunuyor; kapsam/fiyat değişmiş.`);
   for(const v of p.variants){const y=vr.data.find(y=>y.id===v.id);if(!y||y.product_id!==p.productId||y.sku!==v.sku||Number(y.weight_grams)!==v.weight_grams||(y.price_cents!==null&&y.price_cents!==p.priceCents))throw new Error(`${v.sku}: varyant kontrolü başarısız.`);}
  }
  for(const p of pricePlan){
   const x=pr.data.find(x=>x.id===p.productId)!;
   const metadata={...x.listing_metadata,retailPricePlan:{version:PRICE_PLAN,priceCents:p.priceCents,currency:'USD',costMultiplier:2,discountPercent:0,authorizedOn:'2026-09-27'},approval:{...x.listing_metadata?.approval,etsyDraftCreationAuthorized:true,livePublicationAuthorized:false,priceReadyForEtsy:true}};
   const u=await db.from('products').update({price_cents:p.priceCents,listing_metadata:metadata}).eq('org_id',m.org_id).eq('id',p.productId).is('etsy_listing_id',null).select('id');if(u.error||u.data?.length!==1)throw new Error(`${p.id}: fiyat kaydedilemedi.`);
   const v=await db.from('product_variants').update({price_cents:p.priceCents}).eq('org_id',m.org_id).eq('product_id',p.productId).in('id',p.variants.map(v=>v.id)).select('id');if(v.error||v.data?.length!==p.variants.length)throw new Error(`${p.id}: varyant fiyatı kaydedilemedi.`);
  }
  const [pa,va,im]=await Promise.all([
   db.from('products').select('id,price_cents,weight_grams,quantity,listing_metadata,etsy_listing_id,status').eq('org_id',m.org_id).in('id',ids),
   db.from('product_variants').select('id,product_id,sku,price_cents,weight_grams,quantity,properties').eq('org_id',m.org_id).in('product_id',ids),
   db.from('listing_images').select('product_id').eq('org_id',m.org_id).in('product_id',ids)
  ]);
  if(pa.error||va.error||im.error||pa.data.length!==20||va.data.length!==80||im.data.length!==20)throw new Error('Fiyat geri okuması başarısız.');
  for(const p of pricePlan){const x=pa.data.find(x=>x.id===p.productId)!;const old=pr.data.find(x=>x.id===p.productId)!;
   if(x.price_cents!==p.priceCents||x.status!=='draft'||x.etsy_listing_id||x.quantity!==old.quantity||Number(x.weight_grams)!==p.weightGrams||artifactQuotedCost(x.listing_metadata)!==p.costCents||im.data.filter(x=>x.product_id===p.productId).length!==1)throw new Error(`${p.id}: ürün geri okuması uyuşmuyor.`);
   for(const v of p.variants){const y=va.data.find(y=>y.id===v.id)!;const oldV=vr.data.find(y=>y.id===v.id)!;if(!y||y.sku!==v.sku||y.price_cents!==p.priceCents||Number(y.weight_grams)!==v.weight_grams||y.quantity!==oldV.quantity||Object.entries(v.properties).some(([k,val])=>y.properties?.[k]!==val))throw new Error(`${v.sku}: fiyat/beden geri okuması uyuşmuyor.`);}
   revalidatePath(`/tasarimlar/listing/${p.productId}`);
  }
  revalidatePath('/listing-onerileri');revalidatePath('/listing-onerileri/artifact-2027');
  return {ok:true,message:'20 ürün ve 80 varyant satış fiyatı doğrulandı. Küpe $700 · yüzük $730 · bileklik $750 · kolye $760. Maliyet, gram, beden ve görseller korundu.'};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:String(e)};}
}

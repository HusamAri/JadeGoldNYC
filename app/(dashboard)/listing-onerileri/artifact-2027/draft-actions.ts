"use server";
import {revalidatePath} from 'next/cache';
import {requireMembership,getActiveOrg} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase/admin';
import {getEtsyWriteAccess} from '@/lib/db/queries/etsy';
import {assertImportAccess,SOURCE} from '@/lib/artifact-2027/catalog';
import {pricePlan,PRICE_PLAN} from '@/lib/artifact-2027/price-plan';
import {EtsyClient} from '@/lib/etsy/client';
import {etsyPaths} from '@/lib/etsy/endpoints';
import {createDraftListingFromProduct} from '@/lib/etsy/create-listing';
import type {EtsyInventory,EtsyMoney} from '@/lib/etsy/types';
export async function sendArtifactDraft(code:string){
 try{
  const m=await requireMembership();const org=await getActiveOrg();assertImportAccess(org?.name,m.role);
  if(!(await getEtsyWriteAccess(m.org_id)).writeEnabled)throw new Error('Etsy yazma erişimi kapalı.');
  const target=pricePlan.find(p=>p.id===code);if(!target)throw new Error('Koleksiyon dışı ürün.');
  const db=createAdminClient();
  const [pr,vr,im]=await Promise.all([
   db.from('products').select('*').eq('org_id',m.org_id).eq('id',target.productId).single(),
   db.from('product_variants').select('id,sku,name,properties,price_cents,quantity').eq('org_id',m.org_id).eq('product_id',target.productId).eq('active',true),
   db.from('listing_images').select('url').eq('org_id',m.org_id).eq('product_id',target.productId)
  ]);
  const p=pr.data;const variants=vr.data;
  if(pr.error||vr.error||im.error||!p||!variants||p.status!=='draft'||p.archived_at||p.sku!==target.sku||p.listing_metadata?.sourcePackage!==SOURCE||p.listing_metadata?.retailPricePlan?.version!==PRICE_PLAN||p.price_cents!==target.priceCents||variants.length!==target.variants.length||im.data?.length!==1)throw new Error(`${code}: fiyat/görsel/kapsam kontrolü başarısız.`);
  for(const v of target.variants){const x=variants.find(x=>x.id===v.id);if(!x||x.sku!==v.sku||x.price_cents!==target.priceCents||Object.entries(v.properties).some(([k,val])=>x.properties?.[k]!==val))throw new Error(`${code}: varyant fiyat/beden kontrolü başarısız.`);}
  const client=await EtsyClient.forOrg(m.org_id),shopId=await client.requireShopId();
  let listingId=p.etsy_listing_id as number|null;
  if(!listingId){
   if(p.listing_metadata?.draftTransfer)throw new Error(`${code}: önceki aktarımın sonucu belirsiz; çift taslak açmamak için önce Etsy kaydı kontrol edilmeli.`);
   const claim=await db.from('products').update({listing_metadata:{...p.listing_metadata,draftTransfer:{status:'sending',startedAt:new Date().toISOString()}}}).eq('org_id',m.org_id).eq('id',p.id).is('etsy_listing_id',null).is('listing_metadata->draftTransfer',null).select('id');
   if(claim.error||claim.data?.length!==1)throw new Error(`${code}: aktarım zaten başlatılmış.`);
   // Etsy requires a positive draft quantity. One per option is a draft placeholder,
   // not physical inventory; retain the panel's zero stock quantities.
   const result=await createDraftListingFromProduct(db,client,m.org_id,shopId,{...p,quantity:1,galleryUrls:im.data.map(x=>x.url),variants:variants.map(v=>({...v,quantity:1}))});
   listingId=result.listingId??null;
   const link=await db.from('products').update({...(listingId?{etsy_listing_id:listingId,url:`https://www.etsy.com/listing/${listingId}`} : {}),listing_metadata:{...p.listing_metadata,draftTransfer:{status:result.ok?'created':'needs_review',listingId,error:result.error??null,warnings:result.warnings??[],draftQuantityPerOption:1}}}).eq('org_id',m.org_id).eq('id',p.id).select('id');
   if(link.error||link.data?.length!==1)throw new Error(`${code}: Etsy ${listingId??'belirsiz'}; panel bağlantısı kontrol edilmeli.`);
   if(!result.ok||!listingId)throw new Error(`${code}: ${result.error??'Etsy taslağı oluşturulamadı.'}`);
   if(result.warnings?.length)throw new Error(`${code}: Etsy #${listingId} açıldı; ${result.warnings.join(' ')}`);
  }
  const listing=await client.get<{listing_id:number;shop_id:number;state:string;price:EtsyMoney;readiness_state_id?:number}>(etsyPaths.listing(listingId));
  if(listing.state!=='draft'||listing.shop_id!==shopId)throw new Error(`${code}: Etsy durumu/mağazası beklenen taslak değil.`);
  let inv=await client.get<EtsyInventory>(etsyPaths.listingInventory(listingId)+'?legacy=false');
  // The generic creator skips inventory PUT for a single option. Set the SKU
  // only on this authorized collection's draft, preserving the one-option shape.
  if(target.variants.length===1){
   const rows=inv.products.filter(x=>!x.is_deleted);
   if(rows.length!==1)throw new Error(`${code}: beklenmeyen Etsy varyant sayısı.`);
   if(rows[0].sku!==target.variants[0].sku){
    const off=rows[0].offerings?.find(x=>!x.is_deleted) as ({readiness_state_id?:number}|undefined);
    const ready=off?.readiness_state_id??listing.readiness_state_id;
    if(!ready)throw new Error(`${code}: işlem profili okunamadı.`);
    await client.request('PUT',etsyPaths.listingInventory(listingId)+'?legacy=false',{products:[{sku:target.variants[0].sku,property_values:[],offerings:[{price:target.priceCents/100,quantity:1,is_enabled:true,readiness_state_id:ready}]}],price_on_property:[],quantity_on_property:[],sku_on_property:[],readiness_state_on_property:[]});
    inv=await client.get<EtsyInventory>(etsyPaths.listingInventory(listingId)+'?legacy=false');
   }
  }
  const imgs=await client.get<{count:number;results:{listing_image_id:number}[]}>(etsyPaths.listingImagesRead(listingId));
  const rows=inv.products.filter(x=>!x.is_deleted);
  const cents=(money:EtsyMoney|undefined)=>money?.currency_code==='USD'?Math.round(money.amount/money.divisor*100):-1;
  if(cents(listing.price)!==target.priceCents||imgs.results.length!==1||rows.length!==target.variants.length)throw new Error(`${code}: Etsy fiyat/görsel/varyant geri okuması uyuşmuyor.`);
  for(const v of target.variants){const row=rows.find(x=>x.sku===v.sku);const offers=row?.offerings?.filter(x=>!x.is_deleted)??[];if(!row||offers.length!==1||cents(offers[0].price)!==target.priceCents||offers[0].quantity!==1||offers[0].is_enabled!==true||(v.size!==null&&!row.property_values?.some(x=>x.property_name==='Ring Size'&&x.values?.includes(String(v.size)))))throw new Error(`${v.sku}: Etsy SKU/fiyat/beden uyuşmuyor.`);}
  const report={code,listingId,url:`https://www.etsy.com/your/shops/me/listing-editor/edit/${listingId}`,state:listing.state,currency:'USD',priceCents:target.priceCents,imageCount:imgs.results.length,variantCount:rows.length,variants:rows.map(x=>({sku:x.sku,properties:x.property_values,offerings:x.offerings})),checkedAt:new Date().toISOString()};
  const saved=await db.from('products').update({listing_metadata:{...p.listing_metadata,draftTransfer:{status:'verified',...report,draftQuantityPerOption:1}}}).eq('org_id',m.org_id).eq('id',p.id).eq('etsy_listing_id',listingId).select('id');if(saved.error||saved.data?.length!==1)throw new Error(`${code}: doğrulama raporu kaydedilemedi.`);
  revalidatePath(`/tasarimlar/listing/${p.id}`);revalidatePath('/listing-onerileri');revalidatePath('/tasarimlar');
  return {ok:true,message:`${code}: Etsy #${listingId} draft · $${target.priceCents/100} · ${rows.length} varyant · 1 görsel doğrulandı.`,report};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:String(e)};}
}

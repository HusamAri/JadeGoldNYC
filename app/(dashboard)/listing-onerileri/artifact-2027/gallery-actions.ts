"use server";
import {createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {requireMembership,getActiveOrg} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase/admin';
import {assertImportAccess,SOURCE,catalog} from '@/lib/artifact-2027/catalog';
import {getEtsyWriteAccess} from '@/lib/db/queries/etsy';
import {EtsyClient} from '@/lib/etsy/client';
import {etsyPaths} from '@/lib/etsy/endpoints';
import {logAudit} from '@/lib/audit';
type Photo={listing_image_id:number;rank:number;alt_text?:string};
type Gallery={results:Photo[]};
type Slot={sha:string;imageId:number;url:string;name:string};
type HomeGallery={coverId:number;slots:Record<string,Slot>;pending?:string|null};
export async function appendArtifactGalleryImage(fd:FormData){
 try{
  const m=await requireMembership();const org=await getActiveOrg();assertImportAccess(org?.name,m.role);
  if(!(await getEtsyWriteAccess(m.org_id)).writeEnabled)throw new Error('Etsy yazma izni kapalı.');
  const file=fd.get('file');if(!(file instanceof File)||file.type!=='image/png'||file.size<100||file.size>4*1024*1024)throw new Error('PNG dosyası 4 MB altında olmalı.');
  const match=file.name.match(/^([RNBE]0[1-5])-(0[1-9]|1[0-5])-[a-z-]+\.png$/);if(!match)throw new Error('Koleksiyon dosya adı geçersiz.');
  const code=match[1],slot=Number(match[2]),d=catalog.find(x=>x.id===code)!;
  const bytes=new Uint8Array(await file.arrayBuffer());if(Buffer.from(bytes.slice(0,8)).toString('hex')!=='89504e470d0a1a0a')throw new Error('PNG imzası geçersiz.');
  const sha=createHash('sha256').update(bytes).digest('hex');const marker=`${code} home studio ${slot} ${sha.slice(0,16)}`;
  const db=createAdminClient();const pr=await db.from('products').select('id,sku,status,etsy_listing_id,listing_metadata,price_cents,image_url,archived_at').eq('org_id',m.org_id).eq('id',d.productId).single();const p=pr.data;
  if(pr.error||!p||p.sku!==d.sku||p.status!=='draft'||p.archived_at||!p.etsy_listing_id||p.listing_metadata?.sourcePackage!==SOURCE||p.listing_metadata?.draftTransfer?.listingId!==p.etsy_listing_id)throw new Error('Beklenen koleksiyon taslağı bulunamadı.');
  const client=await EtsyClient.forOrg(m.org_id),shopId=await client.requireShopId(),listingId=p.etsy_listing_id;
  const [listing,before]=await Promise.all([client.get<{state:string;shop_id:number}>(etsyPaths.listing(listingId)),client.get<Gallery>(etsyPaths.listingImagesRead(listingId))]);
  if(listing.state!=='draft'||listing.shop_id!==shopId)throw new Error('Yalnız doğru mağazanın Etsy taslağına görsel eklenebilir.');
  const ordered=[...before.results].sort((a,b)=>a.rank-b.rank);
  const saved=(p.listing_metadata?.homeGallery??{coverId:ordered[0]?.listing_image_id,slots:{}}) as HomeGallery;
  if(!saved.coverId||ordered[0]?.listing_image_id!==saved.coverId)throw new Error('Kapak değişmiş; mevcut görseller korunuyor.');
  const existing=saved.slots[String(slot)];
  if(existing){if(existing.sha!==sha||!ordered.some(x=>x.listing_image_id===existing.imageId))throw new Error('Bu sıra farklı dosyayla dolu veya Etsy görseli eksik.');return {ok:true,message:`${code} ${slot}/15 zaten doğrulanmış.`,report:{code,slot,listingId,imageId:existing.imageId,sha,count:ordered.length,skipped:true}};}
  const found=ordered.find(x=>x.alt_text?.includes(marker));
  if(saved.pending&&!found)throw new Error('Önceki yükleme sonucu belirsiz; çift görsel önlemek için Etsy kontrol edilmeli.');
  if(!found&&(ordered.length!==slot||slot!==Object.keys(saved.slots).length+1))throw new Error('Görseller 01–15 sırasıyla ve mevcut kapak korunarak yüklenmeli.');
  if(!found){const lock=await db.from('products').update({listing_metadata:{...p.listing_metadata,homeGallery:{...saved,pending:sha}}}).eq('org_id',m.org_id).eq('id',p.id).is('listing_metadata->homeGallery->>pending',null).select('id');if(lock.error||lock.data?.length!==1)throw new Error('Başka yükleme devam ediyor.');}
  const path=`${m.org_id}/${p.id}/artifact-home-${slot}-${sha}.png`;
  const imageKey=createHash('sha256').update(path).digest('hex');const panelId=`${imageKey.slice(0,8)}-${imageKey.slice(8,12)}-5${imageKey.slice(13,16)}-a${imageKey.slice(17,20)}-${imageKey.slice(20,32)}`;
  const oldRow=await db.from('listing_images').select('id').eq('org_id',m.org_id).eq('id',panelId).maybeSingle();if(oldRow.error)throw oldRow.error;
  const publicUrl=db.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
  if(!oldRow.data){const upload=await db.storage.from('listing-images').upload(path,bytes,{contentType:'image/png',upsert:false});if(upload.error&&!/already exists|Duplicate/i.test(upload.error.message))throw upload.error;
   const ins=await db.from('listing_images').insert({id:panelId,org_id:m.org_id,product_id:p.id,url:publicUrl,storage_path:path,source:'upload',position:slot});if(ins.error)throw ins.error;}
  let imageId=found?.listing_image_id;
  if(!imageId){const body=new FormData();body.append('image',new Blob([bytes],{type:'image/png'}),file.name);body.append('rank',String(slot+1));body.append('alt_text',`${d.name}: AI home studio design visualization. ${marker}`);const up=await client.requestMultipart<{listing_image_id:number}>('POST',etsyPaths.listingImages(shopId,listingId),body);imageId=up.listing_image_id;}
  const [after,afterListing,panel]=await Promise.all([client.get<Gallery>(etsyPaths.listingImagesRead(listingId)),client.get<{state:string;shop_id:number}>(etsyPaths.listing(listingId)),db.from('listing_images').select('id,position').eq('org_id',m.org_id).eq('product_id',p.id)]);
  if(afterListing.state!=='draft'||afterListing.shop_id!==shopId||after.results.length!==slot+1||panel.error||panel.data.length!==slot+1||!after.results.some(x=>x.listing_image_id===imageId&&x.rank===slot+1)||!after.results.some(x=>x.listing_image_id===saved.coverId&&x.rank===1)||ordered.some(x=>!after.results.some(y=>y.listing_image_id===x.listing_image_id)))throw new Error('Etsy/panel galeri geri okuması uyuşmuyor.');
  const next={...saved,pending:null,slots:{...saved.slots,[slot]:{sha,imageId:imageId!,url:publicUrl,name:file.name}}};
  const update=await db.from('products').update({num_images:slot+1,listing_metadata:{...p.listing_metadata,homeGallery:next}}).eq('org_id',m.org_id).eq('id',p.id).eq('etsy_listing_id',listingId).select('id');if(update.error||update.data?.length!==1)throw new Error('Galeri doğrulaması panele kaydedilemedi.');
  await logAudit(db,{orgId:m.org_id,action:'etsy.image_upload',entityType:'product',entityId:p.id,summary:`Artifact home studio ${code} ${slot}/15 appended and verified`,diff:{sha,imageId,listingId,count:slot+1},source:'app'});
  revalidatePath(`/tasarimlar/listing/${p.id}`);revalidatePath('/tasarimlar');
  return {ok:true,message:`${code} ${slot}/15 · Etsy #${listingId} · ${slot+1} görsel doğrulandı; kapak korundu.`,report:{code,slot,listingId,imageId,sha,count:slot+1,skipped:false}};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:(e as {message?:string})?.message??String(e)};}
}

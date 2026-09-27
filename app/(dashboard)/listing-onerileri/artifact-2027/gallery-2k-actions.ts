"use server";
import {createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {requireMembership,getActiveOrg} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase/admin';
import {assertImportAccess,SOURCE,catalog} from '@/lib/artifact-2027/catalog';
import {jpegSize} from '@/lib/artifact-2027/jpeg-size';
import {getEtsyWriteAccess} from '@/lib/db/queries/etsy';
import {EtsyClient} from '@/lib/etsy/client';
import {etsyPaths} from '@/lib/etsy/endpoints';
import {logAudit} from '@/lib/audit';
type Photo={listing_image_id:number;rank:number;alt_text?:string;full_width:number|null;full_height:number|null};
type Gallery={results:Photo[]};
type Entry={sha:string;imageId:number;panelId:string;url:string;name:string;width:number;height:number;previousImageId:number|null;previousUrl:string|null};
type Pending={state:'draft'|'active';sha:string;slot:number;oldId:number|null;beforeIds:number[];beforeCount:number;panelId:string;previousUrl:string|null};
export async function uploadArtifact2k(fd:FormData){
 try{
  const m=await requireMembership();const org=await getActiveOrg();assertImportAccess(org?.name,m.role);
  if(!(await getEtsyWriteAccess(m.org_id)).writeEnabled)throw new Error('Etsy yazma izni kapalı.');
  const file=fd.get('file');if(!(file instanceof File)||file.type!=='image/jpeg'||file.size<100||file.size>4*1024*1024)throw new Error('2048 × 2048 JPEG dosyası 4 MB altında olmalı.');
  const match=file.name.match(/^([RNBE]0[1-5])-(00|0[1-9]|1[0-5])-[a-z-]+\.jpg$/);if(!match)throw new Error('Koleksiyon dosya adı geçersiz.');
  const code=match[1],slot=Number(match[2]),rank=slot+1,d=catalog.find(x=>x.id===code)!;
  const bytes=new Uint8Array(await file.arrayBuffer()),size=jpegSize(bytes);
  if(size.width!==2048||size.height!==2048)throw new Error('Gerçek dosya boyutu 2048 × 2048 olmalı.');
  const sha=createHash('sha256').update(bytes).digest('hex'),marker=`${code} home 2k ${slot} ${sha.slice(0,16)}`;
  const db=createAdminClient();const pr=await db.from('products').select('id,sku,status,etsy_listing_id,listing_metadata,image_url,archived_at').eq('org_id',m.org_id).eq('id',d.productId).single();const p=pr.data;
  if(pr.error||!p||p.sku!==d.sku||p.status!=='draft'||p.archived_at||!p.etsy_listing_id||p.listing_metadata?.sourcePackage!==SOURCE||p.listing_metadata?.draftTransfer?.listingId!==p.etsy_listing_id)throw new Error('Beklenen koleksiyon taslağı bulunamadı.');
  if(p.listing_metadata?.homeGallery?.pending)throw new Error('Önceki galeri yüklemesi tamamlanmalı.');
  const client=await EtsyClient.forOrg(m.org_id),shopId=await client.requireShopId(),listingId=p.etsy_listing_id;
  const [listing,before,panelBefore]=await Promise.all([client.get<{state:string;shop_id:number}>(etsyPaths.listing(listingId)),client.get<Gallery>(etsyPaths.listingImagesRead(listingId)),db.from('listing_images').select('id,position,url').eq('org_id',m.org_id).eq('product_id',p.id)]);
  if(panelBefore.error)throw new Error(`Panel galeri sorgusu: ${panelBefore.error.message}`);
  if(listing.state!=='draft')throw new Error(`Aktif listeler kullanıcı isteğiyle kapsam dışı; Etsy durumu: ${listing.state}. Görsel değiştirilmedi.`);
  if(listing.shop_id!==shopId)throw new Error(`Etsy mağazası eşleşmiyor: listing ${listing.shop_id} (${typeof listing.shop_id}), connection ${shopId} (${typeof shopId}). Görsel değiştirilmedi.`);
  const ordered=[...before.results].sort((a,b)=>a.rank-b.rank),entries=(p.listing_metadata?.gallery2k??{}) as Record<string,Entry>,existing=entries[slot];
  if(existing){const photo=ordered.find(x=>x.listing_image_id===existing.imageId&&x.rank===rank);const panel=panelBefore.data.find(x=>x.id===existing.panelId&&x.url===existing.url&&x.position===slot);if(existing.sha!==sha||!photo||!panel||photo.full_width!==2048||photo.full_height!==2048)throw new Error('2K kaydı, Etsy görseli veya panel uyuşmuyor.');return {ok:true,message:`${code} sıra ${rank}: 2048 × 2048 zaten doğrulanmış.`,report:{code,slot,listingId,imageId:photo.listing_image_id,count:ordered.length,width:2048,height:2048,state:listing.state,skipped:true}};}
  let pending=p.listing_metadata?.gallery2kPending as Pending|null|undefined;
  if(pending&&(pending.sha!==sha||pending.slot!==slot||pending.state!==listing.state))throw new Error('Başka 2K yükleme sonucu bekleniyor.');
  const found=ordered.find(x=>x.alt_text?.includes(marker));
  if(!pending){
   if(found)throw new Error('Kilit kaydı olmadan eşleşen görsel bulundu; manuel kontrol gerekli.');
   if(ordered.length!==panelBefore.data.length)throw new Error('Panel ve Etsy başlangıç sayıları farklı.');
   const target=ordered.find(x=>x.rank===rank),panelRows=panelBefore.data.filter(x=>x.position===slot);
   if(target&&panelRows.length!==1)throw new Error('Yenilenecek panel sırası belirsiz.');
   if(!target&&(slot===0||ordered.length!==slot||panelRows.length))throw new Error('Yeni görseller sıra atlamadan eklenmeli.');
   const known=slot===0?(p.listing_metadata?.homeGallery?.coverId??ordered[0]?.listing_image_id):p.listing_metadata?.homeGallery?.slots?.[slot]?.imageId;
   if(target&&target.listing_image_id!==known)throw new Error('Yenilenecek görsel koleksiyon kaydıyla eşleşmiyor.');
   const key=createHash('sha256').update(`${p.id}:2k:${slot}`).digest('hex'),panelId=panelRows[0]?.id??`${key.slice(0,8)}-${key.slice(8,12)}-5${key.slice(13,16)}-a${key.slice(17,20)}-${key.slice(20,32)}`;
   pending={state:listing.state,sha,slot,oldId:target?.listing_image_id??null,beforeIds:ordered.map(x=>x.listing_image_id),beforeCount:ordered.length,panelId,previousUrl:panelRows[0]?.url??null};
   const lock=await db.from('products').update({listing_metadata:{...p.listing_metadata,gallery2kPending:pending}}).eq('org_id',m.org_id).eq('id',p.id).is('listing_metadata->>gallery2kPending',null).is('listing_metadata->homeGallery->>pending',null).select('id');if(lock.error||lock.data?.length!==1)throw new Error('Başka yükleme devam ediyor.');
  }else if(!found){throw new Error('Önceki 2K yükleme sonucu belirsiz; tekrar gönderilmedi.');}
  const path=`${m.org_id}/${p.id}/artifact-2k-${slot}-${sha}.jpg`,url=db.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
  const upload=await db.storage.from('listing-images').upload(path,bytes,{contentType:'image/jpeg',upsert:false});if(upload.error&&!/already exists|Duplicate/i.test(upload.error.message))throw upload.error;
  let imageId=found?.listing_image_id;
  if(!imageId){const body=new FormData();body.append('image',new Blob([bytes],{type:'image/jpeg'}),file.name);body.append('rank',String(rank));if(pending.oldId)body.append('overwrite','true');body.append('alt_text',`${d.name}: ${file.name.replace(/^[RNBE]\d+-\d+-|\.jpg$/g,'').replaceAll('-',' ')}. AI design visualization, 2048 square upscale. ${marker}`);const up=await client.requestMultipart<{listing_image_id:number}>('POST',etsyPaths.listingImages(shopId,listingId),body);imageId=up.listing_image_id;}
  let after=await client.get<Gallery>(etsyPaths.listingImagesRead(listingId));
  for(let attempt=0;attempt<3;attempt++){const img=after.results.find(x=>x.listing_image_id===imageId);if(img?.full_width&&img.full_height)break;await new Promise(r=>setTimeout(r,1000));after=await client.get<Gallery>(etsyPaths.listingImagesRead(listingId));}
  const newPhoto=after.results.find(x=>x.listing_image_id===imageId&&x.rank===rank),expectedCount=pending.beforeCount+(pending.oldId?0:1);
  const afterListing=await client.get<{state:string;shop_id:number}>(etsyPaths.listing(listingId));
  if(afterListing.state!==pending.state||afterListing.shop_id!==shopId||after.results.length!==expectedCount||!newPhoto||newPhoto.full_width!==2048||newPhoto.full_height!==2048||pending.beforeIds.filter(id=>id!==pending.oldId).some(id=>!after.results.some(x=>x.listing_image_id===id))||(pending.oldId&&after.results.some(x=>x.listing_image_id===pending.oldId)))throw new Error('Etsy 2K boyut, sıra veya koruma kontrolü tamamlanmadı; tekrar gönderilmeden geri okunmalı.');
  const values={url,storage_path:path,source:'upload' as const,position:slot};
  const panelWrite=pending.previousUrl?await db.from('listing_images').update(values).eq('org_id',m.org_id).eq('id',pending.panelId).eq('product_id',p.id).select('id'):await db.from('listing_images').upsert({id:pending.panelId,org_id:m.org_id,product_id:p.id,...values},{onConflict:'id'}).select('id');if(panelWrite.error||panelWrite.data?.length!==1)throw new Error('Etsy doğrulandı, panel görseli güncellenemedi.');
  const entry:Entry={sha,imageId:imageId!,panelId:pending.panelId,url,name:file.name,width:2048,height:2048,previousImageId:pending.oldId,previousUrl:pending.previousUrl};
  const home=p.listing_metadata?.homeGallery??{coverId:ordered[0]?.listing_image_id,slots:{}};
  const newHome=slot===0?{...home,coverId:imageId}: {...home,slots:{...home.slots,[slot]:{sha,imageId,url,name:file.name}}};
  const update=await db.from('products').update({num_images:expectedCount,...(slot===0?{image_url:url}:{}),listing_metadata:{...p.listing_metadata,homeGallery:newHome,gallery2k:{...entries,[slot]:entry},gallery2kPending:null}}).eq('org_id',m.org_id).eq('id',p.id).eq('etsy_listing_id',listingId).select('id');if(update.error||update.data?.length!==1)throw new Error('2K doğrulaması panele kaydedilemedi.');
  const readback=await db.from('listing_images').select('id,position,url').eq('org_id',m.org_id).eq('product_id',p.id);if(readback.error||readback.data.length!==expectedCount||!readback.data.some(x=>x.id===pending.panelId&&x.url===url&&x.position===slot))throw new Error('Panel 2K geri okuması uyuşmuyor.');
  await logAudit(db,{orgId:m.org_id,action:'etsy.image_upload',entityType:'product',entityId:p.id,summary:`Artifact ${code} image ${rank} verified at 2048 square`,diff:{sha,imageId,previousImageId:pending.oldId,listingId,count:expectedCount,width:2048,height:2048},source:'app'});
  revalidatePath(`/tasarimlar/listing/${p.id}`);revalidatePath('/tasarimlar');
  return {ok:true,message:`${code} sıra ${rank}: 2048 × 2048 · ${expectedCount} görsel · Etsy yayın durumu korunarak panel ve görseller doğrulandı.`,report:{code,slot,listingId,imageId,previousImageId:pending.oldId,count:expectedCount,width:2048,height:2048,state:afterListing.state,skipped:false}};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:(e as {message?:string})?.message??String(e)};}
}

export async function auditArtifact2k(){
 const m=await requireMembership();const org=await getActiveOrg();assertImportAccess(org?.name,m.role);
 const db=createAdminClient(),client=await EtsyClient.forOrg(m.org_id),shopId=await client.requireShopId();
 const [products,images]=await Promise.all([
  db.from('products').select('id,etsy_listing_id,listing_metadata').eq('org_id',m.org_id).in('id',catalog.map(x=>x.productId)),
  db.from('listing_images').select('product_id,position,url').eq('org_id',m.org_id).in('product_id',catalog.map(x=>x.productId))
 ]);
 if(products.error)throw products.error;if(images.error)throw images.error;
 const report=[];
 for(const d of catalog){
  const p=products.data.find(x=>x.id===d.productId);if(!p?.etsy_listing_id){report.push({code:d.id,error:'No Etsy mapping'});continue;}
  try{
   const [listing,gallery]=await Promise.all([client.get<{state:string;shop_id:number}>(etsyPaths.listing(p.etsy_listing_id)),client.get<Gallery>(etsyPaths.listingImagesRead(p.etsy_listing_id))]);
   const home=p.listing_metadata?.homeGallery;
   report.push({code:d.id,listingId:p.etsy_listing_id,state:listing.state,shopMatches:listing.shop_id===shopId,panelCount:images.data.filter(x=>x.product_id===p.id).length,etsyCount:gallery.results.length,photos:gallery.results.map(x=>({id:x.listing_image_id,rank:x.rank,width:x.full_width,height:x.full_height,known:x.rank===1?x.listing_image_id===(home?.coverId??p.listing_metadata?.draftTransfer?.imageId):x.listing_image_id===home?.slots?.[x.rank-1]?.imageId})),pending:p.listing_metadata?.gallery2kPending??null});
  }catch(e){report.push({code:d.id,error:e instanceof Error?e.message:String(e)});}
 }
 return report;
}

'use server';
import { revalidatePath } from 'next/cache';
import { requireMembership, getActiveOrg } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertImportAccess, SOURCE } from '@/lib/artifact-2027/catalog';
import { weightPlan, WEIGHT_PLAN, estimateMetadata, artifactQuotedCost } from '@/lib/artifact-2027/weight-plan';
export async function applyArtifactWeightPlan() {
  try {
    const m = await requireMembership(); const org = await getActiveOrg(); assertImportAccess(org?.name,m.role);
    const db=createAdminClient(); const ids=weightPlan.products.map(p=>p.productId);
    const [pr,vr]=await Promise.all([
      db.from('products').select('id,sku,status,etsy_listing_id,archived_at,listing_metadata,weight_grams,price_cents').eq('org_id',m.org_id).in('id',ids),
      db.from('product_variants').select('id,product_id,sku,weight_grams,price_cents,quantity').eq('org_id',m.org_id).in('product_id',ids),
    ]);
    if(pr.error || vr.error || pr.data?.length!==20) throw new Error('Önce 20 panel önerisinin kaydı gerekli.');
    for(const p of weightPlan.products) {
      const row=pr.data.find(x=>x.id===p.productId);
      if(!row || row.sku!==p.sku || row.status!=='draft' || row.etsy_listing_id || row.archived_at || row.listing_metadata?.sourcePackage!==SOURCE) throw new Error(`${p.id}: kapsam değişmiş; işlem durduruldu.`);
      if(row.weight_grams!=null && Number(row.weight_grams)!==p.weightGrams) throw new Error(`${p.id}: mevcut gram korunuyor.`);
      const oldCost=row.listing_metadata?.purchaseCostSnapshot;
      if(oldCost && (oldCost.version!==WEIGHT_PLAN || oldCost.amountCents!==p.costCents)) throw new Error(`${p.id}: mevcut maliyet korunuyor.`);
      for(const v of vr.data.filter(v=>v.product_id===p.productId)) {
        const target=p.variants.find(t=>t.id===v.id);
        if(!target || (v.sku!==target.sku && !(v.id===p.baseVariantId && v.sku===p.sku)) || (v.weight_grams!=null && Number(v.weight_grams)!==target.weight_grams) || v.quantity!==0) throw new Error(`${p.id}: mevcut varyant değişmiş; işlem durduruldu.`);
      }
    }
    // Keep the original variant ID for US 7; add only the other 12 sizes.
    // Prices are intentionally omitted from conflict updates and remain untouched.
    const rows=weightPlan.products.flatMap(p=>p.variants.map(v=>({id:v.id,org_id:m.org_id,product_id:p.productId,sku:v.sku,name:v.size==null?p.id:`US ${v.size}`,properties:v.properties,weight_grams:v.weight_grams,weight_source:'inferred',quantity:0,active:true,currency:'USD'})));
    const save=await db.from('product_variants').upsert(rows,{onConflict:'id'}); if(save.error)throw save.error;
    for(const p of weightPlan.products) {
      const old=pr.data.find(x=>x.id===p.productId)!;
      const up=await db.from('products').update({weight_grams:p.weightGrams,has_variations:p.variants.length>1,listing_metadata:estimateMetadata(old.listing_metadata??{},p)}).eq('org_id',m.org_id).eq('id',p.productId).eq('status','draft').is('etsy_listing_id',null).select('id');
      if(up.error || up.data?.length!==1)throw new Error(`${p.id}: ürün güncellemesi doğrulanamadı.`);
    }
    const [after,variants,images]=await Promise.all([
      db.from('products').select('id,listing_metadata,weight_grams,status,etsy_listing_id,price_cents,has_variations').eq('org_id',m.org_id).in('id',ids),
      db.from('product_variants').select('id,product_id,sku,weight_grams,weight_source,properties,quantity,price_cents').eq('org_id',m.org_id).in('product_id',ids),
      db.from('listing_images').select('id,product_id').eq('org_id',m.org_id).in('product_id',ids),
    ]);
    if(after.error||variants.error||images.error||after.data.length!==20||variants.data.length!==80||images.data.length!==20)throw new Error('20 ürün / 80 varyant / 20 görsel kontrolü başarısız.');
    for(const p of weightPlan.products) {
      const a=after.data.find(x=>x.id===p.productId); const old=pr.data.find(x=>x.id===p.productId)!;
      if(!a||a.status!=='draft'||a.etsy_listing_id||a.price_cents!==old.price_cents||Number(a.weight_grams)!==p.weightGrams||artifactQuotedCost(a.listing_metadata)!==p.costCents||a.listing_metadata?.production?.weightVerified!==false||a.has_variations!==(p.variants.length>1)||images.data.filter(i=>i.product_id===p.productId).length!==1)throw new Error(`${p.id}: ürün geri okuması eşleşmiyor.`);
      for(const v of p.variants) {
        const x=variants.data.find(x=>x.id===v.id); const prior=vr.data.find(x=>x.id===v.id);
        if(!x||x.product_id!==p.productId||x.sku!==v.sku||Number(x.weight_grams)!==v.weight_grams||x.weight_source!=='inferred'||x.quantity!==0||x.price_cents!==(prior?.price_cents??null)||Object.entries(v.properties).some(([k,val])=>x.properties?.[k]!==val))throw new Error(`${v.sku}: varyant geri okuması eşleşmiyor.`);
      }
      revalidatePath(`/tasarimlar/listing/${p.productId}`);
    }
    revalidatePath('/listing-onerileri');revalidatePath('/listing-onerileri/artifact-2027');
    return {ok:true,message:'20 ürün doğrulandı: 65 yüzük bedeni + 15 diğer varyant = 80 varyant. Tahmini gramlar ve altın/işçilik dahil maliyetler kaydedildi; satış fiyatı ve Etsy değişmedi.'};
  }catch(e){return {ok:false,message:e instanceof Error?e.message:(e as {message?:string})?.message??'İşlem tamamlanamadı.'};}
}

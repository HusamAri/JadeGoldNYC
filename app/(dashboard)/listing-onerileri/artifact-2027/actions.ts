"use server";

import { revalidatePath } from "next/cache";
import { requireMembership, getActiveOrg } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { catalog, SOURCE, assertImportAccess, validateCatalog, productRow } from "@/lib/artifact-2027/catalog";

// Fixed package only: no client-supplied content, org IDs, image URLs or prices.
export async function importArtifact2027() {
  try {
    const m = await requireMembership();
    const org = await getActiveOrg();
    assertImportAccess(org?.name, m.role);
    validateCatalog(catalog);
    const db = createAdminClient();
    const skus = catalog.map(d => d.sku);
    const { data: existing, error: lookupError } = await db.from("products")
      .select("id,sku,status,etsy_listing_id,listing_metadata,archived_at")
      .eq("org_id", m.org_id).in("sku", skus);
    if (lookupError) throw lookupError;
    for (const p of existing ?? []) {
      const d = catalog.find(d => d.sku === p.sku);
      if (!d || p.id !== d.productId || p.status !== "draft" || p.etsy_listing_id || p.archived_at || p.listing_metadata?.sourcePackage !== SOURCE) {
        throw new Error(`Mevcut kayıt korunuyor; SKU çakışması: ${p.sku}`);
      }
    }
    // Ignore conflicts, never overwrite. Fixed primary keys also cover concurrent retries.
    const { error: productsError } = await db.from("products")
      .upsert(catalog.map(d => productRow(d, m.org_id)), { onConflict: "id", ignoreDuplicates: true });
    if (productsError) throw productsError;
    // Read ownership back before attaching any child rows, including a retry after a timeout.
    const { data: owned, error: ownerError } = await db.from("products")
      .select("id,sku,status,etsy_listing_id,listing_metadata")
      .eq("org_id", m.org_id).in("id", catalog.map(d => d.productId));
    if (ownerError) throw ownerError;
    if (owned?.length !== 20 || owned.some(p => p.status !== "draft" || p.etsy_listing_id || p.listing_metadata?.sourcePackage !== SOURCE || !catalog.some(d => d.productId === p.id && d.sku === p.sku))) {
      throw new Error("20 taslağın sahipliği doğrulanamadı; tekrar kontrol edin.");
    }
    const { error: variantsError } = await db.from("product_variants").upsert(catalog.map(d => ({
      id: d.variantId, org_id: m.org_id, product_id: d.productId, sku: d.sku,
      name: d.name, price_cents: null, weight_grams: null, quantity: 0,
      active: true, currency: "USD", properties: { "Metal": "14K Yellow Gold", "Development": "Sample required" },
    })), { onConflict: "id", ignoreDuplicates: true });
    if (variantsError) throw variantsError;
    const { error: imageError } = await db.from("listing_images").upsert(catalog.map(d => ({
      id: d.imageId, org_id: m.org_id, product_id: d.productId,
      url: d.imageUrl, source: "url", alt: d.alt, position: 0,
    })), { onConflict: "id", ignoreDuplicates: true });
    if (imageError) throw imageError;
    const ids = catalog.map(d => d.productId);
    const [pr, vr, ir] = await Promise.all([
      db.from("products").select("id,sku,title,status,etsy_listing_id,image_url,price_cents,weight_grams,num_images,tags,quantity,listing_metadata").eq("org_id", m.org_id).in("id", ids),
      db.from("product_variants").select("id,product_id,sku,price_cents,weight_grams,quantity").eq("org_id", m.org_id).in("product_id", ids),
      db.from("listing_images").select("id,product_id,url,position").eq("org_id", m.org_id).in("product_id", ids),
    ]);
    if (pr.error || vr.error || ir.error) throw new Error("Kayıt sonrası okuma başarısız; yeniden doğrulayın.");
    if (pr.data.length !== 20 || vr.data.length !== 20 || ir.data.length !== 20) throw new Error("20 ürün / 20 varyant / 20 tek görsel doğrulanamadı.");
    for (const d of catalog) {
      const p = pr.data.find(p => p.id === d.productId);
      const variants = vr.data.filter(v => v.product_id === d.productId);
      const images = ir.data.filter(i => i.product_id === d.productId);
      if (!p || p.title !== d.title || p.sku !== d.sku || p.status !== "draft" || p.etsy_listing_id !== null || p.image_url !== d.imageUrl || p.price_cents !== null || p.weight_grams !== null || p.quantity !== 0 || p.num_images !== 1 || JSON.stringify(p.tags) !== JSON.stringify(d.tags) || p.listing_metadata?.approval?.etsyDraftCreationAuthorized !== false || variants.length !== 1 || variants[0].sku !== d.sku || variants[0].price_cents !== null || variants[0].weight_grams !== null || variants[0].quantity !== 0 || images.length !== 1 || images[0].url !== d.imageUrl || images[0].position !== 0) {
        throw new Error(`${d.id}: kayıt okuması paketle eşleşmiyor. Mevcut değerler değiştirilmedi.`);
      }
    }
    revalidatePath("/listing-onerileri");
    revalidatePath("/listing-onerileri/artifact-2027");
    return { ok: true, message: "20 öneri doğrulandı: her modelde 1 görsel, fiyat ve gramaj beklemede, Etsy’ye gönderilmedi." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Aktarım tamamlanamadı. Aynı paket güvenle yeniden denenebilir." };
  }
}

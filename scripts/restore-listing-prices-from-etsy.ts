/**
 * Tek listing varyant fiyatlarını Etsy envanterinden panele geri yazar.
 *
 *   npx tsx scripts/restore-listing-prices-from-etsy.ts "10K Solid Rose Gold Beveled Wedding Band"
 *
 * .env.local (veya prod env) içinde Supabase service role + Etsy bağlantısı gerekir.
 */
import { createClient } from "@supabase/supabase-js";
import { syncOneListingVariants } from "../lib/etsy/variants";

async function main() {
  const needle = process.argv.slice(2).join(" ").trim();
  if (!needle) {
    console.error('Kullanım: npx tsx scripts/restore-listing-prices-from-etsy.ts "<başlık parçası>"');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik.");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: products, error } = await admin
    .from("products")
    .select("id, org_id, title, etsy_listing_id")
    .ilike("title", `%${needle}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  const rows = products ?? [];
  if (rows.length === 0) {
    console.error("Eşleşen listing yok:", needle);
    process.exit(1);
  }
  for (const p of rows) {
    console.log(`→ ${p.title} (${p.id}) etsy=${p.etsy_listing_id}`);
    const res = await syncOneListingVariants(p.org_id, p.id);
    if (res.error) console.error("  HATA:", res.error);
    else console.log(`  OK: ${res.variants} varyant fiyatı Etsy’den yazıldı.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

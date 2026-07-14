/**
 * Listing açıklamalarındaki "Average Weight" bloklarından eksik varyant
 * gramajlarını doldurur (lib/etsy/description-weights motoru).
 *
 *   npx tsx scripts/fill-weights-from-description.ts           # kuru çalışma (rapor)
 *   npx tsx scripts/fill-weights-from-description.ts --apply   # DB'ye yaz
 *
 * Yalnız weight_grams IS NULL varyantlar dolar (mevcut değer asla ezilmez).
 * Kaynak: birebir eşleşme 'description', uzunluk-ölçekli 'description-scaled'.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import {
  parseDescriptionWeights,
  extractVariantSize,
  matchVariantWeight,
  type DescWeightEntry,
} from "../lib/etsy/description-weights";

// .env.local'ı elle yükle (Next dışı bağlam)
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const apply = process.argv.includes("--apply");

/** ASCII olmayan değer = doldurulmamış placeholder (gerçek anahtar değil). */
const isRealKey = (v: string | undefined): v is string =>
  !!v && v.length > 60 && [...v].every((c) => c.charCodeAt(0) < 128);

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(
  url,
  isRealKey(serviceKey) ? serviceKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Service anahtarı yoksa RLS için panel kullanıcısıyla oturum aç
 *  (SUPABASE_LOGIN_EMAIL / SUPABASE_LOGIN_PASSWORD env'den). */
async function ensureAuth() {
  if (isRealKey(serviceKey)) return;
  const email = process.env.SUPABASE_LOGIN_EMAIL;
  const password = process.env.SUPABASE_LOGIN_PASSWORD;
  if (!email || !password)
    throw new Error(
      "Service anahtarı yok; SUPABASE_LOGIN_EMAIL/PASSWORD ile giriş gerekli.",
    );
  const { error } = await admin.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Giriş başarısız: " + error.message);
}

interface VariantRow {
  sku: string;
  product_id: string;
  weight_grams: number | null;
  weight_source?: string | null;
  properties: never[] | null;
  name: string | null;
}

/**
 * Doğrulama: ShipStation'dan TARTILMIŞ ağırlığı olan varyantlarda motorun
 * tahminini gerçek değerle karşılaştırır (hold-out kalite ölçümü).
 */
async function validate() {
  await ensureAuth();
  const { data: products } = await admin
    .from("products")
    .select("id, title, description")
    .ilike("description", "%average weight%");
  const { data: weighed } = await admin
    .from("product_variants")
    .select("sku, product_id, weight_grams, properties, name")
    .eq("weight_source", "shipstation")
    .not("weight_grams", "is", null);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  let n = 0;
  const errs: { sku: string; pred: number; real: number; pct: number }[] = [];
  for (const v of weighed ?? []) {
    const p = v.product_id ? byId.get(v.product_id) : null;
    if (!p) continue;
    const entries = parseDescriptionWeights(p.description);
    if (entries.length === 0) continue;
    const hit = matchVariantWeight(entries, extractVariantSize(v.properties as never));
    if (!hit) continue;
    n++;
    const real = Number(v.weight_grams);
    const pct = Math.abs(hit.grams - real) / real;
    errs.push({ sku: v.sku, pred: hit.grams, real, pct });
  }
  errs.sort((a, b) => b.pct - a.pct);
  const within5 = errs.filter((e) => e.pct <= 0.05).length;
  const within10 = errs.filter((e) => e.pct <= 0.1).length;
  const median = errs.length
    ? errs.map((e) => e.pct).sort((a, b) => a - b)[Math.floor(errs.length / 2)]
    : 0;
  console.log(`Doğrulama örneklemi (ShipStation tartılı): ${n}`);
  console.log(`  medyan hata: %${(median * 100).toFixed(1)}`);
  console.log(`  ≤%5 hata: ${within5}/${n} · ≤%10 hata: ${within10}/${n}`);
  console.log("  En kötü 10:");
  for (const e of errs.slice(0, 10))
    console.log(
      `    ${e.sku}: tahmin ${e.pred}g / gerçek ${e.real}g (%${(e.pct * 100).toFixed(0)})`,
    );
}

async function main() {
  if (process.argv.includes("--validate")) return validate();
  await ensureAuth();
  const { data: products, error: pErr } = await admin
    .from("products")
    .select("id, org_id, etsy_listing_id, title, description")
    .ilike("description", "%average weight%");
  if (pErr) throw new Error(pErr.message);

  // Supabase select 1000 satırda doyar — tüm varyantlar sayfalanarak çekilir.
  const variants: VariantRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("product_variants")
      .select("sku, product_id, weight_grams, weight_source, properties, name")
      .order("sku", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    variants.push(...((data ?? []) as unknown as VariantRow[]));
    if (!data || data.length < 1000) break;
  }

  const byProduct = new Map<string, VariantRow[]>();
  for (const v of variants) {
    if (!v.product_id) continue;
    const arr = byProduct.get(v.product_id) ?? [];
    arr.push(v);
    byProduct.set(v.product_id, arr);
  }

  let listingsWithTable = 0;
  let listingsNoParse = 0;
  let skippedSuspicious = 0;
  const updates: {
    sku: string;
    org_id: string;
    grams: number;
    source: string;
  }[] = [];
  const misses: { listing: string; sku: string; name: string | null }[] = [];
  const samples: string[] = [];

  for (const p of products ?? []) {
    const entries: DescWeightEntry[] = parseDescriptionWeights(p.description);
    if (entries.length === 0) {
      listingsNoParse++;
      if (process.argv.includes("--debug-unparsed")) {
        const i = p.description.toLowerCase().indexOf("verage");
        console.log(
          `\n— ÇÖZÜLEMEDİ: ${p.title}\n${p.description.slice(Math.max(0, i - 20), i + 260)}`,
        );
      }
      continue;
    }
    listingsWithTable++;
    const all = byProduct.get(p.id) ?? [];

    // GÜVEN KAPISI: listing'in TARTILMIŞ (shipstation) kardeş varyantında
    // motor %20'den fazla şaşıyorsa açıklama bayattır — listing'i atla.
    const weighed = all.filter(
      (v) => v.weight_grams != null && v.weight_source === "shipstation",
    );
    let suspicious = false;
    for (const w of weighed) {
      const hit = matchVariantWeight(entries, extractVariantSize(w.properties));
      if (hit && Math.abs(hit.grams - Number(w.weight_grams)) / Number(w.weight_grams) > 0.2) {
        suspicious = true;
        break;
      }
    }
    if (suspicious) {
      skippedSuspicious++;
      continue;
    }

    const missing = all.filter((v) => v.weight_grams == null);
    for (const v of missing) {
      const info = extractVariantSize(v.properties);
      const hit = matchVariantWeight(entries, info);
      if (hit) {
        updates.push({
          sku: v.sku,
          org_id: p.org_id,
          grams: hit.grams,
          source: hit.exact ? "description" : "description-scaled",
        });
        if (samples.length < 25)
          samples.push(
            `${hit.exact ? "✓" : "≈"} ${v.sku} · ${v.name ?? ""} → ${hit.grams}g`,
          );
      } else {
        misses.push({ listing: p.title ?? p.id, sku: v.sku, name: v.name });
      }
    }
  }

  console.log(`Listing (tablo çözüldü): ${listingsWithTable}`);
  console.log(`Listing (tablo çözülemedi): ${listingsNoParse}`);
  console.log(`Listing (güven kapısı — tartıyla çelişti, atlandı): ${skippedSuspicious}`);
  console.log(`Doldurulacak varyant: ${updates.length}`);
  console.log(`  birebir: ${updates.filter((u) => u.source === "description").length}`);
  console.log(`  ölçekli: ${updates.filter((u) => u.source === "description-scaled").length}`);
  console.log(`Eşleşmeyen varyant: ${misses.length}`);
  console.log("\nÖrnekler:");
  for (const s of samples) console.log("  " + s);
  console.log("\nEşleşmeyen örnekleri:");
  for (const m of misses.slice(0, 15)) console.log(`  ✗ ${m.sku} · ${m.name ?? m.listing}`);

  if (!apply) {
    console.log("\nKuru çalışma — yazmak için --apply");
    return;
  }

  let written = 0;
  for (const u of updates) {
    const { error } = await admin
      .from("product_variants")
      .update({
        weight_grams: u.grams,
        weight_source: u.source,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", u.org_id)
      .eq("sku", u.sku)
      .is("weight_grams", null);
    if (error) console.error(`YAZILAMADI ${u.sku}: ${error.message}`);
    else written++;
  }
  console.log(`\nYazılan: ${written}/${updates.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

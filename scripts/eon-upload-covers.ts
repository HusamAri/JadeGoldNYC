/**
 * EON taslak kapak görsellerini Supabase Storage'a yükler ve products.image_url'i
 * public URL'e bağlar. GÜVENLİ yol: service-role anahtarıyla çalışır (RLS bypass),
 * bucket'ta anon-yazma politikası GEREKMEZ.
 *
 * Panel kapak görseli (products.image_url) Etsy CDN dışında Supabase Storage'ın
 * public `eon-media` bucket'ından da gelebilir (Etsy'ye henüz açılmamış EON
 * taslakları için AI hero kapağı). next.config `images.remotePatterns` bu host'u
 * izinler. Bucket public-OKUMA'dır; yükleme yalnız bu script (service-role) ile.
 *
 *   ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local)
 *   Girdi: <dir>/01.jpg .. 16.jpg  (EON 16 renk-hero, 01-16 numaralı)
 *
 *   npx tsx scripts/eon-upload-covers.ts ./eon-covers            # yükle + image_url yaz
 *   npx tsx scripts/eon-upload-covers.ts ./eon-covers --dry-run  # yalnız kontrol
 *
 * NOT: 16 taslağın image_url'i zaten .../eon-media/hero/<NN>.jpg olarak ayarlı;
 * bu script dosyaları o yola yükler. Alternatif: aynı 16 dosyayı Supabase
 * dashboard'dan `eon-media` bucket'ında `hero/` klasörüne elle sürükle.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (.env.local) gerekli.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const dir = argv.find((a) => !a.startsWith("--")) ?? "./eon-covers";
const dry = argv.includes("--dry-run");
const ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0"; // EON
const BUCKET = "eon-media";

async function main() {
  const supabase = createClient(URL!, KEY!, { auth: { persistSession: false } });
  let uploaded = 0;
  let missing = 0;

  for (let i = 1; i <= 16; i++) {
    const key = String(i).padStart(2, "0");
    const path = join(dir, `${key}.jpg`);
    if (!existsSync(path)) {
      console.warn(`⚠ eksik: ${path}`);
      missing++;
      continue;
    }
    const bytes = readFileSync(path);
    const dest = `hero/${key}.jpg`;
    if (dry) {
      console.log(`[dry] ${path} → ${BUCKET}/${dest} (${(bytes.length / 1024).toFixed(0)} KB)`);
      uploaded++;
      continue;
    }
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) {
      console.error(`✗ ${dest}: ${error.message}`);
      continue;
    }
    // image_url zaten ayarlı olabilir; yine de garanti et (idempotent).
    const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${dest}`;
    const { error: upErr } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("org_id", ORG)
      .eq("status", "draft")
      .like("description", `%[EON ${key} %`);
    if (upErr) console.error(`✗ image_url ${key}: ${upErr.message}`);
    console.log(`✓ ${dest}`);
    uploaded++;
  }

  console.log(`\n── ÖZET ── yüklendi/kontrol: ${uploaded}/16 · eksik: ${missing}`);
  if (!dry && uploaded > 0)
    console.log("Panelde kapaklar için deploy sonrası next.config remotePatterns aktif olmalı.");
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exit(1);
});

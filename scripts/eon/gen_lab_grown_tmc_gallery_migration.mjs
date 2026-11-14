#!/usr/bin/env node
/**
 * EON-TMC9 galerisi → supabase/migrations/0192_eon_lab_grown_tmc9_gallery.sql
 *
 * Girdi: docs/eon/lab-grown/07-two-tone-milgrain-channel/images/status.json (sahibin 2026-11-14 kararı "1a 2a 3a":
 * 2a = prompt setinden 9 Higgsfield karesi + yerelde dizilmiş ölçü kartı, önce hero sahibin fotoğraflarıyla kontrol;
 * 3a = sahibin ilk fotoğrafı son kare, düzenlenmeden ve kırpılmadan). Set incelemesinde 01 ve 08 taş sayısı için
 * kendilerinden düzenlendi, 06 iki kez sekiz taş verince profil karesine döndü ve yansıması tek düzenlemeyle silindi.
 * Kapılar, uygulama sırası ve SQL: scripts/eon/lab_grown_gallery.mjs. ÖNCE dağıtım: 11 URL canlıda 200 dönmeden
 * uygulanmaz. 11. kare 1512×2016 dikey JPEG'dir (sahibin fotoğrafı; yalnız EXIF/APP13 segmentleri söküldü).
 *
 * Kullanım: node scripts/eon/gen_lab_grown_tmc_gallery_migration.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { galleryMigrationSql } from "./lab_grown_gallery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const outFile = path.join(repoRoot, "supabase/migrations/0192_eon_lab_grown_tmc9_gallery.sql");

const sql = await galleryMigrationSql({
  repoRoot,
  statusRel: "docs/eon/lab-grown/07-two-tone-milgrain-channel/images/status.json",
  sku: "EON-TMC9",
  folder: "lab-grown-tmc9",
  count: 11,
  fileName: "0192_eon_lab_grown_tmc9_gallery.sql",
  generatorScript: "scripts/eon/gen_lab_grown_tmc_gallery_migration.mjs",
  tag: "tmc9",
  look: "pencere gün ışığı, sarının tamamlayıcısı soğuk zeminler; 10. kare yerelde dizilmiş ölçü kartı; 11. kare sahibin kendi fotoğrafı, düzenlenmeden",
});
await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 11 images, cover https://amuletta.artifactstudio.info/eon/lab-grown-tmc9/01.jpg`);
